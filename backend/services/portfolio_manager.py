from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np
from dataclasses import dataclass
from pycoingecko import CoinGeckoAPI
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Position:
    symbol: str
    coin_id: str  # CoinGecko ID
    quantity: float
    entry_price: float
    current_price: float
    entry_date: datetime
    pnl: float
    pnl_percentage: float

@dataclass
class Portfolio:
    total_value: float
    cash: float
    positions: List[Position]
    performance_metrics: Dict
    allocation: Dict[str, float]

class PortfolioManager:
    def __init__(self, initial_capital: float = 100000.0):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions: Dict[str, Position] = {}
        self.trades_history: List[Dict] = []
        self.cg = CoinGeckoAPI(api_key=os.getenv('COINGECKO_API_KEY'))
        self.symbol_to_id_map = {}
        self._init_coin_map()
        
    def _init_coin_map(self):
        """Initialize the symbol to CoinGecko ID mapping"""
        try:
            coins_list = self.cg.get_coins_list()
            self.symbol_to_id_map = {
                coin['symbol'].upper(): coin['id'] 
                for coin in coins_list
            }
        except Exception as e:
            print(f"Error initializing coin map: {str(e)}")
            
    def get_coin_id(self, symbol: str) -> str:
        """Get CoinGecko ID for a symbol"""
        symbol = symbol.upper()
        if symbol not in self.symbol_to_id_map:
            raise ValueError(f"Unsupported cryptocurrency: {symbol}")
        return self.symbol_to_id_map[symbol]
        
    async def add_position(self, symbol: str, quantity: float, price: float) -> None:
        """Add a new position or update existing position"""
        cost = quantity * price
        if self.cash < cost:
            raise ValueError("Insufficient funds")
            
        coin_id = self.get_coin_id(symbol)
        symbol = symbol.upper()
            
        if symbol in self.positions:
            # Update existing position
            current_pos = self.positions[symbol]
            total_quantity = current_pos.quantity + quantity
            avg_price = (current_pos.entry_price * current_pos.quantity + price * quantity) / total_quantity
            
            self.positions[symbol] = Position(
                symbol=symbol,
                coin_id=coin_id,
                quantity=total_quantity,
                entry_price=avg_price,
                current_price=price,
                entry_date=current_pos.entry_date,
                pnl=0,
                pnl_percentage=0
            )
        else:
            # Create new position
            self.positions[symbol] = Position(
                symbol=symbol,
                coin_id=coin_id,
                quantity=quantity,
                entry_price=price,
                current_price=price,
                entry_date=datetime.now(),
                pnl=0,
                pnl_percentage=0
            )
            
        self.cash -= cost
        self.trades_history.append({
            'type': 'buy',
            'symbol': symbol,
            'quantity': quantity,
            'price': price,
            'timestamp': datetime.now()
        })
        
    async def remove_position(self, symbol: str, quantity: float, price: float) -> None:
        """Remove or reduce a position"""
        symbol = symbol.upper()
        if symbol not in self.positions:
            raise ValueError("Position does not exist")
            
        position = self.positions[symbol]
        if position.quantity < quantity:
            raise ValueError("Insufficient quantity")
            
        proceeds = quantity * price
        self.cash += proceeds
        
        if position.quantity == quantity:
            del self.positions[symbol]
        else:
            position.quantity -= quantity
            
        self.trades_history.append({
            'type': 'sell',
            'symbol': symbol,
            'quantity': quantity,
            'price': price,
            'timestamp': datetime.now()
        })
        
    async def update_prices(self) -> None:
        """Update current prices for all positions"""
        if not self.positions:
            return
            
        try:
            # Get current prices for all coins in one API call
            coin_ids = [pos.coin_id for pos in self.positions.values()]
            prices = self.cg.get_price(
                ids=coin_ids,
                vs_currencies='usd',
                include_24hr_change=True
            )
            
            for symbol, position in self.positions.items():
                if position.coin_id in prices:
                    current_price = prices[position.coin_id]['usd']
                    position.current_price = current_price
                    position.pnl = (current_price - position.entry_price) * position.quantity
                    position.pnl_percentage = (current_price / position.entry_price - 1) * 100
                    
        except Exception as e:
            print(f"Error updating prices: {str(e)}")
                
    async def get_portfolio_summary(self) -> Portfolio:
        """Get current portfolio summary"""
        await self.update_prices()
        
        total_value = self.cash
        positions_value = {}
        
        for symbol, position in self.positions.items():
            position_value = position.quantity * position.current_price
            total_value += position_value
            positions_value[symbol] = position_value
            
        # Calculate allocation percentages
        allocation = {
            symbol: (value / total_value) * 100 
            for symbol, value in positions_value.items()
        }
        allocation['cash'] = (self.cash / total_value) * 100
        
        # Calculate performance metrics
        performance_metrics = await self.calculate_performance_metrics()
        
        return Portfolio(
            total_value=total_value,
            cash=self.cash,
            positions=list(self.positions.values()),
            performance_metrics=performance_metrics,
            allocation=allocation
        )
        
    async def calculate_performance_metrics(self) -> Dict:
        """Calculate portfolio performance metrics"""
        if not self.trades_history:
            return {
                'total_return': 0,
                'total_return_percentage': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0,
                'win_rate': 0
            }
            
        # Calculate daily returns
        trades_df = pd.DataFrame(self.trades_history)
        trades_df['date'] = pd.to_datetime(trades_df['timestamp']).dt.date
        
        # Get unique symbols
        symbols = trades_df['symbol'].unique()
        
        # Get historical prices for all symbols
        start_date = trades_df['timestamp'].min()
        prices_data = {}
        
        try:
            for symbol in symbols:
                position = self.positions.get(symbol)
                if position:
                    historical_data = self.cg.get_coin_market_chart_by_id(
                        id=position.coin_id,
                        vs_currency='usd',
                        days='max',
                        interval='daily'
                    )
                    prices = pd.DataFrame(historical_data['prices'], columns=['timestamp', 'price'])
                    prices['timestamp'] = pd.to_datetime(prices['timestamp'], unit='ms')
                    prices.set_index('timestamp', inplace=True)
                    prices_data[symbol] = prices['price']
                    
        except Exception as e:
            print(f"Error fetching historical data: {str(e)}")
            return {
                'total_return': 0,
                'total_return_percentage': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0,
                'win_rate': 0
            }
            
        # Calculate daily portfolio value
        daily_values = []
        current_positions = {}
        
        for date in pd.date_range(start=start_date, end=datetime.now()):
            date_trades = trades_df[trades_df['date'] == date.date()]
            
            # Update positions based on trades
            for _, trade in date_trades.iterrows():
                symbol = trade['symbol']
                if trade['type'] == 'buy':
                    current_positions[symbol] = current_positions.get(symbol, 0) + trade['quantity']
                else:
                    current_positions[symbol] = current_positions.get(symbol, 0) - trade['quantity']
                    
            # Calculate portfolio value for the day
            portfolio_value = self.initial_capital
            for symbol, quantity in current_positions.items():
                if symbol in prices_data and len(prices_data[symbol]) > 0:
                    price = prices_data[symbol].asof(date)
                    portfolio_value += quantity * price
                    
            daily_values.append(portfolio_value)
            
        daily_returns = pd.Series(daily_values).pct_change().dropna()
        
        # Calculate metrics
        total_return = (daily_values[-1] - self.initial_capital)
        total_return_percentage = (total_return / self.initial_capital) * 100
        
        # Sharpe Ratio (assuming risk-free rate of 2%)
        risk_free_rate = 0.02
        excess_returns = daily_returns - risk_free_rate/252
        sharpe_ratio = np.sqrt(252) * excess_returns.mean() / excess_returns.std() if len(excess_returns) > 0 else 0
        
        # Maximum Drawdown
        cumulative_returns = (1 + daily_returns).cumprod()
        rolling_max = cumulative_returns.expanding().max()
        drawdowns = cumulative_returns - rolling_max
        max_drawdown = abs(drawdowns.min()) * 100 if len(drawdowns) > 0 else 0
        
        # Win Rate
        profitable_trades = sum(1 for trade in self.trades_history if trade['type'] == 'sell' and trade['price'] > trade['price'])
        total_trades = sum(1 for trade in self.trades_history if trade['type'] == 'sell')
        win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
        
        return {
            'total_return': total_return,
            'total_return_percentage': total_return_percentage,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate
        }
