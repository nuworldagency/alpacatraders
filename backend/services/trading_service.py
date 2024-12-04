from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, GetOrdersRequest
from alpaca.trading.enums import OrderSide, TimeInForce, OrderStatus
from alpaca.data.historical import CryptoHistoricalDataClient
from alpaca.data.requests import CryptoBarsRequest
from alpaca.data.timeframe import TimeFrame
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from typing import Dict, List, Optional
import pandas as pd

load_dotenv()

class TradingService:
    def __init__(self):
        self.trading_client = TradingClient(
            api_key=os.getenv('ALPACA_API_KEY'),
            secret_key=os.getenv('ALPACA_SECRET_KEY'),
            paper=os.getenv('ALPACA_PAPER_TRADING', 'True').lower() == 'true'
        )
        self.data_client = CryptoHistoricalDataClient()
        
    async def get_account(self):
        """Get account information"""
        try:
            account = self.trading_client.get_account()
            return {
                'cash': float(account.cash),
                'portfolio_value': float(account.portfolio_value),
                'buying_power': float(account.buying_power),
                'currency': account.currency,
                'trading_blocked': account.trading_blocked,
                'pattern_day_trader': account.pattern_day_trader,
                'day_trades_remaining': account.daytrading_buying_power
            }
        except Exception as e:
            raise Exception(f"Failed to get account information: {str(e)}")
            
    async def get_positions(self):
        """Get current positions"""
        try:
            positions = self.trading_client.get_all_positions()
            return [{
                'symbol': pos.symbol,
                'quantity': float(pos.qty),
                'entry_price': float(pos.avg_entry_price),
                'current_price': float(pos.current_price),
                'market_value': float(pos.market_value),
                'cost_basis': float(pos.cost_basis),
                'unrealized_pl': float(pos.unrealized_pl),
                'unrealized_plpc': float(pos.unrealized_plpc)
            } for pos in positions]
        except Exception as e:
            raise Exception(f"Failed to get positions: {str(e)}")
            
    async def place_market_order(self, symbol: str, quantity: float, side: str):
        """Place a market order"""
        try:
            order_data = MarketOrderRequest(
                symbol=symbol,
                qty=quantity,
                side=OrderSide.BUY if side.lower() == 'buy' else OrderSide.SELL,
                time_in_force=TimeInForce.GTC
            )
            
            order = self.trading_client.submit_order(order_data)
            return {
                'order_id': order.id,
                'client_order_id': order.client_order_id,
                'symbol': order.symbol,
                'quantity': float(order.qty),
                'side': order.side.value,
                'status': order.status.value
            }
        except Exception as e:
            raise Exception(f"Failed to place order: {str(e)}")
            
    async def get_order_status(self, order_id: str):
        """Get status of an order"""
        try:
            order = self.trading_client.get_order_by_id(order_id)
            return {
                'order_id': order.id,
                'status': order.status.value,
                'filled_qty': float(order.filled_qty) if order.filled_qty else 0,
                'filled_avg_price': float(order.filled_avg_price) if order.filled_avg_price else 0
            }
        except Exception as e:
            raise Exception(f"Failed to get order status: {str(e)}")
            
    async def get_orders(self, status: Optional[str] = None):
        """Get orders with optional status filter"""
        try:
            request = GetOrdersRequest(status=status) if status else None
            orders = self.trading_client.get_orders(filter=request)
            return [{
                'order_id': order.id,
                'symbol': order.symbol,
                'quantity': float(order.qty),
                'side': order.side.value,
                'status': order.status.value,
                'submitted_at': order.submitted_at.isoformat(),
                'filled_at': order.filled_at.isoformat() if order.filled_at else None
            } for order in orders]
        except Exception as e:
            raise Exception(f"Failed to get orders: {str(e)}")
            
    async def get_historical_data(self, symbol: str, timeframe: str = '1Day', limit: int = 100):
        """Get historical price data"""
        try:
            timeframe_map = {
                '1Min': TimeFrame.Minute,
                '5Min': TimeFrame.Minute * 5,
                '15Min': TimeFrame.Minute * 15,
                '1Hour': TimeFrame.Hour,
                '1Day': TimeFrame.Day
            }
            
            request = CryptoBarsRequest(
                symbol_or_symbols=symbol,
                timeframe=timeframe_map.get(timeframe, TimeFrame.Day),
                start=datetime.now() - timedelta(days=limit)
            )
            
            bars = self.data_client.get_crypto_bars(request)
            df = pd.DataFrame([{
                'timestamp': bar.timestamp,
                'open': float(bar.open),
                'high': float(bar.high),
                'low': float(bar.low),
                'close': float(bar.close),
                'volume': float(bar.volume)
            } for bar in bars])
            
            return df.to_dict('records')
        except Exception as e:
            raise Exception(f"Failed to get historical data: {str(e)}")
            
    async def get_latest_quote(self, symbol: str):
        """Get latest quote for a symbol"""
        try:
            request = CryptoBarsRequest(
                symbol_or_symbols=symbol,
                timeframe=TimeFrame.Minute,
                start=datetime.now() - timedelta(minutes=1)
            )
            
            bars = self.data_client.get_crypto_bars(request)
            latest = list(bars)[-1] if bars else None
            
            if not latest:
                raise Exception("No recent data available")
                
            return {
                'symbol': symbol,
                'price': float(latest.close),
                'timestamp': latest.timestamp.isoformat()
            }
        except Exception as e:
            raise Exception(f"Failed to get latest quote: {str(e)}")
            
    async def get_account_history(self, period: str = '1M'):
        """Get account value history"""
        try:
            period_days = {
                '1D': 1,
                '1W': 7,
                '1M': 30,
                '3M': 90,
                '1Y': 365
            }.get(period, 30)
            
            history = self.trading_client.get_portfolio_history(
                period=period,
                timeframe='1D',
                extended_hours=True
            )
            
            return {
                'timestamp': history.timestamp,
                'equity': history.equity,
                'profit_loss': history.profit_loss,
                'profit_loss_pct': history.profit_loss_pct,
                'base_value': history.base_value
            }
        except Exception as e:
            raise Exception(f"Failed to get account history: {str(e)}")
