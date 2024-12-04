'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star } from 'lucide-react'
import dynamic from 'next/dynamic'
import AIAnalysis from '@/components/AIAnalysis'
import { useToast } from '@/components/ui/use-toast'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TradingPanel from '@/components/TradingPanel'
import StrategyPanel from '@/components/StrategyPanel'

const TradingViewWidget = dynamic(
  () => import('@/components/TradingViewWidget'),
  { ssr: false }
)

export default function CoinPage() {
  const params = useParams()
  const router = useRouter()
  const [coinData, setCoinData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        setLoading(true)
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${params.id}`,
          {
            params: {
              x_cg_demo_api_key: process.env.NEXT_PUBLIC_COINGECKO_API_KEY
            },
            headers: {
              'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY
            }
          }
        )
        setCoinData(response.data)
        checkIfFavorite(params.id as string)
      } catch (error: any) {
        console.error('Error fetching coin data:', error)
        setError(error.response?.data?.error || 'Failed to load coin data')
        toast({
          title: 'Error',
          description: 'Failed to load coin data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCoinData()
  }, [params.id])

  const checkIfFavorite = async (coinId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('favorites')
        .select('coin_id')
        .eq('user_id', session.user.id)
        .eq('coin_id', coinId)
        .single()

      setIsFavorite(!!data)
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const toggleFavorite = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }

      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: session.user.id, coin_id: params.id })
        
        setIsFavorite(false)
        toast.success('Removed from favorites')
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: session.user.id, coin_id: params.id })
        
        setIsFavorite(true)
        toast.success('Added to favorites')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorites')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            {coinData?.name} ({coinData?.symbol.toUpperCase()})
          </h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFavorite}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Price</div>
          <div className="text-2xl font-bold">
            ${coinData?.market_data?.current_price?.usd.toLocaleString()}
          </div>
          <div className={`text-sm ${
            coinData?.market_data?.price_change_percentage_24h >= 0
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {coinData?.market_data?.price_change_percentage_24h.toFixed(2)}% (24h)
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Market Cap</div>
          <div className="text-2xl font-bold">
            ${(coinData?.market_data?.market_cap?.usd / 1e9).toFixed(2)}B
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">24h Volume</div>
          <div className="text-2xl font-bold">
            ${(coinData?.market_data?.total_volume?.usd / 1e6).toFixed(2)}M
          </div>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList className="grid grid-cols-5 gap-4">
          <TabsTrigger value="chart">Price Chart</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="ai">AI Analysis</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card className="p-6">
            <div className="h-[600px]">
              <TradingViewWidget symbol={`${coinData?.symbol}usdt`} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trade">
          <TradingPanel 
            selectedCrypto={coinData?.symbol}
            currentPrice={coinData?.market_data?.current_price?.usd}
          />
        </TabsContent>

        <TabsContent value="strategy">
          <StrategyPanel 
            coinId={params.id as string}
            symbol={coinData?.symbol}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AIAnalysis
            coinId={params.id as string}
            marketData={{
              price: coinData?.market_data?.current_price?.usd,
              market_cap: coinData?.market_data?.market_cap?.usd,
              volume: coinData?.market_data?.total_volume?.usd,
              price_change_24h: coinData?.market_data?.price_change_percentage_24h,
            }}
          />
        </TabsContent>

        <TabsContent value="info">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Market Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">All Time High</p>
                    <p className="font-medium">
                      ${coinData?.market_data?.ath?.usd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">All Time Low</p>
                    <p className="font-medium">
                      ${coinData?.market_data?.atl?.usd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Circulating Supply</p>
                    <p className="font-medium">
                      {coinData?.market_data?.circulating_supply.toLocaleString()} {coinData?.symbol.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Supply</p>
                    <p className="font-medium">
                      {coinData?.market_data?.max_supply
                        ? `${coinData.market_data.max_supply.toLocaleString()} ${coinData.symbol.toUpperCase()}`
                        : 'Unlimited'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {coinData?.description?.en || 'No description available.'}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Links</h2>
                <div className="space-y-2">
                  {coinData?.links?.homepage?.[0] && (
                    <a
                      href={coinData.links.homepage[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block"
                    >
                      Official Website
                    </a>
                  )}
                  {coinData?.links?.blockchain_site?.filter(Boolean)[0] && (
                    <a
                      href={coinData.links.blockchain_site.filter(Boolean)[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block"
                    >
                      Block Explorer
                    </a>
                  )}
                  {coinData?.links?.official_forum_url?.filter(Boolean)[0] && (
                    <a
                      href={coinData.links.official_forum_url.filter(Boolean)[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block"
                    >
                      Official Forum
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
