# Quantitative Finance Features Implementation

This document outlines the quantitative finance features added to RuneKey based on recommendations from the awesome-quant repository.

## 📦 New Dependencies

Added the following libraries to `package.json`:

- **`technicalindicators`** (v3.1.0) - Comprehensive technical analysis library with 150+ indicators
- **`yahoo-finance2`** (v2.4.0) - Enhanced Yahoo Finance data access (optional, for future use)

## 🎯 Features Implemented

### 1. Technical Analysis Service (`technicalAnalysisService.ts`)

A comprehensive service for calculating technical indicators from price data:

**Indicators Supported:**
- **RSI (Relative Strength Index)** - Momentum oscillator (0-100)
- **MACD (Moving Average Convergence Divergence)** - Trend-following momentum indicator
- **Bollinger Bands** - Volatility bands around price
- **SMA (Simple Moving Average)** - Multiple periods supported
- **EMA (Exponential Moving Average)** - Multiple periods supported
- **Stochastic Oscillator** - Momentum indicator
- **ATR (Average True Range)** - Volatility measure
- **ADX (Average Directional Index)** - Trend strength indicator

**Signal Generation:**
- RSI signals: `overbought` (>70), `oversold` (<30), `neutral`
- MACD signals: `bullish`, `bearish`, `neutral`
- Bollinger Bands position: `above_upper`, `below_lower`, `near_upper`, `near_lower`, `middle`

### 2. Portfolio Analytics Service (`portfolioAnalyticsService.ts`)

Advanced portfolio risk and performance metrics:

**Metrics Calculated:**
- **Total Return** - Absolute and percentage returns
- **CAGR** - Compound Annual Growth Rate (requires historical data)
- **Sharpe Ratio** - Risk-adjusted returns (requires historical data)
- **Sortino Ratio** - Downside risk-adjusted returns (requires historical data)
- **Max Drawdown** - Largest peak-to-trough decline (requires historical data)
- **Volatility** - Annualized volatility (requires historical data)
- **Win Rate** - Percentage of profitable periods
- **Profit Factor** - Gross profit / Gross loss
- **Calmar Ratio** - CAGR / Max Drawdown

**Additional Features:**
- **Holding Performance Analysis** - Individual holding P&L, weights, and performance
- **Diversification Metrics** - Concentration (HHI), effective holdings count, top holding weight

### 3. Integration Points

#### InvestmentDetailsScreen
- **Technical Indicators Section** - Displays RSI, MACD, Bollinger Bands, SMA, EMA, and Stochastic
- **Signal Badges** - Color-coded signals (green for bullish/oversold, red for bearish/overbought)
- **Real-time Calculation** - Indicators calculated automatically when chart data loads

#### InvestingScreen
- **Portfolio Analytics Section** - Shows portfolio-level metrics
- **Total Return Display** - Color-coded profit/loss with percentage
- **Diversification Metrics** - Effective holdings and concentration index
- **Top Holdings by Weight** - Shows top 3 holdings with their portfolio weights and P&L

## 📊 Usage Examples

### Calculating Technical Indicators

```typescript
import { technicalAnalysisService } from '../services/api/technicalAnalysisService';

const priceData = [
  { close: 100, timestamp: Date.now() },
  { close: 102, timestamp: Date.now() + 86400000 },
  // ... more data points
];

const indicators = technicalAnalysisService.calculateIndicators(priceData, {
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bbPeriod: 20,
  bbStdDev: 2,
  smaPeriods: [20, 50],
  emaPeriods: [12, 26],
});

// Get signals
const rsiSignal = technicalAnalysisService.getRSISignal(indicators.rsi);
const macdSignal = technicalAnalysisService.getMACDSignal(indicators.macd);
```

### Calculating Portfolio Metrics

```typescript
import { portfolioAnalyticsService } from '../services/api/portfolioAnalyticsService';

// From historical portfolio values
const portfolioHistory = [
  { timestamp: Date.now() - 365 * 86400000, value: 10000 },
  { timestamp: Date.now(), value: 12000 },
];

const metrics = portfolioAnalyticsService.calculateMetrics(portfolioHistory, 0.02);

// From current holdings
const holdings = [
  { symbol: 'AAPL', costBasis: 1000, currentValue: 1200 },
  { symbol: 'MSFT', costBasis: 2000, currentValue: 2100 },
];

const performance = portfolioAnalyticsService.calculateHoldingPerformance(holdings, 3300);
const diversification = portfolioAnalyticsService.calculateDiversification(performance);
```

## 🔮 Future Enhancements

### Historical Data Integration
To enable full portfolio analytics (Sharpe, Sortino, max drawdown), consider:
1. Storing historical portfolio snapshots
2. Integrating with portfolio tracking APIs
3. Building historical data from transaction history

### Additional Indicators
The `technicalindicators` library supports many more indicators:
- Ichimoku Cloud
- Williams %R
- CCI (Commodity Channel Index)
- OBV (On-Balance Volume)
- And many more...

### Portfolio Optimization
Consider integrating portfolio optimization algorithms:
- Mean-variance optimization
- Risk parity
- Black-Litterman model

## 📚 References

- [awesome-quant Repository](https://github.com/wilsonfreitas/awesome-quant)
- [technicalindicators Documentation](https://github.com/anandanand84/technicalindicators)
- [Portfolio Optimization Theory](https://en.wikipedia.org/wiki/Modern_portfolio_theory)

## 🎨 UI/UX Notes

- Technical indicators are displayed in a card layout with color-coded signals
- Portfolio analytics use the same design language as existing RuneKey screens
- Metrics update automatically when data refreshes
- All calculations are performed client-side for privacy

## ⚠️ Limitations

1. **Historical Data Required**: Advanced metrics (Sharpe, Sortino, max drawdown) require historical portfolio values
2. **Data Quality**: Indicator accuracy depends on data quality and sufficient data points
3. **Performance**: Complex calculations may impact performance with very large datasets
4. **Not Financial Advice**: These tools are for informational purposes only

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete and Integrated

