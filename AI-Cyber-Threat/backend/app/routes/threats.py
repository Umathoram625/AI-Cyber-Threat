from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.database import db_instance
from app.auth import get_current_user, get_current_admin
from app.models import ThreatModel, ThreatCreate, ThreatUpdate, UserResponse

router = APIRouter(prefix="/api/threats", tags=["Threat Intelligence"])

@router.get("", response_model=List[ThreatModel])
async def get_threats(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    threat_type: Optional[str] = None,
    country: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user)
):
    query = {}
    
    # Text/Regex Search
    if search:
        # Check if search is a CVE pattern
        import re
        if re.match(r"(?i)cve-\d{4}-\d{4,7}", search):
            query["cve_ids"] = {"$regex": search, "$options": "i"}
        else:
            # Case insensitive regex match across multiple fields
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"malware_name": {"$regex": search, "$options": "i"}},
                {"threat_type": {"$regex": search, "$options": "i"}},
                {"country": {"$regex": search, "$options": "i"}},
                {"organization": {"$regex": search, "$options": "i"}}
            ]
            
    # Filters
    if severity:
        query["severity"] = severity
    if threat_type:
        query["threat_type"] = threat_type
    if country:
        query["country"] = country
        
    # Date filters
    date_query = {}
    if start_date:
        try:
            date_query["$gte"] = datetime.fromisoformat(start_date)
        except ValueError:
            pass
    if end_date:
        try:
            date_query["$lte"] = datetime.fromisoformat(end_date)
        except ValueError:
            pass
            
    if date_query:
        query["published_date"] = date_query

    cursor = db_instance.threats.find(query).sort("published_date", -1).skip(skip).limit(limit)
    threats = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        threats.append(ThreatModel(**doc))
        
    return threats

@router.get("/summary-stats")
async def get_dashboard_summary(current_user: UserResponse = Depends(get_current_user)):
    total = await db_instance.threats.count_documents({})
    critical = await db_instance.threats.count_documents({"severity": "Critical"})
    high = await db_instance.threats.count_documents({"severity": "High"})
    medium = await db_instance.threats.count_documents({"severity": "Medium"})
    low = await db_instance.threats.count_documents({"severity": "Low"})
    
    # Get latest critical threat
    latest_critical_doc = await db_instance.threats.find_one(
        {"severity": "Critical"}, 
        sort=[("published_date", -1)]
    )
    latest_critical = None
    if latest_critical_doc:
        latest_critical_doc["id"] = str(latest_critical_doc["_id"])
        latest_critical = ThreatModel(**latest_critical_doc)
        
    return {
        "total_threats": total,
        "critical_threats": critical,
        "high_threats": high,
        "medium_threats": medium,
        "low_threats": low,
        "latest_critical_threat": latest_critical
    }

@router.get("/{threat_id}", response_model=ThreatModel)
async def get_threat_details(threat_id: str, current_user: UserResponse = Depends(get_current_user)):
    if not ObjectId.is_valid(threat_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid threat ID format"
        )
        
    doc = await db_instance.threats.find_one({"_id": ObjectId(threat_id)})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat intelligence record not found"
        )
        
    doc["id"] = str(doc["_id"])
    return ThreatModel(**doc)

@router.post("", response_model=ThreatModel, status_code=status.HTTP_201_CREATED)
async def create_threat(
    threat_in: ThreatCreate, 
    current_admin: UserResponse = Depends(get_current_admin)
):
    from app.services.ai_service import AIService
    
    # Auto analyze with AI upon creation
    ai_details = await AIService.analyze_threat(threat_in.title, threat_in.description)
    
    threat_dict = threat_in.dict()
    threat_dict.update(ai_details)
    
    # Store in MongoDB
    result = await db_instance.threats.insert_one(threat_dict)
    threat_dict["id"] = str(result.inserted_id)
    
    # Log the action
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "AI_SERVICE",
        "message": f"Admin manually created threat: {threat_in.title} (ID: {threat_dict['id']})"
    })
    
    return ThreatModel(**threat_dict)

@router.put("/{threat_id}", response_model=ThreatModel)
async def update_threat(
    threat_id: str,
    threat_in: ThreatUpdate,
    current_admin: UserResponse = Depends(get_current_admin)
):
    if not ObjectId.is_valid(threat_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid threat ID format"
        )
        
    existing = await db_instance.threats.find_one({"_id": ObjectId(threat_id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat not found"
        )
        
    update_data = {k: v for k, v in threat_in.dict(exclude_unset=True).items() if v is not None}
    
    if update_data:
        await db_instance.threats.update_one(
            {"_id": ObjectId(threat_id)},
            {"$set": update_data}
        )
        
    updated = await db_instance.threats.find_one({"_id": ObjectId(threat_id)})
    updated["id"] = str(updated["_id"])
    
    # Log the action
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "INFO",
        "component": "SYSTEM",
        "message": f"Admin updated threat ID: {threat_id}"
    })
    
    return ThreatModel(**updated)

@router.delete("/{threat_id}")
async def delete_threat(threat_id: str, current_admin: UserResponse = Depends(get_current_admin)):
    if not ObjectId.is_valid(threat_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid threat ID format"
        )
        
    result = await db_instance.threats.delete_one({"_id": ObjectId(threat_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat not found"
        )
        
    # Log the action
    await db_instance.logs.insert_one({
        "timestamp": datetime.utcnow(),
        "level": "WARNING",
        "component": "SYSTEM",
        "message": f"Admin deleted threat ID: {threat_id}"
    })
    
    return {"message": "Threat intel record successfully deleted"}
