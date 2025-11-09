# SearchScreen Trending & Movers Implementation

## Overview

The Search experience now pulls live trending movers straight from CoinGecko, normalizes the payload, and enriches it with fresh market quotes so both the discovery preview card and the dedicated **Trending Tokens** screen render real prices and daily change percentages.

## Data Flow

1. **Raw API fetch**  
   - `priceService.fetchTrendingTokens()` calls CoinGecko’s `/search/trending` endpoint (already behind the shared rate limiter).  
   - The service still returns `coins` in their native shape, which can differ across assets.

2. **Normalization**  
   - `mapTrendingResponse()` (in `src/utils/trending.ts`) flattens each entry into a strict `NormalizedTrendingToken` object.  
   - It safeguards missing IDs/symbols, parses numbers coming back as strings, and supplies image/label fallbacks.

3. **Market price enrichment**  
   - When we have stable IDs, the UI calls `priceService.fetchMarketDataByIds()` with the normalized list.  
   - This hits CoinGecko’s `/coins/markets` endpoint (via the same rate-limited request helper) so we get canonical `current_price`, `market_cap_rank`, and `price_change_percentage_24h`.

4. **UI presentation**  
   - `SearchScreen` keeps the first five movers inside the discovery card, while `TrendingTokensScreen` renders the full list (via `FlatList`).  
   - Currency output follows the project preference: two decimals with comma separators, `M` suffix for values ≥ $1M, and graceful fallbacks to `$0.00`.

## Key Modules

| File | Responsibility |
| --- | --- |
| `src/utils/trending.ts` | Normalizes CoinGecko payloads, provides fallback datasets, merges enriched market data. |
| `src/services/api/priceService.ts` | Adds `fetchMarketDataByIds()` to hydrate movers with live quotes while respecting rate limits. |
| `src/screens/SearchScreen.tsx` | Drives the preview card, auto-refresh cadence, and navigation for “View detailed list”. |
| `src/screens/TrendingTokensScreen.tsx` | Full movers list with refresh control and detail tap-through. |

## Refresh Strategy

- **Initial load & 30s interval**: `SearchScreen` fetches movers on mount and at a 30‑second cadence so the preview stays fresh.  
- **Manual refresh**: Both the preview card and the dedicated screen expose a refresh button that re-runs the pipeline.  
- **Fallbacks**: Whenever CoinGecko is unavailable or returns an empty array, the UI swaps to curated fallback movers to keep the glass cards populated.

## Formatting Rules

- Currency output uses two decimals and adds an `M` suffix for values ≥ $1,000,000.  
- Sub-dollar values render four decimals to retain meaningful precision while still using comma separators.  
- Daily change percentages show two decimals with green (`#22C55E`) for gains and red (`#EF4444`) for losses; undefined changes degrade to the neutral slate gray palette.

## Testing Checklist

- `node tests/run-all-tests.js` (integration suite) – validates that token pricing, fallbacks, and developer wallet flows still pass after the movers refactor.  
- Manual sanity: ensure “View detailed list” navigates to `TrendingTokensScreen`, prices populate, and refresh interactions operate without console errors.

## Future Enhancements

- Add sparkline micro charts using the normalized IDs.  
- Cache mover snapshots (React Query) to de-duplicate requests across tabs.  
- Include equity and ETF movers once the hybrid bridge service is public.


