'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useSWR from 'swr'
import axios from 'axios'

interface CryptoData {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  total_volume: number
  price_change_percentage_24h: number
  sparkline_in_7d: {
    price: number[]
  }
}

const fetcher = (url: string) => axios.get(url).then(res => res.data)

export default function Dashboard() {
  const { data: cryptoData, error } = useSWR<CryptoData[]>(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=3&page=1&sparkline=true',
    fetcher,
    {
      refreshInterval: 60000 // Refresh every minute
    }
  )

  if (error) return (
    <div className="text-red-500">
      Failed to load cryptocurrency data
    </div>
  )

  if (!cryptoData) return (
    <div className="text-gray-500">
      Loading...
    </div>
  )

  return (
    <div className="grid gap-4">
      {/* Price Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cryptoData.map((crypto) => (
          <Card key={crypto.id}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{crypto.name}</span>
                <span className={crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {crypto.price_change_percentage_24h.toFixed(2)}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${crypto.current_price.toLocaleString()}</div>
              <div className="mt-4 h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={crypto.sparkline_in_7d.price.map((price, index) => ({
                    time: index,
                    price: price
                  }))}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={crypto.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Market Cap</div>
                  <div>${(crypto.market_cap / 1e9).toFixed(2)}B</div>
                </div>
                <div>
                  <div className="text-muted-foreground">24h Volume</div>
                  <div>${(crypto.total_volume / 1e6).toFixed(2)}M</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
