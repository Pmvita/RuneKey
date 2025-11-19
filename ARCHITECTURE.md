# RuneKey Architecture

This document provides a detailed overview of the RuneKey application architecture, explaining the design decisions, patterns, and structure used throughout the codebase.

## 🏗️ High-Level Architecture

RuneKey follows a layered architecture pattern with clear separation of concerns:

```mermaid
flowchart TB
    subgraph UI["🖼️ UI Layer"]
        SCREENS["📱 Screens"]
        COMPONENTS["🧩 Components"]
    end

    subgraph HOOKS["🪝 Hook Layer"]
        CUSTOM_HOOKS["⚛️ Custom React Hooks"]
    end

    subgraph STATE["🗃️ State Layer"]
        ZUSTAND["📦 Zustand Stores"]
    end

    subgraph SERVICES["🔧 Service Layer"]
        API_SERVICES["🌐 API Services"]
        BLOCKCHAIN["⛓️ Blockchain Services"]
    end

    subgraph DATA["💾 Data Layer"]
        SECURE_STORAGE["🔐 Secure Storage"]
        CONSTANTS["📋 Constants"]
    end

    UI --> HOOKS
    HOOKS --> STATE
    STATE --> SERVICES
    SERVICES --> DATA

    style UI fill:#9D4EDD,stroke:#7B2CBF,color:#fff
    style HOOKS fill:#4361EE,stroke:#3A0CA3,color:#fff
    style STATE fill:#F72585,stroke:#B5179E,color:#fff
    style SERVICES fill:#06FFA5,stroke:#06D6A0,color:#000
    style DATA fill:#FFBE0B,stroke:#FB8500,color:#000
```

## 📂 Folder Structure

```
RuneKey/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components (Button, Input, Card)
│   │   ├── wallet/         # Wallet-specific components
│   │   ├── swap/           # Swap interface components
│   │   ├── token/          # Token display components
│   │   └── qr/             # QR code functionality
│   │
│   ├── screens/            # Main application screens
│   │   ├── HomeScreen.tsx              # Crypto portfolio overview
│   │   ├── SwapScreen.tsx              # Token swapping interface
│   │   ├── SearchScreen.tsx            # Discovery surface
│   │   ├── InvestingScreen.tsx         # Traditional markets dashboard
│   │   ├── InvestmentDetailsScreen.tsx # Live market detail view
│   │   └── SettingsScreen.tsx          # App settings
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── wallet/         # Wallet management hooks
│   │   ├── token/          # Token and price hooks
│   │   └── swap/           # Swap functionality hooks
│   │
│   ├── services/           # External service integrations
│   │   ├── api/            # API service classes
│   │   │   ├── priceService.ts        # CoinGecko integration
│   │   │   ├── investingService.ts    # Stooq & Yahoo Finance integration
│   │   │   └── swapService.ts         # Swap quotes & execution
│   │   └── blockchain/     # Blockchain interaction
│   │       ├── walletService.ts  # Wallet operations
│   │       ├── solanaService.ts  # Solana-specific
│   │       └── evmService.ts     # EVM-specific
│   │
│   ├── stores/             # Zustand state stores
│   │   ├── wallet/         # Wallet state management
│   │   └── app/            # Application-wide state
│   │
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Configuration and constants
│   └── utils/              # Utility functions
│
├── assets/                 # Static assets
├── App.tsx                 # Main application component
└── Configuration files...
```

## 🔧 Core Technologies

### Frontend Framework
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and toolchain
- **TypeScript**: Type safety and better developer experience

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state management and caching

### Styling
- **TailwindCSS**: Utility-first CSS framework
- **NativeWind**: TailwindCSS for React Native

### Navigation
- **React Navigation**: Navigation library
- **Bottom Tab Navigator**: Main app navigation
- **Stack Navigator**: Screen transitions

### Blockchain Integration
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript interface for Ethereum
- **Solana Web3.js**: Solana blockchain interaction
- **Jupiter API**: Solana DEX aggregation
- **0x Protocol**: EVM DEX aggregation

### Market Data Providers
- **CoinGecko**: Primary source for cryptocurrency pricing and market metrics
- **Stooq**: Live equity, ETF, forex, and commodity quotes for the investing module
- **Yahoo Finance**: Historical candles powering investing charts
- **AllOrigins Proxy**: Browser-safe CORS passthrough for Stooq/Yahoo requests in web builds
- **USDT Reserve Accounting**: Active capital for traditional markets is calculated from the wallet’s USDT holdings

### Security
- **Expo SecureStore**: Encrypted local storage
- **Input validation**: Comprehensive validation utilities

## 🏛️ Architectural Patterns

### Component Architecture

#### Atomic Design Principles

```mermaid
graph TD
    subgraph ATOMS["⚛️ Atoms - Basic Elements"]
        A1["Button"]
        A2["Input"]
        A3["Card"]
        A4["Text"]
    end

    subgraph MOLECULES["🔬 Molecules - Simple Combinations"]
        M1["TokenListItem"]
        M2["SwapForm"]
        M3["PriceDisplay"]
    end

    subgraph ORGANISMS["🧬 Organisms - Complex Combinations"]
        O1["TokenList"]
        O2["SwapInterface"]
        O3["WalletOverview"]
    end

    subgraph TEMPLATES["📄 Templates - Page Layouts"]
        T1["ScreenLayout"]
        T2["ModalLayout"]
    end

    subgraph PAGES["📱 Pages - Actual Screens"]
        P1["HomeScreen"]
        P2["SwapScreen"]
        P3["WalletScreen"]
    end

    A1 --> M1
    A2 --> M1
    A3 --> M2
    A4 --> M3

    M1 --> O1
    M2 --> O2
    M3 --> O3

    O1 --> T1
    O2 --> T1
    O3 --> T1
    O2 --> T2

    T1 --> P1
    T1 --> P2
    T1 --> P3
    T2 --> P2

    style ATOMS fill:#E8F5E9,stroke:#4CAF50,color:#000
    style MOLECULES fill:#E3F2FD,stroke:#2196F3,color:#000
    style ORGANISMS fill:#FFF3E0,stroke:#FF9800,color:#000
    style TEMPLATES fill:#F3E5F5,stroke:#9C27B0,color:#000
    style PAGES fill:#FFEBEE,stroke:#F44336,color:#000
```

#### Component Structure
```typescript
interface ComponentProps {
  // Required props
  title: string;
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  // Event handlers
  onPress?: () => void;
  // Style customization
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({
  title,
  variant = 'primary',
  onPress,
  className = '',
}) => {
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom hooks
  const { data, error } = useCustomHook();
  
  // Event handlers
  const handlePress = useCallback(() => {
    // Handle logic
    onPress?.();
  }, [onPress]);
  
  // Render
  return (
    <StyledView className={`base-classes ${className}`}>
      {/* Component content */}
    </StyledView>
  );
};
```

### State Management Architecture

#### Zustand Store Pattern
```typescript
interface StoreState {
  // State properties
  data: DataType[];
  isLoading: boolean;
  error: string | null;
}

interface StoreActions {
  // Action methods
  fetchData: () => Promise<void>;
  updateData: (data: DataType) => void;
  reset: () => void;
}

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      // Initial state
      data: [],
      isLoading: false,
      error: null,
      
      // Actions
      fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiService.fetchData();
          set({ data, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },
      
      updateData: (newData) => {
        set((state) => ({
          data: [...state.data, newData],
        }));
      },
      
      reset: () => {
        set({ data: [], isLoading: false, error: null });
      },
    }),
    {
      name: 'store-name',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

### Service Layer Architecture

#### Service Class Pattern
```typescript
class ApiService {
  private baseURL: string;
  
  constructor() {
    this.baseURL = API_ENDPOINTS.BASE;
  }
  
  async fetchData<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.message,
      };
    }
  }
}

export const apiService = new ApiService();
```

### Custom Hook Architecture

#### Hook Composition Pattern
```typescript
export const useFeature = () => {
  // Store access
  const { data, actions } = useStore();
  
  // Local state
  const [localState, setLocalState] = useState();
  
  // Other hooks
  const { relatedData } = useRelatedHook();
  
  // Computed values
  const computedValue = useMemo(() => {
    return data.map(/* transformation */);
  }, [data]);
  
  // Event handlers
  const handleAction = useCallback(async (params) => {
    try {
      await actions.performAction(params);
    } catch (error) {
      // Handle error
    }
  }, [actions]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [/* dependencies */]);
  
  // Return hook interface
  return {
    // State
    data,
    localState,
    isLoading: actions.isLoading,
    
    // Computed
    computedValue,
    
    // Actions
    handleAction,
    
    // Utilities
    refresh: actions.fetchData,
  };
};
```

## 🔐 Security Architecture

### Private Key Management

```mermaid
flowchart LR
    A["👤 User Input<br/>(Private Key)"] --> B["✅ Validation<br/>& Sanitization"]
    B --> C["🔐 Expo SecureStore<br/>(Encrypted)"]
    C --> D["⚙️ Wallet Operations<br/>(Signing, etc.)"]

    style A fill:#FFE0B2,stroke:#FF9800,color:#000
    style B fill:#BBDEFB,stroke:#2196F3,color:#000
    style C fill:#C8E6C9,stroke:#4CAF50,color:#000
    style D fill:#F8BBD0,stroke:#E91E63,color:#000
```

### Data Flow Security
1. **Input Validation**: All user inputs validated
2. **Secure Storage**: Private keys encrypted at rest
3. **No Network Transmission**: Private keys never sent to servers
4. **Error Boundaries**: Graceful error handling
5. **Type Safety**: TypeScript prevents runtime errors

## 🌐 Multi-Chain Architecture

### Network Abstraction
```typescript
interface NetworkHandler {
  generateWallet(): Promise<Wallet>;
  importWallet(key: string): Promise<Wallet>;
  getBalance(address: string): Promise<string>;
  sendTransaction(params: TxParams): Promise<string>;
}

class SolanaHandler implements NetworkHandler {
  // Solana-specific implementation
}

class EVMHandler implements NetworkHandler {
  // EVM-specific implementation
}

class NetworkManager {
  private handlers: Map<SupportedNetwork, NetworkHandler>;
  
  getHandler(network: SupportedNetwork): NetworkHandler {
    return this.handlers.get(network);
  }
}
```

### Swap Integration

```mermaid
flowchart TD
    A["👤 User Input<br/>(Token A → B)"] --> B["💰 Quote Service<br/>(Jupiter/0x)"]
    B --> C["🔄 DEX Router<br/>(Best Route)"]
    
    A --> D["💵 Fee Calculation<br/>(0.5-1%)"]
    B --> E["📊 Price Impact<br/>Validation"]
    C --> F["⚡ Transaction<br/>Execution"]

    D --> G["✅ User Confirmation"]
    E --> G
    F --> G

    style A fill:#FFE0B2,stroke:#FF9800,color:#000
    style B fill:#BBDEFB,stroke:#2196F3,color:#000
    style C fill:#C8E6C9,stroke:#4CAF50,color:#000
    style D fill:#F8BBD0,stroke:#E91E63,color:#000
    style E fill:#FFF9C4,stroke:#FBC02D,color:#000
    style F fill:#E1BEE7,stroke:#9C27B0,color:#000
    style G fill:#A5D6A7,stroke:#388E3C,color:#000
```

## 📊 Data Flow Architecture

### Market Data Flow

```mermaid
flowchart TD
    subgraph CRYPTO["💰 Crypto Tokens"]
        CG["📊 CoinGecko API"]
        PS["🔧 priceService"]
        PStore["📦 usePriceStore"]
        UI1["🖼️ Token & Portfolio UI"]
        
        CG --> PS
        PS --> PStore
        PStore --> UI1
        
        PS --> ERR["⚠️ Error Handling"]
        PStore --> REFRESH["🔄 Interval Refresh"]
        UI1 --> ANIM1["✨ Animated Displays"]
        
        PS --> CACHE1["💾 Local Cache<br/>(rate-limit friendly)"]
    end

    subgraph TRAD["📈 Traditional Markets"]
        STOOQ["📊 Stooq API"]
        PROXY["🌐 AllOrigins Proxy<br/>(web)"]
        INV_SVC["🔧 investingService"]
        INV_STATE["📦 Investing State"]
        UI2["🖼️ Home/Investing Screens"]
        
        STOOQ --> INV_SVC
        PROXY --> STOOQ
        INV_SVC --> INV_STATE
        INV_STATE --> UI2
        
        INV_STATE --> RECON["🔀 Quote Reconciliation"]
        UI2 --> ANIM2["✨ Animated Numbers<br/>& Charts"]
        
        YAHOO["📈 Yahoo Finance"]
        YAHOO --> INV_SVC
        INV_SVC --> CHART_CACHE["📊 Chart Data Cache"]
        CHART_CACHE --> SPARK["📉 SparklineChart"]
    end

    style CRYPTO fill:#E8F5E9,stroke:#4CAF50,color:#000
    style TRAD fill:#E3F2FD,stroke:#2196F3,color:#000
```

### Transaction Flow

```mermaid
flowchart LR
    A["👤 User Action"] --> B["✅ Validation"]
    B --> C["💰 Quote"]
    C --> D["✓ Confirmation"]
    D --> E["⚡ Execution"]

    A --> A1["📝 Form Input"]
    B --> B1["❌ Error Checking"]
    C --> C1["📊 Price Impact"]
    D --> D1["👆 User Approval"]
    E --> E1["⛓️ Blockchain<br/>Submission"]

    C1 --> WARN["⚠️ Warning Display"]
    E1 --> STATUS["📊 Status Tracking"]

    style A fill:#FFE0B2,stroke:#FF9800,color:#000
    style B fill:#BBDEFB,stroke:#2196F3,color:#000
    style C fill:#C8E6C9,stroke:#4CAF50,color:#000
    style D fill:#F8BBD0,stroke:#E91E63,color:#000
    style E fill:#E1BEE7,stroke:#9C27B0,color:#000
```

### Investing Module Overview
- **Data Fetching**: `investingService` orchestrates Stooq spot quotes and Yahoo Finance chart pulls. On web, requests are routed through the AllOrigins proxy to bypass CORS restrictions.
- **State Management**: Quotes hydrate lightweight in-memory state that powers both the Home investing tile and the full Investing screens.
- **Fallback Strategy**: Mock data keeps UI responsive if upstream providers rate limit or return incomplete payloads; previous successful quotes are retained until fresh data arrives.
- **Animations**: Price deltas flow into animated number and chart components for smooth transitions during refresh cycles.
- **Funding Model**: The investing totals treat the wallet’s USDT balance as deployable capital for synthetic allocations into equities/ETFs/forex/commodities.

## 🎨 Theming Architecture

### Theme System
```typescript
type Theme = 'light' | 'dark' | 'system';

const ThemeProvider = {
  light: {
    background: '#FFFFFF',
    text: '#111827',
    primary: '#3B82F6',
    // ... more colors
  },
  dark: {
    background: '#111827',
    text: '#F9FAFB',
    primary: '#3B82F6',
    // ... more colors
  }
};

// Automatic theme switching
const useTheme = () => {
  const { theme } = useAppStore();
  const systemTheme = useColorScheme();
  
  return theme === 'system' ? systemTheme : theme;
};
```

## 🚀 Performance Architecture

### Optimization Strategies
1. **Code Splitting**: Feature-based code splitting
2. **Lazy Loading**: Components loaded on demand
3. **Memoization**: React.memo and useMemo for expensive operations
4. **Virtualization**: Large lists with FlatList
5. **Image Optimization**: Cached token images
6. **API Caching**: React Query for server state caching

### Bundle Optimization
```
Bundle Structure:
├── Core App (~2MB)
│   ├── Navigation
│   ├── Basic Components
│   └── Essential Hooks
├── Blockchain (~1.5MB)
│   ├── Solana SDK
│   ├── EVM Libraries
│   └── Crypto Utilities
└── Features (~1MB)
    ├── Swap Interface
    ├── Price Services
    └── Advanced Components
```

## 🧪 Testing Architecture

### Testing Strategy
```
Testing Pyramid:
           ┌─────────────────┐
           │   E2E Tests     │  ← Critical user flows
           │   (Few)         │
           ├─────────────────┤
           │ Integration     │  ← Component interactions
           │ Tests (Some)    │
           ├─────────────────┤
           │  Unit Tests     │  ← Individual functions
           │   (Many)        │
           └─────────────────┘
```

### Test Categories
1. **Unit Tests**: Utilities, hooks, services
2. **Component Tests**: UI component behavior
3. **Integration Tests**: Feature workflows
4. **E2E Tests**: Complete user journeys

## 🔄 Future Architecture Considerations

### Scalability Enhancements
1. **Micro-frontends**: Feature-based app splitting
2. **State Normalization**: Complex data relationships
3. **Background Services**: Price updates, notifications
4. **Offline Support**: Local caching and sync
5. **Plugin Architecture**: Third-party integrations

### Technical Debt Management
1. **Regular Refactoring**: Quarterly architecture reviews
2. **Dependency Updates**: Monthly security updates
3. **Performance Monitoring**: Bundle size tracking
4. **Code Quality**: Automated quality gates

## 📈 Monitoring & Analytics

### Error Tracking
- Crash reporting with Sentry
- Performance monitoring
- User analytics (privacy-focused)
- Feature usage tracking

### Development Tools
- ESLint for code quality
- TypeScript for type safety
- React Developer Tools
- Flipper for debugging

---

This architecture provides a solid foundation for a production-ready cryptocurrency wallet while maintaining flexibility for future enhancements and scaling.