import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import MlkitOcr from 'react-native-mlkit-ocr';
import { receiptAPI } from '../../services/api';

export default function ScanScreen({ navigation }: any) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera roll access is required');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera access is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    setScanning(true);

    try {
      // Check if OCR module is available (not available in Expo Go)
      console.log('🔍 Checking OCR availability:', {
        MlkitOcr: !!MlkitOcr,
        hasMethod: MlkitOcr && typeof MlkitOcr.detectFromUri === 'function'
      });

      if (!MlkitOcr || !MlkitOcr.detectFromUri || typeof MlkitOcr.detectFromUri !== 'function') {
        console.log('⚠️ OCR not available - showing manual entry option');
        setScanning(false);
        Alert.alert(
          'OCR Not Available',
          'Automatic receipt scanning requires a custom build. Would you like to enter the receipt manually?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Manual Entry', onPress: () => createManualReceipt() },
          ]
        );
        return;
      }

      console.log('✅ OCR available - optimizing image');

      // Optimize image before OCR
      const optimizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1024 } }, // Resize to max 1024px width
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('📸 Performing OCR on optimized image');

      // Perform on-device OCR using ML Kit
      const ocrResult = await MlkitOcr.detectFromUri(optimizedImage.uri);

      // Parse OCR text
      const parsedData = parseReceiptText(ocrResult);

      if (parsedData.items.length === 0) {
        Alert.alert(
          'No Items Found',
          'Could not detect items in the receipt. Please try manual entry or retake the photo.',
          [
            { text: 'Retry', onPress: () => setScanning(false) },
            { text: 'Manual Entry', onPress: () => createManualReceipt() },
          ]
        );
        setScanning(false);
        return;
      }

      setReceiptData(parsedData);
      setScanning(false);
    } catch (error) {
      console.error('OCR error:', error);
      console.log('⚠️ OCR failed - showing error dialog to user');
      setScanning(false);
      Alert.alert(
        'Scanning Error',
        'Could not scan the receipt automatically. Please use manual entry instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Manual Entry', onPress: () => {
            console.log('✏️ User chose manual entry');
            createManualReceipt();
          } },
        ]
      );
    }
  };

  const parseReceiptText = (ocrResult: any): any => {
    // Simple receipt parser (Phase 1 - basic implementation)
    // In production, this would be more sophisticated

    const lines = ocrResult.map((block: any) => block.text);
    const allText = lines.join('\n');

    // Try to extract store name (usually first line)
    const storeName = lines[0] || 'Unknown Store';

    // Try to find total
    const totalMatch = allText.match(/total[:\s]+\$?(\d+\.?\d*)/i);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    // Try to find date
    const dateMatch = allText.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
    const date = dateMatch ? new Date() : new Date(); // Fallback to today

    // Extract items (simplified - look for price patterns)
    const items: any[] = [];
    const itemPattern = /(.+?)\s+\$?(\d+\.?\d{2})/g;
    let match;

    while ((match = itemPattern.exec(allText)) !== null) {
      const [, name, price] = match;
      if (name && price && !name.toLowerCase().includes('total')) {
        items.push({
          name: name.trim(),
          totalPrice: parseFloat(price),
          quantity: 1,
        });
      }
    }

    return {
      storeName,
      date: date.toISOString(),
      items,
      total,
      subtotal: total,
      tax: 0,
      ocrMethod: 'on-device',
      ocrConfidence: 70,
    };
  };

  const createManualReceipt = () => {
    console.log('📝 Creating manual receipt entry form');
    setReceiptData({
      storeName: '',
      date: new Date().toISOString(),
      items: [{ name: '', totalPrice: 0, quantity: 1 }],
      total: 0,
      subtotal: 0,
      tax: 0,
      ocrMethod: 'manual',
    });
  };

  const saveReceipt = async () => {
    if (!receiptData) return;

    if (!receiptData.storeName || receiptData.items.length === 0) {
      Alert.alert('Error', 'Please fill in store name and at least one item');
      return;
    }

    setProcessing(true);

    try {
      await receiptAPI.create(receiptData);

      Alert.alert('Success', 'Receipt saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setReceiptData(null);
            navigation.navigate('Receipts');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save receipt');
    } finally {
      setProcessing(false);
    }
  };

  if (scanning) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Scanning receipt...</Text>
      </View>
    );
  }

  if (receiptData) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Review Receipt</Text>

          <Text style={styles.label}>Store Name</Text>
          <TextInput
            style={styles.input}
            value={receiptData.storeName}
            onChangeText={(text) =>
              setReceiptData({ ...receiptData, storeName: text })
            }
            placeholder="Enter store name"
          />

          <Text style={styles.label}>Items ({receiptData.items.length})</Text>
          {receiptData.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                style={[styles.input, styles.itemName]}
                value={item.name}
                onChangeText={(text) => {
                  const newItems = [...receiptData.items];
                  newItems[index].name = text;
                  setReceiptData({ ...receiptData, items: newItems });
                }}
                placeholder="Item name"
              />
              <TextInput
                style={[styles.input, styles.itemPrice]}
                value={item.totalPrice.toString()}
                onChangeText={(text) => {
                  const newItems = [...receiptData.items];
                  newItems[index].totalPrice = parseFloat(text) || 0;
                  setReceiptData({ ...receiptData, items: newItems });
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => {
              const newItems = [
                ...receiptData.items,
                { name: '', totalPrice: 0, quantity: 1 },
              ];
              setReceiptData({ ...receiptData, items: newItems });
            }}
          >
            <Text style={styles.addItemText}>+ Add Item</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Total</Text>
          <TextInput
            style={styles.input}
            value={receiptData.total.toString()}
            onChangeText={(text) =>
              setReceiptData({ ...receiptData, total: parseFloat(text) || 0 })
            }
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setReceiptData(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveReceipt}
              disabled={processing}
            >
              <Text style={styles.saveButtonText}>
                {processing ? 'Saving...' : 'Save Receipt'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>
          Capture your receipt to track spending automatically
        </Text>

        <TouchableOpacity style={styles.scanButton} onPress={takePhoto}>
          <Text style={styles.scanButtonText}>📷 Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scanButton} onPress={pickImage}>
          <Text style={styles.scanButtonText}>🖼️ Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, styles.manualButton]}
          onPress={createManualReceipt}
        >
          <Text style={styles.manualButtonText}>✏️ Manual Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  manualButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  manualButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemName: {
    flex: 2,
    marginRight: 8,
  },
  itemPrice: {
    flex: 1,
  },
  addItemButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addItemText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
