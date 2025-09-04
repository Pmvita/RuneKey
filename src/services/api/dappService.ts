import { ApiResponse } from '../../types';

export interface DApp {
  id: string;
  name: string;
  description: string;
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Social' | 'Tools';
  icon: string;
  url: string;
  networks: string[];
  rating: number;
  users: number;
  volume_24h: number;
  trending: boolean;
  featured: boolean;
}

class DAppService {
  private dappsData: DApp[] = [];

  constructor() {
    this.loadDAppsData();
  }

  private async loadDAppsData() {
    try {
      // In a real app, this would be an API call
      // For now, we'll use the mock data
      const mockDApps = [
        {
          "id": "uniswap",
          "name": "Uniswap",
          "description": "Decentralized exchange for trading ERC-20 tokens",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png?1600306604",
          "url": "https://app.uniswap.org",
          "networks": ["ethereum", "polygon", "arbitrum", "optimism"],
          "rating": 4.8,
          "users": 2500000,
          "volume_24h": 150000000,
          "trending": true,
          "featured": true
        },
        {
          "id": "opensea",
          "name": "OpenSea",
          "description": "The world's largest NFT marketplace",
          "category": "NFT",
          "icon": "https://assets.coingecko.com/coins/images/26328/large/opensea.png?1663834188",
          "url": "https://opensea.io",
          "networks": ["ethereum", "polygon", "solana"],
          "rating": 4.6,
          "users": 1800000,
          "volume_24h": 45000000,
          "trending": true,
          "featured": true
        },
        {
          "id": "aave",
          "name": "Aave",
          "description": "Decentralized lending and borrowing protocol",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/12645/large/AAVE.png?1601374110",
          "url": "https://app.aave.com",
          "networks": ["ethereum", "polygon", "avalanche"],
          "rating": 4.7,
          "users": 850000,
          "volume_24h": 85000000,
          "trending": false,
          "featured": true
        },
        {
          "id": "compound",
          "name": "Compound",
          "description": "Algorithmic, autonomous interest rate protocol",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/10775/large/Compound.png?1591942618",
          "url": "https://app.compound.finance",
          "networks": ["ethereum"],
          "rating": 4.5,
          "users": 650000,
          "volume_24h": 35000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "pancakeswap",
          "name": "PancakeSwap",
          "description": "Decentralized exchange on BNB Smart Chain",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_%281%29.png?1629359065",
          "url": "https://pancakeswap.finance",
          "networks": ["bsc"],
          "rating": 4.4,
          "users": 1200000,
          "volume_24h": 95000000,
          "trending": false,
          "featured": true
        },
        {
          "id": "raydium",
          "name": "Raydium",
          "description": "Automated market maker on Solana",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/13902/large/PSigc4ie_400x400.jpg?1612802559",
          "url": "https://raydium.io",
          "networks": ["solana"],
          "rating": 4.3,
          "users": 450000,
          "volume_24h": 25000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "curve",
          "name": "Curve Finance",
          "description": "Decentralized exchange for stablecoins",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/12124/large/Curve.png?1597369484",
          "url": "https://curve.fi",
          "networks": ["ethereum", "polygon", "avalanche"],
          "rating": 4.6,
          "users": 750000,
          "volume_24h": 120000000,
          "trending": false,
          "featured": true
        },
        {
          "id": "makerdao",
          "name": "MakerDAO",
          "description": "Decentralized autonomous organization",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png?1625196357",
          "url": "https://oasis.app",
          "networks": ["ethereum"],
          "rating": 4.7,
          "users": 350000,
          "volume_24h": 55000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "synthetix",
          "name": "Synthetix",
          "description": "Decentralized synthetic asset platform",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/3406/large/SNX.png?1598631139",
          "url": "https://app.synthetix.io",
          "networks": ["ethereum", "optimism"],
          "rating": 4.2,
          "users": 280000,
          "volume_24h": 18000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "balancer",
          "name": "Balancer",
          "description": "Automated portfolio manager and trading platform",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/11683/large/Balancer.png?1592792958",
          "url": "https://app.balancer.fi",
          "networks": ["ethereum", "polygon", "arbitrum"],
          "rating": 4.4,
          "users": 420000,
          "volume_24h": 28000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "sushiswap",
          "name": "SushiSwap",
          "description": "Decentralized exchange with yield farming",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png?1606986688",
          "url": "https://app.sushi.com",
          "networks": ["ethereum", "polygon", "bsc", "avalanche"],
          "rating": 4.3,
          "users": 680000,
          "volume_24h": 42000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "yearn",
          "name": "Yearn Finance",
          "description": "DeFi yield aggregator",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png?1598325000",
          "url": "https://yearn.fi",
          "networks": ["ethereum"],
          "rating": 4.5,
          "users": 320000,
          "volume_24h": 15000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "dydx",
          "name": "dYdX",
          "description": "Decentralized derivatives exchange",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/17500/large/dydx.png?1628755200",
          "url": "https://dydx.exchange",
          "networks": ["ethereum"],
          "rating": 4.1,
          "users": 180000,
          "volume_24h": 85000000,
          "trending": false,
          "featured": false
        },
        {
          "id": "1inch",
          "name": "1inch",
          "description": "DEX aggregator with best prices",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/13469/large/1inch-token.png?1608803028",
          "url": "https://1inch.io",
          "networks": ["ethereum", "polygon", "bsc", "avalanche"],
          "rating": 4.6,
          "users": 950000,
          "volume_24h": 75000000,
          "trending": false,
          "featured": true
        },
        {
          "id": "paraswap",
          "name": "ParaSwap",
          "description": "DEX aggregator for best token prices",
          "category": "DeFi",
          "icon": "https://assets.coingecko.com/coins/images/20403/large/eprjG82.png?1636979120",
          "url": "https://paraswap.io",
          "networks": ["ethereum", "polygon", "bsc", "avalanche"],
          "rating": 4.4,
          "users": 520000,
          "volume_24h": 38000000,
          "trending": false,
          "featured": false
        }
      ];

      this.dappsData = mockDApps as DApp[];
    } catch (error) {
      console.error('Failed to load DApps data:', error);
      this.dappsData = [];
    }
  }

  /**
   * Fetch all DApps
   */
  async fetchDApps(): Promise<ApiResponse<DApp[]>> {
    try {
      await this.loadDAppsData();
      return {
        data: this.dappsData,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to fetch DApps:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch DApps'
      };
    }
  }

  /**
   * Fetch trending DApps
   */
  async fetchTrendingDApps(): Promise<ApiResponse<DApp[]>> {
    try {
      await this.loadDAppsData();
      const trendingDApps = this.dappsData.filter(dapp => dapp.trending);
      return {
        data: trendingDApps,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to fetch trending DApps:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch trending DApps'
      };
    }
  }

  /**
   * Fetch featured DApps
   */
  async fetchFeaturedDApps(): Promise<ApiResponse<DApp[]>> {
    try {
      await this.loadDAppsData();
      const featuredDApps = this.dappsData.filter(dapp => dapp.featured);
      return {
        data: featuredDApps,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to fetch featured DApps:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch featured DApps'
      };
    }
  }

  /**
   * Search DApps by name or description
   */
  async searchDApps(query: string): Promise<ApiResponse<DApp[]>> {
    try {
      await this.loadDAppsData();
      const searchResults = this.dappsData.filter(dapp => 
        dapp.name.toLowerCase().includes(query.toLowerCase()) ||
        dapp.description.toLowerCase().includes(query.toLowerCase()) ||
        dapp.category.toLowerCase().includes(query.toLowerCase())
      );
      return {
        data: searchResults,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to search DApps:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to search DApps'
      };
    }
  }

  /**
   * Filter DApps by category
   */
  async filterDAppsByCategory(category: string): Promise<ApiResponse<DApp[]>> {
    try {
      await this.loadDAppsData();
      const filteredDApps = this.dappsData.filter(dapp => 
        dapp.category.toLowerCase() === category.toLowerCase()
      );
      return {
        data: filteredDApps,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to filter DApps by category:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to filter DApps by category'
      };
    }
  }

  /**
   * Filter DApps by network
   */
  async filterDAppsByNetwork(network: string): Promise<ApiResponse<DApp[]>> {
    try {
      await this.loadDAppsData();
      const filteredDApps = this.dappsData.filter(dapp => 
        dapp.networks.includes(network.toLowerCase())
      );
      return {
        data: filteredDApps,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to filter DApps by network:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to filter DApps by network'
      };
    }
  }

  /**
   * Get DApp by ID
   */
  async getDAppById(id: string): Promise<ApiResponse<DApp | null>> {
    try {
      await this.loadDAppsData();
      const dapp = this.dappsData.find(d => d.id === id);
      return {
        data: dapp || null,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to get DApp by ID:', error);
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to get DApp by ID'
      };
    }
  }

  /**
   * Get DApp categories
   */
  async getDAppCategories(): Promise<ApiResponse<string[]>> {
    try {
      await this.loadDAppsData();
      const categories = [...new Set(this.dappsData.map(dapp => dapp.category))];
      return {
        data: categories,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to get DApp categories:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to get DApp categories'
      };
    }
  }

  /**
   * Get DApp networks
   */
  async getDAppNetworks(): Promise<ApiResponse<string[]>> {
    try {
      await this.loadDAppsData();
      const networks = [...new Set(this.dappsData.flatMap(dapp => dapp.networks))];
      return {
        data: networks,
        success: true
      };
    } catch (error: any) {
      console.error('Failed to get DApp networks:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to get DApp networks'
      };
    }
  }
}

export const dappService = new DAppService();
