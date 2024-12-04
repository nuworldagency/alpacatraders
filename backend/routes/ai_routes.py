from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from services.ai_service import AIService, AIRequest, AIResponse
from services.auth_service import get_current_user
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
ai_service = AIService()

@router.post("/analysis")
async def get_trading_analysis(
    request: AIRequest,
    current_user: Dict = Depends(get_current_user)
) -> AIResponse:
    """
    Get AI-powered trading analysis based on user query and context
    """
    try:
        logger.info(f"Analysis requested for {request.context.get('coinId', 'unknown')} by user {current_user['id']}")
        return await ai_service.get_trading_analysis(request)
    except Exception as e:
        logger.error(f"Error in analysis endpoint: {e}")
        raise HTTPException(
            status_code=getattr(e, 'status_code', 500),
            detail=str(e)
        )

@router.post("/insights")
async def get_market_insights(
    market_data: Dict,
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """
    Get AI-generated market insights based on provided market data
    """
    insights = await ai_service.get_market_insights(market_data)
    return {"insights": insights}

@router.post("/strategy")
async def generate_trading_strategy(
    parameters: Dict,
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """
    Generate a trading strategy based on provided parameters
    """
    try:
        logger.info(f"Strategy generation requested by user {current_user['id']}")
        return await ai_service.generate_trading_strategy(parameters)
    except Exception as e:
        logger.error(f"Error in strategy endpoint: {e}")
        raise HTTPException(
            status_code=getattr(e, 'status_code', 500),
            detail=str(e)
        )
