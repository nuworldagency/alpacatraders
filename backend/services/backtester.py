import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import yfinance as yf
from datetime import datetime, timedelta

class BacktestResult:
    def __init__(self):
        self.trades: List[Dict] = []
        self.metrics: Dict = {}
        self.equity_curve: List[float] = []
        self.drawdowns: List[float] = []

class Backtester:
    def __init__(self, strategy_script: str, symbol: str, timeframe: str = "1d", 
                 initial_capital: float = 10000.0, position_size: float = 0.1):
        self.strategy_script = strategy_script
        self.symbol = symbol
        self.timeframe = timeframe
        self.initial_capital = initial_capital
        self.position_size = position_size
        self.current_position = 0
        self.capital = initial_capital
        self.trades = []
        
    async def fetch_data(self, start_date: Optional[datetime] = None, 
                        end_date: Optional[datetime] = None) -> pd.DataFrame:
        """Fetch historical data using yfinance"""
        if not start_date:
            start_date = datetime.now() - timedelta(days=365)
        if not end_date:
            end_date = datetime.now()
            
        ticker = yf.Ticker(self.symbol)
        df = ticker.history(start=start_date, end=end_date, interval=self.timeframe)
        return df
    
    def calculate_metrics(self, trades: List[Dict]) -> Dict:
        """Calculate trading metrics"""
        if not trades:
            return {}
            
        profits = [t['profit'] for t in trades]
        win_trades = [p for p in profits if p > 0]
        loss_trades = [p for p in profits if p < 0]
        
        metrics = {
            'total_trades': len(trades),
            'winning_trades': len(win_trades),
            'losing_trades': len(loss_trades),
            'win_rate': len(win_trades) / len(trades) if trades else 0,
            'average_win': np.mean(win_trades) if win_trades else 0,
            'average_loss': np.mean(loss_trades) if loss_trades else 0,
            'profit_factor': abs(sum(win_trades) / sum(loss_trades)) if loss_trades else float('inf'),
            'total_profit': sum(profits),
            'max_drawdown': self.calculate_max_drawdown(trades),
            'sharpe_ratio': self.calculate_sharpe_ratio(profits),
        }
        
        return metrics
    
    def calculate_max_drawdown(self, trades: List[Dict]) -> float:
        """Calculate maximum drawdown"""
        equity_curve = self.generate_equity_curve(trades)
        rolling_max = pd.Series(equity_curve).expanding().max()
        drawdowns = equity_curve - rolling_max
        return abs(min(drawdowns)) if drawdowns.any() else 0
    
    def calculate_sharpe_ratio(self, profits: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe Ratio"""
        if not profits:
            return 0
        returns = pd.Series(profits)
        excess_returns = returns - (risk_free_rate / 252)  # Daily risk-free rate
        if excess_returns.std() == 0:
            return 0
        return np.sqrt(252) * excess_returns.mean() / excess_returns.std()
    
    def generate_equity_curve(self, trades: List[Dict]) -> pd.Series:
        """Generate equity curve from trades"""
        equity = self.initial_capital
        equity_curve = [equity]
        
        for trade in trades:
            equity += trade['profit']
            equity_curve.append(equity)
            
        return pd.Series(equity_curve)
    
    async def run_backtest(self, start_date: Optional[datetime] = None, 
                          end_date: Optional[datetime] = None) -> BacktestResult:
        """Run backtest and return results"""
        result = BacktestResult()
        
        # Fetch historical data
        data = await self.fetch_data(start_date, end_date)
        
        # Initialize variables for tracking positions and performance
        position = 0
        entry_price = 0
        
        # Simulate trading
        for i in range(1, len(data)):
            current_bar = data.iloc[i]
            prev_bar = data.iloc[i-1]
            
            # Execute strategy logic (simplified example)
            if position == 0:  # No position
                if self._check_buy_signal(current_bar, prev_bar):
                    position = 1
                    entry_price = current_bar['Close']
                    self.trades.append({
                        'type': 'buy',
                        'entry_price': entry_price,
                        'entry_time': current_bar.name,
                        'size': self.position_size * self.capital / entry_price
                    })
                elif self._check_sell_signal(current_bar, prev_bar):
                    position = -1
                    entry_price = current_bar['Close']
                    self.trades.append({
                        'type': 'sell',
                        'entry_price': entry_price,
                        'entry_time': current_bar.name,
                        'size': self.position_size * self.capital / entry_price
                    })
            
            elif position == 1:  # Long position
                if self._check_sell_signal(current_bar, prev_bar):
                    exit_price = current_bar['Close']
                    trade = self.trades[-1]
                    profit = (exit_price - trade['entry_price']) * trade['size']
                    trade.update({
                        'exit_price': exit_price,
                        'exit_time': current_bar.name,
                        'profit': profit
                    })
                    position = 0
                    self.capital += profit
            
            elif position == -1:  # Short position
                if self._check_buy_signal(current_bar, prev_bar):
                    exit_price = current_bar['Close']
                    trade = self.trades[-1]
                    profit = (trade['entry_price'] - exit_price) * trade['size']
                    trade.update({
                        'exit_price': exit_price,
                        'exit_time': current_bar.name,
                        'profit': profit
                    })
                    position = 0
                    self.capital += profit
        
        # Calculate final metrics
        result.trades = self.trades
        result.metrics = self.calculate_metrics(self.trades)
        result.equity_curve = self.generate_equity_curve(self.trades).tolist()
        
        return result
    
    def _check_buy_signal(self, current_bar: pd.Series, prev_bar: pd.Series) -> bool:
        """
        Placeholder for buy signal logic.
        This should be replaced with actual strategy logic parsed from Pine Script.
        """
        return current_bar['Close'] > prev_bar['Close']
    
    def _check_sell_signal(self, current_bar: pd.Series, prev_bar: pd.Series) -> bool:
        """
        Placeholder for sell signal logic.
        This should be replaced with actual strategy logic parsed from Pine Script.
        """
        return current_bar['Close'] < prev_bar['Close']
