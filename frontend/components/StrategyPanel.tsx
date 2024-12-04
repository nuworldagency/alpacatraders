'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import axios from 'axios'

interface StrategyPanelProps {
  coinId: string
  symbol?: string
}

export default function StrategyPanel({ coinId, symbol }: StrategyPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [strategy, setStrategy] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generateStrategy = async () => {
    try {
      setLoading(true)
      const response = await axios.post('/api/ai/strategy', {
        prompt,
        context: { coinId, symbol },
      })

      setStrategy(response.data)
      toast({
        title: 'Strategy Generated',
        description: 'New trading strategy has been generated.',
      })
    } catch (error: any) {
      console.error('Strategy generation error:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate strategy',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBacktest = async () => {
    try {
      setLoading(true)
      const response = await axios.post('/api/backtest', {
        strategy_id: strategy.id,
        symbol: symbol?.toUpperCase() + 'USD',
        timeframe: '1d',
        initial_capital: 10000,
        position_size: 0.1,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      })

      toast({
        title: 'Backtest Complete',
        description: `Strategy performance: ${response.data.metrics.total_return.toFixed(2)}% return`,
      })
    } catch (error: any) {
      console.error('Backtest error:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to run backtest',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Strategy Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your trading strategy or let AI generate one for you..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={generateStrategy}
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Strategy'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {strategy && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Strategy Description</h3>
                <p className="text-gray-700">{strategy.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Entry Rules</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {strategy.entry_rules.map((rule: string, index: number) => (
                    <li key={index} className="text-gray-700">{rule}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Exit Rules</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {strategy.exit_rules.map((rule: string, index: number) => (
                    <li key={index} className="text-gray-700">{rule}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Risk Management</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {strategy.risk_management.map((rule: string, index: number) => (
                    <li key={index} className="text-gray-700">{rule}</li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handleBacktest}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Backtest...
                  </>
                ) : (
                  'Run Backtest'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
