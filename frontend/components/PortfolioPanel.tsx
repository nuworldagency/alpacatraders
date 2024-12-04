import React, { useState, useEffect } from 'react';
import {
  Line,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line as LineChart } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Position {
  symbol: string;
  coin_id: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percentage: number;
}

interface PortfolioSummary {
  total_value: number;
  cash: number;
  positions: Position[];
  performance_metrics: {
    total_return: number;
    total_return_percentage: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
  };
  allocation: { [key: string]: number };
}

const PortfolioPanel: React.FC = () => {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<{[key: string]: number}>({});

  const fetchPortfolioSummary = async () => {
    try {
      const response = await fetch('/api/portfolio/summary');
      const data = await response.json();
      setPortfolioSummary(data);
    } catch (error) {
      toast.error('Failed to fetch portfolio summary');
    }
  };

  const fetchCurrentPrice = async (symbol: string) => {
    try {
      const response = await fetch(`/api/crypto/price/${symbol}`);
      const data = await response.json();
      setCurrentPrices(prev => ({
        ...prev,
        [symbol]: data.price
      }));
      setPrice(data.price.toString());
    } catch (error) {
      toast.error('Failed to fetch current price');
    }
  };

  useEffect(() => {
    fetchPortfolioSummary();
    const interval = setInterval(fetchPortfolioSummary, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (symbol) {
      fetchCurrentPrice(symbol);
    }
  }, [symbol]);

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!symbol || !quantity || !price) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/trade/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          quantity: parseFloat(quantity),
          price: parseFloat(price),
        }),
      });

      if (!response.ok) throw new Error('Trade failed');

      toast.success(`${type.toUpperCase()} order executed successfully`);
      fetchPortfolioSummary();
      setSymbol('');
      setQuantity('');
      setPrice('');
    } catch (error) {
      toast.error(`Failed to execute ${type} order`);
    } finally {
      setLoading(false);
    }
  };

  if (!portfolioSummary) return <div>Loading...</div>;

  const chartData = {
    labels: portfolioSummary.positions.map(p => p.symbol),
    datasets: [
      {
        label: 'Portfolio Allocation',
        data: portfolioSummary.positions.map(p => 
          (p.quantity * p.current_price / portfolioSummary.total_value) * 100
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Crypto Portfolio Management</h2>
      
      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Value</h3>
          <p className="text-xl font-bold">${portfolioSummary.total_value.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Cash</h3>
          <p className="text-xl font-bold">${portfolioSummary.cash.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Return</h3>
          <p className={`text-xl font-bold ${
            portfolioSummary.performance_metrics.total_return_percentage >= 0 
            ? 'text-green-500' 
            : 'text-red-500'
          }`}>
            {portfolioSummary.performance_metrics.total_return_percentage.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Sharpe Ratio</h3>
          <p className="text-xl font-bold">{portfolioSummary.performance_metrics.sharpe_ratio.toFixed(2)}</p>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Execute Trade</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Crypto Symbol (e.g., BTC)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="border rounded p-2"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border rounded p-2"
          />
          <div className="relative">
            <input
              type="number"
              placeholder="Price (USD)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border rounded p-2 w-full"
            />
            {currentPrices[symbol] && (
              <span className="absolute right-2 top-2 text-sm text-gray-500">
                Current: ${currentPrices[symbol].toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleTrade('buy')}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex-1"
            >
              Buy
            </button>
            <button
              onClick={() => handleTrade('sell')}
              disabled={loading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1"
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Current Positions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Entry Price</th>
                <th className="px-4 py-2">Current Price</th>
                <th className="px-4 py-2">P&L</th>
                <th className="px-4 py-2">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {portfolioSummary.positions.map((position) => (
                <tr key={position.symbol} className="border-b">
                  <td className="px-4 py-2">{position.symbol}</td>
                  <td className="px-4 py-2">{position.quantity}</td>
                  <td className="px-4 py-2">${position.entry_price.toFixed(2)}</td>
                  <td className="px-4 py-2">${position.current_price.toFixed(2)}</td>
                  <td className={`px-4 py-2 ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${position.pnl.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2 ${position.pnl_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {position.pnl_percentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portfolio Allocation Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
        <div style={{ height: '300px' }}>
          <LineChart data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default PortfolioPanel;
