import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, RefreshControl, Linking, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UniversalBackground } from '../components';
import { logger } from '../utils/logger';
import { stocksService, StockNewsItem, TrendingStock } from '../services/api/stocksService';
import { formatLargeCurrency } from '../utils/formatters';

export const ExploreScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'crypto' | 'stocks'>('crypto');
  const [newsItems, setNewsItems] = useState<StockNewsItem[]>([]);
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load stock news
  const loadStockNews = useCallback(async (pageNum: number, append: boolean) => {
    if (activeTab !== 'stocks') return;
    
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
  }, [activeTab]);

  // Load trending stocks
  const loadTrendingStocks = useCallback(async () => {
    if (activeTab !== 'stocks') return;
    
    setIsLoadingTrending(true);
    try {
      const trending = await stocksService.fetchTrending();
      setTrendingStocks(trending);
    } catch (error) {
      console.error('Failed to load trending stocks:', error);
    } finally {
      setIsLoadingTrending(false);
    }
  }, [activeTab]);

  // Load news and trending when Stocks tab is active
  useEffect(() => {
    if (activeTab === 'stocks') {
      if (newsItems.length === 0) {
        setPage(1);
        loadStockNews(1, false);
      }
      if (trendingStocks.length === 0) {
        loadTrendingStocks();
      }
    }
  }, [activeTab, newsItems.length, trendingStocks.length, loadStockNews, loadTrendingStocks]);

  // Load more news when scrolling near end
  const loadMoreNews = useCallback(() => {
    if (!loadingMore && !isLoadingNews && hasMore && activeTab === 'stocks') {
      const nextPage = page + 1;
      setPage(nextPage);
      loadStockNews(nextPage, true);
    }
  }, [page, loadingMore, isLoadingNews, hasMore, activeTab, loadStockNews]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    if (activeTab === 'stocks') {
      setRefreshing(true);
      setPage(1);
      setHasMore(true);
      await Promise.all([
        loadStockNews(1, false),
        loadTrendingStocks()
      ]);
      setRefreshing(false);
    }
  }, [activeTab, loadStockNews, loadTrendingStocks]);

  return (
    <UniversalBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'crypto' && styles.tabActive
              ]}
              onPress={() => {
                setActiveTab('crypto');
                logger.logButtonPress('Crypto Tab', 'switch to crypto view');
              }}
              activeOpacity={0.85}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'crypto' && styles.tabTextActive
              ]}>
                Crypto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'stocks' && styles.tabActive
              ]}
              onPress={() => {
                setActiveTab('stocks');
                logger.logButtonPress('Stocks Tab', 'switch to stocks view');
              }}
              activeOpacity={0.85}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'stocks' && styles.tabTextActive
              ]}>
                Stocks
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {activeTab === 'crypto' ? (
            <View style={styles.placeholderContent}>
              <Text style={styles.placeholderText}>Crypto content coming soon</Text>
            </View>
          ) : (
            <>
              {/* Trending Section - Outside FlatList */}
              <View style={styles.trendingContainer}>
                <View style={styles.trendingHeader}>
                  <Text style={styles.sectionTitle}>Trending</Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      logger.logButtonPress('See All Trending', 'view all trending stocks');
                      // TODO: Navigate to full trending stocks screen
                    }}
                    style={styles.seeAllButton}
                  >
                    <Text style={styles.seeAllText}>See All</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
                {isLoadingTrending && trendingStocks.length === 0 ? (
                  <View style={styles.trendingLoadingContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </View>
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
                          style={styles.trendingCard}
                        >
                          <View style={styles.trendingSymbolContainer}>
                            <Text style={styles.trendingSymbol}>{stock.symbol}</Text>
                          </View>
                          <Text style={styles.trendingPrice}>{formatLargeCurrency(stock.price)}</Text>
                          <View style={styles.trendingChangeRow}>
                            <Ionicons
                              name={isPositive ? 'trending-up' : 'trending-down'}
                              size={12}
                              color={isPositive ? '#22C55E' : '#EF4444'}
                            />
                            <Text style={[styles.trendingChange, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
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
                renderItem={({ item: news }) => (
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
                    style={styles.newsCard}
                  >
                    <View style={styles.newsHeader}>
                      <View style={styles.newsSymbolBadge}>
                        <Text style={styles.newsSymbolText}>
                          {news.symbol || 'MARKET'}
                        </Text>
                      </View>
                      <Text style={styles.newsSite}>{news.site}</Text>
                      <Text style={styles.newsTime}>
                        • {new Date(news.publishedAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                    <Text style={styles.newsTitle}>{news.title}</Text>
                    {news.text ? (
                      <Text style={styles.newsText} numberOfLines={3}>
                        {news.text}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                )}
                ListHeaderComponent={
                  <View style={styles.newsHeaderContainer}>
                    <Text style={styles.newsSectionTitle}>Market News</Text>
                  </View>
                }
              ListEmptyComponent={
                isLoadingNews ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading news...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No news available</Text>
                  </View>
                )
              }
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
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
            </>
          )}
        </View>
      </SafeAreaView>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#0b1120',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  newsContainer: {
    paddingHorizontal: 24,
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
    color: '#64748B',
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
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  newsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.55)',
    padding: 18,
    marginBottom: 12,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  newsSymbolBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  newsSymbolText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
  },
  newsSite: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  newsTime: {
    color: '#475569',
    fontSize: 11,
    marginLeft: 6,
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  newsText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
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
    color: '#64748B',
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
    color: '#3B82F6',
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.55)',
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
    color: '#FFFFFF',
    textAlign: 'center',
  },
  trendingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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

