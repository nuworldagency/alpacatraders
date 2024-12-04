import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export interface TradingStrategy {
  id: string
  name: string
  description: string
  type: 'scalping' | 'day_trading' | 'swing_trading'
  timeframe: string
  indicators: string[]
  entry_conditions: string[]
  exit_conditions: string[]
  risk_percentage: number
  take_profit: number
  stop_loss: number
  parameters: Record<string, any>
}

export interface Trade {
  id: string
  user_id: string
  strategy_id: string
  coin_id: string
  entry_price: number
  exit_price?: number
  quantity: number
  side: 'long' | 'short'
  status: 'open' | 'closed'
  pnl?: number
  created_at: string
  closed_at?: string
}

export interface UserSettings {
  id: string
  user_id: string
  favorite_coins: string[]
  default_strategy: string
  risk_per_trade: number
  max_open_trades: number
  preferred_timeframes: string[]
}
