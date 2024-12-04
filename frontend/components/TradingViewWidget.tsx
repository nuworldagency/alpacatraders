'use client'

import { useEffect, useRef } from 'react'

interface TradingViewWidgetProps {
  symbol?: string
}

export default function TradingViewWidget({ symbol = 'BTCUSD' }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "BINANCE:${symbol}",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "calendar": false,
        "hide_volume": false,
        "support_host": "https://www.tradingview.com"
      }
    `

    if (container.current) {
      container.current.innerHTML = ''
      const div = document.createElement('div')
      div.className = 'tradingview-widget-container'
      const widgetDiv = document.createElement('div')
      widgetDiv.className = 'tradingview-widget-container__widget'
      div.appendChild(widgetDiv)
      container.current.appendChild(div)
      div.appendChild(script)
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = ''
      }
    }
  }, [symbol])

  return (
    <div ref={container} className="w-full h-full" />
  )
}
