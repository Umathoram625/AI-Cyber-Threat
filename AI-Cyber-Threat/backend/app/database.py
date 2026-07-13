import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None
    
    # Collections
    users = None
    threats = None
    chats = None
    logs = None
    system_settings = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    
    db_instance.users = db_instance.db["users"]
    db_instance.threats = db_instance.db["threats"]
    db_instance.chats = db_instance.db["chats"]
    db_instance.logs = db_instance.db["logs"]
    db_instance.system_settings = db_instance.db["system_settings"]
    
    # Initialize indexes
    await db_instance.users.create_index("email", unique=True)
    await db_instance.threats.create_index("cve_ids")
    await db_instance.threats.create_index("published_date")
    # Text index for search
    await db_instance.threats.create_index([
        ("title", "text"),
        ("description", "text"),
        ("ai_summary", "text"),
        ("malware_name", "text"),
        ("threat_type", "text"),
        ("country", "text")
    ], name="threat_text_search")
    
    logger.info("MongoDB connected and indexes initialized.")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")
