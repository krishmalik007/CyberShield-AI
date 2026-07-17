from urllib.parse import urlparse
import re
import os
import joblib
import pandas as pd
from ml.feature_extractor import features_to_dataframe

# Load ML Model
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'ml', 'phishing_model.pkl')
try:
    model = joblib.load(MODEL_PATH)
    print(f"Loaded ML model from {MODEL_PATH}")
except Exception as e:
    print(f"Could not load ML model (will fallback to heuristic): {e}")
    model = None

WHITELISTED_DOMAINS = {
    'google.com',
    'googleusercontent.com',
    'oracle.com',
    'koyeb.com',
    'github.com',
    'microsoft.com',
    'live.com',
    'outlook.com',
    'okta.com',
    'auth0.com',
    'netlify.app',
    'vercel.app',
    'supabase.co',
    'firebaseapp.com',
    'apple.com',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'gmail.com'
}

def is_whitelisted(url: str) -> bool:
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()
        if not domain:
            # Fallback if no scheme (e.g. urlparse("google.com").netloc is empty)
            if not url.startswith(('http://', 'https://')):
                parsed_url = urlparse('https://' + url)
                domain = parsed_url.netloc.lower()
            else:
                domain = url.split('/')[0].lower()
        
        # Remove port if present
        domain = domain.split(':')[0]
        
        # Check direct match or subdomain match
        if domain in WHITELISTED_DOMAINS:
            return True
            
        for white_dom in WHITELISTED_DOMAINS:
            if domain.endswith('.' + white_dom):
                return True
                
        return False
    except Exception:
        return False

def get_heuristic_score(url: str) -> int:
    risk_score = 0
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    
    if len(url) > 75: risk_score += 20
    if parsed_url.scheme != 'https': risk_score += 30
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain): risk_score += 40
    if domain.count('.') > 2: risk_score += 15
        
    suspicious_keywords = ['login', 'verify', 'update', 'secure', 'account', 'banking', 'paypal']
    url_lower = url.lower()
    for keyword in suspicious_keywords:
        if keyword in url_lower:
            risk_score += 20
            
    return min(risk_score, 100)

def scan_url(url: str) -> dict:
    """
    Scans a URL. Uses ML if available, otherwise falls back to heuristic.
    """
    if is_whitelisted(url):
        return {
            "url": url,
            "risk_score": 0.0,
            "classification": "safe"
        }

    if model:
        # Use ML Model
        features_df = features_to_dataframe(url)
        # Predict probability of class 1 (phishing)
        proba = model.predict_proba(features_df)[0]
        # probability of phishing as percentage
        risk_score = float(proba[1] * 100)
    else:
        # Fallback
        risk_score = float(get_heuristic_score(url))
        
    if risk_score <= 30:
        classification = "safe"
    elif risk_score <= 60:
        classification = "suspicious"
    else:
        classification = "phishing"
        
    return {
        "url": url,
        "risk_score": round(risk_score, 2),
        "classification": classification
    }
