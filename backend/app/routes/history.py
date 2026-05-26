from fastapi import APIRouter, Depends
from app.database import database
from app.utils.auth import get_current_user
from pydantic import BaseModel
import datetime
from typing import List

router = APIRouter()

class ScanHistoryResponse(BaseModel):
    id: str
    url: str
    risk_score: float
    classification: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/history", response_model=List[ScanHistoryResponse])
def get_history(limit: int = 50, classification: str = None, current_user: dict = Depends(get_current_user)):
    db = database.get_db()
    query = {"user_id": current_user["_id"]}
    if classification:
        query["classification"] = classification
        
    scans = list(db.scans.find(query).sort("timestamp", -1).limit(limit))
    
    # Map MongoDB _id to Pydantic id
    result = []
    for scan in scans:
        result.append({
            "id": str(scan["_id"]),
            "url": scan["url"],
            "risk_score": scan["risk_score"],
            "classification": scan["classification"],
            "timestamp": scan["timestamp"]
        })
    return result
