from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# Helper to serialize MongoDB ObjectIDs
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        return str(v)

# --- USER AUTHENTICATION MODELS ---

class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "user"

class UserRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        populate_by_name = True

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str = Field(..., min_length=6)

class GoogleLoginRequest(BaseModel):
    credential: str

# --- THREAT INTELLIGENCE MODELS ---

class ThreatModel(BaseModel):
    id: Optional[str] = None
    title: str
    source: str
    published_date: datetime
    country: str = "Global"
    description: str
    threat_type: str = "Unknown"
    organization: Optional[str] = "Unknown"
    malware_name: Optional[str] = None
    cve_ids: List[str] = []
    url: Optional[str] = None
    
    # AI Analysis Fields
    ai_summary: Optional[str] = None
    severity: str = "Medium" # Critical, High, Medium, Low
    attack_type: Optional[str] = "Unknown"
    industry_target: Optional[str] = "General"
    risk_score: int = Field(50, ge=0, le=100)
    preventive_actions: List[str] = []
    mitre_attack_mapping: Optional[str] = None
    
    class Config:
        populate_by_name = True

class ThreatCreate(BaseModel):
    title: str
    source: str
    published_date: datetime
    country: str = "Global"
    description: str
    threat_type: str = "Unknown"
    organization: Optional[str] = "Unknown"
    malware_name: Optional[str] = None
    cve_ids: List[str] = []
    url: Optional[str] = None

class ThreatUpdate(BaseModel):
    title: Optional[str] = None
    source: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    threat_type: Optional[str] = None
    organization: Optional[str] = None
    malware_name: Optional[str] = None
    cve_ids: Optional[List[str]] = None
    severity: Optional[str] = None
    risk_score: Optional[int] = None
    preventive_actions: Optional[List[str]] = None
    mitre_attack_mapping: Optional[str] = None
    ai_summary: Optional[str] = None

# --- AI CHAT MODULE MODELS ---

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(BaseModel):
    id: Optional[str] = None
    user_id: str
    messages: List[ChatMessage] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatQuery(BaseModel):
    message: str
    session_id: Optional[str] = None

# --- SYSTEM LOGS & SETTINGS MODELS ---

class SystemLog(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    level: str # "INFO", "WARNING", "ERROR"
    component: str # "AUTH", "NEWS_FETCHER", "AI_SERVICE", "SYSTEM"
    message: str

class APIKeysUpdate(BaseModel):
    newsdata_api_key: Optional[str] = None
    serper_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = None
