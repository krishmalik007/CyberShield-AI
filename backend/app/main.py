from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.routes import auth, scan, history, email, dashboard
from app.utils.auth import get_current_user
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CyberShield AI API", docs_url=None, redoc_url=None)

# Allow the browser extension to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Authentication"])
app.include_router(scan.router, tags=["Scanner"])
app.include_router(history.router, tags=["History"])
app.include_router(email.router, tags=["Email"])
app.include_router(dashboard.router, prefix="/stats", tags=["Dashboard"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

last_pings = {}

@app.post("/ping", tags=["Health"])
def ping(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    last_pings[user_id] = datetime.utcnow()
    return {"status": "ok"}

@app.get("/extension-status", tags=["Health"])
def extension_status(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    last_ping = last_pings.get(user_id)
    if not last_ping:
        return {"active": False}
    return {"active": (datetime.utcnow() - last_ping).total_seconds() < 120}
