import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last Updated: February 13, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using SmartReceipt ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            SmartReceipt is a mobile application that allows users to scan, store, and manage receipts. The App provides features including OCR (Optical Character Recognition) for receipt scanning, data storage, analytics, and spending tracking.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To use certain features of the App, you must register for an account. You agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
          <Text style={styles.bulletPoint}>• Maintain the security of your account credentials</Text>
          <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
          <Text style={styles.bulletPoint}>• Be responsible for all activities under your account</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Privacy and Data</Text>
          <Text style={styles.paragraph}>
            Your use of the App is also governed by our Privacy Policy. By using the App, you consent to the collection and use of your information as described in the Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            We collect and process:
          </Text>
          <Text style={styles.bulletPoint}>• Receipt images and OCR-extracted data</Text>
          <Text style={styles.bulletPoint}>• Purchase history and spending analytics</Text>
          <Text style={styles.bulletPoint}>• Account information (name, email)</Text>
          <Text style={styles.bulletPoint}>• Device information and usage data</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Content</Text>
          <Text style={styles.paragraph}>
            You retain ownership of all receipt images and data you upload to the App. By uploading content, you grant us a license to:
          </Text>
          <Text style={styles.bulletPoint}>• Store and process your receipts</Text>
          <Text style={styles.bulletPoint}>• Perform OCR and data extraction</Text>
          <Text style={styles.bulletPoint}>• Generate analytics and insights</Text>
          <Text style={styles.paragraph}>
            You are responsible for ensuring you have the right to upload and share your receipts.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Prohibited Uses</Text>
          <Text style={styles.paragraph}>
            You may not use the App to:
          </Text>
          <Text style={styles.bulletPoint}>• Upload fraudulent or altered receipts</Text>
          <Text style={styles.bulletPoint}>• Violate any laws or regulations</Text>
          <Text style={styles.bulletPoint}>• Interfere with the App's operation</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access</Text>
          <Text style={styles.bulletPoint}>• Use automated tools without permission</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Accuracy of Information</Text>
          <Text style={styles.paragraph}>
            While we strive for accuracy in OCR and data extraction, the App may contain errors. You are responsible for verifying all extracted data before relying on it for important decisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Service Availability</Text>
          <Text style={styles.paragraph}>
            We strive to provide continuous service but do not guarantee uninterrupted access. The App may be unavailable due to:
          </Text>
          <Text style={styles.bulletPoint}>• Maintenance and updates</Text>
          <Text style={styles.bulletPoint}>• Technical difficulties</Text>
          <Text style={styles.bulletPoint}>• Factors beyond our control</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The App, including its design, functionality, and content (excluding user content), is owned by us and protected by copyright, trademark, and other intellectual property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          </Text>
          <Text style={styles.bulletPoint}>• The App is provided "AS IS" without warranties</Text>
          <Text style={styles.bulletPoint}>• We are not liable for any indirect, incidental, or consequential damages</Text>
          <Text style={styles.bulletPoint}>• Our total liability shall not exceed the amount you paid for the service</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any time for:
          </Text>
          <Text style={styles.bulletPoint}>• Violation of these Terms</Text>
          <Text style={styles.bulletPoint}>• Fraudulent or illegal activity</Text>
          <Text style={styles.bulletPoint}>• Extended inactivity</Text>
          <Text style={styles.paragraph}>
            You may delete your account at any time from the Privacy settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may modify these Terms at any time. We will notify you of significant changes via email or in-app notification. Continued use of the App after changes constitutes acceptance of the new Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms are governed by the laws of the jurisdiction in which our company is registered, without regard to conflict of law provisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about these Terms, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: support@smartreceipt.app</Text>
          <Text style={styles.contactInfo}>Website: https://smartreceipt.app</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using SmartReceipt, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    marginLeft: 8,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 15,
    color: '#007AFF',
    lineHeight: 24,
    marginTop: 4,
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
