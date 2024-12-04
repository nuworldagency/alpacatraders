from fastapi import APIRouter, HTTPException
from typing import Dict, List
from pydantic import BaseModel
from datetime import datetime
from ..services.portfolio_manager import PortfolioManager

router = APIRouter()
portfolio_manager = PortfolioManager()

class TradeRequest(BaseModel):
    symbol: str
    quantity: float
    price: float
    
class PortfolioResponse(BaseModel):
    total_value: float
    cash: float
    positions: List[Dict]
    performance_metrics: Dict
    allocation: Dict[str, float]

@router.post("/trade/buy")
async def buy_position(trade: TradeRequest):
    try:
        await portfolio_manager.add_position(
            symbol=trade.symbol,
            quantity=trade.quantity,
            price=trade.price
        )
        return {"message": "Position added successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
@router.post("/trade/sell")
async def sell_position(trade: TradeRequest):
    try:
        await portfolio_manager.remove_position(
            symbol=trade.symbol,
            quantity=trade.quantity,
            price=trade.price
        )
        return {"message": "Position sold successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
@router.get("/portfolio/summary", response_model=PortfolioResponse)
async def get_portfolio_summary():
    try:
        portfolio = await portfolio_manager.get_portfolio_summary()
        return {
            "total_value": portfolio.total_value,
            "cash": portfolio.cash,
            "positions": [vars(pos) for pos in portfolio.positions],
            "performance_metrics": portfolio.performance_metrics,
            "allocation": portfolio.allocation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/portfolio/trades")
async def get_trades_history():
    return portfolio_manager.trades_history
