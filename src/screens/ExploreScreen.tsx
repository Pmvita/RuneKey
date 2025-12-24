import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, RefreshControl, Linking, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UniversalBackground, CustomLoadingAnimation } from '../components';
import { logger } from '../utils/logger';
import { stocksService, StockNewsItem, TrendingStock } from '../services/api/stocksService';
import { formatLargeCurrency, formatAddress } from '../utils/formatters';
import { useWalletStore } from '../stores/wallet/useWalletStore';
import mockDevWallet from '../mockData/api/dev-wallet.json';
import { useThemeColors, useIsDark } from '../utils/theme';

// Helper function to get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// News Card Component
const NewsCard: React.FC<{ news: StockNewsItem }> = ({ news }) => {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [logoError, setLogoError] = useState(false);
  const sentiment = news.sentiment || 'neutral';
  
  // Helper function to get gradient colors based on sentiment and theme
  const getGradientColors = (sentiment: 'positive' | 'negative' | 'neutral'): string[] => {
    const baseBg = isDark ? colors.backgroundSecondary : colors.background;
    const secondaryBg = isDark ? colors.backgroundTertiary : colors.backgroundSecondary;
    
    switch (sentiment) {
      case 'positive':
        return [colors.success + '26', baseBg, secondaryBg];
      case 'negative':
        return [colors.error + '26', baseBg, secondaryBg];
      default:
        return [colors.primary + '26', baseBg, secondaryBg];
    }
  };

  // Helper function to get card border style based on sentiment
  const getCardStyle = (sentiment: 'positive' | 'negative' | 'neutral'): any => {
    switch (sentiment) {
      case 'positive':
        return { borderColor: colors.success + '4D' };
      case 'negative':
        return { borderColor: colors.error + '4D' };
      default:
        return { borderColor: colors.primary + '4D' };
    }
  };
  
  const gradientColors = getGradientColors(sentiment);
  const cardStyle = getCardStyle(sentiment);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        if (news.url) {
          Linking.openURL(news.url).catch(() => {
            console.error('Failed to open URL:', news.url);
          });
        }
        logger.logButtonPress('Stock News', `open ${news.symbol}`);
      }}
      style={styles.newsCardWrapper}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.newsCard, cardStyle]}
      >
        <View style={styles.newsCardContent}>
          {/* Header with Logo and Symbol */}
          <View style={styles.newsCardHeader}>
            <View style={styles.newsLogoContainer}>
              {news.logoUrl && !logoError ? (
                <Image
                  source={{ uri: news.logoUrl }}
                  style={styles.newsLogo}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <View style={[styles.newsLogoPlaceholder, { backgroundColor: colors.primary + '33' }]}>
                  <Text style={[styles.newsLogoPlaceholderText, { color: colors.primary }]}>
                    {news.symbol?.charAt(0) || 'M'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.newsHeaderInfo}>
              <View style={styles.newsHeaderTop}>
                <View style={[styles.newsSymbolBadge, { backgroundColor: colors.backgroundTertiary }]}>
                  <Text style={[styles.newsSymbolText, { color: colors.textPrimary }]}>
                    {news.symbol || 'MARKET'}
                  </Text>
                </View>
                {sentiment !== 'neutral' && (
                  <View style={[
                    styles.sentimentBadge,
                    { backgroundColor: sentiment === 'positive' ? colors.success + '4D' : colors.error + '4D' }
                  ]}>
                    <Ionicons
                      name={sentiment === 'positive' ? 'trending-up' : 'trending-down'}
                      size={10}
                      color={colors.textInverse}
                    />
                  </View>
                )}
              </View>
              {news.companyName && (
                <Text style={[styles.newsCompanyName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {news.companyName}
                </Text>
              )}
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.newsTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {news.title}
          </Text>

          {/* Description */}
          {news.text ? (
            <Text style={[styles.newsText, { color: colors.textSecondary }]} numberOfLines={3}>
              {news.text}
            </Text>
          ) : null}

          {/* Footer */}
          <View style={styles.newsFooter}>
            <View style={styles.newsFooterLeft}>
              <Text style={[styles.newsSite, { color: colors.textTertiary }]}>{news.site}</Text>
              <Text style={[styles.newsTime, { color: colors.textTertiary }]}>
                • {new Date(news.publishedAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={20} color={colors.textSecondary} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const ExploreScreen: React.FC = () => {
  const colors = useThemeColors();
  const { currentWallet, isConnected } = useWalletStore();
  const [newsItems, setNewsItems] = useState<StockNewsItem[]>([]);
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [greeting] = useState(getGreeting());

  // Get user info from connected wallet or fallback to dev wallet
  // Use mock wallet for name (since Wallet type doesn't include name)
  // Use currentWallet address if connected, otherwise use mock wallet address
  const walletAddress = currentWallet?.address || mockDevWallet.wallet.address;
  const walletName = mockDevWallet.wallet.name; // Always use mock wallet name for display
  const displayName = walletName;

  // Load stock news
  const loadStockNews = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) {
      setIsLoadingNews(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const itemsPerPage = pageNum === 1 ? 3 : 10; // Show 3 items initially, then 10 per page
      const news = await stocksService.fetchNews(itemsPerPage, pageNum);
      if (append) {
        setNewsItems(prev => [...prev, ...news]);
      } else {
        setNewsItems(news);
      }
      setHasMore(news.length >= itemsPerPage);
    } catch (error) {
      console.error('Failed to load stock news:', error);
    } finally {
      setIsLoadingNews(false);
      setLoadingMore(false);
    }
  }, []);

  // Load trending stocks
  const loadTrendingStocks = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const trending = await stocksService.fetchTrending();
      setTrendingStocks(trending);
    } catch (error) {
      console.error('Failed to load trending stocks:', error);
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  // Load news and trending on mount
  useEffect(() => {
    if (newsItems.length === 0) {
      setPage(1);
      loadStockNews(1, false);
    }
    if (trendingStocks.length === 0) {
      loadTrendingStocks();
    }
  }, [newsItems.length, trendingStocks.length, loadStockNews, loadTrendingStocks]);

  // Load more news when scrolling near end
  const loadMoreNews = useCallback(() => {
    if (!loadingMore && !isLoadingNews && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadStockNews(nextPage, true);
    }
  }, [page, loadingMore, isLoadingNews, hasMore, loadStockNews]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([
      loadStockNews(1, false),
      loadTrendingStocks()
    ]);
    setRefreshing(false);
  }, [loadStockNews, loadTrendingStocks]);

  return (
    <UniversalBackground>
      <SafeAreaView style={styles.container}>
        {/* User Info Header */}
        <View style={styles.userHeader}>
          <View style={styles.userInfoLeft}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.backgroundCard }]}>
                <Ionicons name="person" size={24} color={colors.textPrimary} />
              </View>
              <View style={[styles.avatarBadge, { backgroundColor: colors.success, borderColor: colors.background }]}>
                <Ionicons name="checkmark" size={10} color={colors.textInverse} />
              </View>
            </View>
            <View style={styles.userTextContainer}>
              <Text style={[styles.greetingText, { color: colors.textTertiary }]}>{greeting}</Text>
              <Text style={[styles.userNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                {displayName}
              </Text>
              {walletAddress && (
                <Text style={[styles.walletAddressText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {formatAddress(walletAddress, 6, 4)}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.75}
            onPress={() => {
              logger.logButtonPress('Notifications', 'open notifications');
              // TODO: Navigate to notifications screen
            }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
              <Text style={[styles.notificationBadgeText, { color: colors.textInverse }]}>1</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {/* Trending Section - Outside FlatList */}
          <View style={styles.trendingContainer}>
            <View style={styles.trendingHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Trending</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  logger.logButtonPress('See All Trending', 'view all trending stocks');
                  // TODO: Navigate to full trending stocks screen
                }}
                style={styles.seeAllButton}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {isLoadingTrending && trendingStocks.length === 0 ? (
              <CustomLoadingAnimation
                message="Loading trending stocks..."
                size="small"
                variant="inline"
              />
            ) : trendingStocks.length > 0 ? (
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.trendingScrollContent}
                style={styles.trendingScrollViewWrapper}
                scrollEnabled={true}
                bounces={false}
                decelerationRate="fast"
                pagingEnabled={false}
                snapToInterval={122}
                snapToAlignment="start"
                disableIntervalMomentum={true}
              >
                {trendingStocks.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  return (
                    <TouchableOpacity
                      key={stock.symbol}
                      activeOpacity={0.85}
                      onPress={() => {
                        logger.logButtonPress('Trending Stock', stock.symbol);
                      }}
                      style={[styles.trendingCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
                    >
                      <View style={styles.trendingSymbolContainer}>
                        <Text style={[styles.trendingSymbol, { color: colors.textPrimary }]}>{stock.symbol}</Text>
                      </View>
                      <Text style={[styles.trendingPrice, { color: colors.textPrimary }]}>{formatLargeCurrency(stock.price)}</Text>
                      <View style={styles.trendingChangeRow}>
                        <Ionicons
                          name={isPositive ? 'trending-up' : 'trending-down'}
                          size={12}
                          color={isPositive ? colors.success : colors.error}
                        />
                        <Text style={[styles.trendingChange, { color: isPositive ? colors.success : colors.error }]}>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          {/* News List */}
          <FlatList
            style={styles.flatList}
            data={newsItems}
            keyExtractor={(item, index) => `${item.symbol}-${item.url}-${item.publishedAt}-${index}`}
            renderItem={({ item: news }) => <NewsCard news={news} />}
            ListHeaderComponent={
              <View style={styles.newsHeaderContainer}>
                <Text style={[styles.newsSectionTitle, { color: colors.textTertiary }]}>Market News</Text>
              </View>
            }
            ListEmptyComponent={
              isLoadingNews ? (
                <CustomLoadingAnimation
                  message="Loading news..."
                  size="large"
                  variant="inline"
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No news available</Text>
                </View>
              )
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <CustomLoadingAnimation
                    message="Loading more..."
                    size="small"
                    variant="inline"
                  />
                </View>
              ) : null
            }
            contentContainerStyle={[
              styles.newsContainer,
              newsItems.length === 0 && styles.newsContainerEmpty
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMoreNews}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
          />
        </View>
      </SafeAreaView>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  walletAddressText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  newsContainer: {
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  newsContainerEmpty: {
    flex: 1,
  },
  newsHeaderContainer: {
    marginBottom: 12,
    marginTop: 4,
  },
  newsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  newsCardWrapper: {
    marginBottom: 16,
    marginHorizontal: 24,
  },
  newsCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  newsCardContent: {
    padding: 18,
  },
  newsCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  newsLogoContainer: {
    marginRight: 12,
  },
  newsLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  newsLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsLogoPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newsHeaderInfo: {
    flex: 1,
  },
  newsHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  newsSymbolBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  newsSymbolText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sentimentBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentimentBadgePositive: {
    // backgroundColor will be set dynamically
  },
  sentimentBadgeNegative: {
    // backgroundColor will be set dynamically
  },
  newsCompanyName: {
    fontSize: 12,
    fontWeight: '500',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  newsFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  newsSite: {
    fontSize: 11,
    fontWeight: '600',
  },
  newsTime: {
    fontSize: 11,
    marginLeft: 6,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  trendingContainer: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trendingLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  trendingScrollViewWrapper: {
    marginLeft: -24,
    marginRight: -24,
    paddingLeft: 24,
    paddingRight: 24,
  },
  trendingScrollContent: {
    paddingRight: 24,
    paddingLeft: 0,
    flexDirection: 'row',
  },
  trendingCard: {
    width: 110,
    minWidth: 110,
    height: 100,
    marginRight: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    flexGrow: 0,
  },
  trendingSymbolContainer: {
    marginBottom: 8,
  },
  trendingSymbol: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  trendingPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  trendingChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingChange: {
    fontSize: 12,
    fontWeight: '600',
  },
});

