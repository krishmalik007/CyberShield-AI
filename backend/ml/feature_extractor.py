import re
from urllib.parse import urlparse
import pandas as pd

def extract_features(url: str) -> dict:
    """
    Extracts features from a URL for machine learning.
    Returns a dictionary of features.
    """
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    
    features = {}
    
    # Feature 1: URL Length
    features['url_length'] = len(url)
    
    # Feature 2: Number of dots in URL
    features['num_dots'] = url.count('.')
    
    # Feature 3: Uses HTTPS? (1 for Yes, 0 for No)
    features['has_https'] = 1 if parsed_url.scheme == 'https' else 0
    
    # Feature 4: IP Address in domain? (1 for Yes, 0 for No)
    features['has_ip'] = 1 if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain) else 0
    
    # Feature 5: Special characters count (@, -, _, etc.)
    features['num_special_chars'] = len(re.findall(r'[@\-_=\?&]', url))
    
    # Feature 6: Suspicious keywords count
    suspicious_keywords = ['login', 'verify', 'update', 'secure', 'account', 'banking', 'paypal']
    url_lower = url.lower()
    features['num_suspicious_keywords'] = sum(1 for keyword in suspicious_keywords if keyword in url_lower)
    
    return features

def features_to_dataframe(url: str) -> pd.DataFrame:
    features = extract_features(url)
    return pd.DataFrame([features])
