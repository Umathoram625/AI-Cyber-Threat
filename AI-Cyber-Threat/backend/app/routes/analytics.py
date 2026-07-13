from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.database import db_instance
from app.auth import get_current_user
from app.models import UserResponse

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/overview")
async def get_analytics_overview(current_user: UserResponse = Depends(get_current_user)):
    # 1. Country aggregates
    country_pipeline = [
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    country_cursor = db_instance.threats.aggregate(country_pipeline)
    by_country = [{"country": doc["_id"], "count": doc["count"]} async for doc in country_cursor]
    
    # 2. Category (threat_type) aggregates
    category_pipeline = [
        {"$group": {"_id": "$threat_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_cursor = db_instance.threats.aggregate(category_pipeline)
    by_category = [{"category": doc["_id"], "count": doc["count"]} async for doc in category_cursor]
    
    # 3. Severity aggregates
    severity_pipeline = [
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}}
    ]
    severity_cursor = db_instance.threats.aggregate(severity_pipeline)
    by_severity = [{"severity": doc["_id"], "count": doc["count"]} async for doc in severity_cursor]
    
    # Make sure we have representations for all categories if count is 0
    severity_order = ["Critical", "High", "Medium", "Low"]
    by_severity_dict = {item["severity"]: item["count"] for item in by_severity}
    by_severity_sorted = [
        {"severity": sev, "count": by_severity_dict.get(sev, 0)} for sev in severity_order
    ]
    
    # 4. Industry target aggregates
    industry_pipeline = [
        {"$group": {"_id": "$industry_target", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8}
    ]
    industry_cursor = db_instance.threats.aggregate(industry_pipeline)
    by_industry = [{"industry": doc["_id"], "count": doc["count"]} async for doc in industry_cursor]
    
    # 5. Threat Source aggregates
    source_pipeline = [
        {"$group": {"_id": "$source", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8}
    ]
    source_cursor = db_instance.threats.aggregate(source_pipeline)
    by_source = [{"source": doc["_id"], "count": doc["count"]} async for doc in source_cursor]
    
    # 6. Monthly timeline aggregates
    monthly_pipeline = [
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$published_date"},
                    "month": {"$month": "$published_date"}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    monthly_cursor = db_instance.threats.aggregate(monthly_pipeline)
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    by_month = []
    async for doc in monthly_cursor:
        y = doc["_id"].get("year")
        m = doc["_id"].get("month")
        if y and m:
            label = f"{months[m-1]} {y}"
            by_month.append({"month": label, "count": doc["count"]})

    # Default mockup if DB is completely empty (safeguard)
    if not by_month:
        by_month = [{"month": "Jul 2026", "count": 0}]

    return {
        "threats_by_country": by_country,
        "threats_by_category": by_category,
        "threats_by_severity": by_severity_sorted,
        "threats_by_industry": by_industry,
        "threats_by_source": by_source,
        "threats_by_month": by_month
    }
