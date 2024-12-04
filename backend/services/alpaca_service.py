from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, GetOrdersRequest
from alpaca.trading.enums import OrderSide, TimeInForce, OrderStatus
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
import os
from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class AlpacaService:
    def __init__(self):
        self.api_key = os.getenv("ALPACA_API_KEY")
        self.api_secret = os.getenv("ALPACA_API_SECRET")
        self.trading_client = TradingClient(self.api_key, self.api_secret, paper=True)
        self.data_client = StockHistoricalDataClient(self.api_key, self.api_secret)

    async def get_account(self) -> Dict:
        """Get account information including cash balance and portfolio value"""
        try:
            account = self.trading_client.get_account()
            return {
                "cash": float(account.cash),
                "portfolio_value": float(account.portfolio_value),
                "buying_power": float(account.buying_power),
                "equity": float(account.equity),
                "long_market_value": float(account.long_market_value),
                "short_market_value": float(account.short_market_value),
                "initial_margin": float(account.initial_margin),
                "maintenance_margin": float(account.maintenance_margin),
                "last_equity": float(account.last_equity),
                "day_trade_count": account.day_trade_count
            }
        except Exception as e:
            logger.error(f"Error getting account info: {str(e)}")
            raise

    async def get_positions(self) -> List[Dict]:
        """Get current positions with P/L calculations"""
        try:
            positions = self.trading_client.get_all_positions()
            return [{
                "symbol": pos.symbol,
                "qty": float(pos.qty),
                "avg_entry_price": float(pos.avg_entry_price),
                "current_price": float(pos.current_price),
                "market_value": float(pos.market_value),
                "cost_basis": float(pos.cost_basis),
                "unrealized_pl": float(pos.unrealized_pl),
                "unrealized_plpc": float(pos.unrealized_plpc),
                "unrealized_intraday_pl": float(pos.unrealized_intraday_pl),
                "unrealized_intraday_plpc": float(pos.unrealized_intraday_plpc),
                "change_today": float(pos.change_today),
                "side": pos.side
            } for pos in positions]
        except Exception as e:
            logger.error(f"Error getting positions: {str(e)}")
            raise

    async def place_market_order(self, symbol: str, qty: float, side: str) -> Dict:
        """Place a market order"""
        try:
            order_side = OrderSide.BUY if side.upper() == "BUY" else OrderSide.SELL
            market_order = MarketOrderRequest(
                symbol=symbol,
                qty=qty,
                side=order_side,
                time_in_force=TimeInForce.DAY
            )
            order = self.trading_client.submit_order(market_order)
            return {
                "order_id": order.id,
                "client_order_id": order.client_order_id,
                "symbol": order.symbol,
                "qty": float(order.qty),
                "side": order.side.value,
                "status": order.status.value,
                "created_at": order.created_at.isoformat(),
                "filled_at": order.filled_at.isoformat() if order.filled_at else None,
                "filled_qty": float(order.filled_qty) if order.filled_qty else 0,
                "filled_avg_price": float(order.filled_avg_price) if order.filled_avg_price else 0
            }
        except Exception as e:
            logger.error(f"Error placing market order: {str(e)}")
            raise

    async def get_order_history(self, status: str = "all") -> List[Dict]:
        """Get order history with optional status filter"""
        try:
            request = GetOrdersRequest(status=status)
            orders = self.trading_client.get_orders(request)
            return [{
                "order_id": order.id,
                "symbol": order.symbol,
                "qty": float(order.qty),
                "side": order.side.value,
                "status": order.status.value,
                "created_at": order.created_at.isoformat(),
                "filled_at": order.filled_at.isoformat() if order.filled_at else None,
                "filled_qty": float(order.filled_qty) if order.filled_qty else 0,
                "filled_avg_price": float(order.filled_avg_price) if order.filled_avg_price else 0,
                "type": order.type.value
            } for order in orders]
        except Exception as e:
            logger.error(f"Error getting order history: {str(e)}")
            raise

    async def get_portfolio_history(self, timeframe: str = "1D") -> Dict:
        """Get portfolio history with performance metrics"""
        try:
            timeframe_map = {
                "1D": timedelta(days=1),
                "1W": timedelta(weeks=1),
                "1M": timedelta(days=30),
                "3M": timedelta(days=90),
                "1Y": timedelta(days=365)
            }
            
            period = timeframe_map.get(timeframe, timedelta(days=1))
            end = datetime.now()
            start = end - period
            
            history = self.trading_client.get_portfolio_history(
                start=start,
                end=end,
                timeframe=TimeFrame.Hour if timeframe == "1D" else TimeFrame.Day
            )
            
            return {
                "timestamp": history.timestamp,
                "equity": history.equity,
                "profit_loss": history.profit_loss,
                "profit_loss_pct": history.profit_loss_pct,
                "base_value": float(history.base_value),
                "timeframe": timeframe
            }
        except Exception as e:
            logger.error(f"Error getting portfolio history: {str(e)}")
            raise
