from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from services.backtester import Backtester
from models import User
from main import get_current_user

router = APIRouter()

class BacktestRequest(BaseModel):
    strategy_id: str
    symbol: str
    timeframe: str = "1d"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    initial_capital: float = 10000.0
    position_size: float = 0.1

class BacktestResponse(BaseModel):
    strategy_id: str
    trades: list
    metrics: dict
    equity_curve: list
    drawdowns: list

@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(
    request: BacktestRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Here you would typically load the strategy from the database
        # For now, we'll use a placeholder strategy
        strategy_script = "// Example strategy\n"
        
        # Initialize backtester
        backtester = Backtester(
            strategy_script=strategy_script,
            symbol=request.symbol,
            timeframe=request.timeframe,
            initial_capital=request.initial_capital,
            position_size=request.position_size
        )
        
        # Run backtest
        result = await backtester.run_backtest(
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        return BacktestResponse(
            strategy_id=request.strategy_id,
            trades=result.trades,
            metrics=result.metrics,
            equity_curve=result.equity_curve,
            drawdowns=result.drawdowns
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
