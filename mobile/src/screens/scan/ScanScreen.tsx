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
    try {
      console.log('📱 Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📱 Permission result:', permissionResult);

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera roll access is required to pick images');
        return;
      }

      console.log('📱 Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        aspect: [4, 3],
      });

      console.log('📱 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('📱 Image selected, URI:', result.assets[0].uri);
        processImage(result.assets[0].uri);
      } else {
        console.log('📱 Image picker canceled or no image selected');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📷 Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 Permission result:', permissionResult);

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera access is required to take photos');
        return;
      }

      console.log('📷 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      console.log('📷 Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('📷 Photo taken, URI:', result.assets[0].uri);
        processImage(result.assets[0].uri);
      } else {
        console.log('📷 Camera canceled or no photo taken');
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
      console.log('✅ OCR completed, blocks found:', ocrResult?.length || 0);

      // Parse OCR text
      let parsedData;
      try {
        parsedData = parseReceiptText(ocrResult);
        console.log('✅ Parsing completed');
      } catch (parseError) {
        console.error('❌ Parsing error:', parseError);
        throw parseError;
      }

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
    try {
      console.log('🔍 Starting receipt parsing...');

      // Improved receipt parser using spatial coordinates
      // Split blocks by newlines to handle multi-line OCR blocks
      const rawBlocks = ocrResult.map((block: any, idx: number) => {
        const bbox = block.boundingBox || block.frame || null;

        // Try different bounding box formats
        let yPos = idx * 20; // Default fallback
        let xPos = idx * 10;

        if (bbox) {
          if (bbox.top !== undefined && bbox.bottom !== undefined) {
            yPos = (bbox.top + bbox.bottom) / 2;
            xPos = (bbox.left + bbox.right) / 2;
          } else if (bbox.y !== undefined && bbox.height !== undefined) {
            yPos = bbox.y + (bbox.height / 2);
            xPos = bbox.x + (bbox.width / 2);
          }
        }

        return {
          text: block.text.trim(),
          boundingBox: bbox,
          yPos,
          xPos,
        };
      }).filter((block: any) => block.text.length > 0);

      console.log('✅ Raw blocks processed:', rawBlocks.length);

    // Split multi-line blocks into individual lines
    const blocks: any[] = [];
    rawBlocks.forEach((block) => {
      const blockLines = block.text.split('\n').filter(line => line.trim().length > 0);
      blockLines.forEach((line, lineIdx) => {
        blocks.push({
          text: line.trim(),
          boundingBox: block.boundingBox,
          yPos: block.yPos + (lineIdx * 15), // Offset Y for each line
          xPos: block.xPos,
        });
      });
    });

    const lines = blocks.map((block: any) => block.text);
    const allText = lines.join('\n');

    console.log('📝 OCR Blocks:', blocks.length, 'blocks found (after splitting newlines)');
    console.log('📝 OCR Lines:', lines);

    // Debug: Check if bounding boxes are available
    const hasBoundingBoxes = blocks.filter(b => b.boundingBox).length;
    const useFallbackMatching = hasBoundingBoxes === 0;
    console.log('📐 Bounding boxes available:', hasBoundingBoxes, '/', blocks.length);
    console.log('📐 Using fallback matching:', useFallbackMatching);
    if (blocks.length > 0) {
      console.log('📐 Sample positions:', blocks.slice(0, 5).map(b => ({
        text: b.text.substring(0, 20),
        x: Number(b.xPos || 0).toFixed(0),
        y: Number(b.yPos || 0).toFixed(0)
      })));
    }

    // Keywords to skip (not items)
    const skipKeywords = [
      'total', 'subtotal', 'tax', 'payment', 'change', 'cash', 'credit', 'debit',
      'visa', 'mastercard', 'amex', 'american express', 'discover', 'capital one', 'chase', 'bank',
      'thank you', 'receipt', 'store', 'phone', 'till', 'ture till', 'sture till',
      'address', 'street', 'avenue', 'road', 'blvd', 'suite', 'apt', 'city', 'state', 'zip',
      'open', 'close', 'hours', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'card', 'entry', 'contactless', 'approved', 'tender', 'amount', 'paynents', 'payments',
      'discount', 'balance', 'drawer', 'register', 'reg', 'chk', 'auth', 'aid', 'tvr', 'tsi', 'trans',
      'app label', 'tip', 'gratuity', '%', 'percent', 'date', 'time', 'cashier', 'item', 'iten', 'items',
      'transaction', 'purchase', 'customer', 'copy', 'verification', 'cardholder', 'retain', 'records',
      'tid', 'mid', 'code', 'id:', 'type:', 'auth',
      'please', 'daily', 'welcome', 'manager', 'balance', 'shopping', 'shopptng', 'thank', 'yol',
      'wholesale', 'member', 'membership'
    ];

    // Modifiers to skip (these modify items but aren't items themselves)
    const modifierKeywords = [
      'extra', 'hot', 'iced', 'cold', 'large', 'medium', 'small', 'add', 'no', 'light',
      'heavy', 'side', 'with', 'without'
    ];

    // Extract store name - look in first 10 lines for common patterns
    let storeName = 'Unknown Store';
    const storeNameCandidates = lines.slice(0, 10).filter(line => {
      const lower = line.toLowerCase();
      // Filter out common non-store text
      if (lower.includes('receipt') || lower.includes('sale') || lower.includes('transaction')) return false;
      if (lower.includes('date') || lower.includes('time') || lower.match(/\d{1,2}[:/]\d{2}/)) return false;
      if (lower.includes('cashier') || lower.includes('till') || lower.includes('reg')) return false;
      if (line.match(/^\d+$/)) return false; // Just numbers
      if (line.match(/^[A-Z]{2,}\s+\d+$/)) return false; // State + zip
      if (line.match(/^\(\d{3}\)/)) return false; // Phone numbers like (415) 516-4441
      if (line.match(/^\d{3,}\s+[A-Z]/)) return false; // Addresses like "412 Marina Bay"
      if (line.match(/,\s*[A-Z]{2}\s+\d{5}/)) return false; // City/state/zip
      // Store name is usually 4-40 chars, alphanumeric with spaces/apostrophes
      return line.length >= 4 && line.length <= 40;
    });

    // Pick the first candidate that looks like a store name
    // Prefer ALL CAPS store names (most common on receipts) over title case
    for (const candidate of storeNameCandidates) {
      if (candidate.match(/^[A-Z][A-Z\s'&.)\-]+$/)) {
        storeName = candidate;
        break;
      }
    }

    // If no all-caps store name found, try title case
    if (storeName === 'Unknown Store') {
      for (const candidate of storeNameCandidates) {
        if (candidate.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/)) {
          storeName = candidate;
          break;
        }
      }
    }

    // If no good candidate, use first valid line
    if (storeName === 'Unknown Store' && storeNameCandidates.length > 0) {
      storeName = storeNameCandidates[0];
    }

    console.log(`🏪 Extracted store name: "${storeName}"`);

    // Extract store address - look for multiple address patterns
    let storeAddress = '';

    // Pattern 1: Number + street name with common suffixes
    const streetPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln|way|court|ct|circle|place|pl)\b/i;
    let addressMatch = allText.match(streetPattern);

    // Pattern 2: Just number + words (for addresses without typical suffixes)
    if (!addressMatch) {
      const simplePattern = /\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/;
      addressMatch = allText.match(simplePattern);
    }

    if (addressMatch) {
      storeAddress = addressMatch[0];

      // Try to append city and state if available nearby
      const cityStatePattern = new RegExp(
        addressMatch[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '\\s*,?\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?(?:,\\s*[A-Z]{2})?)',
        'i'
      );
      const fullAddressMatch = allText.match(cityStatePattern);
      if (fullAddressMatch && fullAddressMatch[1]) {
        storeAddress += ', ' + fullAddressMatch[1];
      }
    }

    // Try to find total (look for the last occurrence to get final total, not subtotal)
    const totalMatches = allText.matchAll(/(?:^|\n).*?total[:\s]+\$?(\d+\.?\d{2})/gi);
    const totalMatchArray = Array.from(totalMatches);
    const total = totalMatchArray.length > 0
      ? parseFloat(totalMatchArray[totalMatchArray.length - 1][1])
      : 0;

    // Try to find subtotal
    const subtotalMatch = allText.match(/subtotal[:\s]+\$?(\d+\.?\d{2})/i);
    let subtotal = subtotalMatch ? parseFloat(subtotalMatch[1]) : 0;

    // Try to find tax
    const taxMatch = allText.match(/tax[:\s]+\$?(\d+\.?\d{2})/i);
    const tax = taxMatch ? parseFloat(taxMatch[1]) : 0;

    // Try to find tip
    const tipMatch = allText.match(/tip[:\s]+\$?(\d+\.?\d{2})/i);
    const tip = tipMatch ? parseFloat(tipMatch[1]) : 0;

    // Try to find date
    const dateMatch = allText.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
    const date = dateMatch ? new Date() : new Date(); // Fallback to today

    // Detect sections of the receipt
    let saleStartIdx = -1;
    let saleEndIdx = -1;
    let paymentStartIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      // Look for "SALE TRANSACTION" as start
      if (lower.includes('sale transaction')) {
        saleStartIdx = i;
      }
      // First occurrence of tax/total marks end of items
      if ((lower.includes('tax:') || lower.includes('subtotal') || lower.includes('total')) && saleEndIdx === -1) {
        saleEndIdx = i;
      }
      // Payment section starts at "payment" or card names
      if ((lower.includes('payment') || lower.includes('mastercard') || lower.includes('visa') || lower.includes('capital one')) && paymentStartIdx === -1) {
        paymentStartIdx = i;
      }
    }

    console.log('📍 Receipt sections:', {
      saleStart: saleStartIdx,
      saleEnd: saleEndIdx,
      paymentStart: paymentStartIdx,
      totalLines: lines.length
    });

    // Extract items - improved to handle names and prices on different lines
    const itemsWithPosition: any[] = [];
    const processedIndices = new Set<number>();

    // First pass: Try to find item name + price on same line
    for (let i = 0; i < lines.length; i++) {
      if (processedIndices.has(i)) continue;

      const line = lines[i];
      // Pattern: "Item Name $12.99" or "Item Name 12.99"
      const sameLineMatch = line.match(/^(.+?)\s+\$?(\d+\.\d{2})$/);

      if (sameLineMatch) {
        const [, name, price] = sameLineMatch;
        const cleanName = name.trim();
        const lowerName = cleanName.toLowerCase();
        const shouldSkip = skipKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()));
        const isModifier = modifierKeywords.some(keyword => lowerName.includes(keyword.toLowerCase())) &&
                           cleanName.split(' ').length <= 2;
        const priceNum = parseFloat(price);

        // Must have at least 3 letters
        const hasLetters = (cleanName.match(/[a-zA-Z]/g) || []).length >= 3;

        if (
          cleanName.length >= 3 &&
          cleanName.length <= 50 &&
          hasLetters &&
          !shouldSkip &&
          !isModifier &&
          priceNum > 0.05 &&
          priceNum < 1000 &&
          cleanName !== storeName &&
          cleanName !== storeAddress
        ) {
          itemsWithPosition.push({
            name: cleanName,
            totalPrice: priceNum,
            quantity: 1,
            position: i, // Track original position
          });
          processedIndices.add(i);
        }
      }
    }

    // Second pass: Look for price-only blocks and pair them
    // STRATEGY: Use SEQUENTIAL matching for fallback mode (columnar receipts),
    // proximity matching for when we have bounding boxes
    let pricesFound = 0;
    let pricesSkipped = 0;
    let pricesMatched = 0;

    if (useFallbackMatching) {
      console.log('📋 Using SEQUENTIAL matching for columnar layout');

      // Helper function to validate item candidates
      const isValidItemCandidate = (text: string, blockIndex: number): boolean => {
        if (text.match(/^\$?[\dSs]+\.?\d{0,2}$/)) return false; // Skip prices with S or s (OCR error for $)
        if (text.match(/^\d+[,.]?\d*%?$/)) return false;
        if (text.match(/^\$[\d\s.]+$/)) return false;
        if (text.match(/^\*+\d+$/)) return false;
        if (text.match(/^\d{3,}$/)) return false;
        if (text.match(/\d+\s+[Ss][\$Ss]?\d+\.\d{2}/)) return false; // Skip quantity+price lines
        if (text.match(/^\w{1,3}:$/)) return false;
        if (text.match(/^[A-Z][a-z]*,\s*[A-Z]/)) return false;
        if (text.match(/\*{3,}/)) return false;
        if (text.match(/^\w+:\s*\*+/)) return false;
        if (text.match(/^[A-Z]{2,}[a-z]+\d+$/)) return false;
        if (text.match(/,\s*[A-Z]{2}$/)) return false;
        if (text.match(/^\d{5}(-\d{4})?$/)) return false;

        // Filter out phone numbers
        if (text.match(/^\(\d{3}\)/)) return false;

        // Filter out city/state/zip lines like "SAN FRANCISCO, CA 91232"
        if (text.match(/,\s*[A-Z]{2}\s+\d{5}/)) {
          console.log(`❌ Filtered out city/state/zip: "${text}"`);
          return false;
        }

        // Filter out store location patterns like "Greenville #1005"
        if (text.match(/#\d+/)) {
          console.log(`❌ Filtered out store location: "${text}"`);
          return false;
        }

        // Filter out membership numbers like "V5 Member 11117324950"
        if (text.match(/^[A-Z]\d+\s+(Member|Membership)\s+\d{10,}/i)) {
          console.log(`❌ Filtered out membership number: "${text}"`);
          return false;
        }

        // Filter out street addresses ONLY if they have 3+ digits OR contain typical street words
        // This avoids filtering items like "1 Pasta Sauce" which start with small quantity numbers
        if (blockIndex < 15) {  // Check in header and early item section
          const hasHighNumber = text.match(/^\d{3,}\s+/);  // 100+ = likely address
          const lowerText = text.toLowerCase();

          // Use word boundary matching to avoid false matches like "pasta" containing "st"
          const streetPattern = /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|place|pl|court|ct|boulevard|blvd|marina|bay|plaza|parkway|circle|square)\b/;
          const hasStreetWord = streetPattern.test(lowerText);

          if (hasHighNumber || (text.match(/^\d{1,3}\s+[A-Z]/i) && hasStreetWord)) {
            console.log(`❌ Filtered out address: "${text}"`);
            return false;
          }
        }

        const lowerName = text.toLowerCase();
        const shouldSkip = skipKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()));
        if (shouldSkip) return false;

        const isModifier = modifierKeywords.some(keyword => lowerName.includes(keyword.toLowerCase())) &&
                           text.split(' ').length <= 2;
        if (isModifier) return false;

        const hasLetters = (text.match(/[a-zA-Z]/g) || []).length >= 3;
        if (!hasLetters) return false;

        // Don't filter single-word items - "Bananas", "Carrots", "Milk" are valid items
        // Cashier names typically appear on their own line before items, and are rare

        // Filter out store name - multiple checks for robustness
        // 1. Exact match with various apostrophe normalizations
        const normalizedText = text.toLowerCase().replace(/[''`´]/g, "'").replace(/\s+/g, ' ').trim();
        const normalizedStoreName = storeName.toLowerCase().replace(/[''`´]/g, "'").replace(/\s+/g, ' ').trim();

        // 2. Check if store name substring appears (without apostrophes)
        const textNoApostrophes = text.toLowerCase().replace(/[''`´]/g, '').replace(/\s+/g, ' ').trim();
        const storeNoApostrophes = storeName.toLowerCase().replace(/[''`´]/g, '').replace(/\s+/g, ' ').trim();

        if (normalizedText === normalizedStoreName || textNoApostrophes === storeNoApostrophes) {
          console.log(`❌ Filtered out store name: "${text}" (matches "${storeName}")`);
          return false;
        }

        if (text === storeAddress) return false;
        if (text.length < 3 || text.length > 50) return false;

        return true;
      };

      // Step 1: Collect all item candidates (stop at tax/total section)
      const itemCandidates: { index: number; text: string }[] = [];
      const endKeywords = ['tax:', 'total', 'balance', 'subtotal'];

      for (let i = 0; i < blocks.length; i++) {
        if (processedIndices.has(i)) continue;

        // Stop collecting items after we hit tax/total section
        // Normalize text to handle OCR errors (spaces, etc.)
        const lower = blocks[i].text.toLowerCase();
        const normalized = lower.replace(/\s+/g, ''); // Remove all spaces for matching
        if (endKeywords.some(keyword => lower.includes(keyword) || normalized.includes(keyword.replace(/\s+/g, '')))) {
          console.log(`⏹️ Stopped collecting items at: "${blocks[i].text}"`);
          break;
        }

        if (isValidItemCandidate(blocks[i].text, i)) {
          itemCandidates.push({ index: i, text: blocks[i].text });
          console.log(`✅ Item candidate #${itemCandidates.length}: "${blocks[i].text}"`);
        }
      }

      console.log(`📝 Found ${itemCandidates.length} item candidates total`);

      // Merge split item names (e.g., "SEMI SHEET CHOC" + "CHIPS" → "SEMI SHEET CHOC CHIPS")
      // Only merge if next item is a single short word AND current item looks incomplete
      const mergedItemCandidates: { index: number; text: string }[] = [];
      for (let i = 0; i < itemCandidates.length; i++) {
        const current = itemCandidates[i];
        const next = itemCandidates[i + 1];

        if (next) {
          const nextWords = next.text.split(/\s+/);
          const currentWords = current.text.split(/\s+/);
          const nextIsSingleWord = nextWords.length === 1 && next.text.length <= 10;
          const nextStartsWithNumber = /^\d/.test(next.text);
          const currentIsMultiWord = currentWords.length >= 2;
          const currentIsAllCaps = current.text === current.text.toUpperCase() && current.text.match(/[A-Z]{3,}/);

          // Only merge if:
          // 1. Next is single short word AND doesn't start with number (quantity)
          // 2. Current has multiple words OR is all caps (suggesting incomplete name)
          const shouldMerge = nextIsSingleWord && !nextStartsWithNumber && (currentIsMultiWord || currentIsAllCaps);

          if (shouldMerge) {
            mergedItemCandidates.push({
              index: current.index,
              text: current.text + ' ' + next.text
            });
            console.log(`🔗 Merged split item: "${current.text}" + "${next.text}" → "${current.text + ' ' + next.text}"`);
            i++; // Skip next since we merged it
          } else {
            mergedItemCandidates.push(current);
          }
        } else {
          mergedItemCandidates.push(current);
        }
      }

      console.log(`📝 After merging: ${mergedItemCandidates.length} items`);

      // Step 2: Collect ALL price candidates - no positional cutoff, just pattern matching
      // Filter by price range to exclude totals (most items are under $50)
      const priceCandidates: { index: number; price: number; originalText: string }[] = [];

      for (let i = 0; i < blocks.length; i++) {
        if (processedIndices.has(i)) continue;

        const block = blocks[i];

        // Skip lines with @ symbol (e.g., "6 @ s0.29" - these show quantity × unit price, not final price)
        // Skip lines with % symbol (e.g., "$4.99 9.75%" - tax calculations)
        // Skip lines with "item_code + price" format (e.g., "69 $0.29" - unit price, not final total)
        if (block.text.includes('@') || block.text.includes('%')) {
          continue;
        }

        // Skip lines that are ONLY "number + space + $price" (e.g., "69 $0.29")
        // These are quantity/unit price calculations, not final item prices
        if (block.text.match(/^\d+\s+[\$Ss]\d+\.\d{2}$/)) {
          console.log(`⏭️ Skipping unit price line: "${block.text}"`);
          continue;
        }

        // Extract price from the line
        let priceStr = '';
        let hasDollarSign = false;

        if (block.text.includes('$')) {
          // Handle OCR errors in prices with spaces: "$4 4.99" → "$4.99", "$0.1 10" → "$0.10"
          let cleanedText = block.text;

          // Fix: commas as decimal separators: "$1,12" → "$1.12", "$2,99" → "$2.99", "$23,16" → "$23.16"
          cleanedText = cleanedText.replace(/\$(\d+),(\d{2})/g, '$$$1.$2');

          // Fix: "digit space digit.dd" pattern → "digit.dd" (e.g., "$4 4.99" → "$4.99", "3 3.49" → "3.49")
          cleanedText = cleanedText.replace(/\$?\d+\s+(\d+\.\d{2})/g, '$$$1');

          // Fix: "$digit space digit" within decimal → "$digit.digit" (e.g., "$0.1 10" → "$0.10")
          cleanedText = cleanedText.replace(/\$(\d+)\.(\d)\s+(\d)/g, '$$$1.$2$3');

          // Clean up other malformed patterns
          cleanedText = cleanedText.replace(/\.\s*\./g, '.').replace(/\$\s+/g, '$');

          // Extract price: $ followed by digits with optional decimal
          const dollarMatch = cleanedText.match(/\$(\d+\.?\d*)/);
          if (dollarMatch) {
            priceStr = dollarMatch[1];
            hasDollarSign = true;
          }
        } else if (block.text.match(/[Ss]\d+\.\d{2}/)) {
          // Handle OCR error: "S0.29" instead of "$0.29" (including "6 @ S0.29")
          const sMatch = block.text.match(/[Ss](\d+\.\d{2})/);
          if (sMatch) {
            priceStr = sMatch[1];
            hasDollarSign = true; // Treat S as $
          }
        } else {
          // No $ or S sign - handle patterns like "3 3.49" → "3.49", ".99", "49", etc.
          let priceText = block.text;

          // Fix: "digit space digit.dd" pattern → "digit.dd"
          priceText = priceText.replace(/\d+\s+(\d+\.\d{2})/g, '$1');

          // Remove remaining spaces and double dots
          priceText = priceText.replace(/\s+/g, '').replace(/\.\./g, '.');

          // Try to match decimal prices like ".99", "3.49", etc.
          let priceMatch = priceText.match(/^(\d*\.\d{2})$/);

          if (priceMatch) {
            priceStr = priceMatch[1];
            // If starts with decimal, add leading zero
            if (priceStr.startsWith('.')) {
              priceStr = '0' + priceStr;
            }
          } else {
            // Try integer prices like "49", "40" (rare but possible)
            priceMatch = priceText.match(/^(\d{1,2})$/);
            if (priceMatch) {
              // Could be cents (49 = $0.49) or dollars (40 = $40.00)
              // Since most items are under $50, assume these are prices in dollar format
              priceStr = priceMatch[1];
              // Don't add decimal here, let the parsing handle it
            } else {
              continue;
            }
          }
        }

        if (!priceStr) continue;

        pricesFound++;

        // Try to detect split prices (e.g., "$3" on one line, "49" on next = "$3.49")
        if (hasDollarSign && !priceStr.includes('.') && priceStr.length <= 2) {
          const nextBlock = blocks[i + 1];
          if (nextBlock && nextBlock.text.match(/^\d{1,2}$/) && !processedIndices.has(i + 1)) {
            priceStr = priceStr + '.' + nextBlock.text;
            console.log(`🔗 Merged split price: "${block.text}" + "${nextBlock.text}" = "$${priceStr}"`);
            processedIndices.add(i + 1);
            hasDollarSign = true;
          }
        }

        // If we have a price without decimal and no dollar sign, it's ambiguous
        // For now, skip these as they're likely not prices
        if (!priceStr.includes('.') && !hasDollarSign) {
          continue;
        }

        // Ensure decimal format for prices
        if (!priceStr.includes('.') && hasDollarSign) {
          if (priceStr.length === 3) {
            // "349" -> "3.49"
            priceStr = priceStr.substring(0, 1) + '.' + priceStr.substring(1);
          } else if (priceStr.length === 2) {
            // "49" -> "0.49"
            priceStr = '0.' + priceStr;
          } else if (priceStr.length === 1) {
            // "5" -> "5.00"
            priceStr = priceStr + '.00';
          }
        }

        const price = parseFloat(priceStr);

        // Skip unreasonable prices (too small or too large - likely totals)
        if (price < 0.01 || price > 50) continue;

        console.log(`💵 Price candidate: "${block.text}" → $${price}`);
        priceCandidates.push({ index: i, price, originalText: block.text });
      }

      console.log(`💵 Found ${priceCandidates.length} price candidates (before limiting)`);

      // Step 3: Limit prices to match number of items (take first N prices)
      const limitedPrices = priceCandidates.slice(0, mergedItemCandidates.length);
      console.log(`💵 Using ${limitedPrices.length} prices to match ${mergedItemCandidates.length} items`);

      // Step 4: Match sequentially
      const matchCount = Math.min(mergedItemCandidates.length, limitedPrices.length);
      for (let i = 0; i < matchCount; i++) {
        const item = mergedItemCandidates[i];
        const priceInfo = limitedPrices[i];

        console.log(`🔗 Sequential match #${i+1}: "${item.text}" → $${priceInfo.price}`);

        itemsWithPosition.push({
          name: item.text.trim(),
          totalPrice: priceInfo.price,
          quantity: 1,
          position: priceInfo.index,
        });

        processedIndices.add(item.index);
        processedIndices.add(priceInfo.index);
        pricesMatched++;
      }

      if (mergedItemCandidates.length !== priceCandidates.length) {
        console.log(`⚠️ Mismatch: ${mergedItemCandidates.length} items vs ${priceCandidates.length} prices`);
      }

    } else {
      // PROXIMITY MATCHING when we have bounding boxes
      console.log('📍 Using PROXIMITY matching with bounding boxes');

      for (let i = 0; i < blocks.length; i++) {
        if (processedIndices.has(i)) continue;

        if (paymentStartIdx !== -1 && i >= paymentStartIdx) {
          const priceY = blocks[i].yPos;
          const paymentY = blocks[paymentStartIdx].yPos;
          if (priceY >= paymentY) {
            pricesSkipped++;
            continue;
          }
        }

        const block = blocks[i];
        const priceText = block.text.replace(/\s+/g, '').replace(/\.\./g, '.');
        let priceMatch = priceText.match(/^\$?(\d{1,3}\.?\d{0,2})/);

        if (!priceMatch) {
          priceMatch = priceText.match(/^(\d+\.\d{2})/);
        }

        if (priceMatch) {
          pricesFound++;
          let priceStr = priceMatch[1];
          const hasDecimal = priceStr.includes('.');
          const hasDollarSign = block.text.trim().startsWith('$');

          const finalHasDecimal = priceStr.includes('.');

          if (!finalHasDecimal && !hasDollarSign) {
            continue;
          }

          if (!finalHasDecimal && hasDollarSign && priceStr.length === 3) {
            priceStr = priceStr.substring(0, 1) + '.' + priceStr.substring(1);
          } else if (!finalHasDecimal && hasDollarSign && priceStr.length === 2) {
            priceStr = '0.' + priceStr;
          }

          const price = parseFloat(priceStr);

          if (price < 0.01 || price > 100) continue;

          let bestMatch = null;
          let bestDistance = Infinity;

          for (let j = 0; j < blocks.length; j++) {
            if (processedIndices.has(j) || i === j) continue;

            const candidate = blocks[j];

            if (paymentStartIdx !== -1) {
              const candidateY = candidate.yPos;
              const paymentY = blocks[paymentStartIdx].yPos;
              if (candidateY >= paymentY) continue;
            }

            if (candidate.text.match(/^\$?\d+\.?\d{0,2}$/)) continue;
            if (candidate.text.match(/^\d+[,.]?\d*%?$/)) continue;
            if (candidate.text.match(/^\$[\d\s.]+$/)) continue;
            if (candidate.text.match(/^\*+\d+$/)) continue;
            if (candidate.text.match(/^\d{3,}$/)) continue;
            if (candidate.text.match(/\d+\s+[Ss]\$?\d+\.\d{2}/)) continue;
            if (candidate.text.match(/^\w{1,3}:$/)) continue;
            if (candidate.text.match(/^[A-Z][a-z]*,\s*[A-Z]/)) continue;
            if (candidate.text.match(/\*{3,}/)) continue;
            if (candidate.text.match(/^\w+:\s*\*+/)) continue;
            if (candidate.text.match(/^[A-Z]{2,}[a-z]+\d+$/)) continue;
            if (candidate.text.match(/,\s*[A-Z]{2}$/)) continue;
            if (candidate.text.match(/^\d{5}(-\d{4})?$/)) continue;

            const lowerName = candidate.text.toLowerCase();
            const shouldSkip = skipKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()));
            const isModifier = modifierKeywords.some(keyword => lowerName.includes(keyword.toLowerCase())) &&
                               candidate.text.split(' ').length <= 2;
            const hasLetters = (candidate.text.match(/[a-zA-Z]/g) || []).length >= 3;

            const isSingleWord = candidate.text.split(/\s+/).length === 1;
            const isTitleCase = candidate.text.length > 2 &&
                               candidate.text[0] === candidate.text[0].toUpperCase() &&
                               candidate.text.slice(1) === candidate.text.slice(1).toLowerCase();
            const likelyCashierName = isSingleWord && isTitleCase && candidate.text.length < 15;

            if (
              candidate.text.length >= 3 &&
              candidate.text.length <= 50 &&
              hasLetters &&
              !shouldSkip &&
              !isModifier &&
              !likelyCashierName &&
              candidate.text !== storeName &&
              candidate.text !== storeAddress
            ) {
              const yDistance = Math.abs(blocks[i].yPos - candidate.yPos);
              const xDistance = Math.abs(blocks[i].xPos - candidate.xPos);
              const distance = yDistance + (xDistance * 0.1);

              let penalty = candidate.xPos > blocks[i].xPos ? 5 : 0;

              const totalDistance = distance + penalty;

              if (totalDistance < bestDistance) {
                bestDistance = totalDistance;
                bestMatch = j;
              }
            }
          }

          const distanceThreshold = 50;
          if (bestMatch !== null && bestDistance <= distanceThreshold) {
            const matchedName = blocks[bestMatch].text.trim();
            console.log(`🔗 Matched: "${matchedName}" ($${price}) - dist: ${bestDistance.toFixed(1)}px`);

            itemsWithPosition.push({
              name: matchedName,
              totalPrice: price,
              quantity: 1,
              position: i,
            });
            processedIndices.add(i);
            processedIndices.add(bestMatch);
            pricesMatched++;
          } else if (bestMatch !== null) {
            console.log(`❌ No match for price $${price} - best distance: ${bestDistance.toFixed(1)}px`);
          } else {
            console.log(`❌ No candidates found for price $${price}`);
          }
        }
      }
    }

    console.log('💵 Price matching summary:', {
      found: pricesFound,
      skipped: pricesSkipped,
      matched: pricesMatched,
      totalBlocks: blocks.length
    });

    // Sort items by their original position on the receipt
    itemsWithPosition.sort((a, b) => a.position - b.position);

    // Remove position field and create final items array
    // NOTE: Do NOT deduplicate by price - different items can have the same price!
    const items = itemsWithPosition.map(({ position, ...item }) => item);

    console.log('📦 Parsed items (in order):', items);

    // Calculate subtotal from items if not found in OCR
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    if (subtotal === 0 && calculatedSubtotal > 0) {
      subtotal = calculatedSubtotal;
    }

    // Validate and recalculate total if needed
    let finalTotal = total;
    const expectedTotal = subtotal + tax + tip;

    // If OCR total is way off or missing, use calculated total
    if (total === 0 || Math.abs(total - expectedTotal) > 1.0) {
      finalTotal = expectedTotal;
      console.log('⚠️ Total recalculated:', {
        ocrTotal: total,
        calculatedTotal: finalTotal,
        subtotal,
        tax,
        tip,
      });
    }

    console.log('💰 Final amounts:', {
      items: items.length,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      tip: tip.toFixed(2),
      total: finalTotal.toFixed(2),
    });

    return {
      storeName,
      storeAddress,
      date: date.toISOString(),
      items,
      total: finalTotal,
      subtotal,
      tax,
      tip,
      ocrMethod: 'on-device',
      ocrConfidence: 70,
    };
    } catch (error: any) {
      console.error('❌ Error in parseReceiptText:', error);
      if (error?.stack) {
        console.error('Error stack:', error.stack);
      }
      // Return empty receipt on error
      return {
        storeName: 'Error parsing receipt',
        storeAddress: '',
        date: new Date().toISOString(),
        items: [],
        total: 0,
        subtotal: 0,
        tax: 0,
        tip: 0,
        ocrMethod: 'on-device',
        ocrConfidence: 0,
      };
    }
  };

  const createManualReceipt = () => {
    console.log('📝 Creating manual receipt entry form');
    setReceiptData({
      storeName: '',
      storeAddress: '',
      date: new Date().toISOString(),
      items: [{ name: '', totalPrice: 0, quantity: 1 }],
      total: 0,
      subtotal: 0,
      tax: 0,
      tip: 0,
      ocrMethod: 'manual',
    });
  };

  // Helper function to recalculate subtotal and total based on item prices, tax, and tip
  const recalculateTotals = (data: any) => {
    // Calculate subtotal from item prices
    const calculatedSubtotal = data.items.reduce((sum: number, item: any) => {
      const price = typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice;
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    // Get tax and tip values
    const tax = typeof data.tax === 'string' ? parseFloat(data.tax) : (typeof data.tax === 'number' ? data.tax : 0);
    const tip = typeof data.tip === 'string' ? parseFloat(data.tip) : (typeof data.tip === 'number' ? data.tip : 0);

    // Calculate total
    const calculatedTotal = calculatedSubtotal + (isNaN(tax) ? 0 : tax) + (isNaN(tip) ? 0 : tip);

    return {
      ...data,
      subtotal: calculatedSubtotal,
      total: calculatedTotal
    };
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

          <Text style={styles.label}>Store Address (Optional)</Text>
          <TextInput
            style={styles.input}
            value={receiptData.storeAddress || ''}
            onChangeText={(text) =>
              setReceiptData({ ...receiptData, storeAddress: text })
            }
            placeholder="Enter store address"
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
                value={typeof item.totalPrice === 'string' ? item.totalPrice : (item.totalPrice === 0 ? '' : item.totalPrice.toString())}
                onChangeText={(text) => {
                  const newItems = [...receiptData.items];
                  // Store as string while editing to preserve decimals like "5."
                  if (text === '' || text === '0') {
                    newItems[index].totalPrice = 0;
                  } else if (text === '.' || text === '0.') {
                    newItems[index].totalPrice = text; // Keep as string
                  } else if (/^\d*\.?\d*$/.test(text)) {
                    // Valid number format, keep as string while editing
                    newItems[index].totalPrice = text;
                  }
                  setReceiptData({ ...receiptData, items: newItems });
                }}
                onBlur={() => {
                  // Convert to number when user finishes editing and recalculate totals
                  const newItems = [...receiptData.items];
                  const value = newItems[index].totalPrice;
                  if (typeof value === 'string') {
                    const parsed = parseFloat(value);
                    newItems[index].totalPrice = isNaN(parsed) ? 0 : parsed;
                    // Recalculate subtotal and total
                    const updatedData = recalculateTotals({ ...receiptData, items: newItems });
                    setReceiptData(updatedData);
                  }
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  const newItems = receiptData.items.filter((_: any, i: number) => i !== index);
                  // Recalculate subtotal and total after deleting item
                  const updatedData = recalculateTotals({ ...receiptData, items: newItems });
                  setReceiptData(updatedData);
                }}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
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

          <Text style={styles.label}>Subtotal</Text>
          <TextInput
            style={styles.input}
            value={typeof receiptData.subtotal === 'string' ? receiptData.subtotal : (receiptData.subtotal === 0 ? '' : receiptData.subtotal?.toString() || '')}
            onChangeText={(text) => {
              if (text === '' || text === '0') {
                setReceiptData({ ...receiptData, subtotal: 0 });
              } else if (text === '.' || text === '0.') {
                setReceiptData({ ...receiptData, subtotal: text });
              } else if (/^\d*\.?\d*$/.test(text)) {
                setReceiptData({ ...receiptData, subtotal: text });
              }
            }}
            onBlur={() => {
              if (typeof receiptData.subtotal === 'string') {
                const parsed = parseFloat(receiptData.subtotal);
                const subtotal = isNaN(parsed) ? 0 : parsed;
                const tax = typeof receiptData.tax === 'string' ? parseFloat(receiptData.tax) : (typeof receiptData.tax === 'number' ? receiptData.tax : 0);
                const tip = typeof receiptData.tip === 'string' ? parseFloat(receiptData.tip) : (typeof receiptData.tip === 'number' ? receiptData.tip : 0);
                const calculatedTotal = subtotal + (isNaN(tax) ? 0 : tax) + (isNaN(tip) ? 0 : tip);
                setReceiptData({
                  ...receiptData,
                  subtotal,
                  total: calculatedTotal
                });
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Tax</Text>
          <TextInput
            style={styles.input}
            value={typeof receiptData.tax === 'string' ? receiptData.tax : (receiptData.tax === 0 ? '' : receiptData.tax?.toString() || '')}
            onChangeText={(text) => {
              if (text === '' || text === '0') {
                setReceiptData({ ...receiptData, tax: 0 });
              } else if (text === '.' || text === '0.') {
                setReceiptData({ ...receiptData, tax: text });
              } else if (/^\d*\.?\d*$/.test(text)) {
                setReceiptData({ ...receiptData, tax: text });
              }
            }}
            onBlur={() => {
              if (typeof receiptData.tax === 'string') {
                const parsed = parseFloat(receiptData.tax);
                const tax = isNaN(parsed) ? 0 : parsed;
                // Recalculate subtotal and total
                const updatedData = recalculateTotals({ ...receiptData, tax });
                setReceiptData(updatedData);
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Tip (Optional)</Text>
          <TextInput
            style={styles.input}
            value={typeof receiptData.tip === 'string' ? receiptData.tip : (receiptData.tip === 0 ? '' : receiptData.tip?.toString() || '')}
            onChangeText={(text) => {
              if (text === '' || text === '0') {
                setReceiptData({ ...receiptData, tip: 0 });
              } else if (text === '.' || text === '0.') {
                setReceiptData({ ...receiptData, tip: text });
              } else if (/^\d*\.?\d*$/.test(text)) {
                setReceiptData({ ...receiptData, tip: text });
              }
            }}
            onBlur={() => {
              if (typeof receiptData.tip === 'string') {
                const parsed = parseFloat(receiptData.tip);
                const tip = isNaN(parsed) ? 0 : parsed;
                // Recalculate subtotal and total
                const updatedData = recalculateTotals({ ...receiptData, tip });
                setReceiptData(updatedData);
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Total (Auto-calculated)</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={receiptData.total === 0 ? '0.00' : receiptData.total?.toFixed(2) || '0.00'}
            editable={false}
            placeholder="0.00"
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
    alignItems: 'center',
  },
  itemName: {
    flex: 2,
    marginRight: 8,
  },
  itemPrice: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
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
  readOnlyInput: {
    backgroundColor: '#e8e8e8',
    color: '#666',
  },
});
