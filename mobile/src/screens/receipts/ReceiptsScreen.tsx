import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { receiptAPI } from '../../services/api';
import { format } from 'date-fns';

export default function ReceiptsScreen({ navigation }: any) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReceipts();

    // Add listener to reload when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadReceipts();
    });

    return unsubscribe;
  }, [navigation]);

  const loadReceipts = async () => {
    try {
      const response = await receiptAPI.getAll({ limit: 50 });
      setReceipts(response.data.data.receipts);
    } catch (error) {
      console.error('Failed to load receipts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReceipts();
  };

  const deleteReceipt = async (receiptId: string) => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await receiptAPI.delete(receiptId);
              // Remove from local state immediately
              setReceipts(receipts.filter((r: any) => r._id !== receiptId));
            } catch (error) {
              console.error('Failed to delete receipt:', error);
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  const viewReceiptDetails = (receipt: any) => {
    // For now, show an alert with receipt details
    // TODO: Create a detailed view screen
    const itemsList = receipt.items.map((item: any) =>
      `• ${item.name}: $${item.totalPrice.toFixed(2)}`
    ).join('\n');

    const tipLine = receipt.tip && receipt.tip > 0
      ? `Tip: $${receipt.tip.toFixed(2)}\n`
      : '';

    Alert.alert(
      receipt.storeName,
      `${format(new Date(receipt.date), 'MMM dd, yyyy')}\n${receipt.storeAddress || ''}\n\n${itemsList}\n\nSubtotal: $${receipt.subtotal?.toFixed(2) || '0.00'}\nTax: $${receipt.tax?.toFixed(2) || '0.00'}\n${tipLine}Total: $${receipt.total.toFixed(2)}`,
      [
        { text: 'OK' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReceipt(receipt._id),
        },
      ]
    );
  };

  const renderReceiptItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.receiptCard}
      onPress={() => viewReceiptDetails(item)}
    >
      <View style={styles.receiptHeader}>
        <Text style={styles.storeName}>{item.storeName}</Text>
        <Text style={styles.receiptTotal}>${item.total.toFixed(2)}</Text>
      </View>

      <View style={styles.receiptDetails}>
        <Text style={styles.receiptDate}>
          {format(new Date(item.date), 'MMM dd, yyyy')}
        </Text>
        <Text style={styles.itemCount}>
          {item.items.length} item{item.items.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No receipts yet</Text>
          <Text style={styles.emptySubtext}>
            Scan your first receipt to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  receiptTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  verifiedBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
