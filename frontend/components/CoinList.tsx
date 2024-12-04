'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  image: string;
}

export default function CoinList() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [displayedCoins, setDisplayedCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<{ [key: string]: string }>({});
  const [page, setPage] = useState(1);
  const loadMoreRef = useRef(null);
  const router = useRouter();
  const ITEMS_PER_PAGE = 20;

  const entry = useIntersectionObserver(loadMoreRef, {});
  const isVisible = !!entry?.isIntersecting;

  useEffect(() => {
    fetchCoins();
    checkFavoritesTable();
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (isVisible && coins.length > displayedCoins.length) {
      loadMore();
    }
  }, [isVisible]);

  const fetchCoins = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
        {
          headers: {
            'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY!
          }
        }
      );
      const data = await response.json();
      setCoins(data);
      setDisplayedCoins(data.slice(0, ITEMS_PER_PAGE));
      setLoading(false);
      
      // Fetch AI insights for the first batch of coins
      fetchAiInsights(data.slice(0, ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching coins:', error);
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const newCoins = coins.slice(0, end);
    setDisplayedCoins(newCoins);
    setPage(nextPage);

    // Fetch AI insights for the new batch of coins
    const newBatch = coins.slice(start, end);
    fetchAiInsights(newBatch);
  };

  const checkFavoritesTable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('favorites')
        .select()
        .limit(1);

      if (error && error.code === '42P01') {
        await supabase.rpc('create_favorites_table');
      }
    } catch (error) {
      console.error('Error checking favorites table:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('coin_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data.map(f => f.coin_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchAiInsights = async (coinsToAnalyze: Coin[]) => {
    try {
      const insights: { [key: string]: string } = {};
      
      for (const coin of coinsToAnalyze) {
        if (!aiInsights[coin.id]) {  // Only fetch if we don't have insights yet
          const response = await fetch('/api/ai/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              context: {
                coinId: coin.id,
                price: coin.current_price,
                priceChange: coin.price_change_percentage_24h
              }
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            insights[coin.id] = data.analysis;
          }
        }
      }
      
      setAiInsights(prev => ({ ...prev, ...insights }));
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const toggleFavorite = async (coinId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (favorites.includes(coinId)) {
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, coin_id: coinId });
        setFavorites(favorites.filter(id => id !== coinId));
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, coin_id: coinId });
        setFavorites([...favorites, coinId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCoins.map((coin) => (
          <Card key={coin.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                <div>
                  <CardTitle className="text-lg font-bold">{coin.name}</CardTitle>
                  <CardDescription>{coin.symbol.toUpperCase()}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(coin.id)}
                className="ml-auto"
              >
                <Star
                  className={favorites.includes(coin.id) ? "fill-yellow-400 text-yellow-400" : ""}
                />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">${coin.current_price.toLocaleString()}</span>
                  <Badge variant={coin.price_change_percentage_24h >= 0 ? "success" : "destructive"}>
                    {coin.price_change_percentage_24h.toFixed(2)}%
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Rank #{coin.market_cap_rank}
                </div>
                {aiInsights[coin.id] && (
                  <div className="mt-2 p-2 bg-secondary rounded-lg">
                    <div className="flex items-center gap-1 text-sm font-medium mb-1">
                      <Sparkles className="w-4 h-4" />
                      AI Insight
                    </div>
                    <p className="text-sm">{aiInsights[coin.id]}</p>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => router.push(`/coin/${coin.id}`)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div ref={loadMoreRef} className="h-10" />
    </div>
  );
}
