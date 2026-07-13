from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from bson import ObjectId
import httpx
import json
import base64

from app.database import db_instance
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.models import (
    UserRegister, UserLogin, UserResponse, UserProfileUpdate,
    Token, ForgotPasswordRequest, ResetPasswordRequest, GoogleLoginRequest
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserRegister):
    # Check if user already exists
    existing_user = await db_instance.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_in.password)
    
    # Determine role (if first user or matches configured admin email)
    role = "user"
    user_count = await db_instance.users.count_documents({})
    if user_count == 0 or user_in.email == settings.ADMIN_EMAIL:
        role = "admin"
        
    user_dict = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "hashed_password": hashed_password,
        "role": role,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db_instance.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    # Write system log
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "AUTH",
        "message": f"User registered: {user_in.email} with role: {role}"
    })
    
    return UserResponse(**user_dict)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db_instance.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user["id"] = str(user["_id"])
    user_resp = UserResponse(**user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["email"], "email": user["email"], "role": user["role"]}
    )
    
    # Log login success
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "AUTH",
        "message": f"User logged in: {credentials.email}"
    })
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        user=user_resp
    )

@router.post("/google", response_model=Token)
async def google_login(req: GoogleLoginRequest):
    # Verify token with Google's tokeninfo endpoint (async, no blocking calls)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": req.credential},
            timeout=10.0
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token verification failed: {resp.text}"
        )

    id_info = resp.json()

    # Verify the token was issued for our app
    if id_info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token audience mismatch. Expected {settings.GOOGLE_CLIENT_ID}, got {id_info.get('aud')}"
        )

    email = id_info.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token missing email")

    full_name = id_info.get("name", email.split("@")[0])

    user = await db_instance.users.find_one({"email": email})
    if not user:
        role = "admin" if email == settings.ADMIN_EMAIL else "user"
        user_dict = {
            "email": email,
            "full_name": full_name,
            "hashed_password": "",
            "role": role,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db_instance.users.insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        user = user_dict
    else:
        user["id"] = str(user["_id"])

    access_token = create_access_token(
        data={"sub": email, "email": email, "role": user["role"]}
    )
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "AUTH",
        "message": f"Google OAuth login: {email}"
    })
    return Token(access_token=access_token, token_type="bearer", role=user["role"], user=UserResponse(**user))


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate, 
    current_user: UserResponse = Depends(get_current_user)
):
    update_dict = {}
    if profile_data.full_name is not None:
        update_dict["full_name"] = profile_data.full_name
        
    if profile_data.password is not None:
        update_dict["hashed_password"] = get_password_hash(profile_data.password)
        
    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()
        await db_instance.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_dict}
        )
        
    updated_user = await db_instance.users.find_one({"_id": ObjectId(current_user.id)})
    updated_user["id"] = str(updated_user["_id"])
    
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "AUTH",
        "message": f"User profile updated: {current_user.email}"
    })
    
    return UserResponse(**updated_user)

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await db_instance.users.find_one({"email": req.email})
    if not user:
        # Avoid user enumeration, return successful anyway
        return {"message": "If this email exists, a password reset link has been dispatched."}
        
    # In a full production system, we'd send an email. For this CTI app, we log it and return simulated instructions.
    reset_url = f"http://localhost:5173/reset-password?email={req.email}&token=simulated-reset-token-123"
    
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "WARNING",
        "component": "AUTH",
        "message": f"Password reset requested for: {req.email}"
    })
    
    return {
        "message": "Password reset dispatch initialized.",
        "simulated_reset_url": reset_url
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    user = await db_instance.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    hashed_password = get_password_hash(req.new_password)
    await db_instance.users.update_one(
        {"email": req.email},
        {"$set": {"hashed_password": hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "AUTH",
        "message": f"Password reset successfully executed for user: {req.email}"
    })
    
    return {"message": "Password updated successfully."}
