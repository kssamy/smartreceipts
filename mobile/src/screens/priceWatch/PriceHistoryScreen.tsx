import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { priceWatchAPI } from '../../services/api';

const screenWidth = Dimensions.get('window').width;

interface PriceWatch {
  _id: string;
  itemName: string;
  originalPrice: number;
  storeName: string;
  purchaseDate: string;
  expiresAt: string;
  bestPriceFound?: {
    price: number;
    store: string;
    date: string;
    url: string;
  };
}

interface PriceHistoryEntry {
  _id: string;
  store: string;
  price: number;
  inStock: boolean;
  productUrl?: string;
  scrapedAt: string;
}

export default function PriceHistoryScreen({ route, navigation }: any) {
  const { watchId } = route.params;
  const [watch, setWatch] = useState<PriceWatch | null>(null);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriceHistory();
  }, [watchId]);

  const loadPriceHistory = async () => {
    try {
      const response = await priceWatchAPI.getHistory(watchId);
      setWatch(response.data.data.watch);
      setHistory(response.data.data.history);
    } catch (error) {
      console.error('Failed to load price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const openProductUrl = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading price history...</Text>
      </View>
    );
  }

  if (!watch) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Price watch not found</Text>
      </View>
    );
  }

  // Prepare chart data
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime()
  );

  // Group by date to show lowest price per day
  const dailyPrices = sortedHistory.reduce((acc: any, entry) => {
    const dateKey = formatDate(entry.scrapedAt);
    if (!acc[dateKey] || entry.price < acc[dateKey].price) {
      acc[dateKey] = entry;
    }
    return acc;
  }, {});

  const chartLabels = Object.keys(dailyPrices);
  const chartData = Object.values(dailyPrices).map((entry: any) => entry.price);

  // Calculate savings
  const savings = watch.bestPriceFound
    ? watch.originalPrice - watch.bestPriceFound.price
    : 0;
  const savingsPercent = watch.bestPriceFound
    ? (savings / watch.originalPrice) * 100
    : 0;

  // Calculate days left
  const daysLeft = Math.ceil(
    (new Date(watch.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <ScrollView style={styles.container}>
      {/* Item Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.itemName}>{watch.itemName}</Text>
        <Text style={styles.storeName}>{watch.storeName}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Original Price</Text>
            <Text style={styles.statValue}>${watch.originalPrice.toFixed(2)}</Text>
          </View>

          {watch.bestPriceFound && (
            <>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Best Price</Text>
                <Text style={[styles.statValue, styles.bestPrice]}>
                  ${watch.bestPriceFound.price.toFixed(2)}
                </Text>
                <Text style={styles.bestStore}>{watch.bestPriceFound.store}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Savings</Text>
                <Text style={[styles.statValue, styles.savingsValue]}>
                  ${savings.toFixed(2)}
                </Text>
                <Text style={styles.savingsPercent}>
                  {savingsPercent.toFixed(0)}% off
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.daysLeftContainer}>
          <Text style={[styles.daysLeftText, daysLeft < 7 && styles.daysLeftWarning]}>
            {daysLeft} days left to track
          </Text>
        </View>
      </View>

      {/* Price Trend Chart */}
      {chartData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Price Trend</Text>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: chartData,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: [watch.originalPrice],
                  color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                  strokeWidth: 2,
                  withDots: false,
                },
              ],
              legend: ['Best Price Found', 'Original Price'],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#4CAF50',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Price History List */}
      <View style={styles.historyCard}>
        <Text style={styles.sectionTitle}>Price Checks ({history.length})</Text>
        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No price checks yet</Text>
            <Text style={styles.emptyHistorySubtext}>
              Price checks run daily at 2 AM
            </Text>
          </View>
        ) : (
          history.map((entry) => (
            <TouchableOpacity
              key={entry._id}
              style={styles.historyItem}
              onPress={() => entry.productUrl && openProductUrl(entry.productUrl)}
              disabled={!entry.productUrl}
            >
              <View style={styles.historyLeft}>
                <Text style={styles.historyStore}>{entry.store}</Text>
                <Text style={styles.historyDate}>
                  {new Date(entry.scrapedAt).toLocaleDateString()} at{' '}
                  {new Date(entry.scrapedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <View style={styles.stockBadge}>
                  <Text
                    style={[
                      styles.stockText,
                      entry.inStock ? styles.inStock : styles.outOfStock,
                    ]}
                  >
                    {entry.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </Text>
                </View>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyPrice}>${entry.price.toFixed(2)}</Text>
                {entry.productUrl && (
                  <Text style={styles.viewLink}>View →</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Best Price Action */}
      {watch.bestPriceFound && watch.bestPriceFound.url && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openProductUrl(watch.bestPriceFound!.url)}
        >
          <Text style={styles.actionButtonText}>
            🛒 View Best Price at {watch.bestPriceFound.store}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  bestPrice: {
    color: '#4caf50',
  },
  bestStore: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  savingsValue: {
    color: '#4caf50',
  },
  savingsPercent: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 2,
  },
  daysLeftContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  daysLeftText: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '500',
  },
  daysLeftWarning: {
    color: '#d32f2f',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyHistory: {
    padding: 32,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyLeft: {
    flex: 1,
  },
  historyStore: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  stockBadge: {
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
  inStock: {
    color: '#4caf50',
  },
  outOfStock: {
    color: '#999',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  viewLink: {
    fontSize: 12,
    color: '#1976d2',
  },
  actionButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
