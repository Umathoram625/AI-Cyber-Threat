from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime

from app.database import db_instance
from app.auth import get_current_user
from app.models import UserResponse
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/api/reports", tags=["Report Generator"])

@router.get("/download")
async def download_pdf_report(current_user: UserResponse = Depends(get_current_user)):
    try:
        # 1. Fetch recent threats to display in report
        cursor = db_instance.threats.find().sort("published_date", -1).limit(20)
        threats = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            threats.append(doc)
            
        # 2. Compile stats for report
        total_threats = await db_instance.threats.count_documents({})
        critical_threats = await db_instance.threats.count_documents({"severity": "Critical"})
        high_threats = await db_instance.threats.count_documents({"severity": "High"})
        
        # Top target industry
        industry_pipeline = [
            {"$group": {"_id": "$industry_target", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        ind_cursor = db_instance.threats.aggregate(industry_pipeline)
        top_industry = "General"
        async for doc in ind_cursor:
            top_industry = doc["_id"]
            
        # Top categories (threat types)
        cat_pipeline = [
            {"$group": {"_id": "$threat_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 2}
        ]
        cat_cursor = db_instance.threats.aggregate(cat_pipeline)
        top_categories = []
        async for doc in cat_cursor:
            top_categories.append(doc["_id"])
            
        stats = {
            "total_threats": total_threats,
            "critical_threats": critical_threats,
            "high_threats": high_threats,
            "top_industry": top_industry,
            "top_categories": top_categories if top_categories else ["Ransomware"]
        }
        
        # 3. Generate PDF
        pdf_buffer = PDFService.generate_threat_report(threats, stats)
        
        filename = f"cyber_threat_intel_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # Write log
        await db_instance.logs.insert_one({
            "timestamp": datetime.utcnow(),
            "level": "INFO",
            "component": "SYSTEM",
            "message": f"User {current_user.email} downloaded security PDF report."
        })
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate threat report PDF: {str(e)}"
        )
