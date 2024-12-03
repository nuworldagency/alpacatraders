import streamlit as st
import requests
import json

st.set_page_config(
    page_title="TradeViewPro Dashboard",
    page_icon="📈",
    layout="wide"
)

st.title("TradeViewPro Dashboard")

with st.sidebar:
    st.header("Settings")
    timeframe = st.selectbox(
        "Select Timeframe",
        ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"]
    )
    
    indicators = st.multiselect(
        "Select Indicators",
        ["RSI", "MACD", "Bollinger Bands", "Moving Average", "Volume"]
    )

st.header("Pine Script Generator")
user_description = st.text_area(
    "Describe your trading strategy",
    height=150,
    placeholder="Example: Create a strategy that buys when RSI is oversold and sells when RSI is overbought..."
)

if st.button("Generate Pine Script"):
    if user_description:
        with st.spinner("Generating Pine Script..."):
            try:
                response = requests.post(
                    "http://localhost:8000/generate-pine-script",
                    json={
                        "description": user_description,
                        "timeframe": timeframe,
                        "indicators": indicators
                    }
                )
                if response.status_code == 200:
                    st.success("Pine Script Generated!")
                    st.code(response.json().get("script", ""), language="pine")
                else:
                    st.error("Failed to generate Pine Script")
            except Exception as e:
                st.error(f"Error: {str(e)}")
    else:
        st.warning("Please provide a description of your trading strategy")
