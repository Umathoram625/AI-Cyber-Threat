from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from bson import ObjectId

from app.database import db_instance
from app.auth import get_current_user
from app.models import ChatQuery, ChatMessage, UserResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/chat", tags=["AI Chat Assistant"])

@router.post("")
async def send_chat_message(query: ChatQuery, current_user: UserResponse = Depends(get_current_user)):
    user_id = current_user.id
    session_id = query.session_id
    
    # 1. Retrieve or create chat session
    session = None
    if session_id:
        if ObjectId.is_valid(session_id):
            session = await db_instance.chats.find_one({"_id": ObjectId(session_id), "user_id": user_id})
            
    if not session:
        # Create a new session
        new_session = {
            "user_id": user_id,
            "messages": [],
            "updated_at": datetime.utcnow()
        }
        res = await db_instance.chats.insert_one(new_session)
        session_id = str(res.inserted_id)
        session = new_session
        session["_id"] = res.inserted_id
    else:
        session_id = str(session["_id"])

    # 2. Extract prior conversation history (excluding current message)
    history_list = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in session.get("messages", [])
    ]

    # 3. Save user message to DB
    user_message = {
        "role": "user",
        "content": query.message,
        "timestamp": datetime.utcnow()
    }
    await db_instance.chats.update_one(
        {"_id": session["_id"]},
        {
            "$push": {"messages": user_message},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    # 4. Generate AI response — pass history (without current msg) + current query separately
    assistant_content = await AIService.get_chatbot_response(query.message, history_list)
    
    # 5. Save assistant response
    assistant_message = {
        "role": "assistant",
        "content": assistant_content,
        "timestamp": datetime.utcnow()
    }
    
    await db_instance.chats.update_one(
        {"_id": session["_id"]},
        {
            "$push": {"messages": assistant_message},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {
        "session_id": session_id,
        "reply": assistant_content,
        "messages": session.get("messages", []) + [user_message, assistant_message]
    }

@router.get("/sessions")
async def get_chat_sessions(current_user: UserResponse = Depends(get_current_user)):
    cursor = db_instance.chats.find({"user_id": current_user.id}).sort("updated_at", -1)
    sessions = []
    async for s in cursor:
        # Generate summary of session (first user message or "New Chat")
        msg_summary = "New Conversation"
        messages = s.get("messages", [])
        if messages:
            msg_summary = messages[0]["content"][:35] + "..." if len(messages[0]["content"]) > 35 else messages[0]["content"]
            
        sessions.append({
            "session_id": str(s["_id"]),
            "summary": msg_summary,
            "updated_at": s["updated_at"]
        })
    return sessions

@router.get("/sessions/{session_id}")
async def get_chat_session_details(session_id: str, current_user: UserResponse = Depends(get_current_user)):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID"
        )
        
    session = await db_instance.chats.find_one({"_id": ObjectId(session_id), "user_id": current_user.id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
        
    return {
        "session_id": str(session["_id"]),
        "messages": session.get("messages", [])
    }
