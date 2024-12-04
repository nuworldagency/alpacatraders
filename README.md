# TradeViewPro

A professional cryptocurrency trading platform with AI-powered analysis and real-time trading capabilities.

## Features

- Real-time cryptocurrency price tracking
- AI-powered trading analysis
- Portfolio management
- Alpaca trading integration
- User authentication via Supabase
- Interactive charts and trading interface

## Tech Stack

- **Frontend**: Next.js, TailwindCSS, Tremor
- **Backend**: FastAPI, Python
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Trading**: Alpaca API
- **AI**: OpenAI API

## Project Structure

```
tradeviewpro/
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/              # Utility functions and hooks
│   └── public/           # Static assets
│
├── backend/               # FastAPI backend application
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
│
├── .replit               # Replit configuration
├── replit.nix           # Nix environment configuration
├── run.sh              # Startup script
└── package.json        # Project metadata and scripts
```

## Environment Variables

### Frontend
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend
```env
OPENAI_API_KEY=your_openai_key
ALPACA_API_KEY=your_alpaca_key
ALPACA_API_SECRET=your_alpaca_secret
ALPACA_API_URL=https://paper-api.alpaca.markets
```

## Development

1. Clone the repository:
```bash
git clone https://github.com/your-username/tradeviewpro.git
cd tradeviewpro
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && pip install -r requirements.txt
```

3. Set up environment variables:
- Copy `.env.example` to `.env` in both frontend and backend directories
- Fill in your API keys and configuration

4. Run the development servers:
```bash
# Start the backend server
cd backend && uvicorn main:app --reload

# In another terminal, start the frontend
cd frontend && npm run dev
```

## Deployment

The project is configured to be deployed on Replit:

1. Import the repository to Replit
2. Set up the environment variables in Replit's Secrets tab
3. Click "Run" to start the application

## License

MIT License - See [LICENSE](LICENSE) for details
