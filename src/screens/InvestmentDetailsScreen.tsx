import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  useWindowDimensions,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, InvestmentHolding, TechnicalIndicators, TechnicalSignals } from '../types';
import { formatLargeCurrency } from '../utils/formatters';
import { investingService, InvestmentChartPoint } from '../services/api/investingService';
import { technicalAnalysisService } from '../services/api/technicalAnalysisService';
import { SparklineChart, UniversalBackground, CustomLoadingAnimation } from '../components';

 type InvestmentDetailsRouteProp = RouteProp<RootStackParamList, 'InvestmentDetails'>;
 type InvestmentDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'InvestmentDetails'>;

 interface InvestmentDetailsScreenProps {
   route: InvestmentDetailsRouteProp;
 }

 interface QuoteData {
   price: number;
   changePercent: number;
   currency: string;
   exchange?: string;
   shortName?: string;
   fetchedAt?: string;
 }

type ChartRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y';

const CHART_CONFIG: Record<ChartRange, { range: ChartRange; interval: '5m' | '30m' | '1d' | '1wk' }> = {
  '1d': { range: '1d', interval: '5m' },
  '5d': { range: '5d', interval: '30m' },
  '1mo': { range: '1mo', interval: '1d' },
  '3mo': { range: '3mo', interval: '1d' },
  '6mo': { range: '6mo', interval: '1d' },
  '1y': { range: '1y', interval: '1wk' },
};

 export const InvestmentDetailsScreen: React.FC<InvestmentDetailsScreenProps> = ({ route }) => {
   const navigation = useNavigation<InvestmentDetailsNavigationProp>();
   const { holding } = route.params;
  const { width: screenWidth } = useWindowDimensions();
   const [quoteData, setQuoteData] = useState<QuoteData>({
     price: holding.currentPrice,
     changePercent: holding.changePercent,
     currency: holding.currency,
     exchange: holding.market,
     shortName: holding.name,
   });
   const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>('1mo');
  const [chartPoints, setChartPoints] = useState<InvestmentChartPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicators>({});
  const [technicalSignals, setTechnicalSignals] = useState<TechnicalSignals>({});

   const marketValue = useMemo(() => holding.quantity * quoteData.price, [holding.quantity, quoteData.price]);
   const costBasis = useMemo(() => holding.quantity * holding.averagePrice, [holding.quantity, holding.averagePrice]);
   const profitLoss = useMemo(() => marketValue - costBasis, [marketValue, costBasis]);
   const profitLossPercent = useMemo(() => {
     if (costBasis === 0) {
       return 0;
     }
     return (profitLoss / costBasis) * 100;
   }, [profitLoss, costBasis]);

   const loadQuote = useCallback(async () => {
     setIsRefreshing(true);
     try {
      const response = await investingService.fetchQuotes([holding]);
       const quote = response.data?.[holding.symbol.toUpperCase()];
       if (quote) {
        setQuoteData((previous) => ({
          price:
            typeof quote.price === 'number' && Number.isFinite(quote.price)
              ? quote.price
              : previous.price,
          changePercent:
            typeof quote.changePercent === 'number' && Number.isFinite(quote.changePercent)
              ? quote.changePercent
              : previous.changePercent,
          currency: quote.currency || previous.currency || holding.currency,
          exchange: quote.exchange || previous.exchange || holding.market,
          shortName: quote.shortName || previous.shortName || holding.name,
          fetchedAt: new Date().toISOString(),
        }));
       }
     } finally {
       setIsRefreshing(false);
     }
   }, [holding]);

  const loadChart = useCallback(
    async (range: ChartRange) => {
      setIsChartLoading(true);
      setChartError(null);
      try {
        const config = CHART_CONFIG[range];
        const response = await investingService.fetchChart(holding.symbol, {
          range: config.range,
          interval: config.interval,
        });

        if (!response.success) {
          setChartError(response.error || 'Unable to load chart data');
          setChartPoints([]);
          return;
        }

        const points = Array.isArray(response.data.points) ? response.data.points : [];
        setChartPoints(points);

        // Calculate technical indicators from chart data
        if (points.length > 0) {
          const priceData = points.map((point) => ({
            close: point.close,
            timestamp: point.timestamp,
          }));

          const indicators = technicalAnalysisService.calculateIndicators(priceData, {
            rsiPeriod: 14,
            macdFast: 12,
            macdSlow: 26,
            macdSignal: 9,
            bbPeriod: 20,
            bbStdDev: 2,
            smaPeriods: [20, 50],
            emaPeriods: [12, 26],
            stochasticPeriod: 14,
            atrPeriod: 14,
            adxPeriod: 14,
          });

          setTechnicalIndicators(indicators);

          // Calculate signals
          const rsiSignal = technicalAnalysisService.getRSISignal(indicators.rsi);
          const macdSignal = technicalAnalysisService.getMACDSignal(indicators.macd);
          const bbPosition = technicalAnalysisService.getBBPosition(
            quoteData.price,
            indicators.bollingerBands
          );

          setTechnicalSignals({
            rsiSignal,
            macdSignal,
            bbPosition,
          });
        }
      } catch (error: any) {
        setChartPoints([]);
        setChartError(error?.message || 'Unable to load chart data');
      } finally {
        setIsChartLoading(false);
      }
    },
    [holding.symbol, quoteData.price]
  );

   useEffect(() => {
     loadQuote();
   }, [loadQuote]);

  useEffect(() => {
    loadChart(chartRange);
  }, [chartRange, loadChart]);

   const isChangePositive = quoteData.changePercent >= 0;
   const isPnLPositive = profitLoss >= 0;
  const chartPrices = useMemo(() => chartPoints.map((point) => point.close), [chartPoints]);
  const chartWidth = useMemo(() => Math.max(Math.min(screenWidth - 64, 360), 220), [screenWidth]);
  const chartHeight = useMemo(() => Math.max(Math.round(chartWidth * 0.45), 120), [chartWidth]);

  const handleSelectRange = useCallback(
    (range: ChartRange) => {
      if (range !== chartRange) {
        setChartRange(range);
      } else {
        // allow manual refresh on same range
        loadChart(range);
      }
    },
    [chartRange, loadChart]
  );

   return (
     <UniversalBackground>
       <SafeAreaView style={{ flex: 1 }}>
         <ScrollView
           style={{ flex: 1 }}
           contentContainerStyle={{ padding: 24, paddingBottom: 64 }}
           refreshControl={
             <RefreshControl
               tintColor="#3B82F6"
               colors={['#3B82F6']}
               refreshing={isRefreshing}
               onRefresh={loadQuote}
             />
           }
           showsVerticalScrollIndicator={false}
         >
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
             <TouchableOpacity
               onPress={() => navigation.goBack()}
               style={{
                 width: 40,
                 height: 40,
                 borderRadius: 20,
                 borderWidth: 1,
                 borderColor: 'rgba(148, 163, 184, 0.25)',
                 alignItems: 'center',
                 justifyContent: 'center',
                 marginRight: 16,
                 backgroundColor: 'rgba(15, 23, 42, 0.6)',
               }}
             >
               <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
             </TouchableOpacity>

             <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
               {holding.icon ? (
                 <Image
                   source={{ uri: holding.icon }}
                   style={{ width: 48, height: 48, borderRadius: 14, marginRight: 16 }}
                   resizeMode="cover"
                 />
               ) : (
                 <View
                   style={{
                     width: 48,
                     height: 48,
                     borderRadius: 14,
                     marginRight: 16,
                     backgroundColor: 'rgba(30, 41, 59, 0.9)',
                     alignItems: 'center',
                     justifyContent: 'center',
                   }}
                 >
                   <Text style={{ color: '#94A3B8', fontWeight: '600', fontSize: 16 }}>
                     {holding.symbol.slice(0, 3).toUpperCase()}
                   </Text>
                 </View>
               )}

               <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>{holding.name}</Text>
                 <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                   {holding.symbol} • {holding.type.toUpperCase()} • {quoteData.exchange || holding.market}
                 </Text>
               </View>
             </View>
           </View>

           <View
             style={{
               backgroundColor: 'rgba(15, 23, 42, 0.85)',
               borderRadius: 20,
               borderWidth: 1,
               borderColor: 'rgba(30, 41, 59, 0.65)',
               padding: 20,
               marginBottom: 20,
             }}
           >
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.75 }}>
                 LIVE MARKET DATA
               </Text>
               <TouchableOpacity
                 onPress={loadQuote}
                 style={{ flexDirection: 'row', alignItems: 'center' }}
               >
                 <Ionicons name="refresh" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                 <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600' }}>Refresh</Text>
               </TouchableOpacity>
             </View>

             <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginTop: 12 }}>
               {formatLargeCurrency(quoteData.price)}
             </Text>
             <Text
               style={{
                 color: isChangePositive ? '#34D399' : '#F87171',
                 fontSize: 14,
                 fontWeight: '600',
                 marginTop: 6,
               }}
             >
               {isChangePositive ? '+' : ''}
               {quoteData.changePercent.toFixed(2)}%
             </Text>

             <View style={{ flexDirection: 'row', marginTop: 16 }}>
               <View style={{ flex: 1 }}>
                 <Text style={{ color: '#94A3B8', fontSize: 12 }}>Currency</Text>
                 <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                   {quoteData.currency}
                 </Text>
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={{ color: '#94A3B8', fontSize: 12 }}>Exchange</Text>
                 <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                   {quoteData.exchange || '—'}
                 </Text>
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={{ color: '#94A3B8', fontSize: 12 }}>Last Update</Text>
                 <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500', marginTop: 4 }}>
                   {quoteData.fetchedAt ? new Date(quoteData.fetchedAt).toLocaleTimeString() : '—'}
                 </Text>
               </View>
             </View>
           </View>

          <View
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(30, 41, 59, 0.65)',
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.75 }}>
                PERFORMANCE
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 12, paddingRight: 4 }}
                style={{ marginLeft: 16, flexGrow: 0 }}
              >
                {(['1d', '5d', '1mo', '3mo', '6mo', '1y'] as ChartRange[]).map((range, index) => {
                  const isActive = range === chartRange;
                  return (
                    <TouchableOpacity
                      key={range}
                      onPress={() => handleSelectRange(range)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        marginLeft: index === 0 ? 0 : 8,
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                        borderWidth: 1,
                        borderColor: isActive ? '#3B82F6' : 'rgba(51, 65, 85, 0.7)',
                      }}
                    >
                      <Text
                        style={{
                          color: isActive ? '#3B82F6' : '#94A3B8',
                          fontSize: 12,
                          fontWeight: isActive ? '600' : '500',
                        }}
                      >
                        {range.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View
              style={{
                minHeight: 160,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {isChartLoading ? (
                <CustomLoadingAnimation
                  message="Loading chart..."
                  size="small"
                  variant="inline"
                />
              ) : chartError ? (
                <Text style={{ color: '#F87171', fontSize: 12 }}>{chartError}</Text>
              ) : chartPrices.length > 1 ? (
                <SparklineChart data={chartPrices} width={chartWidth} height={chartHeight} color="#3B82F6" />
              ) : (
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>No chart data available</Text>
              )}
            </View>
          </View>

          {/* Technical Indicators Section */}
          {Object.keys(technicalIndicators).length > 0 && (
            <View
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(30, 41, 59, 0.65)',
                padding: 20,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.75, marginBottom: 16 }}>
                TECHNICAL INDICATORS
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {technicalIndicators.rsi !== undefined && (
                  <View style={{ flex: 1, minWidth: '45%', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11 }}>RSI (14)</Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                          backgroundColor:
                            technicalSignals.rsiSignal === 'overbought'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : technicalSignals.rsiSignal === 'oversold'
                              ? 'rgba(34, 211, 153, 0.2)'
                              : 'rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <Text
                          style={{
                            color:
                              technicalSignals.rsiSignal === 'overbought'
                                ? '#F87171'
                                : technicalSignals.rsiSignal === 'oversold'
                                ? '#34D399'
                                : '#3B82F6',
                            fontSize: 10,
                            fontWeight: '600',
                          }}
                        >
                          {technicalSignals.rsiSignal?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
                      {technicalIndicators.rsi.toFixed(2)}
                    </Text>
                  </View>
                )}

                {technicalIndicators.macd && (
                  <View style={{ flex: 1, minWidth: '45%', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11 }}>MACD</Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                          backgroundColor:
                            technicalSignals.macdSignal === 'bullish'
                              ? 'rgba(34, 211, 153, 0.2)'
                              : technicalSignals.macdSignal === 'bearish'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <Text
                          style={{
                            color:
                              technicalSignals.macdSignal === 'bullish'
                                ? '#34D399'
                                : technicalSignals.macdSignal === 'bearish'
                                ? '#F87171'
                                : '#3B82F6',
                            fontSize: 10,
                            fontWeight: '600',
                          }}
                        >
                          {technicalSignals.macdSignal?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
                      {technicalIndicators.macd.MACD.toFixed(4)}
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                      Signal: {technicalIndicators.macd.signal.toFixed(4)}
                    </Text>
                  </View>
                )}

                {technicalIndicators.bollingerBands && (
                  <View style={{ flex: 1, minWidth: '45%', marginBottom: 12 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Bollinger Bands</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                      Upper: {formatLargeCurrency(technicalIndicators.bollingerBands.upper)}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                      Middle: {formatLargeCurrency(technicalIndicators.bollingerBands.middle)}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                      Lower: {formatLargeCurrency(technicalIndicators.bollingerBands.lower)}
                    </Text>
                    {technicalSignals.bbPosition && (
                      <Text style={{ color: '#94A3B8', fontSize: 10, marginTop: 4, textTransform: 'capitalize' }}>
                        Position: {technicalSignals.bbPosition.replace('_', ' ')}
                      </Text>
                    )}
                  </View>
                )}

                {technicalIndicators.sma && Object.keys(technicalIndicators.sma).length > 0 && (
                  <View style={{ flex: 1, minWidth: '45%', marginBottom: 12 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>SMA</Text>
                    {Object.entries(technicalIndicators.sma).map(([period, value]) => (
                      <Text key={period} style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                        SMA({period}): {formatLargeCurrency(value)}
                      </Text>
                    ))}
                  </View>
                )}

                {technicalIndicators.stochastic && (
                  <View style={{ flex: 1, minWidth: '45%', marginBottom: 12 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>Stochastic</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                      K: {technicalIndicators.stochastic.k.toFixed(2)}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                      D: {technicalIndicators.stochastic.d.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

           <View
             style={{
               backgroundColor: 'rgba(15, 23, 42, 0.85)',
               borderRadius: 20,
               borderWidth: 1,
               borderColor: 'rgba(30, 41, 59, 0.65)',
               padding: 20,
               marginBottom: 20,
             }}
           >
             <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 0.75 }}>
               YOUR HOLDINGS
             </Text>

             <View style={{ marginTop: 16 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                 <Text style={{ color: '#94A3B8', fontSize: 13 }}>Quantity</Text>
                 <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>
                   {holding.quantity.toLocaleString()} {holding.symbol}
                 </Text>
               </View>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                 <Text style={{ color: '#94A3B8', fontSize: 13 }}>Average Price</Text>
                 <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>
                   {formatLargeCurrency(holding.averagePrice)}
                 </Text>
               </View>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                 <Text style={{ color: '#94A3B8', fontSize: 13 }}>Market Value</Text>
                 <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>
                   {formatLargeCurrency(marketValue)}
                 </Text>
               </View>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                 <Text style={{ color: '#94A3B8', fontSize: 13 }}>Unrealized P&L</Text>
                 <Text
                   style={{
                     color: isPnLPositive ? '#34D399' : '#F87171',
                     fontSize: 15,
                     fontWeight: '600',
                   }}
                 >
                   {isPnLPositive ? '+' : ''}
                   {formatLargeCurrency(profitLoss)} ({profitLossPercent.toFixed(2)}%)
                 </Text>
               </View>
             </View>
           </View>

           <View
             style={{
               backgroundColor: 'rgba(15, 23, 42, 0.75)',
               borderRadius: 20,
               borderWidth: 1,
               borderColor: 'rgba(30, 41, 59, 0.55)',
               padding: 20,
             }}
           >
             <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Strategy Notes</Text>
            <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
              This position is tracked using live market data feeds. Refresh periodically to monitor performance
              and rebalance alongside decentralized allocations.
            </Text>
           </View>
         </ScrollView>
       </SafeAreaView>
     </UniversalBackground>
   );
 };
