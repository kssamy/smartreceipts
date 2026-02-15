import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms and Conditions</Text>
      <Text style={styles.updated}>Last Updated: February 14, 2026</Text>

      <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
      <Text style={styles.paragraph}>
        By accessing or using the SmartReceipt mobile application ("App"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these Terms, you may not access the App.
      </Text>
      <Text style={styles.highlight}>
        Important: These Terms include a binding arbitration clause and class action waiver, which affect your legal rights.
      </Text>

      <Text style={styles.sectionTitle}>2. Description of Service</Text>

      <Text style={styles.subsectionTitle}>Core Features</Text>
      <Text style={styles.paragraph}>
        • Receipt Scanning: Capture and digitize paper receipts using OCR technology{'\n'}
        • Receipt Management: Store, organize, and search your purchase history{'\n'}
        • Spending Analytics: Track spending patterns by category, store, and time period{'\n'}
        • Data Visualization: View charts and insights about your purchasing behavior
      </Text>

      <Text style={styles.subsectionTitle}>Phase 2 Features - Price Tracking</Text>
      <Text style={styles.paragraph}>
        • Automated Price Monitoring: Track prices for purchased items across multiple retailers for 30 days{'\n'}
        • Price Drop Alerts: Receive push notifications when prices fall below specified thresholds{'\n'}
        • Price Comparison: Compare prices from Amazon, Walmart, Target, Kroger, and other major retailers{'\n'}
        • Savings Calculations: View potential savings and best prices found{'\n'}
        • Price History: Access historical price trends and charts
      </Text>

      <Text style={styles.sectionTitle}>3. User Accounts</Text>

      <Text style={styles.subsectionTitle}>Account Creation</Text>
      <Text style={styles.paragraph}>
        • You must provide accurate and complete information{'\n'}
        • You must be at least 13 years old to create an account{'\n'}
        • You are responsible for maintaining account security{'\n'}
        • You are responsible for all activities under your account{'\n'}
        • You must not share your account credentials
      </Text>

      <Text style={styles.subsectionTitle}>Account Termination</Text>
      <Text style={styles.paragraph}>
        We reserve the right to terminate or suspend accounts that:{'\n'}
        • Violate these Terms{'\n'}
        • Engage in fraudulent or illegal activities{'\n'}
        • Abuse the service or harm other users{'\n'}
        • Remain inactive for over 2 years{'\n\n'}
        You may delete your account at any time through the App settings.
      </Text>

      <Text style={styles.sectionTitle}>4. Acceptable Use</Text>

      <Text style={styles.subsectionTitle}>You May</Text>
      <Text style={styles.paragraph}>
        • Use the App for personal, non-commercial purposes{'\n'}
        • Scan and store your own receipts{'\n'}
        • Track prices for items you have purchased{'\n'}
        • Share household accounts with family members (when feature is available)
      </Text>

      <Text style={styles.subsectionTitle}>You May Not</Text>
      <Text style={styles.paragraph}>
        • Use the App for illegal purposes{'\n'}
        • Attempt to hack, reverse engineer, or compromise the App{'\n'}
        • Upload receipts that are not yours without authorization{'\n'}
        • Create fake or fraudulent receipts{'\n'}
        • Abuse the price tracking system (e.g., excessive API calls){'\n'}
        • Scrape or harvest data from the App{'\n'}
        • Spam other users or send unsolicited communications{'\n'}
        • Impersonate others or misrepresent your identity{'\n'}
        • Use automated tools to access the App{'\n'}
        • Resell or redistribute our services
      </Text>

      <Text style={styles.sectionTitle}>5. Price Tracking Terms (Phase 2)</Text>

      <Text style={styles.subsectionTitle}>How Price Tracking Works</Text>
      <Text style={styles.paragraph}>
        1. When you scan a receipt, items are automatically added to your price watch list{'\n'}
        2. Our system monitors prices daily from major retailers{'\n'}
        3. You receive notifications when prices drop below your configured thresholds (default: 10%, 20%, 30%){'\n'}
        4. Price watches expire automatically after 30 days
      </Text>

      <Text style={styles.subsectionTitle}>Price Data Accuracy</Text>
      <Text style={styles.paragraph}>
        • No Guarantees: Price data is collected from public sources and may not always be accurate or current{'\n'}
        • Best Effort: We make reasonable efforts to provide accurate price information but cannot guarantee completeness{'\n'}
        • No Liability: We are not responsible for pricing errors, outdated data, or unavailable products{'\n'}
        • Retailer Changes: Retailers may change prices, availability, or policies at any time{'\n'}
        • Regional Variations: Prices may vary by location, delivery method, or membership status
      </Text>

      <Text style={styles.subsectionTitle}>Price Alerts</Text>
      <Text style={styles.paragraph}>
        • Alerts are sent on a best-effort basis and are not guaranteed{'\n'}
        • Notification delivery depends on device settings and network conditions{'\n'}
        • You are responsible for checking prices before making purchases{'\n'}
        • Links to products may expire or become unavailable
      </Text>

      <Text style={styles.subsectionTitle}>Retailer Relationships</Text>
      <Text style={styles.paragraph}>
        • No Affiliation: We are not affiliated with, endorsed by, or sponsored by any retailer{'\n'}
        • No Commissions: We do not receive compensation for directing you to specific retailers{'\n'}
        • Independent Service: Price comparison is provided as an independent, informational service{'\n'}
        • No Purchase Obligation: You are under no obligation to purchase from any retailer we link to
      </Text>

      <Text style={styles.sectionTitle}>6. User Content</Text>

      <Text style={styles.subsectionTitle}>Receipt Data</Text>
      <Text style={styles.paragraph}>
        • You retain ownership of your receipt data{'\n'}
        • You grant us a license to process, store, and display your receipts for providing the service{'\n'}
        • We may use aggregated, anonymized data for service improvements
      </Text>

      <Text style={styles.subsectionTitle}>Prohibited Content</Text>
      <Text style={styles.paragraph}>
        You may not upload receipts containing:{'\n'}
        • Illegal items or controlled substances{'\n'}
        • Stolen credit card information{'\n'}
        • Someone else's private information without consent{'\n'}
        • Fraudulent or fake purchases
      </Text>

      <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
      <Text style={styles.highlight}>
        THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
      </Text>
      <Text style={styles.paragraph}>
        We do not warrant that:{'\n'}
        • Price data, OCR results, or analytics are accurate{'\n'}
        • The service will be uninterrupted or error-free{'\n'}
        • The App is completely secure{'\n'}
        • The App meets your specific requirements{'\n'}
        • Price alerts will always be delivered
      </Text>

      <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
      <Text style={styles.paragraph}>
        Our total liability to you for any claims shall not exceed the greater of:{'\n'}
        • $100 USD, or{'\n'}
        • The amount you paid us in the past 12 months (currently $0, as the service is free){'\n\n'}
        We are not liable for:{'\n'}
        • Inaccurate price data or outdated product information{'\n'}
        • Failed notifications or missed alerts{'\n'}
        • Purchases made based on our price comparisons{'\n'}
        • Actions of third-party retailers{'\n'}
        • Loss of receipt data due to account deletion or technical issues{'\n'}
        • Decisions made based on spending analytics
      </Text>

      <Text style={styles.sectionTitle}>9. Privacy and Data Protection</Text>
      <Text style={styles.paragraph}>
        Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy.{'\n\n'}
        Key points:{'\n'}
        • We collect receipt data, price tracking preferences, and usage information{'\n'}
        • We scrape public price data from retailer websites{'\n'}
        • We send push notifications for price drops{'\n'}
        • We do not sell your personal data{'\n\n'}
        See our full Privacy Policy for details.
      </Text>

      <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
      <Text style={styles.paragraph}>
        We may modify these Terms at any time. We will notify you of material changes by:{'\n'}
        • In-app notification{'\n'}
        • Email to your registered address{'\n'}
        • Updating the "Last Updated" date{'\n\n'}
        Your continued use after changes constitutes acceptance. If you don't agree, you must stop using the App and delete your account.
      </Text>

      <Text style={styles.sectionTitle}>11. Contact Information</Text>
      <Text style={styles.paragraph}>
        For questions about these Terms:{'\n\n'}
        Email: legal@smartreceipt.app{'\n'}
        Support: support@smartreceipt.app{'\n'}
        Privacy Inquiries: privacy@smartreceipt.app{'\n\n'}
        Response Time: We aim to respond to inquiries within 5 business days.
      </Text>

      <Text style={styles.sectionTitle}>12. Acknowledgment</Text>
      <Text style={styles.highlight}>
        BY CREATING AN ACCOUNT AND USING SMARTRECEIPT, YOU ACKNOWLEDGE THAT:
      </Text>
      <Text style={styles.paragraph}>
        • You have read and understood these Terms{'\n'}
        • You agree to be bound by these Terms{'\n'}
        • You consent to the collection and use of information as described in the Privacy Policy{'\n'}
        • You understand that price data may not always be accurate{'\n'}
        • You understand that the service is provided "as is" without warranties{'\n'}
        • You agree to the arbitration clause and class action waiver
      </Text>

      <Text style={styles.footer}>
        Version: 2.0 (Phase 2 - Price Tracking){'\n'}
        Effective Date: February 14, 2026{'\n'}
        Document ID: TOS-SR-2.0-20260214
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
  highlight: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    marginTop: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
