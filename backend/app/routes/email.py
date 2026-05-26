from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.database import database
from app.utils.auth import get_current_user
import re
from urllib.parse import urlparse
from datetime import datetime
import re
import re

router = APIRouter()

class EmailRequest(BaseModel):
    content: str
    sender: str = None

class EmailScanResponse(BaseModel):
    risk_score: float
    classification: str
    summary: str
    findings: list[str]

def generate_summary(text: str) -> str:
    """Generates a basic extractive summary of the email text."""
    # Clean up excess whitespace and newlines
    clean_text = re.sub(r'\s+', ' ', text).strip()
    
    # Split into rough sentences based on punctuation followed by a space
    sentences = re.split(r'(?<=[.!?])\s+', clean_text)
    
    # Filter out sentences that look like URLs or are too short
    valid_sentences = [
        s for s in sentences 
        if len(s) > 15 and not s.startswith('http') and '@' not in s
    ]
    
    # Return the first 2 meaningful sentences
    if len(valid_sentences) == 0:
        return "No meaningful content found to summarize."
    elif len(valid_sentences) == 1:
        return valid_sentences[0]
    else:
        return f"{valid_sentences[0]} {valid_sentences[1]}"

@router.post("/scan-email", response_model=EmailScanResponse)
def scan_email(request: EmailRequest, current_user: dict = Depends(get_current_user)):
    content = request.content.lower()
    risk_score = 0
    findings = []
    
    # 1. Check for urgency keywords
    urgency_keywords = ['urgent', 'immediate action required', 'account suspended', 'verify your account', 'password reset']
    for keyword in urgency_keywords:
        if keyword in content:
            risk_score += 20
            findings.append(f"Contains urgency keyword: '{keyword}'")
            
    # 2. Check for suspicious links in email
    # Extract URLs
    urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', content)
    if urls:
        findings.append(f"Found {len(urls)} link(s) in email.")
        # Basic check on URLs
        for url in urls:
            if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", urlparse(url).netloc):
                risk_score += 40
                findings.append(f"Suspicious IP-based link found: {url}")
                
    # 3. Sender domain check (if provided)
    if request.sender:
        suspicious_senders = ['@admin-support', '@verify', 'no-reply-update']
        for sender_key in suspicious_senders:
            if sender_key in request.sender.lower():
                risk_score += 30
                findings.append(f"Suspicious sender: {request.sender}")
                
    risk_score = min(risk_score, 100)
    
    if risk_score <= 30:
        classification = "safe"
    elif risk_score <= 60:
        classification = "suspicious"
    else:
        classification = "phishing"
        
    summary = generate_summary(request.content)
        
    # Save to database
    db = database.get_db()
    email_doc = {
        "risk_score": float(risk_score),
        "classification": classification,
        "timestamp": datetime.utcnow(),
        "user_id": current_user["_id"]
    }
    db.email_scans.insert_one(email_doc)

    return {
        "risk_score": float(risk_score),
        "classification": classification,
        "summary": summary,
        "findings": findings
    }

@router.get("/email-history")
def get_email_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    db = database.get_db()
    scans = list(db.email_scans.find({"user_id": current_user["_id"]}).sort("timestamp", -1).limit(limit))
    
    result = []
    for scan in scans:
        result.append({
            "id": str(scan["_id"]),
            "risk_score": scan["risk_score"],
            "classification": scan["classification"],
            "timestamp": scan["timestamp"]
        })
    return result
