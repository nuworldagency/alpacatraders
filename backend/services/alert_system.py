import asyncio
from typing import Dict, List, Optional, Callable
import websockets
import json
from datetime import datetime
import logging
from pydantic import BaseModel

class Alert(BaseModel):
    id: str
    user_id: str
    symbol: str
    condition: str
    message: str
    status: str
    created_at: datetime
    triggered_at: Optional[datetime] = None

class AlertManager:
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.websocket_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.price_subscriptions: Dict[str, set] = {}
        self.callbacks: Dict[str, List[Callable]] = {}
        
    async def add_alert(self, alert: Alert) -> None:
        """Add a new alert to the system"""
        self.alerts[alert.id] = alert
        # Subscribe to price updates if needed
        if alert.symbol not in self.price_subscriptions:
            self.price_subscriptions[alert.symbol] = set()
        self.price_subscriptions[alert.symbol].add(alert.id)
        
    async def remove_alert(self, alert_id: str) -> None:
        """Remove an alert from the system"""
        if alert_id in self.alerts:
            alert = self.alerts[alert_id]
            self.price_subscriptions[alert.symbol].remove(alert_id)
            if not self.price_subscriptions[alert.symbol]:
                del self.price_subscriptions[alert.symbol]
            del self.alerts[alert_id]
            
    async def register_websocket(self, user_id: str, websocket: websockets.WebSocketServerProtocol) -> None:
        """Register a new WebSocket connection for a user"""
        self.websocket_connections[user_id] = websocket
        
    async def unregister_websocket(self, user_id: str) -> None:
        """Unregister a WebSocket connection"""
        if user_id in self.websocket_connections:
            del self.websocket_connections[user_id]
            
    async def add_callback(self, alert_id: str, callback: Callable) -> None:
        """Add a callback function for an alert"""
        if alert_id not in self.callbacks:
            self.callbacks[alert_id] = []
        self.callbacks[alert_id].append(callback)
        
    async def process_price_update(self, symbol: str, price_data: Dict) -> None:
        """Process a price update and check for triggered alerts"""
        if symbol not in self.price_subscriptions:
            return
            
        for alert_id in self.price_subscriptions[symbol]:
            alert = self.alerts[alert_id]
            if await self._check_alert_condition(alert, price_data):
                await self._trigger_alert(alert, price_data)
                
    async def _check_alert_condition(self, alert: Alert, price_data: Dict) -> bool:
        """Check if an alert condition is met"""
        try:
            # Parse and evaluate the alert condition
            # This is a simple example - you would want to implement a more sophisticated
            # condition parser in production
            price = price_data.get('close', 0)
            condition = alert.condition
            
            if '>=' in condition:
                threshold = float(condition.split('>=')[1].strip())
                return price >= threshold
            elif '<=' in condition:
                threshold = float(condition.split('<=')[1].strip())
                return price <= threshold
            elif '>' in condition:
                threshold = float(condition.split('>')[1].strip())
                return price > threshold
            elif '<' in condition:
                threshold = float(condition.split('<')[1].strip())
                return price < threshold
            
            return False
        except Exception as e:
            logging.error(f"Error checking alert condition: {str(e)}")
            return False
            
    async def _trigger_alert(self, alert: Alert, price_data: Dict) -> None:
        """Handle a triggered alert"""
        try:
            # Update alert status
            alert.status = "triggered"
            alert.triggered_at = datetime.now()
            
            # Prepare notification message
            notification = {
                'type': 'alert',
                'alert_id': alert.id,
                'symbol': alert.symbol,
                'message': alert.message,
                'price': price_data.get('close', 0),
                'triggered_at': alert.triggered_at.isoformat()
            }
            
            # Send notification to user's WebSocket if connected
            if alert.user_id in self.websocket_connections:
                try:
                    await self.websocket_connections[alert.user_id].send(
                        json.dumps(notification)
                    )
                except websockets.exceptions.ConnectionClosed:
                    await self.unregister_websocket(alert.user_id)
            
            # Execute callbacks
            if alert.id in self.callbacks:
                for callback in self.callbacks[alert.id]:
                    try:
                        await callback(alert, price_data)
                    except Exception as e:
                        logging.error(f"Error executing alert callback: {str(e)}")
            
            # Remove one-time alerts
            if alert.status == "one_time":
                await self.remove_alert(alert.id)
                
        except Exception as e:
            logging.error(f"Error triggering alert: {str(e)}")

class AlertWebSocketHandler:
    def __init__(self, alert_manager: AlertManager):
        self.alert_manager = alert_manager
        
    async def handle_websocket(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """Handle WebSocket connections for real-time alerts"""
        try:
            # Authenticate user (you should implement proper authentication)
            auth_message = await websocket.recv()
            auth_data = json.loads(auth_message)
            user_id = auth_data.get('user_id')
            
            if not user_id:
                await websocket.close(1008, "Authentication required")
                return
                
            # Register WebSocket connection
            await self.alert_manager.register_websocket(user_id, websocket)
            
            try:
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        command = data.get('command')
                        
                        if command == 'subscribe':
                            # Handle subscription to new alerts
                            alert_data = data.get('alert')
                            if alert_data:
                                alert = Alert(**alert_data)
                                await self.alert_manager.add_alert(alert)
                                await websocket.send(json.dumps({
                                    'type': 'subscription',
                                    'status': 'success',
                                    'alert_id': alert.id
                                }))
                                
                        elif command == 'unsubscribe':
                            # Handle unsubscription from alerts
                            alert_id = data.get('alert_id')
                            if alert_id:
                                await self.alert_manager.remove_alert(alert_id)
                                await websocket.send(json.dumps({
                                    'type': 'unsubscription',
                                    'status': 'success',
                                    'alert_id': alert_id
                                }))
                                
                    except json.JSONDecodeError:
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Invalid JSON format'
                        }))
                        
            except websockets.exceptions.ConnectionClosed:
                pass
                
        finally:
            # Clean up when connection is closed
            if user_id:
                await self.alert_manager.unregister_websocket(user_id)
