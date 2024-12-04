'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface Alert {
  id: string
  symbol: string
  condition: string
  message: string
  status: string
  created_at: string
  triggered_at?: string
}

export default function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [symbol, setSymbol] = useState('')
  const [condition, setCondition] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    // Fetch existing alerts
    fetchAlerts()

    // Set up WebSocket connection
    const websocket = new WebSocket('ws://localhost:8000/api/v1/ws/alerts/user123')
    setWs(websocket)

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'alert') {
        toast.success(data.message)
        // Refresh alerts list
        fetchAlerts()
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      toast.error('Error connecting to alert system')
    }

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/alerts', {
        headers: {
          // Add authorization header if needed
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      const data = await response.json()
      setAlerts(data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to fetch alerts')
    }
  }

  const createAlert = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        },
        body: JSON.stringify({
          symbol,
          condition,
          message,
          status: 'active',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create alert')
      }

      const data = await response.json()
      setAlerts([...alerts, data])
      toast.success('Alert created successfully')

      // Reset form
      setSymbol('')
      setCondition('')
      setMessage('')
    } catch (error) {
      console.error('Error creating alert:', error)
      toast.error('Failed to create alert')
    }
    setLoading(false)
  }

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          // Add authorization header if needed
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete alert')
      }

      setAlerts(alerts.filter((alert) => alert.id !== alertId))
      toast.success('Alert deleted successfully')
    } catch (error) {
      console.error('Error deleting alert:', error)
      toast.error('Failed to delete alert')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Price Alerts</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Create New Alert</h3>
        <div className="space-y-4">
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
              Condition
            </label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="price > 150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="AAPL price alert triggered!"
            />
          </div>

          <button
            onClick={createAlert}
            disabled={loading}
            className={`w-full bg-blue-500 text-white py-2 rounded ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            {loading ? 'Creating Alert...' : 'Create Alert'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Active Alerts</h3>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{alert.symbol}</p>
                <p className="text-sm text-gray-600">{alert.condition}</p>
                <p className="text-sm text-gray-500">{alert.message}</p>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="text-gray-500 text-center">No active alerts</p>
          )}
        </div>
      </div>
    </div>
  )
}
