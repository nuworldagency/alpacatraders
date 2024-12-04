from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from models import User
from routers import backtest, alerts, portfolio, crypto, trading
import uvicorn
from datetime import datetime, timedelta
import jwt
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(backtest.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(crypto.router, prefix="/api")
app.include_router(trading.router, prefix="/api")

# Authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        # Here you would typically query your database to get the user
        # For now, we'll return a mock user
        return User(username=username, email=f"{username}@example.com", hashed_password="")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@app.get("/")
async def root():
    return {"message": "Welcome"}

@app.post("/token")
async def login(username: str, password: str):
    # Here you would typically verify the username and password against your database
    # For now, we'll accept any username/password
    access_token = create_access_token(
        data={"sub": username},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/strategies")
async def get_strategies(current_user: User = Depends(get_current_user)):
    # Here you would typically query your database for the user's strategies
    # For now, we'll return a mock strategy
    return [
        {
            "id": "1",
            "user_id": current_user.username,
            "name": "Example Strategy",
            "description": "Buy when RSI is oversold",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
