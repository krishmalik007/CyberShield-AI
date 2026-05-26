import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

def generate_dummy_data():
    """
    Generates dummy data for training since we don't have a dataset yet.
    In a real scenario, we would load from datasets/
    """
    data = [
        # features: url_length, num_dots, has_https, has_ip, num_special_chars, num_suspicious_keywords, label (0=Safe, 1=Phishing)
        [20, 2, 1, 0, 0, 0, 0], # google.com
        [30, 2, 1, 0, 0, 0, 0], # github.com
        [150, 5, 0, 1, 3, 2, 1], # http://192.168.1.1/login.php?update=true
        [45, 3, 0, 0, 1, 1, 1], # http://paypal-verify-account.com
        [80, 4, 1, 0, 2, 1, 1], # https://secure-login.bank-update.com
        [25, 2, 1, 0, 0, 0, 0], # microsoft.com
        [100, 4, 0, 1, 4, 1, 1], # http://10.0.0.5/verify?account=123
        [60, 2, 1, 0, 1, 0, 0], # https://www.reddit.com/r/learnpython/
        [35, 3, 0, 0, 0, 1, 1], # http://update.your-bank.com
        [15, 2, 1, 0, 0, 0, 0], # apple.com
    ]
    
    df = pd.DataFrame(data, columns=[
        'url_length', 'num_dots', 'has_https', 'has_ip', 
        'num_special_chars', 'num_suspicious_keywords', 'label'
    ])
    return df

def train_and_save_model():
    print("Generating training data...")
    df = generate_dummy_data()
    
    X = df.drop('label', axis=1)
    y = df['label']
    
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Ensure ml directory exists
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    
    model_path = os.path.join(os.path.dirname(__file__), 'phishing_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
