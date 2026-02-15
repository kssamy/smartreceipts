import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { receiptAPI } from '../../services/api';
import { format } from 'date-fns';

interface ReceiptItem {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceTrack?: boolean;
}

interface Receipt {
  _id: string;
  storeName: string;
  storeAddress?: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  verified: boolean;
  notes?: string;
}

export default function ReceiptDetailScreen({ route, navigation }: any) {
  const { receiptId } = route.params;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadReceipt();
  }, [receiptId]);

  const loadReceipt = async () => {
    try {
      const response = await receiptAPI.getById(receiptId);
      setReceipt(response.data.data.receipt);
    } catch (error) {
      console.error('Failed to load receipt:', error);
      Alert.alert('Error', 'Failed to load receipt details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const togglePriceTracking = async (itemIndex: number, currentValue: boolean) => {
    if (!receipt) return;

    // Add this item to updating set
    setUpdatingItems(prev => new Set(prev).add(itemIndex));

    try {
      const response = await receiptAPI.toggleItemPriceTracking(receipt._id, {
        itemIndex,
        priceTrack: !currentValue,
      });

      // Update local state with the response
      setReceipt(response.data.data.receipt);
    } catch (error) {
      console.error('Failed to toggle price tracking:', error);
      Alert.alert('Error', 'Failed to update price tracking');
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemIndex);
        return newSet;
      });
    }
  };

  const deleteReceipt = async () => {
    if (!receipt) return;

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
              await receiptAPI.delete(receipt._id);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete receipt:', error);
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!receipt) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.storeName}>{receipt.storeName}</Text>
          {receipt.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>
        {receipt.storeAddress && (
          <Text style={styles.storeAddress}>{receipt.storeAddress}</Text>
        )}
        <Text style={styles.date}>
          {format(new Date(receipt.date), 'MMMM dd, yyyy')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        <Text style={styles.sectionSubtitle}>
          Toggle to track price changes for each item
        </Text>
        {receipt.items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
              <View style={styles.itemPriceContainer}>
                <Text style={styles.itemPrice}>${item.totalPrice.toFixed(2)}</Text>
                {item.quantity > 1 && (
                  <Text style={styles.itemQuantity}>
                    {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.itemFooter}>
              <View style={styles.trackingToggle}>
                <Text style={styles.trackingLabel}>
                  Price Tracking {item.priceTrack ? 'On' : 'Off'}
                </Text>
                {updatingItems.has(index) ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Switch
                    value={item.priceTrack ?? false}
                    onValueChange={() => togglePriceTracking(index, item.priceTrack ?? false)}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={item.priceTrack ? '#007AFF' : '#f4f3f4'}
                  />
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${receipt.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${receipt.tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${receipt.total.toFixed(2)}</Text>
        </View>
      </View>

      {receipt.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{receipt.notes}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={deleteReceipt}>
        <Text style={styles.deleteButtonText}>Delete Receipt</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  verifiedBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  trackingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 20,
  },
});
