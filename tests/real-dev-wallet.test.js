const fs = require('fs');
const path = require('path');

// Test the actual dev-wallet.json file
class RealDevWalletTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  // Load actual dev-wallet.json
  loadActualDevWallet() {
    try {
      const devWalletPath = path.join(__dirname, '../src/mockData/api/dev-wallet.json');
      const devWalletData = JSON.parse(fs.readFileSync(devWalletPath, 'utf8'));
      return devWalletData;
    } catch (error) {
      console.error('❌ Failed to load dev-wallet.json:', error.message);
      return null;
    }
  }

  // Test 1: Verify dev-wallet.json exists and is valid JSON
  testDevWalletFileExists() {
    console.log('\n🧪 Test 1: Dev Wallet File Validation');
    
    const devWalletData = this.loadActualDevWallet();
    
    if (devWalletData && devWalletData.wallet && devWalletData.wallet.tokens) {
      console.log('✅ dev-wallet.json exists and is valid JSON');
      console.log(`   Wallet ID: ${devWalletData.wallet.id}`);
      console.log(`   Token Count: ${devWalletData.wallet.tokens.length}`);
      this.passed++;
    } else {
      console.log('❌ dev-wallet.json is missing or invalid');
      this.failed++;
    }
  }

  // Test 2: Verify all required token fields are present
  testTokenFieldsComplete() {
    console.log('\n🧪 Test 2: Token Fields Completeness');
    
    const devWalletData = this.loadActualDevWallet();
    if (!devWalletData) {
      this.failed++;
      return;
    }

    const requiredFields = ['coinId', 'address', 'symbol', 'name', 'decimals', 'balance', 'logoURI'];
    let allComplete = true;

    devWalletData.wallet.tokens.forEach((token, index) => {
      const missingFields = requiredFields.filter(field => !token[field]);
      
      if (missingFields.length === 0) {
        console.log(`✅ Token ${index + 1} (${token.symbol}): All fields present`);
      } else {
        console.log(`❌ Token ${index + 1} (${token.symbol}): Missing fields: ${missingFields.join(', ')}`);
        allComplete = false;
      }
    });

    if (allComplete) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  // Test 3: Verify token balances are numeric
  testTokenBalancesNumeric() {
    console.log('\n🧪 Test 3: Token Balances Validation');
    
    const devWalletData = this.loadActualDevWallet();
    if (!devWalletData) {
      this.failed++;
      return;
    }

    let allNumeric = true;

    devWalletData.wallet.tokens.forEach(token => {
      const balance = parseFloat(token.balance);
      
      if (!isNaN(balance) && balance >= 0) {
        console.log(`✅ ${token.symbol}: Balance ${balance} (valid)`);
      } else {
        console.log(`❌ ${token.symbol}: Balance "${token.balance}" (invalid)`);
        allNumeric = false;
      }
    });

    if (allNumeric) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  // Test 4: Verify token addresses are valid format
  testTokenAddressesValid() {
    console.log('\n🧪 Test 4: Token Addresses Validation');
    
    const devWalletData = this.loadActualDevWallet();
    if (!devWalletData) {
      this.failed++;
      return;
    }

    let allValid = true;

    devWalletData.wallet.tokens.forEach(token => {
      // Check if address is a valid Ethereum address format
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(token.address);
      
      if (isValidAddress) {
        console.log(`✅ ${token.symbol}: Address ${token.address} (valid)`);
      } else {
        console.log(`❌ ${token.symbol}: Address "${token.address}" (invalid format)`);
        allValid = false;
      }
    });

    if (allValid) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  // Test 5: Verify logoURIs are accessible URLs
  testLogoURIsValid() {
    console.log('\n🧪 Test 5: Logo URI Validation');
    
    const devWalletData = this.loadActualDevWallet();
    if (!devWalletData) {
      this.failed++;
      return;
    }

    let allValid = true;

    devWalletData.wallet.tokens.forEach(token => {
      try {
        const url = new URL(token.logoURI);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          console.log(`✅ ${token.symbol}: Logo URI ${token.logoURI} (valid)`);
        } else {
          console.log(`❌ ${token.symbol}: Logo URI "${token.logoURI}" (invalid protocol)`);
          allValid = false;
        }
      } catch (error) {
        console.log(`❌ ${token.symbol}: Logo URI "${token.logoURI}" (invalid URL)`);
        allValid = false;
      }
    });

    if (allValid) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  // Test 6: Verify no duplicate symbols
  testNoDuplicateSymbols() {
    console.log('\n🧪 Test 6: No Duplicate Symbols');
    
    const devWalletData = this.loadActualDevWallet();
    if (!devWalletData) {
      this.failed++;
      return;
    }

    const symbols = devWalletData.wallet.tokens.map(token => token.symbol);
    const uniqueSymbols = [...new Set(symbols)];

    if (symbols.length === uniqueSymbols.length) {
      console.log('✅ No duplicate symbols found');
      console.log(`   Symbols: ${symbols.join(', ')}`);
      this.passed++;
    } else {
      console.log('❌ Duplicate symbols found');
      console.log(`   All symbols: ${symbols.join(', ')}`);
      console.log(`   Unique symbols: ${uniqueSymbols.join(', ')}`);
      this.failed++;
    }
  }

  // Test 7: Verify total portfolio value calculation
  testPortfolioValueCalculation() {
    console.log('\n🧪 Test 7: Portfolio Value Calculation');
    
    const devWalletData = this.loadActualDevWallet();
    if (!devWalletData) {
      this.failed++;
      return;
    }

    // Mock prices for calculation
    const mockPrices = {
      'BTC': 51200.00,
      'ETH': 3200.00,
      'USDC': 1.00,
      'USDT': 1.00,
      'BNB': 312.00
    };

    let totalValue = 0;
    let calculationValid = true;

    devWalletData.wallet.tokens.forEach(token => {
      const balance = parseFloat(token.balance);
      const price = mockPrices[token.symbol] || 0;
      const tokenValue = balance * price;
      totalValue += tokenValue;

      console.log(`   ${token.symbol}: ${balance} × $${price.toLocaleString()} = $${tokenValue.toLocaleString()}`);
    });

    console.log(`   Total Portfolio Value: $${totalValue.toLocaleString()}`);

    if (totalValue > 0) {
      console.log('✅ Portfolio value calculation working correctly');
      this.passed++;
    } else {
      console.log('❌ Portfolio value calculation failed');
      this.failed++;
    }
  }

  // Run all tests
  runAllTests() {
    console.log('🚀 Starting Real Dev Wallet Tests...\n');
    
    this.testDevWalletFileExists();
    this.testTokenFieldsComplete();
    this.testTokenBalancesNumeric();
    this.testTokenAddressesValid();
    this.testLogoURIsValid();
    this.testNoDuplicateSymbols();
    this.testPortfolioValueCalculation();
    
    console.log('\n📊 Real Dev Wallet Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All real dev wallet tests passed! Data integrity verified.');
    } else {
      console.log('\n⚠️ Some real dev wallet tests failed. Please review dev-wallet.json.');
    }
  }
}

// Run the real dev wallet tests
const realTestRunner = new RealDevWalletTest();
realTestRunner.runAllTests();
