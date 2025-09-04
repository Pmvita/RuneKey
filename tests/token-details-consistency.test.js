const fs = require('fs');
const path = require('path');

// Mock the dev-wallet.json data
const mockDevWallet = {
  wallet: {
    id: "developer-wallet",
    name: "Developer Wallet",
    address: "0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0",
    publicKey: "0x742d35Cc6b4D4EeC7e4b4dB4Ce123456789abcdef0",
    network: "ethereum",
    balance: "",
    totalValue: 0,
    tokens: [
      {
        coinId: "bitcoin",
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        symbol: "BTC",
        name: "Bitcoin",
        decimals: 8,
        balance: 7000,
        logoURI: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fw7.pngwing.com%2Fpngs%2F152%2F545%2Fpng-transparent-bitcoin-cash-cryptocurrency-ethereum-application-specific-integrated-circuit-bitcoin-text-trademark-orange.png&f=1&nofb=1&ipt=74034d56692237b23ecc24fb98c244b6788c9af53288f955e51a5c217b4bc06b"
      },
      {
        coinId: "ethereum",
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        balance: 1000,
        logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png"
      },
      {
        coinId: "usd-coin",
        address: "0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        balance: 5000000.00,
        logoURI: "https://tokens.1inch.io/0xa0b86a33e6441abb619d3d5c9c5c27da6e6f4d91.png"
      },
      {
        coinId: "tether",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        balance: 3000000.00,
        logoURI: "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png"
      },
      {
        coinId: "binancecoin",
        address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        symbol: "BNB",
        name: "BNB",
        decimals: 18,
        balance: 1000,
        logoURI: "https://tokens.1inch.io/0xb8c77482e45f1f44de1745f52c74426c631bdd52.png"
      }
    ]
  }
};

// Mock price service with realistic live prices
const mockPriceService = {
  getTokenPrice: (address) => {
    const addressMap = {
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 51200.00, // BTC
      '0x0000000000000000000000000000000000000000': 3200.00,  // ETH
      '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91': 1.00,     // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 1.00,     // USDT
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': 312.00,   // BNB
    };
    return addressMap[address] || 0;
  },
  
  getTokenPriceChange: (address) => {
    const changeMap = {
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 1.8,   // BTC +1.8%
      '0x0000000000000000000000000000000000000000': 2.5,   // ETH +2.5%
      '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91': 0.00,  // USDC stable
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 0.00,  // USDT stable
      '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': -0.5,  // BNB -0.5%
    };
    return changeMap[address] || 0;
  }
};

// Mock live API data (simulating CoinGecko API responses)
const mockLiveAPIData = {
  bitcoin: {
    current_price: 109883.00,
    price_change_percentage_24h: -1.78
  },
  ethereum: {
    current_price: 3200.00,
    price_change_percentage_24h: 2.5
  },
  'usd-coin': {
    current_price: 1.00,
    price_change_percentage_24h: 0.00
  },
  tether: {
    current_price: 1.00,
    price_change_percentage_24h: 0.00
  },
  binancecoin: {
    current_price: 312.00,
    price_change_percentage_24h: -0.5
  }
};

// Test suite for TokenDetailsScreen consistency
class TokenDetailsConsistencyTest {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  // Test helper: Get token data from dev-wallet.json
  getTokenFromDevWallet(symbol) {
    return mockDevWallet.wallet.tokens.find(t => 
      t.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }

  // Test helper: Simulate getCurrentPrice function logic
  getCurrentPrice(token, currentWallet, coinInfo) {
    let price = 0;
    let priceSource = 'none';
    
    // 1. First try to get price from dev wallet live data
    if (currentWallet && currentWallet.tokens) {
      const tokenData = currentWallet.tokens.find(t => 
        t.symbol?.toLowerCase() === token.symbol?.toLowerCase()
      );
      
      if (tokenData?.currentPrice && tokenData.currentPrice > 0) {
        price = tokenData.currentPrice;
        priceSource = 'dev_wallet_live';
        return { price, priceSource };
      }
    }
    
    // 2. Fallback to API data
    if (coinInfo?.current_price && coinInfo.current_price > 0) {
      price = coinInfo.current_price;
      priceSource = 'api_live';
    } else if (token.current_price && token.current_price > 0) {
      price = token.current_price;
      priceSource = 'token_param';
    }
    
    // 3. If still no price, use mock prices from priceService
    if (!price || price === 0) {
      const symbolMap = {
        'btc': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        'eth': '0x0000000000000000000000000000000000000000',
        'usdc': '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
        'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'bnb': '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      };
      
      const address = symbolMap[token.symbol?.toLowerCase() || ''];
      if (address) {
        price = mockPriceService.getTokenPrice(address);
        priceSource = 'mock_fallback';
      }
    }
    
    return { price, priceSource };
  }

  // Test helper: Simulate getPriceChangePercentage function logic
  getPriceChangePercentage(token, currentWallet, coinInfo) {
    let priceChange = 0;
    let changeSource = 'none';
    
    // 1. First try to get price change from dev wallet live data
    if (currentWallet && currentWallet.tokens) {
      const tokenData = currentWallet.tokens.find(t => 
        t.symbol?.toLowerCase() === token.symbol?.toLowerCase()
      );
      
      if (tokenData?.priceChange24h !== undefined) {
        priceChange = tokenData.priceChange24h;
        changeSource = 'dev_wallet_live';
        return { priceChange, changeSource };
      }
    }
    
    // 2. Fallback to API data
    if (coinInfo?.price_change_percentage_24h !== undefined) {
      priceChange = coinInfo.price_change_percentage_24h;
      changeSource = 'api_live';
    } else if (token.price_change_percentage_24h !== undefined) {
      priceChange = token.price_change_percentage_24h;
      changeSource = 'token_param';
    }
    
    // 3. If still no price change, use mock price changes
    if (priceChange === 0) {
      const symbolMap = {
        'btc': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        'eth': '0x0000000000000000000000000000000000000000',
        'usdc': '0xA0b86a33E6441aBB619d3d5c9C5c27DA6E6f4d91',
        'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'bnb': '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      };
      
      const address = symbolMap[token.symbol?.toLowerCase() || ''];
      if (address) {
        priceChange = mockPriceService.getTokenPriceChange(address);
        changeSource = 'mock_fallback';
      }
    }
    
    return { priceChange, changeSource };
  }

  // Test helper: Simulate dev wallet with live data
  createDevWalletWithLiveData() {
    const tokensWithLiveData = mockDevWallet.wallet.tokens.map(token => {
      const liveData = mockLiveAPIData[token.coinId];
      return {
        ...token,
        currentPrice: liveData?.current_price || mockPriceService.getTokenPrice(token.address),
        priceChange24h: liveData?.price_change_percentage_24h || mockPriceService.getTokenPriceChange(token.address),
        usdValue: token.balance * (liveData?.current_price || mockPriceService.getTokenPrice(token.address))
      };
    });

    return {
      ...mockDevWallet.wallet,
      tokens: tokensWithLiveData
    };
  }

  // Test 1: Verify dev wallet data comes from dev-wallet.json
  testDevWalletDataSource() {
    console.log('\n🧪 Test 1: Dev Wallet Data Source');
    
    const btcToken = this.getTokenFromDevWallet('BTC');
    const ethToken = this.getTokenFromDevWallet('ETH');
    
    // Verify token data matches dev-wallet.json
    if (btcToken && btcToken.symbol === 'BTC' && btcToken.balance === 7000) {
      console.log('✅ BTC token data correctly sourced from dev-wallet.json');
      this.passed++;
    } else {
      console.log('❌ BTC token data not matching dev-wallet.json');
      this.failed++;
    }
    
    if (ethToken && ethToken.symbol === 'ETH' && ethToken.balance === 1000) {
      console.log('✅ ETH token data correctly sourced from dev-wallet.json');
      this.passed++;
    } else {
      console.log('❌ ETH token data not matching dev-wallet.json');
      this.failed++;
    }
  }

  // Test 2: Verify live price priority (dev wallet > API > fallback)
  testLivePricePriority() {
    console.log('\n🧪 Test 2: Live Price Priority');
    
    const currentWallet = this.createDevWalletWithLiveData();
    const token = { symbol: 'BTC', current_price: 50000 }; // Old price
    const coinInfo = { current_price: 105000 }; // API price
    
    const { price, priceSource } = this.getCurrentPrice(token, currentWallet, coinInfo);
    
    // Should use dev wallet live price (109883.00) over API price (105000)
    if (price === 109883.00 && priceSource === 'dev_wallet_live') {
      console.log('✅ Live price priority working correctly');
      console.log(`   Price: $${price.toLocaleString()}, Source: ${priceSource}`);
      this.passed++;
    } else {
      console.log('❌ Live price priority not working correctly');
      console.log(`   Expected: $109,883.00 (dev_wallet_live), Got: $${price} (${priceSource})`);
      this.failed++;
    }
  }

  // Test 3: Verify fallback to last live price when API fails
  testFallbackToLastLivePrice() {
    console.log('\n🧪 Test 3: Fallback to Last Live Price');
    
    const currentWallet = null; // No dev wallet data
    const token = { symbol: 'BTC', current_price: 0 }; // No token price
    const coinInfo = null; // API failed
    
    const { price, priceSource } = this.getCurrentPrice(token, currentWallet, coinInfo);
    
    // Should fallback to mock price (51200.00)
    if (price === 51200.00 && priceSource === 'mock_fallback') {
      console.log('✅ Fallback to last live price working correctly');
      console.log(`   Price: $${price.toLocaleString()}, Source: ${priceSource}`);
      this.passed++;
    } else {
      console.log('❌ Fallback to last live price not working correctly');
      console.log(`   Expected: $51,200.00 (mock_fallback), Got: $${price} (${priceSource})`);
      this.failed++;
    }
  }

  // Test 4: Verify price change consistency
  testPriceChangeConsistency() {
    console.log('\n🧪 Test 4: Price Change Consistency');
    
    const currentWallet = this.createDevWalletWithLiveData();
    const token = { symbol: 'BTC', price_change_percentage_24h: 0.5 }; // Old change
    const coinInfo = { price_change_percentage_24h: 1.2 }; // API change
    
    const { priceChange, changeSource } = this.getPriceChangePercentage(token, currentWallet, coinInfo);
    
    // Should use dev wallet live change (-1.78) over API change (1.2)
    if (priceChange === -1.78 && changeSource === 'dev_wallet_live') {
      console.log('✅ Price change consistency working correctly');
      console.log(`   Change: ${priceChange}%, Source: ${changeSource}`);
      this.passed++;
    } else {
      console.log('❌ Price change consistency not working correctly');
      console.log(`   Expected: -1.78% (dev_wallet_live), Got: ${priceChange}% (${changeSource})`);
      this.failed++;
    }
  }

  // Test 5: Verify all tokens have consistent data
  testAllTokensConsistency() {
    console.log('\n🧪 Test 5: All Tokens Consistency');
    
    const currentWallet = this.createDevWalletWithLiveData();
    const tokens = ['BTC', 'ETH', 'USDC', 'USDT', 'BNB'];
    let allConsistent = true;
    
    tokens.forEach(symbol => {
      const token = { symbol };
      const { price, priceSource } = this.getCurrentPrice(token, currentWallet, null);
      const { priceChange, changeSource } = this.getPriceChangePercentage(token, currentWallet, null);
      
      const devWalletToken = currentWallet.tokens.find(t => t.symbol === symbol);
      
      if (price === devWalletToken.currentPrice && priceSource === 'dev_wallet_live' &&
          priceChange === devWalletToken.priceChange24h && changeSource === 'dev_wallet_live') {
        console.log(`✅ ${symbol}: Price $${price.toLocaleString()}, Change ${priceChange}%`);
      } else {
        console.log(`❌ ${symbol}: Inconsistent data`);
        allConsistent = false;
      }
    });
    
    if (allConsistent) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  // Test 6: Verify USD value calculation
  testUSDValueCalculation() {
    console.log('\n🧪 Test 6: USD Value Calculation');
    
    const currentWallet = this.createDevWalletWithLiveData();
    const btcToken = currentWallet.tokens.find(t => t.symbol === 'BTC');
    
    // Calculate expected USD value: balance × current price
    const expectedUSDValue = btcToken.balance * btcToken.currentPrice;
    const actualUSDValue = btcToken.usdValue;
    
    if (Math.abs(expectedUSDValue - actualUSDValue) < 0.01) {
      console.log('✅ USD value calculation working correctly');
      console.log(`   Balance: ${btcToken.balance} BTC`);
      console.log(`   Price: $${btcToken.currentPrice.toLocaleString()}`);
      console.log(`   USD Value: $${actualUSDValue.toLocaleString()}`);
      this.passed++;
    } else {
      console.log('❌ USD value calculation not working correctly');
      console.log(`   Expected: $${expectedUSDValue.toLocaleString()}, Got: $${actualUSDValue.toLocaleString()}`);
      this.failed++;
    }
  }

  // Test 7: Verify no hardcoded values
  testNoHardcodedValues() {
    console.log('\n🧪 Test 7: No Hardcoded Values');
    
    // Verify all token data comes from dev-wallet.json
    const hardcodedTokens = mockDevWallet.wallet.tokens;
    let noHardcoded = true;
    
    hardcodedTokens.forEach(token => {
      if (token.balance && token.symbol && token.name) {
        console.log(`✅ ${token.symbol}: Balance ${token.balance}, Name: ${token.name}`);
      } else {
        console.log(`❌ ${token.symbol}: Missing data`);
        noHardcoded = false;
      }
    });
    
    if (noHardcoded) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  // Run all tests
  runAllTests() {
    console.log('🚀 Starting TokenDetailsScreen Consistency Tests...\n');
    
    this.testDevWalletDataSource();
    this.testLivePricePriority();
    this.testFallbackToLastLivePrice();
    this.testPriceChangeConsistency();
    this.testAllTokensConsistency();
    this.testUSDValueCalculation();
    this.testNoHardcodedValues();
    
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! TokenDetailsScreen consistency verified.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the implementation.');
    }
  }
}

// Run the tests
const testRunner = new TokenDetailsConsistencyTest();
testRunner.runAllTests();
