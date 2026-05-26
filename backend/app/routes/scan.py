from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.database import database
from app.utils.auth import get_current_user
from app.services.scanner import scan_url
import socket
import urllib.request
from urllib.parse import urlparse
from datetime import datetime

router = APIRouter()

class URLRequest(BaseModel):
    url: str

class ScanResponse(BaseModel):
    url: str
    risk_score: float
    classification: str

@router.post("/scan-url", response_model=ScanResponse)
def run_scan(request: URLRequest, current_user: dict = Depends(get_current_user)):
    # 1. Analyze the URL
    scan_result = scan_url(request.url)
    
    # 2. Save to database
    db = database.get_db()
    scan_doc = {
        "url": scan_result["url"],
        "risk_score": scan_result["risk_score"],
        "classification": scan_result["classification"],
        "timestamp": datetime.utcnow(),
        "user_id": current_user["_id"]
    }
    db.scans.insert_one(scan_doc)
    
    return scan_result

class SecurityResponse(BaseModel):
    url: str
    open_ports: list[int]
    vulnerabilities: list[str]

@router.post("/analyze-security", response_model=SecurityResponse)
def analyze_security(request: URLRequest):
    parsed = urlparse(request.url)
    domain = parsed.netloc.split(':')[0]
    if not domain:
        domain = request.url.split('/')[0]

    open_ports = []
    ports_to_check = [21, 22, 80, 443, 3306, 3389]
    for port in ports_to_check:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                if s.connect_ex((domain, port)) == 0:
                    open_ports.append(port)
        except Exception:
            pass

    vulnerabilities = []
    if parsed.scheme in ['http', 'https']:
        try:
            req = urllib.request.Request(request.url, method='HEAD')
            # Add a user agent so sites don't block us as easily
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0 Safari/537.36')
            with urllib.request.urlopen(req, timeout=3) as response:
                headers = response.headers
                
                if 'Strict-Transport-Security' not in headers:
                    vulnerabilities.append("Missing Strict-Transport-Security (HSTS) header")
                if 'X-Frame-Options' not in headers:
                    vulnerabilities.append("Missing X-Frame-Options header (vulnerable to Clickjacking)")
                if 'X-Content-Type-Options' not in headers:
                    vulnerabilities.append("Missing X-Content-Type-Options header")
                if 'Content-Security-Policy' not in headers:
                    vulnerabilities.append("Missing Content-Security-Policy header")
        except Exception as e:
            vulnerabilities.append(f"Could not analyze headers: {str(e)}")

    return {
        "url": request.url,
        "open_ports": open_ports,
        "vulnerabilities": vulnerabilities
    }

