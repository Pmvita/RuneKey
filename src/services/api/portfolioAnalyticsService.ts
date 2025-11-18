export interface PortfolioMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  cagr?: number; // Compound Annual Growth Rate
  sharpeRatio?: number;
  sortinoRatio?: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  volatility?: number; // Annualized volatility
  winRate?: number; // Percentage of profitable periods
  averageWin?: number;
  averageLoss?: number;
  profitFactor?: number; // Gross profit / Gross loss
  calmarRatio?: number; // CAGR / Max Drawdown
}

export interface PortfolioValue {
  timestamp: number;
  value: number;
}

export interface HoldingPerformance {
  symbol: string;
  costBasis: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  weight: number; // Portfolio weight percentage
}

class PortfolioAnalyticsService {
  /**
   * Calculate portfolio performance metrics from historical values
   */
  calculateMetrics(
    portfolioValues: PortfolioValue[],
    riskFreeRate: number = 0.02 // Default 2% annual risk-free rate
  ): PortfolioMetrics {
    if (!portfolioValues || portfolioValues.length < 2) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
      };
    }

    // Sort by timestamp
    const sorted = [...portfolioValues].sort((a, b) => a.timestamp - b.timestamp);
    const initialValue = sorted[0].value;
    const finalValue = sorted[sorted.length - 1].value;

    // Total return
    const totalReturn = finalValue - initialValue;
    const totalReturnPercent = initialValue > 0 ? (totalReturn / initialValue) * 100 : 0;

    // Calculate returns (periodic)
    const returns: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prevValue = sorted[i - 1].value;
      if (prevValue > 0) {
        returns.push((sorted[i].value - prevValue) / prevValue);
      }
    }

    // CAGR (Compound Annual Growth Rate)
    const daysDiff = (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / (1000 * 60 * 60 * 24);
    const years = daysDiff / 365.25;
    let cagr: number | undefined;
    if (years > 0 && initialValue > 0) {
      cagr = (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    }

    // Volatility (annualized)
    let volatility: number | undefined;
    if (returns.length > 1) {
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
      const stdDev = Math.sqrt(variance);
      // Annualize: multiply by sqrt of periods per year
      // Assuming daily data (252 trading days)
      const periodsPerYear = 252;
      const periodsInData = returns.length;
      const daysInData = daysDiff;
      const periodsPerYearEstimate = daysInData > 0 ? (periodsInData / daysInData) * 365.25 : 252;
      volatility = stdDev * Math.sqrt(periodsPerYearEstimate) * 100;
    }

    // Max Drawdown
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = initialValue;

    for (let i = 1; i < sorted.length; i++) {
      const value = sorted[i].value;
      if (value > peak) {
        peak = value;
      }
      const drawdown = peak - value;
      const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    // Sharpe Ratio
    let sharpeRatio: number | undefined;
    if (volatility && volatility > 0 && cagr !== undefined) {
      const excessReturn = cagr - riskFreeRate * 100;
      sharpeRatio = excessReturn / volatility;
    }

    // Sortino Ratio (uses downside deviation instead of standard deviation)
    let sortinoRatio: number | undefined;
    if (returns.length > 1 && cagr !== undefined) {
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const downsideReturns = returns.filter((r) => r < 0);
      if (downsideReturns.length > 0) {
        const downsideVariance =
          downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length;
        const downsideStdDev = Math.sqrt(downsideVariance);
        if (downsideStdDev > 0) {
          const periodsPerYearEstimate = daysDiff > 0 ? (returns.length / daysDiff) * 365.25 : 252;
          const annualizedDownsideDev = downsideStdDev * Math.sqrt(periodsPerYearEstimate);
          const excessReturn = (cagr / 100 - riskFreeRate);
          sortinoRatio = excessReturn / annualizedDownsideDev;
        }
      }
    }

    // Win Rate
    const positiveReturns = returns.filter((r) => r > 0);
    const winRate = returns.length > 0 ? (positiveReturns.length / returns.length) * 100 : undefined;

    // Average Win / Loss
    const wins = returns.filter((r) => r > 0);
    const losses = returns.filter((r) => r < 0);
    const averageWin = wins.length > 0 ? wins.reduce((sum, r) => sum + r, 0) / wins.length : undefined;
    const averageLoss =
      losses.length > 0 ? Math.abs(losses.reduce((sum, r) => sum + r, 0) / losses.length) : undefined;

    // Profit Factor
    let profitFactor: number | undefined;
    if (averageWin !== undefined && averageLoss !== undefined && averageLoss > 0) {
      const grossProfit = wins.reduce((sum, r) => sum + r, 0);
      const grossLoss = Math.abs(losses.reduce((sum, r) => sum + r, 0));
      profitFactor = grossLoss > 0 ? grossProfit / grossLoss : undefined;
    }

    // Calmar Ratio (CAGR / Max Drawdown %)
    let calmarRatio: number | undefined;
    if (cagr !== undefined && maxDrawdownPercent > 0) {
      calmarRatio = cagr / maxDrawdownPercent;
    }

    return {
      totalReturn,
      totalReturnPercent,
      cagr,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      maxDrawdownPercent,
      volatility,
      winRate,
      averageWin: averageWin ? averageWin * 100 : undefined,
      averageLoss: averageLoss ? averageLoss * 100 : undefined,
      profitFactor,
      calmarRatio,
    };
  }

  /**
   * Calculate portfolio metrics from current holdings
   */
  calculateHoldingPerformance(
    holdings: Array<{
      symbol: string;
      costBasis: number;
      currentValue: number;
    }>,
    totalPortfolioValue: number
  ): HoldingPerformance[] {
    return holdings.map((holding) => {
      const profitLoss = holding.currentValue - holding.costBasis;
      const profitLossPercent = holding.costBasis > 0 ? (profitLoss / holding.costBasis) * 100 : 0;
      const weight = totalPortfolioValue > 0 ? (holding.currentValue / totalPortfolioValue) * 100 : 0;

      return {
        symbol: holding.symbol,
        costBasis: holding.costBasis,
        currentValue: holding.currentValue,
        profitLoss,
        profitLossPercent,
        weight,
      };
    });
  }

  /**
   * Calculate portfolio diversification metrics
   */
  calculateDiversification(holdings: HoldingPerformance[]): {
    concentration: number; // Herfindahl-Hirschman Index (0-1, higher = more concentrated)
    effectiveHoldings: number; // Effective number of holdings
    topHoldingWeight: number;
  } {
    if (holdings.length === 0) {
      return {
        concentration: 0,
        effectiveHoldings: 0,
        topHoldingWeight: 0,
      };
    }

    // Herfindahl-Hirschman Index (sum of squared weights)
    const hhi = holdings.reduce((sum, h) => sum + Math.pow(h.weight / 100, 2), 0);
    const concentration = hhi; // 0 = perfectly diversified, 1 = single holding

    // Effective number of holdings (1 / HHI)
    const effectiveHoldings = hhi > 0 ? 1 / hhi : holdings.length;

    // Top holding weight
    const sortedByWeight = [...holdings].sort((a, b) => b.weight - a.weight);
    const topHoldingWeight = sortedByWeight[0]?.weight ?? 0;

    return {
      concentration,
      effectiveHoldings,
      topHoldingWeight,
    };
  }

  /**
   * Generate portfolio value history from holdings performance
   * This is a helper to create historical data if you only have current snapshots
   */
  generatePortfolioHistory(
    initialValue: number,
    returns: number[],
    startTimestamp: number,
    intervalMs: number = 24 * 60 * 60 * 1000 // Daily by default
  ): PortfolioValue[] {
    const history: PortfolioValue[] = [{ timestamp: startTimestamp, value: initialValue }];

    let currentValue = initialValue;
    let currentTimestamp = startTimestamp;

    returns.forEach((returnValue) => {
      currentValue = currentValue * (1 + returnValue);
      currentTimestamp += intervalMs;
      history.push({
        timestamp: currentTimestamp,
        value: currentValue,
      });
    });

    return history;
  }
}

export const portfolioAnalyticsService = new PortfolioAnalyticsService();

