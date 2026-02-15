import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Form fields
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [storeName, setStoreName] = useState('');

  const loadPriceWatches = useCallback(async () => {
    try {
      const response = await priceWatchAPI.getList();
      setWatches(response.data.data);
    } catch (error) {
      console.error('Failed to load price watches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload price watches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPriceWatches();
    }, [loadPriceWatches])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPriceWatches();
  };

  const deletePriceWatch = async (watchId: string, itemName: string) => {
    Alert.alert(
      'Stop Tracking',
      `Stop tracking price changes for "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Tracking',
          style: 'destructive',
          onPress: async () => {
            try {
              await priceWatchAPI.delete(watchId);
              setWatches(watches.filter((w) => w._id !== watchId));
            } catch (error) {
              console.error('Failed to delete price watch:', error);
              Alert.alert('Error', 'Failed to stop tracking this item');
            }
          },
        },
      ]
    );
  };

  const handleAddItem = async () => {
    if (!itemName.trim() || !price.trim() || !storeName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setAddingItem(true);

    try {
      await priceWatchAPI.create({
        itemName: itemName.trim(),
        originalPrice: priceValue,
        storeName: storeName.trim(),
        purchaseDate: new Date().toISOString(),
      });

      // Clear form
      setItemName('');
      setPrice('');
      setStoreName('');
      setShowAddModal(false);

      // Reload watches
      await loadPriceWatches();

      Alert.alert('Success', 'Item added to price tracker!');
    } catch (error: any) {
      console.error('Failed to add price watch:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to add item to tracker');
    } finally {
      setAddingItem(false);
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    item: PriceWatch
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deletePriceWatch(item._id, item.itemName)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
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
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        overshootRight={false}
      >
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
      </Swipeable>
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
              Tap the + button below to add an item to track!
            </Text>
          </View>
        }
        contentContainerStyle={watches.length === 0 && styles.emptyContainer}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item to Track</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Organic Milk"
                value={itemName}
                onChangeText={setItemName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Price You Paid</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 4.99"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Store Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Trader Joe's"
                value={storeName}
                onChangeText={setStoreName}
                autoCapitalize="words"
              />

              <TouchableOpacity
                style={[styles.submitButton, addingItem && styles.submitButtonDisabled]}
                onPress={handleAddItem}
                disabled={addingItem}
              >
                {addingItem ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Start Tracking</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                disabled={addingItem}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 8,
    marginRight: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
