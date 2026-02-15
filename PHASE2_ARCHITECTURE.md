# Phase 2: Price Tracking & Drop Alerts - Architecture Document

## 🎯 **Objective**
Build a 30-day price tracking system with drop alerts using **100% FREE services** to maintain zero operational costs for <100 users.

---

## 📊 **System Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Flow                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. User scans receipt → Items extracted                        │
│  2. Items auto-added to 30-day price watch                      │
│  3. Daily cron checks prices across stores                      │
│  4. Price drops trigger push notifications                      │
│  5. User views savings dashboard & price history                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **Architecture Components**

### **1. Data Model**

#### **PriceWatch Schema**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  receiptId: ObjectId,
  itemName: string,              // "Organic Milk 1 Gallon"
  normalizedName: string,        // "milk organic"
  category: string,              // "Groceries"
  originalPrice: number,         // 4.99
  storeName: string,             // "Trader Joe's"
  purchaseDate: Date,
  expiresAt: Date,               // 30 days from purchase

  // Tracking configuration
  thresholds: {
    anyDrop: boolean,            // Alert on any price drop
    percent10: boolean,          // Alert on 10% drop
    percent20: boolean,          // Alert on 20% drop
    percent30: boolean,          // Alert on 30% drop
  },

  // Status
  isActive: boolean,
  lastCheckedAt: Date,
  bestPriceFound: {
    price: number,
    store: string,
    date: Date,
    url: string
  },

  createdAt: Date,
  updatedAt: Date
}
```

#### **PriceHistory Schema**
```typescript
{
  _id: ObjectId,
  priceWatchId: ObjectId,
  store: string,                 // "Walmart", "Target", "Amazon"
  price: number,
  currency: string,              // "USD"
  inStock: boolean,
  productUrl: string,
  scrapedAt: Date,

  // Metadata
  productId: string,             // Store-specific product ID
  upc: string,                   // Universal Product Code (if available)

  createdAt: Date
}
```

#### **PriceAlert Schema**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  priceWatchId: ObjectId,

  // Alert details
  type: string,                  // "price_drop", "threshold_met", "expiring_soon"
  message: string,

  // Price context
  originalPrice: number,
  newPrice: number,
  savings: number,
  savingsPercent: number,
  store: string,

  // Delivery status
  notificationSent: boolean,
  sentAt: Date,

  createdAt: Date
}
```

#### **UserPreferences Schema** (extend existing User model)
```typescript
{
  priceAlerts: {
    enabled: boolean,            // Master toggle
    thresholds: {
      anyDrop: boolean,
      percent10: boolean,
      percent20: boolean,
      percent30: boolean,
    },
    quietHours: {
      enabled: boolean,
      start: string,             // "22:00"
      end: string,               // "08:00"
    },
    maxAlertsPerDay: number,     // Rate limiting
  },

  pushNotificationToken: string, // FCM/Expo token
}
```

---

## 🆓 **Free Tier Services Strategy**

### **A. Price Data Sources** (100% Free)

#### **Option 1: Public Price APIs** ✅ **RECOMMENDED**

**1. Rainforest API (Free Tier)**
- Service: https://www.rainforestapi.com/
- Free Tier: 1,000 requests/month
- Coverage: Amazon, Walmart
- Rate Limit: ~33 requests/day
- **Strategy**: Prioritize high-value items

**2. Open Food Facts API** ✅ **FREE & UNLIMITED**
- Service: https://world.openfoodfacts.org/api
- Coverage: 2M+ grocery products worldwide
- Data: Prices, stores, barcodes, nutrition
- **Best For**: Groceries (perfect for receipts!)
- Rate Limit: None (just be respectful)

**3. USDA FoodData Central** ✅ **FREE**
- Service: https://fdc.nal.usda.gov/api-guide.html
- Coverage: Food items with average prices
- Free Tier: Unlimited
- **Use**: Price benchmarking

**4. Google Shopping Scraper (Free Tier)**
- Service: SerpApi free tier - 100 searches/month
- Alternative: ScraperAPI - 1,000 credits/month free
- **Strategy**: Reserve for high-value items

#### **Option 2: Web Scraping** ✅ **COMPLETELY FREE**

**Store Selection** (easiest to scrape):
1. **Walmart.com** - Good HTML structure
2. **Target.com** - API-like responses
3. **Kroger.com** - Regional grocery
4. **Amazon** - Complex but doable

**Implementation**:
```typescript
// Lightweight scraper using node-fetch + cheerio
// No browser automation = minimal resource usage
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function scrapeWalmartPrice(searchQuery: string) {
  const url = `https://www.walmart.com/search?q=${encodeURIComponent(searchQuery)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SmartReceiptBot/1.0)'
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract price from first result
  const firstProduct = $('[data-item-id]').first();
  const price = firstProduct.find('[data-automation-id="product-price"]').text();

  return parseFloat(price.replace(/[^0-9.]/g, ''));
}
```

**Scraping Strategy**:
- Use lightweight libraries (cheerio > puppeteer)
- Implement intelligent caching
- Respect robots.txt
- Add random delays (2-5 seconds between requests)
- Rotate User-Agent headers
- Store HTML parsing patterns in database (adapt to changes)

---

### **B. Scheduled Jobs** ✅ **FREE**

**Option 1: node-cron (Self-hosted)** ✅ **RECOMMENDED**
```typescript
import cron from 'node-cron';

// Run daily at 2 AM (low traffic time)
cron.schedule('0 2 * * *', async () => {
  await runDailyPriceCheck();
});

// Run hourly cleanup of expired watches
cron.schedule('0 * * * *', async () => {
  await cleanupExpiredWatches();
});
```

**Benefits**:
- Zero cost (runs on our server)
- No external dependencies
- Full control over timing

**Option 2: GitHub Actions (Free Tier)**
- 2,000 minutes/month for private repos
- Can trigger API endpoints
- **Use Case**: Backup cron if server goes down

---

### **C. Push Notifications** ✅ **FREE FOREVER**

**Option 1: Expo Push Notifications** ✅ **EASIEST**
```typescript
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotification(token: string, message: string) {
  const messages = [{
    to: token,
    sound: 'default',
    title: '💰 Price Drop Alert!',
    body: message,
    data: { priceWatchId: '...' },
  }];

  await expo.sendPushNotificationsAsync(messages);
}
```

**Features**:
- Completely free
- No limits
- Works with Expo apps
- Simple integration

**Option 2: Firebase Cloud Messaging (FCM)** ✅ **UNLIMITED**
- Google's push service
- Free forever
- Unlimited notifications
- More complex setup

**Recommendation**: Start with Expo, migrate to FCM if needed

---

### **D. Data Storage** ✅ **FREE TIER**

**MongoDB Atlas (Current)**
- Free Tier: 512 MB storage
- Enough for: ~50,000 price watch records + history

**Storage Optimization Strategy**:
1. **Time-based aggregation**:
   - Days 0-7: Store every price check
   - Days 8-30: Store daily average only
   - After 30 days: Archive or delete

2. **Compression**:
```typescript
// Store only price changes, not all checks
interface PriceHistoryOptimized {
  priceWatchId: ObjectId,
  checkDates: Date[],          // [Day1, Day2, Day3...]
  prices: number[],            // [4.99, 4.99, 4.79...]
  stores: string[],            // ["Walmart", "Walmart", "Target"]
  // Only 3 arrays vs. 30+ documents
}
```

3. **Cleanup cron**:
```typescript
// Delete watches older than 30 days
cron.schedule('0 3 * * *', async () => {
  await PriceWatch.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  await PriceHistory.deleteMany({
    createdAt: { $lt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) }
  });
});
```

**Redis (Current)**
- Free Tier: 25 MB (enough for caching)
- Cache API responses for 6 hours
- Cache product search results

---

## 🔄 **System Workflows**

### **Workflow 1: Auto-Add Items After Receipt Scan**

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User scans receipt                                        │
│ 2. OCR extracts items → ScanScreen.tsx                      │
│ 3. User confirms/edits items                                 │
│ 4. User clicks "Save Receipt"                                │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend: POST /api/v1/receipts                               │
│   - Save receipt to database                                 │
│   - For each item:                                           │
│     ├─ Create PriceWatch record                              │
│     ├─ Set expiresAt = purchaseDate + 30 days               │
│     ├─ Apply user's default alert thresholds                 │
│     └─ Normalize item name for searching                     │
│   - Return success + priceWatchIds                           │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Mobile: Show success message                                 │
│ "🎯 Tracking 8 items for price drops"                        │
│ [View Price Watch List]                                      │
└──────────────────────────────────────────────────────────────┘
```

**Code Example**:
```typescript
// server/src/controllers/receiptController.ts
async function createReceipt(req: Request, res: Response) {
  const { items, storeName, purchaseDate } = req.body;

  // Save receipt
  const receipt = await Receipt.create({...});

  // Auto-add items to price watch
  const priceWatches = await Promise.all(
    items.map(item => PriceWatch.create({
      userId: req.user.id,
      receiptId: receipt._id,
      itemName: item.name,
      normalizedName: normalizeItemName(item.name),
      originalPrice: item.totalPrice,
      storeName,
      purchaseDate: new Date(purchaseDate),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      thresholds: req.user.priceAlerts.thresholds,
      isActive: true,
    }))
  );

  res.json({
    receipt,
    priceWatchesCreated: priceWatches.length
  });
}
```

---

### **Workflow 2: Daily Price Check (Cron Job)**

```
┌──────────────────────────────────────────────────────────────┐
│ Cron: Every day at 2 AM                                      │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. Get all active price watches (not expired)                │
│    Query: { isActive: true, expiresAt: { $gt: now } }       │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Batch processing (100 items at a time)                    │
│    - Prevents memory overload                                │
│    - Allows for graceful error handling                      │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. For each item:                                            │
│    a) Check Redis cache for recent prices (6hr TTL)         │
│    b) If not cached:                                         │
│       - Search on Open Food Facts API (free)                 │
│       - Fallback to Walmart scraping                         │
│       - Fallback to Target scraping                          │
│    c) Save price to PriceHistory                             │
│    d) Update PriceWatch.lastCheckedAt                        │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Price Comparison & Alert Logic                            │
│    For each price found:                                     │
│    - Compare with originalPrice                              │
│    - Calculate savings = originalPrice - newPrice            │
│    - Calculate savingsPercent = (savings / original) * 100   │
│    - Check if any threshold met                              │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Trigger Alerts (if conditions met)                        │
│    - Create PriceAlert record                                │
│    - Send push notification via Expo                         │
│    - Respect quiet hours                                     │
│    - Respect max alerts per day limit                        │
└──────────────────────────────────────────────────────────────┘
```

**Code Example**:
```typescript
// server/src/services/priceCheckService.ts
import cron from 'node-cron';
import { PriceWatch, PriceHistory, PriceAlert } from '../models';
import { sendPushNotification } from './notificationService';
import { searchProductPrice } from './priceScraperService';
import { redisClient } from '../config/redis';

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🔍 Starting daily price check...');
  await runDailyPriceCheck();
});

async function runDailyPriceCheck() {
  const startTime = Date.now();

  // Get all active price watches
  const watches = await PriceWatch.find({
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('userId');

  console.log(`📊 Checking prices for ${watches.length} items`);

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < watches.length; i += batchSize) {
    const batch = watches.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(watch => checkPriceForWatch(watch))
    );

    // Add delay between batches to avoid rate limits
    if (i + batchSize < watches.length) {
      await sleep(5000); // 5 second delay
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`✅ Price check completed in ${duration}s`);
}

async function checkPriceForWatch(watch: any) {
  try {
    // Check cache first
    const cacheKey = `price:${watch.normalizedName}`;
    const cachedPrice = await redisClient.get(cacheKey);

    if (cachedPrice) {
      console.log(`💾 Cache hit for ${watch.itemName}`);
      return JSON.parse(cachedPrice);
    }

    // Search for current prices
    const priceData = await searchProductPrice(watch.normalizedName);

    if (!priceData || priceData.length === 0) {
      console.log(`❌ No prices found for ${watch.itemName}`);
      return;
    }

    // Save to cache (6 hours)
    await redisClient.setex(cacheKey, 6 * 60 * 60, JSON.stringify(priceData));

    // Save to price history
    for (const price of priceData) {
      await PriceHistory.create({
        priceWatchId: watch._id,
        store: price.store,
        price: price.price,
        inStock: price.inStock,
        productUrl: price.url,
        scrapedAt: new Date(),
      });
    }

    // Check for price drops
    const bestPrice = Math.min(...priceData.map(p => p.price));
    const savings = watch.originalPrice - bestPrice;
    const savingsPercent = (savings / watch.originalPrice) * 100;

    // Update best price found
    if (bestPrice < (watch.bestPriceFound?.price || Infinity)) {
      const bestPriceStore = priceData.find(p => p.price === bestPrice);
      watch.bestPriceFound = {
        price: bestPrice,
        store: bestPriceStore.store,
        date: new Date(),
        url: bestPriceStore.url,
      };
      await watch.save();
    }

    // Check thresholds and send alerts
    if (shouldSendAlert(watch, savings, savingsPercent)) {
      await createAndSendAlert(watch, bestPrice, savings, savingsPercent);
    }

    // Update last checked
    watch.lastCheckedAt = new Date();
    await watch.save();

  } catch (error) {
    console.error(`Error checking price for ${watch.itemName}:`, error);
  }
}

function shouldSendAlert(watch: any, savings: number, savingsPercent: number): boolean {
  const thresholds = watch.thresholds;

  // Check if user has alerts enabled
  if (!watch.userId.priceAlerts.enabled) return false;

  // Check quiet hours
  if (isQuietHours(watch.userId.priceAlerts.quietHours)) return false;

  // Check alert limits
  // (implementation of maxAlertsPerDay check)

  // Check thresholds
  if (thresholds.anyDrop && savings > 0) return true;
  if (thresholds.percent10 && savingsPercent >= 10) return true;
  if (thresholds.percent20 && savingsPercent >= 20) return true;
  if (thresholds.percent30 && savingsPercent >= 30) return true;

  return false;
}

async function createAndSendAlert(
  watch: any,
  newPrice: number,
  savings: number,
  savingsPercent: number
) {
  // Create alert record
  const alert = await PriceAlert.create({
    userId: watch.userId._id,
    priceWatchId: watch._id,
    type: 'price_drop',
    message: `${watch.itemName} dropped to $${newPrice.toFixed(2)} (${savingsPercent.toFixed(0)}% off!)`,
    originalPrice: watch.originalPrice,
    newPrice,
    savings,
    savingsPercent,
    store: watch.bestPriceFound.store,
    notificationSent: false,
  });

  // Send push notification
  if (watch.userId.pushNotificationToken) {
    await sendPushNotification(
      watch.userId.pushNotificationToken,
      {
        title: `💰 Price Drop Alert!`,
        body: alert.message,
        data: {
          type: 'price_drop',
          priceWatchId: watch._id.toString(),
          alertId: alert._id.toString(),
        },
      }
    );

    alert.notificationSent = true;
    alert.sentAt = new Date();
    await alert.save();
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

### **Workflow 3: Price Scraping Service**

```typescript
// server/src/services/priceScraperService.ts
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { redisClient } from '../config/redis';

interface PriceResult {
  store: string;
  price: number;
  inStock: boolean;
  url: string;
}

export async function searchProductPrice(normalizedName: string): Promise<PriceResult[]> {
  const results: PriceResult[] = [];

  // Strategy 1: Try Open Food Facts (free, unlimited)
  try {
    const offPrice = await searchOpenFoodFacts(normalizedName);
    if (offPrice) results.push(offPrice);
  } catch (error) {
    console.error('Open Food Facts error:', error);
  }

  // Strategy 2: Scrape Walmart
  try {
    const walmartPrice = await scrapeWalmart(normalizedName);
    if (walmartPrice) results.push(walmartPrice);
  } catch (error) {
    console.error('Walmart scraping error:', error);
  }

  // Strategy 3: Scrape Target (if < 50 requests today)
  const requestCount = await getRequestCountToday('target');
  if (requestCount < 50) {
    try {
      const targetPrice = await scrapeTarget(normalizedName);
      if (targetPrice) results.push(targetPrice);
      await incrementRequestCount('target');
    } catch (error) {
      console.error('Target scraping error:', error);
    }
  }

  return results;
}

async function searchOpenFoodFacts(query: string): Promise<PriceResult | null> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.products && data.products.length > 0) {
    const product = data.products[0];

    // Extract price (if available in product data)
    // Note: OFF doesn't always have prices, but has barcodes for matching
    return {
      store: 'Open Food Facts',
      price: 0, // Would need to be supplemented
      inStock: true,
      url: product.url || '',
    };
  }

  return null;
}

async function scrapeWalmart(query: string): Promise<PriceResult | null> {
  const searchUrl = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml',
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  // Walmart uses specific selectors (these may change)
  const firstProduct = $('[data-item-id]').first();
  const priceText = firstProduct.find('[data-automation-id="product-price"]').text();
  const productLink = firstProduct.find('a[link-identifier]').attr('href');

  if (priceText) {
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

    return {
      store: 'Walmart',
      price,
      inStock: true,
      url: productLink ? `https://www.walmart.com${productLink}` : searchUrl,
    };
  }

  return null;
}

async function scrapeTarget(query: string): Promise<PriceResult | null> {
  // Similar implementation to Walmart
  // Target's structure is different, adjust selectors accordingly
  return null; // Placeholder
}

async function getRequestCountToday(store: string): Promise<number> {
  const key = `scrape_count:${store}:${new Date().toISOString().split('T')[0]}`;
  const count = await redisClient.get(key);
  return count ? parseInt(count, 10) : 0;
}

async function incrementRequestCount(store: string): Promise<void> {
  const key = `scrape_count:${store}:${new Date().toISOString().split('T')[0]}`;
  await redisClient.incr(key);
  await redisClient.expire(key, 24 * 60 * 60); // Expire after 24 hours
}
```

---

## 📱 **Mobile App Components**

### **1. Price Watch List Screen**

```typescript
// mobile/src/screens/priceWatch/PriceWatchListScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { priceWatchAPI } from '../../services/api';

export default function PriceWatchListScreen({ navigation }: any) {
  const [watches, setWatches] = useState([]);
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

  const renderPriceWatch = ({ item }: any) => {
    const savings = item.originalPrice - (item.bestPriceFound?.price || item.originalPrice);
    const savingsPercent = (savings / item.originalPrice) * 100;

    return (
      <TouchableOpacity
        style={styles.watchCard}
        onPress={() => navigation.navigate('PriceHistory', { watchId: item._id })}
      >
        <View style={styles.watchHeader}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <View style={styles.daysLeft}>
            <Text style={styles.daysLeftText}>
              {Math.ceil((new Date(item.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))}d left
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.label}>You Paid</Text>
            <Text style={styles.originalPrice}>${item.originalPrice.toFixed(2)}</Text>
          </View>

          {item.bestPriceFound && (
            <View style={styles.bestPrice}>
              <Text style={styles.label}>Best Price</Text>
              <Text style={styles.newPrice}>${item.bestPriceFound.price.toFixed(2)}</Text>
              <Text style={styles.store}>{item.bestPriceFound.store}</Text>
            </View>
          )}

          {savings > 0 && (
            <View style={styles.savings}>
              <Text style={styles.savingsText}>
                💰 Save ${savings.toFixed(2)}
              </Text>
              <Text style={styles.savingsPercent}>
                ({savingsPercent.toFixed(0)}% off)
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={watches}
        renderItem={renderPriceWatch}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadPriceWatches} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              📊 No items being tracked yet
            </Text>
            <Text style={styles.emptySubtext}>
              Scan a receipt to start tracking prices!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  daysLeft: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysLeftText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textDecorationLine: 'line-through',
  },
  bestPrice: {
    alignItems: 'center',
  },
  newPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },
  store: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  savings: {
    alignItems: 'flex-end',
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
  },
  savingsPercent: {
    fontSize: 12,
    color: '#4caf50',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
```

### **2. Price History Detail Screen**

```typescript
// mobile/src/screens/priceWatch/PriceHistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { priceWatchAPI } from '../../services/api';

export default function PriceHistoryScreen({ route }: any) {
  const { watchId } = route.params;
  const [watch, setWatch] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadPriceHistory();
  }, []);

  const loadPriceHistory = async () => {
    try {
      const response = await priceWatchAPI.getHistory(watchId);
      setWatch(response.data.data.watch);
      setHistory(response.data.data.history);
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: history.map((h: any) =>
      new Date(h.scrapedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ).slice(-7), // Last 7 days
    datasets: [{
      data: history.map((h: any) => h.price).slice(-7),
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  return (
    <ScrollView style={styles.container}>
      {watch && (
        <>
          <View style={styles.header}>
            <Text style={styles.itemName}>{watch.itemName}</Text>
            <Text style={styles.originalPrice}>
              You paid: ${watch.originalPrice.toFixed(2)}
            </Text>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Price History (Last 7 Days)</Text>
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={styles.historyList}>
            <Text style={styles.sectionTitle}>Price Checks</Text>
            {history.map((item: any, index: number) => (
              <View key={index} style={styles.historyItem}>
                <View>
                  <Text style={styles.storeName}>{item.store}</Text>
                  <Text style={styles.date}>
                    {new Date(item.scrapedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  historyList: {
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
});
```

---

## 🔔 **Push Notification Setup**

### **1. Install Expo Notifications**

```bash
cd mobile
npm install expo-notifications
```

### **2. Configure Notifications**

```typescript
// mobile/src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authAPI } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('price-alerts', {
      name: 'Price Drop Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4caf50',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }

  // Get Expo push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Send token to backend
  await authAPI.updateProfile({ pushNotificationToken: token });

  return token;
}

export function setupNotificationListeners(navigation: any) {
  // Handle notification when app is in foreground
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle notification tap
  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;

    if (data.type === 'price_drop') {
      navigation.navigate('PriceHistory', { watchId: data.priceWatchId });
    }
  });
}
```

### **3. Backend Notification Service**

```typescript
// server/src/services/notificationService.ts
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

interface PushNotification {
  title: string;
  body: string;
  data?: any;
}

export async function sendPushNotification(
  token: string,
  notification: PushNotification
) {
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Invalid Expo push token: ${token}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    priority: 'high',
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', tickets);

    // Handle tickets (check for errors)
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error('Error sending notification:', ticket.message);
      }
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export async function sendBatchNotifications(notifications: Array<{
  token: string;
  notification: PushNotification;
}>) {
  const messages: ExpoPushMessage[] = notifications
    .filter(({ token }) => Expo.isExpoPushToken(token))
    .map(({ token, notification }) => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: 'high',
    }));

  // Send in chunks of 100 (Expo limit)
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Batch notification error:', error);
    }
  }
}
```

---

## 📊 **Savings Dashboard**

### **"Money Left on the Table" Feature**

```typescript
// server/src/controllers/priceWatchController.ts
export async function getSavingsMissed(req: Request, res: Response) {
  const { userId } = req.user;

  // Get all expired or current watches
  const watches = await PriceWatch.find({
    userId,
    bestPriceFound: { $exists: true },
  });

  let totalSavings = 0;
  const missedOpportunities = [];

  for (const watch of watches) {
    const savings = watch.originalPrice - watch.bestPriceFound.price;

    if (savings > 0) {
      totalSavings += savings;
      missedOpportunities.push({
        itemName: watch.itemName,
        savings,
        savingsPercent: (savings / watch.originalPrice) * 100,
        bestPrice: watch.bestPriceFound.price,
        store: watch.bestPriceFound.store,
        originalPrice: watch.originalPrice,
      });
    }
  }

  res.json({
    totalSavings: totalSavings.toFixed(2),
    opportunitiesCount: missedOpportunities.length,
    opportunities: missedOpportunities.sort((a, b) => b.savings - a.savings),
  });
}
```

---

## 🎯 **Performance Optimizations**

### **1. Intelligent Price Checking**

```typescript
// Only check high-value items frequently
function getPriceCheckFrequency(watch: any): number {
  if (watch.originalPrice > 50) return 1;  // Daily
  if (watch.originalPrice > 20) return 2;  // Every 2 days
  return 3;  // Every 3 days
}
```

### **2. Batch Processing**

```typescript
// Group items by store for efficient scraping
const itemsByStore = watches.reduce((acc, watch) => {
  const store = watch.storeName;
  if (!acc[store]) acc[store] = [];
  acc[store].push(watch);
  return acc;
}, {});
```

### **3. Redis Caching Strategy**

```typescript
// Cache price data by normalized name (dedupe across users)
const cacheKey = `price:${normalizedName}`;
await redisClient.setex(cacheKey, 6 * 60 * 60, JSON.stringify(priceData));

// Cache search results
const searchCacheKey = `search:${store}:${query}`;
await redisClient.setex(searchCacheKey, 12 * 60 * 60, JSON.stringify(results));
```

---

## 🔐 **Security & Rate Limiting**

### **1. Scraping Best Practices**

- Respect robots.txt
- Random delays (2-5 seconds)
- User-Agent rotation
- Rate limit per store (max 50/day initially)
- Graceful error handling
- Cache aggressively

### **2. User Rate Limits**

```typescript
// Limit API requests
app.use('/api/v1/price-watch', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
}));
```

---

## 📈 **Monitoring & Metrics**

### **Track These Metrics**

```typescript
// Daily metrics to log
{
  date: Date,
  priceChecksCompleted: number,
  priceChecksFailed: number,
  alertsSent: number,
  averageResponseTime: number,
  cacheHitRate: number,
  activeWatches: number,
  expiringWatches: number,
}
```

---

## 🚀 **Deployment Strategy**

### **Phase 2.1: MVP Launch** (Week 1-2)
- Basic price watch creation
- Single store scraping (Walmart only)
- Daily cron job
- Push notifications

### **Phase 2.2: Multi-Store** (Week 3-4)
- Add Target, Kroger support
- Price history charts
- Alert preferences

### **Phase 2.3: Optimization** (Week 5+)
- Caching improvements
- Batch notifications
- Savings dashboard

---

## 💰 **Final Cost Analysis**

| Service | Free Tier | Usage | Monthly Cost |
|---------|-----------|-------|--------------|
| MongoDB Atlas | 512 MB | Price history storage | **$0** |
| Redis | 25 MB | Caching | **$0** |
| Expo Push Notifications | Unlimited | All alerts | **$0** |
| Open Food Facts API | Unlimited | Primary price source | **$0** |
| Web Scraping (self-hosted) | N/A | Backup price source | **$0** |
| Cron Jobs (node-cron) | N/A | Runs on our server | **$0** |
| **TOTAL** | | | **$0/month** |

---

## ✅ **Success Criteria**

- [ ] 80%+ of items get price data within 24 hours
- [ ] <5% false positive alerts
- [ ] Notifications delivered in <5 minutes
- [ ] 90%+ cache hit rate for common items
- [ ] Zero API costs maintained

---

## 🎓 **Next Steps**

1. Review & approve this architecture
2. Set up Phase 2 development branch
3. Implement database models first
4. Build price scraping service
5. Set up cron jobs
6. Add push notifications
7. Build mobile UI
8. Test with real receipts
9. Deploy to production

---

**Questions? Concerns? Ready to start building?** 🚀
