import {
  RSI,
  MACD,
  BollingerBands,
  SMA,
  EMA,
  Stochastic,
  ATR,
  ADX,
} from 'technicalindicators';

export interface TechnicalIndicators {
  rsi?: number;
  macd?: {
    MACD: number;
    signal: number;
    histogram: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  sma?: {
    [period: number]: number;
  };
  ema?: {
    [period: number]: number;
  };
  stochastic?: {
    k: number;
    d: number;
  };
  atr?: number;
  adx?: number;
}

export interface PriceData {
  close: number;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
  timestamp?: number;
}

class TechnicalAnalysisService {
  /**
   * Calculate all technical indicators for a given price series
   */
  calculateIndicators(
    priceData: PriceData[],
    options: {
      rsiPeriod?: number;
      macdFast?: number;
      macdSlow?: number;
      macdSignal?: number;
      bbPeriod?: number;
      bbStdDev?: number;
      smaPeriods?: number[];
      emaPeriods?: number[];
      stochasticPeriod?: number;
      atrPeriod?: number;
      adxPeriod?: number;
    } = {}
  ): TechnicalIndicators {
    if (!priceData || priceData.length === 0) {
      return {};
    }

    const closes = priceData.map((d) => d.close);
    const highs = priceData.map((d) => d.high ?? d.close);
    const lows = priceData.map((d) => d.low ?? d.close);
    const opens = priceData.map((d) => d.open ?? d.close);
    const volumes = priceData.map((d) => d.volume ?? 0);

    const indicators: TechnicalIndicators = {};

    // RSI (Relative Strength Index)
    if (closes.length >= (options.rsiPeriod ?? 14) + 1) {
      try {
        const rsiValues = RSI.calculate({
          values: closes,
          period: options.rsiPeriod ?? 14,
        });
        if (rsiValues.length > 0) {
          indicators.rsi = rsiValues[rsiValues.length - 1];
        }
      } catch (error) {
        console.warn('RSI calculation error:', error);
      }
    }

    // MACD (Moving Average Convergence Divergence)
    if (closes.length >= (options.macdSlow ?? 26)) {
      try {
        const macdValues = MACD.calculate({
          values: closes,
          fastPeriod: options.macdFast ?? 12,
          slowPeriod: options.macdSlow ?? 26,
          signalPeriod: options.macdSignal ?? 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false,
        });
        if (macdValues.length > 0) {
          const lastMacd = macdValues[macdValues.length - 1];
          indicators.macd = {
            MACD: lastMacd.MACD ?? 0,
            signal: lastMacd.signal ?? 0,
            histogram: lastMacd.histogram ?? 0,
          };
        }
      } catch (error) {
        console.warn('MACD calculation error:', error);
      }
    }

    // Bollinger Bands
    if (closes.length >= (options.bbPeriod ?? 20)) {
      try {
        const bbValues = BollingerBands.calculate({
          values: closes,
          period: options.bbPeriod ?? 20,
          stdDev: options.bbStdDev ?? 2,
        });
        if (bbValues.length > 0) {
          const lastBB = bbValues[bbValues.length - 1];
          indicators.bollingerBands = {
            upper: lastBB.upper ?? 0,
            middle: lastBB.middle ?? 0,
            lower: lastBB.lower ?? 0,
          };
        }
      } catch (error) {
        console.warn('Bollinger Bands calculation error:', error);
      }
    }

    // Simple Moving Averages
    if (options.smaPeriods && options.smaPeriods.length > 0) {
      indicators.sma = {};
      options.smaPeriods.forEach((period) => {
        if (closes.length >= period) {
          try {
            const smaValues = SMA.calculate({
              values: closes,
              period,
            });
            if (smaValues.length > 0) {
              indicators.sma![period] = smaValues[smaValues.length - 1];
            }
          } catch (error) {
            console.warn(`SMA(${period}) calculation error:`, error);
          }
        }
      });
    }

    // Exponential Moving Averages
    if (options.emaPeriods && options.emaPeriods.length > 0) {
      indicators.ema = {};
      options.emaPeriods.forEach((period) => {
        if (closes.length >= period) {
          try {
            const emaValues = EMA.calculate({
              values: closes,
              period,
            });
            if (emaValues.length > 0) {
              indicators.ema![period] = emaValues[emaValues.length - 1];
            }
          } catch (error) {
            console.warn(`EMA(${period}) calculation error:`, error);
          }
        }
      });
    }

    // Stochastic Oscillator
    if (
      closes.length >= (options.stochasticPeriod ?? 14) &&
      highs.length === closes.length &&
      lows.length === closes.length
    ) {
      try {
        const stochasticValues = Stochastic.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: options.stochasticPeriod ?? 14,
          signalPeriod: 3,
        });
        if (stochasticValues.length > 0) {
          const lastStoch = stochasticValues[stochasticValues.length - 1];
          indicators.stochastic = {
            k: lastStoch.k ?? 0,
            d: lastStoch.d ?? 0,
          };
        }
      } catch (error) {
        console.warn('Stochastic calculation error:', error);
      }
    }

    // ATR (Average True Range)
    if (
      closes.length >= (options.atrPeriod ?? 14) &&
      highs.length === closes.length &&
      lows.length === closes.length &&
      opens.length === closes.length
    ) {
      try {
        const atrValues = ATR.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: options.atrPeriod ?? 14,
        });
        if (atrValues.length > 0) {
          indicators.atr = atrValues[atrValues.length - 1];
        }
      } catch (error) {
        console.warn('ATR calculation error:', error);
      }
    }

    // ADX (Average Directional Index)
    if (
      closes.length >= (options.adxPeriod ?? 14) &&
      highs.length === closes.length &&
      lows.length === closes.length
    ) {
      try {
        const adxValues = ADX.calculate({
          high: highs,
          low: lows,
          close: closes,
          period: options.adxPeriod ?? 14,
        });
        if (adxValues.length > 0) {
          indicators.adx = adxValues[adxValues.length - 1].adx ?? 0;
        }
      } catch (error) {
        console.warn('ADX calculation error:', error);
      }
    }

    return indicators;
  }

  /**
   * Get RSI signal (overbought/oversold)
   */
  getRSISignal(rsi?: number): 'overbought' | 'oversold' | 'neutral' {
    if (!rsi) return 'neutral';
    if (rsi >= 70) return 'overbought';
    if (rsi <= 30) return 'oversold';
    return 'neutral';
  }

  /**
   * Get MACD signal (bullish/bearish)
   */
  getMACDSignal(macd?: { MACD: number; signal: number; histogram: number }): 'bullish' | 'bearish' | 'neutral' {
    if (!macd) return 'neutral';
    if (macd.MACD > macd.signal && macd.histogram > 0) return 'bullish';
    if (macd.MACD < macd.signal && macd.histogram < 0) return 'bearish';
    return 'neutral';
  }

  /**
   * Get Bollinger Bands position
   */
  getBBPosition(
    price: number,
    bb?: { upper: number; middle: number; lower: number }
  ): 'above_upper' | 'below_lower' | 'near_upper' | 'near_lower' | 'middle' | 'unknown' {
    if (!bb) return 'unknown';
    if (price > bb.upper) return 'above_upper';
    if (price < bb.lower) return 'below_lower';
    const upperRange = bb.upper - bb.middle;
    const lowerRange = bb.middle - bb.lower;
    if (price > bb.middle + upperRange * 0.7) return 'near_upper';
    if (price < bb.middle - lowerRange * 0.7) return 'near_lower';
    return 'middle';
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService();

