# TradeViewPro

An AI-powered trading platform that integrates with TradingView for generating Pine Script, setting up trackers, indicators, and backtests.

## Project Structure
```
tradeviewpro/
├── frontend/           # Next.js frontend application
├── backend/           # FastAPI backend service
│   ├── api/          # FastAPI routes and endpoints
│   ├── models/       # Data models and schemas
│   └── services/     # Business logic and services
├── streamlit/        # Streamlit dashboard application
└── tradingview-api/  # TradingView API integration
```

## Setup Instructions

### Backend Setup
1. Activate conda environment:
```bash
conda activate aistuff
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
uvicorn main:app --reload
```

### Frontend Setup
1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

### Streamlit Dashboard
1. Run the Streamlit app:
```bash
cd streamlit
streamlit run app.py
```
