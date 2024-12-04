'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import axios from 'axios'

interface AIAnalysisProps {
  coinId?: string
  marketData?: any
}

export default function AIAnalysis({ coinId, marketData }: AIAnalysisProps) {
  const [prompt, setPrompt] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const getAnalysis = async () => {
    try {
      setLoading(true)
      const response = await axios.post('/api/ai/analysis', {
        prompt,
        context: { coinId },
        market_data: marketData
      })

      setAnalysis(response.data)
      toast({
        title: 'Analysis Complete',
        description: 'AI has generated new trading insights.',
      })
    } catch (error: any) {
      console.error('AI Analysis error:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to get AI analysis',
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
          <CardTitle>AI Trading Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Ask for trading analysis, market insights, or strategy suggestions..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={getAnalysis}
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Get AI Analysis'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Market Analysis</h3>
                <p className="text-gray-700">{analysis.analysis}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Trading Suggestions</h3>
                <ul className="list-disc pl-4 space-y-1">
                  {analysis.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-gray-700">{suggestion}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Confidence Level</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${analysis.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {Math.round(analysis.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
