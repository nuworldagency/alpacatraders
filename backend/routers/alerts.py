from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from services.alert_system import AlertManager, Alert
from models import User
from main import get_current_user
import uuid

router = APIRouter()
alert_manager = AlertManager()

class CreateAlertRequest(BaseModel):
    symbol: str
    condition: str
    message: str
    status: str = "active"

class AlertResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    condition: str
    message: str
    status: str
    created_at: datetime
    triggered_at: Optional[datetime] = None

@router.post("/alerts", response_model=AlertResponse)
async def create_alert(
    request: CreateAlertRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        alert = Alert(
            id=str(uuid.uuid4()),
            user_id=current_user.username,
            symbol=request.symbol,
            condition=request.condition,
            message=request.message,
            status=request.status,
            created_at=datetime.now()
        )
        
        await alert_manager.add_alert(alert)
        return alert
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(current_user: User = Depends(get_current_user)):
    try:
        user_alerts = [
            alert for alert in alert_manager.alerts.values()
            if alert.user_id == current_user.username
        ]
        return user_alerts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        alert = alert_manager.alerts.get(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        if alert.user_id != current_user.username:
            raise HTTPException(status_code=403, detail="Not authorized to delete this alert")
            
        await alert_manager.remove_alert(alert_id)
        return {"message": "Alert deleted successfully"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/alerts/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    
    try:
        # Register the WebSocket connection
        await alert_manager.register_websocket(user_id, websocket)
        
        try:
            while True:
                # Handle incoming WebSocket messages
                data = await websocket.receive_text()
                # Process messages if needed
                
        except WebSocketDisconnect:
            # Clean up on disconnect
            await alert_manager.unregister_websocket(user_id)
            
    except Exception as e:
        await alert_manager.unregister_websocket(user_id)
        await websocket.close(code=1011, reason=str(e))
