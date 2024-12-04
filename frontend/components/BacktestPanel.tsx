'use client'

import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface BacktestResult {
  trades: any[]
  metrics: {
    total_trades: number
    winning_trades: number
    losing_trades: number
    win_rate: number
    average_win: number
    average_loss: number
    profit_factor: number
    total_profit: number
    max_drawdown: number
    sharpe_ratio: number
  }
  equity_curve: number[]
}

export default function BacktestPanel() {
  const [symbol, setSymbol] = useState('')
  const [timeframe, setTimeframe] = useState('1d')
  const [initialCapital, setInitialCapital] = useState(10000)
  const [positionSize, setPositionSize] = useState(0.1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BacktestResult | null>(null)

  const runBacktest = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          initial_capital: initialCapital,
          position_size: positionSize,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to run backtest')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error running backtest:', error)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Backtest Strategy</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="AAPL"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeframe
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Initial Capital
          </label>
          <input
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position Size (%)
          </label>
          <input
            type="number"
            value={positionSize * 100}
            onChange={(e) => setPositionSize(Number(e.target.value) / 100)}
            className="w-full p-2 border rounded"
            min="1"
            max="100"
          />
        </div>
      </div>

      <button
        onClick={runBacktest}
        disabled={loading}
        className={`w-full bg-blue-500 text-white py-2 rounded ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
        }`}
      >
        {loading ? 'Running Backtest...' : 'Run Backtest'}
      </button>

      {result && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Results</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Performance Metrics</h4>
              <ul className="space-y-1 text-sm">
                <li>Total Trades: {result.metrics.total_trades}</li>
                <li>Win Rate: {(result.metrics.win_rate * 100).toFixed(2)}%</li>
                <li>Profit Factor: {result.metrics.profit_factor.toFixed(2)}</li>
                <li>Total Profit: ${result.metrics.total_profit.toFixed(2)}</li>
                <li>Max Drawdown: {(result.metrics.max_drawdown * 100).toFixed(2)}%</li>
                <li>Sharpe Ratio: {result.metrics.sharpe_ratio.toFixed(2)}</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Trade Statistics</h4>
              <ul className="space-y-1 text-sm">
                <li>Winning Trades: {result.metrics.winning_trades}</li>
                <li>Losing Trades: {result.metrics.losing_trades}</li>
                <li>Average Win: ${result.metrics.average_win.toFixed(2)}</li>
                <li>Average Loss: ${result.metrics.average_loss.toFixed(2)}</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Equity Curve</h4>
            <div className="h-64">
              <Line
                data={{
                  labels: result.equity_curve.map((_, i) => i),
                  datasets: [
                    {
                      label: 'Equity',
                      data: result.equity_curve,
                      borderColor: 'rgb(59, 130, 246)',
                      tension: 0.1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
