from fastapi import HTTPException
import openai
from typing import Optional, List, Dict
import os
from pydantic import BaseModel
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIRequest(BaseModel):
    prompt: str
    context: Optional[Dict] = None
    market_data: Optional[Dict] = None

class AIResponse(BaseModel):
    analysis: str
    suggestions: List[str]
    confidence: float

class AIService:
    def __init__(self):
        openai.api_key = os.getenv("OPENAI_API_KEY")
        if not openai.api_key:
            logger.error("OpenAI API key not found in environment variables")
            raise ValueError("OpenAI API key not configured")

    async def get_trading_analysis(self, request: AIRequest) -> AIResponse:
        try:
            logger.info(f"Generating analysis for {request.context.get('coinId', 'unknown coin')}")
            
            # Format market data for better context
            market_context = ""
            if request.market_data:
                market_context = f"""
                Current Price: ${request.market_data.get('price', 'N/A')}
                Market Cap: ${request.market_data.get('market_cap', 'N/A')}
                24h Volume: ${request.market_data.get('volume', 'N/A')}
                24h Price Change: {request.market_data.get('price_change_24h', 'N/A')}%
                """

            # Create the prompt with context
            system_prompt = f"""You are a cryptocurrency trading expert. Analyze the following request and provide detailed insights.
            Consider the current market conditions and technical analysis principles.
            Market Data:
            {market_context}
            """

            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            # Extract and structure the response
            content = response.choices[0].message.content
            
            # Parse the content into structured format
            try:
                # Try to extract key points and suggestions
                parts = content.split("\n\n")
                analysis = parts[0]
                suggestions = [s.strip("- ") for s in parts[1].split("\n") if s.strip()]
                confidence = min(0.95, len(suggestions) / 10)  # Simple confidence calculation
            except Exception as e:
                logger.warning(f"Error parsing AI response: {e}")
                # Fallback to simple format
                analysis = content
                suggestions = ["No specific suggestions available"]
                confidence = 0.5

            return AIResponse(
                analysis=analysis,
                suggestions=suggestions,
                confidence=confidence
            )

        except openai.error.AuthenticationError:
            logger.error("OpenAI API authentication failed")
            raise HTTPException(status_code=500, detail="AI service authentication failed")
        except openai.error.RateLimitError:
            logger.error("OpenAI API rate limit exceeded")
            raise HTTPException(status_code=429, detail="AI service rate limit exceeded")
        except openai.error.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in AI analysis: {e}")
            raise HTTPException(status_code=500, detail=f"Unexpected error in AI analysis")

    async def get_market_insights(self, market_data: Dict) -> str:
        try:
            prompt = f"""
            Analyze the following market data and provide insights:
            {market_data}
            
            Focus on:
            1. Key trends
            2. Potential opportunities
            3. Risk factors
            """

            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert market analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error generating market insights: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate market insights: {str(e)}")

    async def generate_trading_strategy(self, parameters: Dict) -> Dict:
        try:
            logger.info(f"Generating strategy for {parameters.get('symbol', 'unknown symbol')}")
            
            system_prompt = """You are a cryptocurrency trading expert. Create a detailed trading strategy based on the given parameters.
            Include specific entry/exit rules and risk management guidelines."""

            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(parameters)}
                ],
                temperature=0.7,
                max_tokens=1500
            )

            content = response.choices[0].message.content
            
            try:
                # Parse the response into structured format
                sections = content.split("\n\n")
                strategy = {
                    "id": os.urandom(8).hex(),  # Generate unique strategy ID
                    "description": sections[0],
                    "entry_rules": [rule.strip("- ") for rule in sections[1].split("\n") if rule.strip()],
                    "exit_rules": [rule.strip("- ") for rule in sections[2].split("\n") if rule.strip()],
                    "risk_management": [rule.strip("- ") for rule in sections[3].split("\n") if rule.strip()],
                    "timeframe": parameters.get("timeframe", "1d"),
                    "created_at": datetime.now().isoformat()
                }
            except Exception as e:
                logger.warning(f"Error parsing strategy response: {e}")
                # Fallback to simple format
                strategy = {
                    "id": os.urandom(8).hex(),
                    "description": content,
                    "entry_rules": ["Strategy parsing failed"],
                    "exit_rules": ["Strategy parsing failed"],
                    "risk_management": ["Strategy parsing failed"],
                    "timeframe": parameters.get("timeframe", "1d"),
                    "created_at": datetime.now().isoformat()
                }

            return strategy

        except Exception as e:
            logger.error(f"Error generating strategy: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate strategy: {str(e)}")
