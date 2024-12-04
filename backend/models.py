from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    username: str
    email: str
    hashed_password: str
    
class Strategy(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    description: str
    pine_script: str
    timeframe: str
    created_at: str
    updated_at: str
    
class PineScriptRequest(BaseModel):
    description: str
    timeframe: Optional[str] = "D"
    indicators: Optional[List[str]] = []
    
class PineScriptResponse(BaseModel):
    script: str
    message: Optional[str] = None
