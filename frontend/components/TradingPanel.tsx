'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CoinList from './CoinList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const TradingViewWidget = dynamic(
  () => import('./TradingViewWidget'),
  { ssr: false }
)

interface AccountInfo {
  buying_power: number;
  cash: number;
  equity: number;
}

export default function TradingPanel() {
  const router = useRouter()
  const [selectedCrypto, setSelectedCrypto] = useState('BTCUSD')
  const [orderType, setOrderType] = useState('market')
  const [orderSide, setOrderSide] = useState('buy')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAccountInfo();
    const interval = setInterval(fetchAccountInfo, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch('/api/alpaca/account');
      if (response.ok) {
        const data = await response.json();
        setAccountInfo(data);
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  // Calculate quantity based on amount and current price
  useEffect(() => {
    if (currentPrice && amount) {
      const calculatedQty = Number(amount) / currentPrice;
      setQuantity(calculatedQty.toFixed(8));
    }
  }, [amount, currentPrice]);

  const handleOrder = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }

      if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        toast.error('Please enter a valid quantity')
        return
      }

      if (orderType === 'limit' && (!limitPrice || isNaN(Number(limitPrice)) || Number(limitPrice) <= 0)) {
        toast.error('Please enter a valid limit price')
        return
      }

      // Check if user has enough buying power
      if (orderSide === 'buy' && accountInfo) {
        const orderCost = Number(quantity) * (orderType === 'limit' ? Number(limitPrice) : (currentPrice || 0));
        if (orderCost > accountInfo.buying_power) {
          toast.error('Insufficient buying power');
          return;
        }
      }

      // Place order through Alpaca API
      const response = await fetch('/api/alpaca/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedCrypto,
          qty: Number(quantity),
          side: orderSide,
          type: orderType,
          limit_price: orderType === 'limit' ? Number(limitPrice) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to place order');
      }

      const order = await response.json();
      toast.success(`${orderSide.toUpperCase()} order placed successfully`);
      
      // Reset form
      setAmount('');
      setQuantity('');
      setLimitPrice('');
      
      // Refresh account info
      fetchAccountInfo();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Coins</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <CoinList />
        </TabsContent>
        
        <TabsContent value="favorites">
          <CoinList favorites={true} />
        </TabsContent>
      </Tabs>

      {/* Account Info */}
      {accountInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Buying Power</p>
                <p className="text-lg font-bold">
                  ${accountInfo.buying_power.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cash</p>
                <p className="text-lg font-bold">
                  ${accountInfo.cash.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Equity</p>
                <p className="text-lg font-bold">
                  ${accountInfo.equity.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading View Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[600px]">
          <TradingViewWidget symbol={selectedCrypto} />
        </CardContent>
      </Card>

      {/* Trading Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Place Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={orderType === 'market' ? 'default' : 'outline'}
                onClick={() => setOrderType('market')}
              >
                Market
              </Button>
              <Button
                variant={orderType === 'limit' ? 'default' : 'outline'}
                onClick={() => setOrderType('limit')}
              >
                Limit
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant={orderSide === 'buy' ? 'default' : 'outline'}
                onClick={() => setOrderSide('buy')}
                className="w-full"
              >
                Buy
              </Button>
              <Button
                variant={orderSide === 'sell' ? 'destructive' : 'outline'}
                onClick={() => setOrderSide('sell')}
                className="w-full"
              >
                Sell
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity..."
                min="0"
                step="0.00000001"
              />
            </div>

            {orderType === 'limit' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Limit Price (USD)</label>
                <Input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Enter limit price..."
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <Button
              onClick={handleOrder}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Processing...' : `Place ${orderSide.toUpperCase()} Order`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
