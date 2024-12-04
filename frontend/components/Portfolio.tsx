'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Position {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  change_today: number;
}

interface Order {
  symbol: string;
  qty: number;
  side: string;
  status: string;
  filled_avg_price: number;
  created_at: string;
}

interface AccountInfo {
  cash: number;
  portfolio_value: number;
  buying_power: number;
  day_trade_count: number;
}

export default function Portfolio() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('1D');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [positionsRes, ordersRes, accountRes, historyRes] = await Promise.all([
        fetch('/api/alpaca/positions'),
        fetch('/api/alpaca/orders'),
        fetch('/api/alpaca/account'),
        fetch(`/api/alpaca/portfolio/history?timeframe=${timeframe}`)
      ]);

      const [positionsData, ordersData, accountData, historyData] = await Promise.all([
        positionsRes.json(),
        ordersRes.json(),
        accountRes.json(),
        historyRes.json()
      ]);

      setPositions(positionsData);
      setOrders(ordersData);
      setAccountInfo(accountData);
      setPortfolioHistory(historyData);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value / 100);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {accountInfo ? formatCurrency(accountInfo.portfolio_value) : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {accountInfo ? formatCurrency(accountInfo.cash) : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Buying Power</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {accountInfo ? formatCurrency(accountInfo.buying_power) : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Day Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {accountInfo ? accountInfo.day_trade_count : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="flex space-x-2">
            {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'outline'}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={portfolioHistory}>
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Positions and Orders */}
      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Market Value</TableHead>
                    <TableHead>Unrealized P/L</TableHead>
                    <TableHead>Today's Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.symbol}>
                      <TableCell>{position.symbol}</TableCell>
                      <TableCell>{position.qty}</TableCell>
                      <TableCell>{formatCurrency(position.avg_entry_price)}</TableCell>
                      <TableCell>{formatCurrency(position.current_price)}</TableCell>
                      <TableCell>{formatCurrency(position.market_value)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={position.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(position.unrealized_pl)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatPercent(position.unrealized_plpc)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={position.change_today >= 0 ? 'success' : 'destructive'}>
                          {formatPercent(position.change_today)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.created_at}>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{order.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={order.side === 'buy' ? 'success' : 'destructive'}>
                          {order.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.qty}</TableCell>
                      <TableCell>{formatCurrency(order.filled_avg_price)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'filled' ? 'success' : 'secondary'}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
