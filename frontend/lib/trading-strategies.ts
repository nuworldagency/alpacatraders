import { TradingStrategy } from './supabase'

export const tradingStrategies: TradingStrategy[] = [
  {
    id: 'vwap_scalping',
    name: 'VWAP Scalping',
    description: 'Scalp trades using VWAP as a dynamic support/resistance level with volume confirmation',
    type: 'scalping',
    timeframe: '5m',
    indicators: ['VWAP', 'Volume', 'RSI'],
    entry_conditions: [
      'Price crosses above/below VWAP',
      'Volume spike confirms direction',
      'RSI not in extreme territory'
    ],
    exit_conditions: [
      'Price moves X% in profit',
      'Price returns to VWAP',
      'Volume momentum decreases'
    ],
    risk_percentage: 0.5,
    take_profit: 1.5,
    stop_loss: 0.5,
    parameters: {
      vwap_period: '1d',
      volume_threshold: 1.5,
      rsi_period: 14,
      rsi_overbought: 70,
      rsi_oversold: 30
    }
  },
  {
    id: 'breakout_momentum',
    name: 'Breakout Momentum Scalping',
    description: 'Capture explosive moves during high-momentum breakouts with volume confirmation',
    type: 'scalping',
    timeframe: '1m',
    indicators: ['Bollinger Bands', 'Volume', 'Momentum'],
    entry_conditions: [
      'Price breaks out of Bollinger Bands',
      'Strong volume surge',
      'Momentum indicator confirms direction'
    ],
    exit_conditions: [
      'Price reaches next resistance/support',
      'Volume decreases significantly',
      'Momentum weakens'
    ],
    risk_percentage: 0.75,
    take_profit: 2.0,
    stop_loss: 0.75,
    parameters: {
      bb_period: 20,
      bb_std: 2,
      volume_surge_threshold: 2,
      momentum_period: 10
    }
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion Scalping',
    description: 'Profit from price returning to moving average after extreme deviations',
    type: 'scalping',
    timeframe: '3m',
    indicators: ['EMA', 'Stochastic', 'ATR'],
    entry_conditions: [
      'Price deviates significantly from EMA',
      'Stochastic shows oversold/overbought',
      'ATR indicates normal volatility'
    ],
    exit_conditions: [
      'Price returns to EMA',
      'Stochastic crosses middle line',
      'Profit target reached'
    ],
    risk_percentage: 0.5,
    take_profit: 1.2,
    stop_loss: 0.4,
    parameters: {
      ema_period: 20,
      stoch_period: 14,
      stoch_overbought: 80,
      stoch_oversold: 20,
      atr_period: 14
    }
  },
  {
    id: 'orderbook_scalping',
    name: 'Order Book Imbalance Scalping',
    description: 'Exploit order book imbalances for quick profits',
    type: 'scalping',
    timeframe: '1m',
    indicators: ['Order Book Depth', 'Trade Flow', 'Price Action'],
    entry_conditions: [
      'Significant order book imbalance',
      'Trade flow supports direction',
      'Price shows momentum'
    ],
    exit_conditions: [
      'Order book balance restores',
      'Trade flow momentum decreases',
      'Quick profit target reached'
    ],
    risk_percentage: 0.3,
    take_profit: 0.8,
    stop_loss: 0.3,
    parameters: {
      imbalance_ratio: 3,
      depth_levels: 10,
      min_order_size: 10000
    }
  },
  {
    id: 'trend_surfing',
    name: 'Trend Surfing',
    description: 'Ride strong intraday trends using multiple timeframe analysis',
    type: 'day_trading',
    timeframe: '15m',
    indicators: ['Supertrend', 'ADX', 'Moving Averages'],
    entry_conditions: [
      'Higher timeframe trend alignment',
      'ADX shows strong trend',
      'Price pulls back to moving average'
    ],
    exit_conditions: [
      'Trend weakness on higher timeframe',
      'ADX drops below threshold',
      'Moving average crossover'
    ],
    risk_percentage: 1.0,
    take_profit: 3.0,
    stop_loss: 1.0,
    parameters: {
      supertrend_period: 10,
      supertrend_multiplier: 3,
      adx_period: 14,
      adx_threshold: 25,
      ma_fast: 8,
      ma_slow: 21
    }
  }
]

export function getStrategyById(id: string): TradingStrategy | undefined {
  return tradingStrategies.find(strategy => strategy.id === id)
}

export function calculatePosition(
  strategy: TradingStrategy,
  price: number,
  balance: number
): {
  quantity: number
  stopLoss: number
  takeProfit: number
} {
  const riskAmount = balance * (strategy.risk_percentage / 100)
  const stopLossPrice = price * (1 - strategy.stop_loss / 100)
  const takeProfitPrice = price * (1 + strategy.take_profit / 100)
  const quantity = riskAmount / (price - stopLossPrice)

  return {
    quantity: Number(quantity.toFixed(8)),
    stopLoss: Number(stopLossPrice.toFixed(2)),
    takeProfit: Number(takeProfitPrice.toFixed(2))
  }
}

export interface MarketCondition {
  indicator: string
  value: number
  signal: 'buy' | 'sell' | 'neutral'
  confidence: number
}

export function analyzeMarketConditions(
  strategy: TradingStrategy,
  price: number,
  volume: number,
  indicators: Record<string, number>
): MarketCondition[] {
  // This is a simplified example. In a real implementation,
  // you would use technical analysis libraries and real-time data
  const conditions: MarketCondition[] = []

  switch (strategy.id) {
    case 'vwap_scalping':
      if (indicators.vwap) {
        const vwapDiff = ((price - indicators.vwap) / indicators.vwap) * 100
        const volumeRatio = volume / indicators.averageVolume
        
        conditions.push({
          indicator: 'VWAP',
          value: vwapDiff,
          signal: vwapDiff > 0 ? 'sell' : 'buy',
          confidence: Math.min(Math.abs(vwapDiff) * 10, 100)
        })

        conditions.push({
          indicator: 'Volume',
          value: volumeRatio,
          signal: volumeRatio > strategy.parameters.volume_threshold ? 'buy' : 'neutral',
          confidence: Math.min(volumeRatio * 20, 100)
        })
      }
      break

    case 'breakout_momentum':
      if (indicators.upperBB && indicators.lowerBB) {
        const bbRange = indicators.upperBB - indicators.lowerBB
        const pricePosition = (price - indicators.lowerBB) / bbRange
        
        conditions.push({
          indicator: 'BB Position',
          value: pricePosition,
          signal: pricePosition > 0.8 ? 'sell' : pricePosition < 0.2 ? 'buy' : 'neutral',
          confidence: Math.abs(0.5 - pricePosition) * 200
        })
      }
      break
      
    // Add more strategy-specific analysis
  }

  return conditions
}

export function generateTradingSignal(
  strategy: TradingStrategy,
  conditions: MarketCondition[]
): {
  signal: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string[]
} {
  const totalConfidence = conditions.reduce((sum, condition) => sum + condition.confidence, 0)
  const averageConfidence = totalConfidence / conditions.length

  const buySignals = conditions.filter(c => c.signal === 'buy')
  const sellSignals = conditions.filter(c => c.signal === 'sell')

  const reasoning: string[] = []
  conditions.forEach(condition => {
    reasoning.push(`${condition.indicator}: ${condition.signal.toUpperCase()} (${condition.confidence.toFixed(1)}% confidence)`)
  })

  if (buySignals.length > sellSignals.length && averageConfidence > 70) {
    return { signal: 'buy', confidence: averageConfidence, reasoning }
  } else if (sellSignals.length > buySignals.length && averageConfidence > 70) {
    return { signal: 'sell', confidence: averageConfidence, reasoning }
  }

  return { signal: 'hold', confidence: averageConfidence, reasoning }
}
