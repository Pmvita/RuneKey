import AsyncStorage from '@react-native-async-storage/async-storage';

// Price cache service to store last live prices
class PriceCacheService {
  private static instance: PriceCacheService;
  private cacheKey = 'last_live_prices';
  private priceCache: { [symbol: string]: { price: number; timestamp: number } } = {};

  static getInstance(): PriceCacheService {
    if (!PriceCacheService.instance) {
      PriceCacheService.instance = new PriceCacheService();
    }
    return PriceCacheService.instance;
  }

  // Save last live price for a token
  async saveLastLivePrice(symbol: string, price: number): Promise<void> {
    try {
      this.priceCache[symbol] = {
        price,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(this.priceCache));
    } catch (error) {
      console.error('❌ PriceCache: Failed to save last live price:', error);
    }
  }

  // Get last live price for a token
  async getLastLivePrice(symbol: string): Promise<number | null> {
    try {
      // Load cache if not loaded
      if (Object.keys(this.priceCache).length === 0) {
        const cached = await AsyncStorage.getItem(this.cacheKey);
        if (cached) {
          this.priceCache = JSON.parse(cached);
        }
      }

      const cachedPrice = this.priceCache[symbol];
      if (cachedPrice) {
        // Check if cache is still valid (less than 1 hour old)
        const isExpired = Date.now() - cachedPrice.timestamp > 60 * 60 * 1000;
        
        if (!isExpired) {
          return cachedPrice.price;
        } else {
          delete this.priceCache[symbol];
          await AsyncStorage.setItem(this.cacheKey, JSON.stringify(this.priceCache));
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ PriceCache: Failed to get last live price:', error);
      return null;
    }
  }

  // Get all cached prices
  async getAllCachedPrices(): Promise<{ [symbol: string]: number }> {
    try {
      if (Object.keys(this.priceCache).length === 0) {
        const cached = await AsyncStorage.getItem(this.cacheKey);
        if (cached) {
          this.priceCache = JSON.parse(cached);
        }
      }

      const prices: { [symbol: string]: number } = {};
      Object.entries(this.priceCache).forEach(([symbol, data]) => {
        const isExpired = Date.now() - data.timestamp > 60 * 60 * 1000;
        if (!isExpired) {
          prices[symbol] = data.price;
        }
      });

      return prices;
    } catch (error) {
      console.error('❌ PriceCache: Failed to get all cached prices:', error);
      return {};
    }
  }

  // Clear expired prices
  async clearExpiredPrices(): Promise<void> {
    try {
      const now = Date.now();
      const expiredSymbols: string[] = [];

      Object.entries(this.priceCache).forEach(([symbol, data]) => {
        if (now - data.timestamp > 60 * 60 * 1000) {
          expiredSymbols.push(symbol);
        }
      });

      expiredSymbols.forEach(symbol => {
        delete this.priceCache[symbol];
      });

      if (expiredSymbols.length > 0) {
        await AsyncStorage.setItem(this.cacheKey, JSON.stringify(this.priceCache));
        console.log(`🧹 PriceCache: Cleared ${expiredSymbols.length} expired prices`);
      }
    } catch (error) {
      console.error('❌ PriceCache: Failed to clear expired prices:', error);
    }
  }
}

export const priceCacheService = PriceCacheService.getInstance();
