from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
import os
from dotenv import load_dotenv

load_dotenv()

class PineScriptGenerator:
    def __init__(self):
        self.llm = ChatOpenAI(
            model_name="gpt-4",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.template = """
        You are an expert in creating Pine Script for TradingView. Generate a Pine Script v5 implementation based on the following trading strategy description.
        
        Strategy Description: {strategy_description}
        Timeframe: {timeframe}
        
        Requirements:
        1. Use Pine Script v5 syntax
        2. Include proper risk management
        3. Add relevant indicators and alerts
        4. Make the code readable and well-commented
        5. Ensure the strategy is complete and can be directly used in TradingView
        
        Generated Pine Script:
        """
        
        self.prompt = PromptTemplate(
            input_variables=["strategy_description", "timeframe"],
            template=self.template
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
    
    async def generate(self, description: str, timeframe: str = "D") -> str:
        try:
            response = await self.chain.arun(
                strategy_description=description,
                timeframe=timeframe
            )
            return response.strip()
        except Exception as e:
            print(f"Error generating Pine Script: {str(e)}")
            return f"Error generating Pine Script: {str(e)}"
