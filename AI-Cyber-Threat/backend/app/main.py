import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import db_instance, connect_to_mongo, close_mongo_connection
from app.routes import auth, threats, chat, analytics, admin, reports

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("main")

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

async def fetch_and_store_threats():
    from app.services.news_service import NewsService
    from app.services.ai_service import AIService

    logger.info("Fetching latest threats from NewsData.io API...")
    articles = await NewsService.fetch_cybersecurity_news(limit=50)

    inserted = 0
    for item in articles:
        # Avoid duplicates by checking title
        exists = await db_instance.threats.find_one({"title": item["title"]})
        if not exists:
            ai_data = AIService._get_fallback_analysis(item["title"], item["description"])
            threat_doc = item.copy()
            threat_doc.update(ai_data)
            await db_instance.threats.insert_one(threat_doc)
            inserted += 1

    logger.info(f"Threat refresh complete. {inserted} new threats inserted.")


async def periodic_threat_refresh():
    """Refresh threats from API every 30 minutes."""
    while True:
        await asyncio.sleep(30 * 60)
        try:
            await fetch_and_store_threats()
        except Exception as e:
            logger.error(f"Periodic threat refresh failed: {e}")


async def seed_database():
    # 1. Seed Admin User
    admin_count = await db_instance.users.count_documents({"role": "admin"})
    if admin_count == 0:
        from app.auth import get_password_hash
        admin_dict = {
            "email": settings.ADMIN_EMAIL,
            "full_name": "CTI System Admin",
            "hashed_password": get_password_hash(settings.ADMIN_PASSWORD),
            "role": "admin",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db_instance.users.insert_one(admin_dict)
        logger.info(f"Database seeded with default Admin user: {settings.ADMIN_EMAIL}")

    # 2. Always fetch fresh threats from real API on startup
    await fetch_and_store_threats()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await seed_database()
    # Start background refresh task
    refresh_task = asyncio.create_task(periodic_threat_refresh())

    yield

    refresh_task.cancel()
    await close_mongo_connection()

app = FastAPI(
    title="AI Cyber Threat Intelligence Assistant API",
    description="Backend API powering the CTI Assistant dashboard and chatbot",
    version="1.0.0",
    lifespan=lifespan
)

# SlowAPI Rate Limiting exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(threats.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(reports.router)

@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db_instance.db is not None else "disconnected"
    }
