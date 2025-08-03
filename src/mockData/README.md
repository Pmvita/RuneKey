# 📊 Mock Data for RuneKey Development

This folder contains mock API data that can be used for development and testing purposes when the real CoinGecko API is unavailable or when you want to work offline.

## 📁 File Structure

```
mockData/
├── api/
│   ├── crypto-prices.json      # Individual coin price data
│   ├── chart-data.json         # Historical price charts
│   ├── top-coins.json          # Top 10 cryptocurrencies
│   └── dev-wallet.json         # Developer wallet configuration
└── README.md                   # This file
```

## 🔧 Usage

### 1. Crypto Prices (`crypto-prices.json`)
Contains detailed price information for individual cryptocurrencies including:
- Current price
- Market cap and rank
- 24h price changes
- Volume data
- Historical highs/lows

**Example Usage:**
```javascript
import cryptoPrices from './mockData/api/crypto-prices.json';

// Get Bitcoin price
const bitcoinPrice = cryptoPrices.bitcoin.current_price;
```

### 2. Chart Data (`chart-data.json`)
Contains 30-day historical price data for charts including:
- Price points (timestamp, price)
- Market cap data
- Volume data

**Example Usage:**
```javascript
import chartData from './mockData/api/chart-data.json';

// Get Bitcoin chart data
const bitcoinChart = chartData.bitcoin.prices;
```

### 3. Top Coins (`top-coins.json`)
Array of top 10 cryptocurrencies by market cap with complete data.

**Example Usage:**
```javascript
import topCoins from './mockData/api/top-coins.json';

// Get all top coins
const coins = topCoins.map(coin => ({
  id: coin.id,
  name: coin.name,
  price: coin.current_price
}));
```

### 4. Dev Wallet (`dev-wallet.json`)
Complete developer wallet configuration with:
- $15.5M portfolio value
- 5 major cryptocurrencies
- Transaction history
- Network configurations
- User settings

**Example Usage:**
```javascript
import devWallet from './mockData/api/dev-wallet.json';

// Get wallet balance
const totalValue = devWallet.wallet.totalValue;
const tokens = devWallet.wallet.tokens;
```

## 💰 Dev Wallet Portfolio

The developer wallet contains a realistic $15.5M portfolio:

| Token | Balance | USD Value | Percentage |
|-------|---------|-----------|------------|
| **BTC** | 35.5 | $1,535,379 | 9.9% |
| **ETH** | 1,250.875 | $3,316,251 | 21.4% |
| **USDC** | 5,000,000 | $5,000,000 | 32.3% |
| **USDT** | 3,000,000 | $3,000,000 | 19.4% |
| **BNB** | 15,000 | $4,686,750 | 30.2% |

**Total Portfolio Value: $15,538,380**

## 🔄 Integration with Real API

To switch between mock data and real API:

```javascript
// In your service files
const useMockData = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true';

if (useMockData) {
  // Use mock data
  return mockData;
} else {
  // Use real API
  return await fetchFromAPI();
}
```

## 📊 Data Format

All mock data follows the CoinGecko API format for seamless integration:

### Price Data Format
```json
{
  "id": "bitcoin",
  "symbol": "btc",
  "name": "Bitcoin",
  "current_price": 43250.12,
  "market_cap": 847123456789,
  "price_change_percentage_24h": 2.98,
  "total_volume": 23456789012
}
```

### Chart Data Format
```json
{
  "prices": [[timestamp, price], ...],
  "market_caps": [[timestamp, market_cap], ...],
  "total_volumes": [[timestamp, volume], ...]
}
```

## 🚀 Quick Start

1. **Copy mock data to your project:**
   ```bash
   cp -r mockData/ src/
   ```

2. **Import in your components:**
   ```javascript
   import cryptoPrices from '../mockData/api/crypto-prices.json';
   ```

3. **Use in development:**
   ```javascript
   const bitcoinData = cryptoPrices.bitcoin;
   console.log(`Bitcoin price: $${bitcoinData.current_price}`);
   ```

## 🔧 Environment Variables

Add these to your `.env` file for easy switching:

```env
USE_MOCK_DATA=true
MOCK_DATA_PATH=./mockData/api/
```

## 📝 Notes

- All timestamps are in milliseconds since Unix epoch
- Prices are in USD
- Market caps and volumes are in USD
- Data is updated to reflect realistic current market conditions
- Use this data for development, testing, and demos

## 🤝 Contributing

When adding new mock data:
1. Follow the existing format
2. Use realistic values
3. Include all required fields
4. Update this README if needed

---

*This mock data is for development purposes only. For production, always use real API data.* 