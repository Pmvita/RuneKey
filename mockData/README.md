# Mock Data

This directory contains mock data for development and testing purposes.

## Structure

```
mockData/
├── api/
│   ├── dev-wallet.json      # Developer wallet structure and balances
│   └── top-coins.json       # Top coins list for search functionality
└── README.md
```

## Files

### 1. Developer Wallet (`dev-wallet.json`)
Contains the structure and balances for the developer wallet used in development mode. **Note: This file no longer contains static price data - the app fetches live prices from CoinGecko API.**

### 2. Top Coins (`top-coins.json`)
Contains a list of top cryptocurrencies for search functionality and initial app state.

## Usage

The mock data is used for:
- **Wallet structure and balances** - Static data that doesn't change frequently
- **Initial app state** - Providing a starting point for development
- **Testing** - Ensuring the app works without external API dependencies

**Live data is fetched from:**
- **CoinGecko API** - For current prices, market cap, and 24h price changes
- **Real-time updates** - Prices update every 30 seconds automatically

## Important Notes

- **No more static price data** - All prices, market caps, and price changes are live
- **Automatic fallbacks** - If the API fails, the app gracefully handles the error
- **Real-time updates** - Portfolio values update automatically with live market data 