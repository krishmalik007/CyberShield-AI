from fastapi import APIRouter, Depends
from app.database import database
from app.utils.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    db = database.get_db()
    user_id = current_user["_id"]
    
    # Total URLs Scanned
    total_urls = db.scans.count_documents({"user_id": user_id})
    
    # Phishing Attempts Blocked
    phishing_blocked = db.scans.count_documents({"user_id": user_id, "classification": "phishing"})
    
    # Suspicious Domains Detected
    suspicious_domains = db.scans.count_documents({"user_id": user_id, "classification": "suspicious"})
    
    # Total Emails Scanned
    total_emails = db.email_scans.count_documents({"user_id": user_id})
    
    # Active Risk Score (average of last 10 scans)
    recent_scans = list(db.scans.find({"user_id": user_id}).sort("timestamp", -1).limit(10))
    if recent_scans:
        avg_score = sum(s["risk_score"] for s in recent_scans) / len(recent_scans)
        active_risk = "High" if avg_score > 60 else "Medium" if avg_score > 30 else "Low"
    else:
        active_risk = "Low"
        
    return {
        "total_urls": total_urls,
        "phishing_blocked": phishing_blocked,
        "suspicious_domains": suspicious_domains,
        "total_emails": total_emails,
        "active_risk": active_risk
    }

@router.get("/recent")
def get_recent_threats(limit: int = 5, current_user: dict = Depends(get_current_user)):
    db = database.get_db()
    
    # Get recent phishing or suspicious URLs
    threats = list(db.scans.find({
        "user_id": current_user["_id"],
        "classification": {"$in": ["phishing", "suspicious"]}
    }).sort("timestamp", -1).limit(limit))
    
    return [
        {
            "id": str(t["_id"]),
            "url": t["url"],
            "risk_score": t["risk_score"],
            "classification": t["classification"],
            "timestamp": t["timestamp"]
        }
        for t in threats
    ]

@router.get("/trends")
def get_threat_trends(current_user: dict = Depends(get_current_user)):
    db = database.get_db()
    user_id = current_user["_id"]
    
    # Calculate start date (7 days ago)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=6) # 7 days inclusive
    
    # MongoDB aggregation pipeline
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }},
        {"$project": {
            "classification": 1,
            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}
        }},
        {"$group": {
            "_id": {"date": "$date", "classification": "$classification"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = list(db.scans.aggregate(pipeline))
    
    # Organize data by date
    daily_stats = {}
    for i in range(7):
        target_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[target_date] = {"safe": 0, "suspicious": 0, "phishing": 0}
        
    for res in results:
        date_str = res["_id"]["date"]
        classification = res["_id"]["classification"]
        if date_str in daily_stats:
            daily_stats[date_str][classification] += res["count"]
            
    # Format for chart (e.g., 'Mon', 'Tue')
    trends = []
    for date_str, stats in daily_stats.items():
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        day_name = date_obj.strftime("%a")
        trends.append({
            "name": day_name,
            "safe": stats["safe"],
            "suspicious": stats["suspicious"],
            "phishing": stats["phishing"]
        })
        
    return trends
