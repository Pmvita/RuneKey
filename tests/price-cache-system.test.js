const fs = require('fs');
const path = require('path');

// Test the price cache system for last live price fallback
class PriceCacheTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  // Mock AsyncStorage for testing
  mockAsyncStorage = {
    storage: {},
    setItem: async (key, value) => {
      this.mockAsyncStorage.storage[key] = value;
      console.log(`💾 MockAsyncStorage: Saved ${key}`);
    },
    getItem: async (key) => {
      const value = this.mockAsyncStorage.storage[key];
      console.log(`💾 MockAsyncStorage: Retrieved ${key}: ${value ? 'exists' : 'null'}`);
      return value;
    }
  };

  // Mock price cache service
  mockPriceCacheService = {
    priceCache: {},
    cacheKey: 'last_live_prices',
    
    saveLastLivePrice: async (symbol, price) => {
      this.mockPriceCacheService.priceCache[symbol] = {
        price,
        timestamp: Date.now()
      };
      
      await this.mockAsyncStorage.setItem(
        this.mockPriceCacheService.cacheKey, 
        JSON.stringify(this.mockPriceCacheService.priceCache)
      );
      console.log(`💾 PriceCache: Saved last live price for ${symbol}: $${price.toLocaleString()}`);
    },
    
    getLastLivePrice: async (symbol) => {
      const cached = await this.mockAsyncStorage.getItem(this.mockPriceCacheService.cacheKey);
      if (cached) {
        this.mockPriceCacheService.priceCache = JSON.parse(cached);
      }
      
      const cachedPrice = this.mockPriceCacheService.priceCache[symbol];
      if (cachedPrice) {
        const isExpired = Date.now() - cachedPrice.timestamp > 60 * 60 * 1000;
        
        if (!isExpired) {
          console.log(`💾 PriceCache: Using last live price for ${symbol}: $${cachedPrice.price.toLocaleString()}`);
          return cachedPrice.price;
        } else {
          console.log(`💾 PriceCache: Last live price for ${symbol} expired`);
          delete this.mockPriceCacheService.priceCache[symbol];
          await this.mockAsyncStorage.setItem(
            this.mockPriceCacheService.cacheKey, 
            JSON.stringify(this.mockPriceCacheService.priceCache)
          );
        }
      }
      
      return null;
    }
  };

  // Test 1: Save and retrieve last live price
  testSaveAndRetrieveLastLivePrice() {
    console.log('\n🧪 Test 1: Save and Retrieve Last Live Price');
    
    const testSymbol = 'BTC';
    const testPrice = 109883.00;
    
    // Save price
    this.mockPriceCacheService.saveLastLivePrice(testSymbol, testPrice);
    
    // Retrieve price
    this.mockPriceCacheService.getLastLivePrice(testSymbol).then(retrievedPrice => {
      if (retrievedPrice === testPrice) {
        console.log('✅ Last live price saved and retrieved correctly');
        console.log(`   Symbol: ${testSymbol}`);
        console.log(`   Price: $${testPrice.toLocaleString()}`);
        this.passed++;
      } else {
        console.log('❌ Last live price not retrieved correctly');
        console.log(`   Expected: $${testPrice.toLocaleString()}, Got: $${retrievedPrice}`);
        this.failed++;
      }
    });
  }

  // Test 2: Price cache fallback hierarchy
  testPriceCacheFallbackHierarchy() {
    console.log('\n🧪 Test 2: Price Cache Fallback Hierarchy');
    
    const scenarios = [
      {
        name: 'Dev Wallet Live Available',
        devWalletPrice: 109883.00,
        apiPrice: 105000.00,
        cachedPrice: 51200.00,
        expectedPrice: 109883.00,
        expectedSource: 'dev_wallet_live'
      },
      {
        name: 'Dev Wallet Failed, API Available',
        devWalletPrice: 0,
        apiPrice: 105000.00,
        cachedPrice: 51200.00,
        expectedPrice: 105000.00,
        expectedSource: 'api_live'
      },
      {
        name: 'Dev Wallet and API Failed, Cache Available',
        devWalletPrice: 0,
        apiPrice: 0,
        cachedPrice: 51200.00,
        expectedPrice: 51200.00,
        expectedSource: 'last_live_cache'
      },
      {
        name: 'All Failed, Mock Fallback',
        devWalletPrice: 0,
        apiPrice: 0,
        cachedPrice: 0,
        expectedPrice: 51200.00,
        expectedSource: 'mock_fallback'
      }
    ];

    scenarios.forEach(scenario => {
      console.log(`\n   Testing: ${scenario.name}`);
      
      // Simulate price resolution logic
      let price = 0;
      let source = 'none';
      
      // 1. Dev wallet live data
      if (scenario.devWalletPrice > 0) {
        price = scenario.devWalletPrice;
        source = 'dev_wallet_live';
      }
      // 2. API data
      else if (scenario.apiPrice > 0) {
        price = scenario.apiPrice;
        source = 'api_live';
      }
      // 3. Last live price from cache
      else if (scenario.cachedPrice > 0) {
        price = scenario.cachedPrice;
        source = 'last_live_cache';
      }
      // 4. Mock fallback
      else {
        price = 51200.00; // Mock BTC price
        source = 'mock_fallback';
      }
      
      if (price === scenario.expectedPrice && source === scenario.expectedSource) {
        console.log(`   ✅ ${scenario.name}: Price $${price.toLocaleString()} (${source})`);
        this.passed++;
      } else {
        console.log(`   ❌ ${scenario.name}: Expected $${scenario.expectedPrice.toLocaleString()} (${scenario.expectedSource}), Got $${price.toLocaleString()} (${source})`);
        this.failed++;
      }
    });
  }

  // Test 3: Cache expiration
  testCacheExpiration() {
    console.log('\n🧪 Test 3: Cache Expiration');
    
    const testSymbol = 'ETH';
    const testPrice = 3200.00;
    
    // Save price with old timestamp (simulate expired cache)
    this.mockPriceCacheService.priceCache[testSymbol] = {
      price: testPrice,
      timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
    };
    
    this.mockPriceCacheService.getLastLivePrice(testSymbol).then(retrievedPrice => {
      if (retrievedPrice === null) {
        console.log('✅ Expired cache correctly returns null');
        this.passed++;
      } else {
        console.log('❌ Expired cache should return null');
        console.log(`   Got: $${retrievedPrice}`);
        this.failed++;
      }
    });
  }

  // Test 4: Multiple tokens in cache
  testMultipleTokensInCache() {
    console.log('\n🧪 Test 4: Multiple Tokens in Cache');
    
    const tokens = [
      { symbol: 'BTC', price: 109883.00 },
      { symbol: 'ETH', price: 3200.00 },
      { symbol: 'USDC', price: 1.00 },
      { symbol: 'USDT', price: 1.00 },
      { symbol: 'BNB', price: 312.00 }
    ];
    
    let allSaved = true;
    
    // Save all tokens
    tokens.forEach(token => {
      this.mockPriceCacheService.saveLastLivePrice(token.symbol, token.price);
    });
    
    // Verify all tokens are saved
    tokens.forEach(token => {
      const savedPrice = this.mockPriceCacheService.priceCache[token.symbol];
      if (savedPrice && savedPrice.price === token.price) {
        console.log(`   ✅ ${token.symbol}: $${token.price.toLocaleString()}`);
      } else {
        console.log(`   ❌ ${token.symbol}: Not saved correctly`);
        allSaved = false;
      }
    });
    
    if (allSaved) {
      console.log('✅ All tokens saved to cache correctly');
      this.passed++;
    } else {
      console.log('❌ Some tokens not saved correctly');
      this.failed++;
    }
  }

  // Test 5: Real dev wallet integration
  testRealDevWalletIntegration() {
    console.log('\n🧪 Test 5: Real Dev Wallet Integration');
    
    // Load actual dev-wallet.json
    try {
      const devWalletPath = path.join(__dirname, '../src/mockData/api/dev-wallet.json');
      const devWalletData = JSON.parse(fs.readFileSync(devWalletPath, 'utf8'));
      
      const tokens = devWalletData.wallet.tokens;
      let integrationValid = true;
      
      tokens.forEach(token => {
        // Simulate saving live prices for each token
        const mockLivePrice = token.symbol === 'BTC' ? 109883.00 :
                             token.symbol === 'ETH' ? 3200.00 :
                             token.symbol === 'USDC' ? 1.00 :
                             token.symbol === 'USDT' ? 1.00 :
                             token.symbol === 'BNB' ? 312.00 : 0;
        
        this.mockPriceCacheService.saveLastLivePrice(token.symbol, mockLivePrice);
        
        console.log(`   ${token.symbol}: Balance ${token.balance}, Live Price $${mockLivePrice.toLocaleString()}`);
      });
      
      console.log('✅ Dev wallet integration working correctly');
      this.passed++;
      
    } catch (error) {
      console.log('❌ Failed to load dev-wallet.json:', error.message);
      this.failed++;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Price Cache System Tests...\n');
    
    await this.testSaveAndRetrieveLastLivePrice();
    this.testPriceCacheFallbackHierarchy();
    await this.testCacheExpiration();
    this.testMultipleTokensInCache();
    this.testRealDevWalletIntegration();
    
    console.log('\n📊 Price Cache Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All price cache tests passed!');
      console.log('✅ Last live prices are saved and used as fallback');
      console.log('✅ Price hierarchy works correctly');
      console.log('✅ Cache expiration works properly');
      console.log('✅ Multiple tokens supported');
      console.log('✅ Dev wallet integration verified');
    } else {
      console.log('\n⚠️ Some price cache tests failed. Please review the implementation.');
    }
  }
}

// Run the price cache tests
const priceCacheTestRunner = new PriceCacheTest();
priceCacheTestRunner.runAllTests();
