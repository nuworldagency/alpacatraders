from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from ..services.trading_service import TradingService

router = APIRouter()
trading_service = TradingService()

class OrderRequest(BaseModel):
    symbol: str
    quantity: float
    side: str

@router.get("/account")
async def get_account():
    """Get account information"""
    try:
        return await trading_service.get_account()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/positions")
async def get_positions():
    """Get current positions"""
    try:
        return await trading_service.get_positions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/order")
async def place_order(order: OrderRequest):
    """Place a market order"""
    try:
        return await trading_service.place_market_order(
            symbol=order.symbol,
            quantity=order.quantity,
            side=order.side
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/order/{order_id}")
async def get_order_status(order_id: str):
    """Get status of an order"""
    try:
        return await trading_service.get_order_status(order_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders")
async def get_orders(status: Optional[str] = None):
    """Get all orders with optional status filter"""
    try:
        return await trading_service.get_orders(status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{symbol}")
async def get_historical_data(
    symbol: str,
    timeframe: str = '1Day',
    limit: int = 100
):
    """Get historical price data"""
    try:
        return await trading_service.get_historical_data(
            symbol=symbol,
            timeframe=timeframe,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quote/{symbol}")
async def get_latest_quote(symbol: str):
    """Get latest quote for a symbol"""
    try:
        return await trading_service.get_latest_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/account/history")
async def get_account_history(period: str = '1M'):
    """Get account value history"""
    try:
        return await trading_service.get_account_history(period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
