from fastapi import APIRouter, HTTPException
from pycoingecko import CoinGeckoAPI
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
cg = CoinGeckoAPI(api_key=os.getenv('COINGECKO_API_KEY'))

@router.get("/crypto/price/{symbol}")
async def get_crypto_price(symbol: str):
    try:
        # Get coin ID from symbol
        coins_list = cg.get_coins_list()
        coin_id = next(
            (coin['id'] for coin in coins_list if coin['symbol'].upper() == symbol.upper()),
            None
        )
        
        if not coin_id:
            raise HTTPException(status_code=404, detail=f"Cryptocurrency {symbol} not found")
            
        # Get current price
        price_data = cg.get_price(ids=coin_id, vs_currencies='usd')
        if not price_data or coin_id not in price_data:
            raise HTTPException(status_code=404, detail="Price data not available")
            
        return {
            "symbol": symbol.upper(),
            "price": price_data[coin_id]['usd']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/crypto/list")
async def get_crypto_list():
    try:
        coins_list = cg.get_coins_list()
        return [
            {
                "symbol": coin['symbol'].upper(),
                "name": coin['name'],
                "id": coin['id']
            }
            for coin in coins_list
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
