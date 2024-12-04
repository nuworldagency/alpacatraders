'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import TradingPanel from '@/components/TradingPanel'
import BacktestPanel from '@/components/BacktestPanel'
import AlertPanel from '@/components/AlertPanel'
import PortfolioPanel from '@/components/PortfolioPanel'
import { Toaster } from 'react-hot-toast'
import { BellIcon, LineChartIcon, LogOutIcon, Settings2Icon, TrendingUpIcon, WalletIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">TradeViewPro</h1>
            <p className="text-muted-foreground">Professional Cryptocurrency Trading Platform</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Paper Trading
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Real-time Data
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="trading" className="space-y-4">
          <TabsList className="grid grid-cols-5 gap-4 bg-muted p-1">
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-2">
              <TrendingUpIcon className="h-4 w-4" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-2">
              <Settings2Icon className="h-4 w-4" />
              Backtest
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trading">
            <Card>
              <CardHeader>
                <CardTitle>Trading Dashboard</CardTitle>
                <CardDescription>Execute trades and monitor your positions in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <TradingPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Generator</CardTitle>
                <CardDescription>Create and customize your trading strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <textarea
                    className="w-full h-32 p-2 border rounded-md bg-background"
                    placeholder="Describe your trading strategy..."
                  />
                  <Button>Generate Strategy</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backtest">
            <Card>
              <CardHeader>
                <CardTitle>Backtest Analysis</CardTitle>
                <CardDescription>Test your strategies against historical data</CardDescription>
              </CardHeader>
              <CardContent>
                <BacktestPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Price Alerts</CardTitle>
                <CardDescription>Set up and manage your price alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>Track your assets and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster position="bottom-right" />
    </main>
  )
}
