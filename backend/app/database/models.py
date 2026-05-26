from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    username: str
    email: str
    hashed_password: str

class User(BaseModel):
    id: str
    username: str
    email: str

    class Config:
        from_attributes = True
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ScanHistoryBase(BaseModel):
    url: str
    risk_score: float
    classification: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str

class EmailScanHistoryBase(BaseModel):
    risk_score: float
    classification: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
