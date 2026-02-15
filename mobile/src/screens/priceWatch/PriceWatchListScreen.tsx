import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { priceWatchAPI } from '../../services/api';

interface PriceWatch {
  _id: string;
  itemName: string;
  originalPrice: number;
  storeName: string;
  expiresAt: string;
  bestPriceFound?: {
    price: number;
    store: string;
    date: string;
    url: string;
  };
}

export default function PriceWatchListScreen({ navigation }: any) {
  const [watches, setWatches] = useState<PriceWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPriceWatches();
  }, []);

  const loadPriceWatches = async () => {
    try {
      const response = await priceWatchAPI.getList();
      setWatches(response.data.data);
    } catch (error) {
      console.error('Failed to load price watches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPriceWatches();
  };

  const renderPriceWatch = ({ item }: { item: PriceWatch }) => {
    const savings = item.bestPriceFound
      ? item.originalPrice - item.bestPriceFound.price
      : 0;
    const savingsPercent = item.bestPriceFound
      ? (savings / item.originalPrice) * 100
      : 0;

    // Calculate days left
    const daysLeft = Math.ceil(
      (new Date(item.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        style={styles.watchCard}
        onPress={() => navigation.navigate('PriceHistory', { watchId: item._id })}
      >
        <View style={styles.watchHeader}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.itemName}
          </Text>
          <View style={[
            styles.daysLeft,
            daysLeft < 7 && styles.daysLeftWarning
          ]}>
            <Text style={[
              styles.daysLeftText,
              daysLeft < 7 && styles.daysLeftTextWarning
            ]}>
              {daysLeft}d left
            </Text>
          </View>
        </View>

        <Text style={styles.storeName}>{item.storeName}</Text>

        <View style={styles.priceRow}>
          <View style={styles.priceSection}>
            <Text style={styles.label}>You Paid</Text>
            <Text style={styles.originalPrice}>${item.originalPrice.toFixed(2)}</Text>
          </View>

          {item.bestPriceFound && (
            <>
              <View style={styles.priceSection}>
                <Text style={styles.label}>Best Price</Text>
                <Text style={styles.newPrice}>${item.bestPriceFound.price.toFixed(2)}</Text>
                <Text style={styles.store}>{item.bestPriceFound.store}</Text>
              </View>

              <View style={styles.savingsSection}>
                <Text style={styles.savingsText}>
                  Save ${savings.toFixed(2)}
                </Text>
                <Text style={styles.savingsPercent}>
                  ({savingsPercent.toFixed(0)}% off)
                </Text>
              </View>
            </>
          )}

          {!item.bestPriceFound && (
            <View style={styles.noDataSection}>
              <Text style={styles.noDataText}>Checking prices...</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading price watches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={watches}
        renderItem={renderPriceWatch}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>
              No items being tracked yet
            </Text>
            <Text style={styles.emptySubtext}>
              Scan a receipt to start tracking prices automatically!
            </Text>
          </View>
        }
        contentContainerStyle={watches.length === 0 && styles.emptyContainer}
      />
    </View>
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
  watchCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  watchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  storeName: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  daysLeft: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysLeftWarning: {
    backgroundColor: '#ffebee',
  },
  daysLeftText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  daysLeftTextWarning: {
    color: '#d32f2f',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceSection: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },
  store: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  savingsSection: {
    alignItems: 'flex-end',
    flex: 1,
  },
  savingsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4caf50',
  },
  savingsPercent: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 2,
  },
  noDataSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  noDataText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
