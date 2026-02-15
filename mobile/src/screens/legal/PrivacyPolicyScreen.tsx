import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last Updated: February 14, 2026</Text>

      <Text style={styles.sectionTitle}>Introduction</Text>
      <Text style={styles.paragraph}>
        SmartReceipt ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services, including our advanced price tracking and alert features.
      </Text>

      <Text style={styles.sectionTitle}>Information We Collect</Text>

      <Text style={styles.subsectionTitle}>1. Account Information</Text>
      <Text style={styles.paragraph}>
        • Email address (required for account creation and notifications){'\n'}
        • Name (optional, for personalization){'\n'}
        • Password (encrypted and securely stored)
      </Text>

      <Text style={styles.subsectionTitle}>2. Receipt Data</Text>
      <Text style={styles.paragraph}>
        • Receipt images (temporarily processed for OCR text extraction){'\n'}
        • Purchase information: Store names and addresses, purchase dates and times, item names and prices, product categories, total amounts, tax, and tips{'\n'}
        • Receipt metadata: OCR confidence scores, verification status, user notes
      </Text>

      <Text style={styles.subsectionTitle}>3. Price Tracking Data (Phase 2)</Text>
      <Text style={styles.paragraph}>
        • Watched items: Products you choose to track for price changes{'\n'}
        • Original purchase prices: Prices you paid for items{'\n'}
        • Price alert preferences: Your notification threshold settings (10%, 20%, 30% drops){'\n'}
        • Price history: Historical price data collected from multiple retailers{'\n'}
        • Best prices found: Lowest prices discovered during monitoring{'\n'}
        • Savings calculations: Computed savings compared to original prices
      </Text>

      <Text style={styles.subsectionTitle}>4. Technical Information</Text>
      <Text style={styles.paragraph}>
        • Device information: Device type, operating system, app version{'\n'}
        • Push notification tokens: For delivering price drop alerts{'\n'}
        • Usage analytics: App features used, screen views, interaction patterns{'\n'}
        • Error logs: Crash reports and performance data (anonymized)
      </Text>

      <Text style={styles.subsectionTitle}>5. Location Data</Text>
      <Text style={styles.paragraph}>
        • Store locations: Derived from receipt addresses (not real-time tracking){'\n'}
        • We do NOT collect real-time GPS location data{'\n'}
        • We do NOT track your movements
      </Text>

      <Text style={styles.sectionTitle}>How We Use Your Information</Text>

      <Text style={styles.subsectionTitle}>Core Features</Text>
      <Text style={styles.paragraph}>
        1. Receipt Management: Store, organize, and categorize your receipts{'\n'}
        2. Spending Analytics: Provide insights into your purchasing patterns{'\n'}
        3. Receipt Search: Enable you to find past purchases quickly
      </Text>

      <Text style={styles.subsectionTitle}>Price Tracking Features (Phase 2)</Text>
      <Text style={styles.paragraph}>
        1. Automated Price Monitoring: Track prices for items from your receipts for 30 days, scrape public price data from major retailers (Amazon, Walmart, Target, Kroger, etc.){'\n'}
        2. Price Drop Alerts: Send push notifications when prices drop below your thresholds{'\n'}
        3. Savings Calculations: Calculate potential savings compared to original prices
      </Text>

      <Text style={styles.sectionTitle}>Price Data Collection</Text>

      <Text style={styles.subsectionTitle}>Web Scraping Practices</Text>
      <Text style={styles.paragraph}>
        We collect publicly available price data from retailer websites through automated scraping:{'\n\n'}
        • Retailers monitored: Amazon, Walmart, Target, Kroger, Costco, Sam's Club, and other major stores{'\n'}
        • Data collected: Product names, prices, availability, URLs{'\n'}
        • Frequency: Daily automated checks (runs at 2 AM UTC){'\n'}
        • Compliance: We respect robots.txt files and implement rate limiting{'\n'}
        • Purpose: Provide you with the best price information for your tracked items
      </Text>

      <Text style={styles.subsectionTitle}>No Personal Data Shared</Text>
      <Text style={styles.paragraph}>
        • Your purchase history is NEVER shared with retailers{'\n'}
        • Retailers cannot see what you bought or when{'\n'}
        • Price checks are performed anonymously{'\n'}
        • We do not sell or share your data with price comparison partners
      </Text>

      <Text style={styles.sectionTitle}>Data Storage and Security</Text>

      <Text style={styles.subsectionTitle}>Storage Location</Text>
      <Text style={styles.paragraph}>
        • Primary Database: MongoDB Atlas (cloud-hosted, encrypted){'\n'}
        • Cache Layer: Redis (optional, session data only){'\n'}
        • Backup: Daily automated backups with 30-day retention{'\n'}
        • Server: Oracle Cloud Infrastructure (secured with industry-standard practices)
      </Text>

      <Text style={styles.subsectionTitle}>Security Measures</Text>
      <Text style={styles.paragraph}>
        • Encryption: All data in transit uses HTTPS/TLS{'\n'}
        • Password Security: Bcrypt hashing with salt{'\n'}
        • Authentication: JWT tokens with expiration{'\n'}
        • Access Control: Role-based permissions{'\n'}
        • Network Security: Firewall rules and DDoS protection{'\n'}
        • Monitoring: Automated security alerts and logging
      </Text>

      <Text style={styles.subsectionTitle}>Data Retention</Text>
      <Text style={styles.paragraph}>
        • Active accounts: Data retained indefinitely while account is active{'\n'}
        • Price watches: Automatically expire after 30 days{'\n'}
        • Deleted accounts: Data permanently deleted within 30 days{'\n'}
        • Receipts: Retained until you delete them or close your account{'\n'}
        • Price history: Retained for the duration of price watch (30 days)
      </Text>

      <Text style={styles.sectionTitle}>Your Privacy Rights</Text>

      <Text style={styles.subsectionTitle}>Access and Control</Text>
      <Text style={styles.paragraph}>
        You have the right to:{'\n'}
        • Access all your data through the app{'\n'}
        • Export your receipt data in standard formats{'\n'}
        • Update your account information at any time{'\n'}
        • Delete individual receipts or your entire account{'\n'}
        • Opt-out of price tracking for specific items or all items{'\n'}
        • Control notification preferences and alert thresholds
      </Text>

      <Text style={styles.subsectionTitle}>Data Deletion</Text>
      <Text style={styles.paragraph}>
        To delete your account and all associated data:{'\n'}
        1. Open the SmartReceipt app{'\n'}
        2. Go to Settings → Account → Delete Account{'\n'}
        3. Confirm deletion{'\n'}
        4. All data will be permanently deleted within 30 days{'\n\n'}
        Or email us at privacy@smartreceipt.app
      </Text>

      <Text style={styles.sectionTitle}>Push Notifications</Text>

      <Text style={styles.subsectionTitle}>Types of Notifications</Text>
      <Text style={styles.paragraph}>
        1. Price Drop Alerts: When tracked item prices fall below your thresholds{'\n'}
        2. Expiration Reminders: When price watches are about to expire (optional){'\n'}
        3. Service Notifications: Critical app updates or maintenance (rare)
      </Text>

      <Text style={styles.subsectionTitle}>Notification Controls</Text>
      <Text style={styles.paragraph}>
        • Enable/disable notifications in device settings{'\n'}
        • Customize alert thresholds (10%, 20%, 30% price drops){'\n'}
        • Opt-out of specific notification types in app settings{'\n'}
        • Unsubscribe from all notifications while keeping account active
      </Text>

      <Text style={styles.sectionTitle}>Contact Us</Text>
      <Text style={styles.paragraph}>
        For privacy-related questions, concerns, or requests:{'\n\n'}
        Email: privacy@smartreceipt.app{'\n'}
        Data Protection Officer: dpo@smartreceipt.app{'\n\n'}
        Response Time: We aim to respond within 48 hours
      </Text>

      <Text style={styles.sectionTitle}>Consent</Text>
      <Text style={styles.paragraph}>
        By creating an account and using SmartReceipt, you consent to:{'\n'}
        • Collection and processing of your data as described in this policy{'\n'}
        • Automated price monitoring of items from your receipts{'\n'}
        • Push notifications about price drops (can be disabled){'\n'}
        • Use of cookies and similar technologies for app functionality{'\n\n'}
        You can withdraw consent at any time by deleting your account or contacting us.
      </Text>

      <Text style={styles.footer}>
        Version: 2.0 (Phase 2 - Price Tracking){'\n'}
        Effective Date: February 14, 2026
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  updated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    marginBottom: 12,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    marginTop: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
