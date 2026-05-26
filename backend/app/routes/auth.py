from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.database import database, models
from app.utils import auth
from datetime import timedelta

router = APIRouter()

@router.post("/signup", response_model=models.User)
def signup(user: models.UserCreate):
    db = database.get_db()
    
    # Check if user already exists
    existing_user = db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    existing_email = db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    result = db.users.insert_one(user_dict)
    
    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "email": user.email
    }

@router.post("/login", response_model=models.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = database.get_db()
    user = db.users.find_one({"username": form_data.username})
    
    if not user or not auth.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
