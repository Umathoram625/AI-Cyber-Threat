from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any
from bson import ObjectId
from datetime import datetime

from app.database import db_instance
from app.auth import get_current_admin
from app.models import UserResponse, APIKeysUpdate, ThreatModel
from app.services.news_service import NewsService
from app.services.ai_service import AIService
from app.config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin Control Panel"])

@router.get("/users", response_model=List[UserResponse])
async def get_users(current_admin: UserResponse = Depends(get_current_admin)):
    cursor = db_instance.users.find().sort("created_at", -1)
    users = []
    async for u in cursor:
        u["id"] = str(u["_id"])
        users.append(UserResponse(**u))
    return users

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_admin: UserResponse = Depends(get_current_admin)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
        
    user = await db_instance.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user["email"] == current_admin.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete yourself")
        
    await db_instance.users.delete_one({"_id": ObjectId(user_id)})
    
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "WARNING",
        "component": "AUTH",
        "message": f"Admin deleted user account: {user['email']}"
    })
    return {"message": "User deleted successfully"}

@router.get("/logs")
async def get_system_logs(limit: int = 50, current_admin: UserResponse = Depends(get_current_admin)):
    cursor = db_instance.logs.find().sort("timestamp", -1).limit(limit)
    logs = []
    async for log in cursor:
        log["id"] = str(log["_id"])
        log["timestamp"] = log["timestamp"].isoformat()
        logs.append(log)
    return logs

async def refresh_threat_intel_task():
    try:
        # Log start
        await db_instance.logs.insert_one({
            "timestamp": datetime.utcnow(),
            "level": "INFO",
            "component": "NEWS_FETCHER",
            "message": "Manual threat intelligence refresh started."
        })
        
        # Load keys from database if they exist
        sys_settings = await db_instance.system_settings.find_one({"key": "api_keys"})
        if sys_settings:
            # Dynamically update settings overrides
            if sys_settings.get("newsdata_api_key"):
                settings.NEWSDATA_API_KEY = sys_settings.get("newsdata_api_key")
            if sys_settings.get("openai_api_key"):
                settings.OPENAI_API_KEY = sys_settings.get("openai_api_key")
            if sys_settings.get("openai_model"):
                settings.OPENAI_MODEL = sys_settings.get("openai_model")
                
        # Fetch news
        articles = await NewsService.fetch_cybersecurity_news(limit=10)
        
        new_count = 0
        for article in articles:
            # Check if threat already exists (by title match to avoid duplicates)
            existing = await db_instance.threats.find_one({"title": article["title"]})
            if existing:
                continue
                
            # Perform AI Analysis
            ai_data = await AIService.analyze_threat(article["title"], article["description"])
            
            # Combine fields
            threat_doc = article.copy()
            threat_doc.update(ai_data)
            
            # Save to MongoDB
            await db_instance.threats.insert_one(threat_doc)
            new_count += 1
            
        await db_instance.logs.insert_one({
            "timestamp": datetime.utcnow(),
            "level": "INFO",
            "component": "NEWS_FETCHER",
            "message": f"Threat refresh completed. Ingested {new_count} new threat intelligence reports."
        })
    except Exception as e:
        await db_instance.logs.insert_one({
            "timestamp": datetime.utcnow(),
            "level": "ERROR",
            "component": "NEWS_FETCHER",
            "message": f"Manual refresh failed: {str(e)}"
        })

@router.post("/news/refresh")
async def trigger_news_refresh(
    background_tasks: BackgroundTasks, 
    current_admin: UserResponse = Depends(get_current_admin)
):
    background_tasks.add_task(refresh_threat_intel_task)
    return {"message": "Threat intelligence refresh task queued in background."}

@router.get("/keys")
async def get_keys(current_admin: UserResponse = Depends(get_current_admin)):
    sys_settings = await db_instance.system_settings.find_one({"key": "api_keys"})
    if not sys_settings:
        return {
            "newsdata_api_key": settings.NEWSDATA_API_KEY,
            "serper_api_key": settings.SERPER_API_KEY,
            "openai_api_key": settings.OPENAI_API_KEY,
            "openai_model": settings.OPENAI_MODEL
        }
    return {
        "newsdata_api_key": sys_settings.get("newsdata_api_key", settings.NEWSDATA_API_KEY),
        "serper_api_key": sys_settings.get("serper_api_key", settings.SERPER_API_KEY),
        "openai_api_key": sys_settings.get("openai_api_key", settings.OPENAI_API_KEY),
        "openai_model": sys_settings.get("openai_model", settings.OPENAI_MODEL)
    }

@router.post("/keys")
async def update_keys(keys: APIKeysUpdate, current_admin: UserResponse = Depends(get_current_admin)):
    # Update DB config
    update_data = {
        "key": "api_keys",
        "updated_at": datetime.utcnow()
    }
    if keys.newsdata_api_key is not None:
        update_data["newsdata_api_key"] = keys.newsdata_api_key
        settings.NEWSDATA_API_KEY = keys.newsdata_api_key
    if keys.openai_api_key is not None:
        update_data["openai_api_key"] = keys.openai_api_key
        settings.OPENAI_API_KEY = keys.openai_api_key
    if keys.openai_model is not None:
        update_data["openai_model"] = keys.openai_model
        settings.OPENAI_MODEL = keys.openai_model
        
    await db_instance.system_settings.update_one(
        {"key": "api_keys"},
        {"$set": update_data},
        upsert=True
    )
    
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "SYSTEM",
        "message": "Admin updated system API configuration keys dynamically."
    })
    
    return {"message": "API keys updated successfully."}
