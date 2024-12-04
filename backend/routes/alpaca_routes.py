from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from services.alpaca_service import AlpacaService
from services.auth_service import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
alpaca_service = AlpacaService()

@router.get("/account")
async def get_account_info(current_user: Dict = Depends(get_current_user)) -> Dict:
    """Get account information and portfolio value"""
    try:
        return await alpaca_service.get_account()
    except Exception as e:
        logger.error(f"Error in get_account_info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/positions")
async def get_positions(current_user: Dict = Depends(get_current_user)) -> List[Dict]:
    """Get current positions with P/L data"""
    try:
        return await alpaca_service.get_positions()
    except Exception as e:
        logger.error(f"Error in get_positions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders")
async def place_order(
    order: Dict,
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Place a new market order"""
    try:
        return await alpaca_service.place_market_order(
            symbol=order["symbol"],
            qty=order["qty"],
            side=order["side"]
        )
    except Exception as e:
        logger.error(f"Error in place_order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders")
async def get_orders(
    status: str = "all",
    current_user: Dict = Depends(get_current_user)
) -> List[Dict]:
    """Get order history"""
    try:
        return await alpaca_service.get_order_history(status)
    except Exception as e:
        logger.error(f"Error in get_orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/history")
async def get_portfolio_history(
    timeframe: str = "1D",
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Get portfolio history and performance metrics"""
    try:
        return await alpaca_service.get_portfolio_history(timeframe)
    except Exception as e:
        logger.error(f"Error in get_portfolio_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
