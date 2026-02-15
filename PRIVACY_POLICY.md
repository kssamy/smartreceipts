# Privacy Policy for SmartReceipt

**Last Updated: February 14, 2026**

## Introduction

SmartReceipt ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services, including our advanced price tracking and alert features.

## Information We Collect

### 1. Account Information
- **Email address** (required for account creation and notifications)
- **Name** (optional, for personalization)
- **Password** (encrypted and securely stored)

### 2. Receipt Data
- **Receipt images** (temporarily processed for OCR text extraction)
- **Purchase information**:
  - Store names and addresses
  - Purchase dates and times
  - Item names and prices
  - Product categories
  - Total amounts, tax, and tips
- **Receipt metadata**:
  - OCR confidence scores
  - Verification status
  - User notes

### 3. Price Tracking Data (Phase 2)
- **Watched items**: Products you choose to track for price changes
- **Original purchase prices**: Prices you paid for items
- **Price alert preferences**: Your notification threshold settings (10%, 20%, 30% drops)
- **Price history**: Historical price data collected from multiple retailers
- **Best prices found**: Lowest prices discovered during monitoring
- **Savings calculations**: Computed savings compared to original prices

### 4. Technical Information
- **Device information**: Device type, operating system, app version
- **Push notification tokens**: For delivering price drop alerts
- **Usage analytics**: App features used, screen views, interaction patterns
- **Error logs**: Crash reports and performance data (anonymized)

### 5. Location Data
- **Store locations**: Derived from receipt addresses (not real-time tracking)
- We do **NOT** collect real-time GPS location data
- We do **NOT** track your movements

## How We Use Your Information

### Core Features
1. **Receipt Management**: Store, organize, and categorize your receipts
2. **Spending Analytics**: Provide insights into your purchasing patterns
3. **Receipt Search**: Enable you to find past purchases quickly

### Price Tracking Features (Phase 2)
1. **Automated Price Monitoring**:
   - Track prices for items from your receipts for 30 days
   - Scrape public price data from major retailers (Amazon, Walmart, Target, Kroger, etc.)
   - Compare current prices against your original purchase prices
   - Generate price history charts and trends

2. **Price Drop Alerts**:
   - Send push notifications when prices drop below your thresholds
   - Alert you to significant savings opportunities
   - Provide links to best prices found

3. **Savings Calculations**:
   - Calculate potential savings compared to original prices
   - Track total savings across all monitored items
   - Display best price sources for each product

### Service Improvements
- Improve OCR accuracy and item categorization
- Enhance price matching algorithms
- Develop better product normalization
- Optimize notification delivery

### Communications
- Send transactional emails (account verification, password resets)
- Deliver price drop alerts via push notifications
- Provide important service updates (optional marketing emails require consent)

## Price Data Collection

### Web Scraping Practices
We collect publicly available price data from retailer websites through automated scraping:

- **Retailers monitored**: Amazon, Walmart, Target, Kroger, Costco, Sam's Club, and other major stores
- **Data collected**: Product names, prices, availability, URLs
- **Frequency**: Daily automated checks (runs at 2 AM UTC)
- **Compliance**: We respect robots.txt files and implement rate limiting
- **Purpose**: Provide you with the best price information for your tracked items

### No Personal Data Shared
- Your purchase history is **NEVER** shared with retailers
- Retailers cannot see what you bought or when
- Price checks are performed anonymously
- We do not sell or share your data with price comparison partners

## Data Storage and Security

### Storage Location
- **Primary Database**: MongoDB Atlas (cloud-hosted, encrypted)
- **Cache Layer**: Redis (optional, session data only)
- **Backup**: Daily automated backups with 30-day retention
- **Server**: Oracle Cloud Infrastructure (secured with industry-standard practices)

### Security Measures
- **Encryption**: All data in transit uses HTTPS/TLS
- **Password Security**: Bcrypt hashing with salt
- **Authentication**: JWT tokens with expiration
- **Access Control**: Role-based permissions
- **Network Security**: Firewall rules and DDoS protection
- **Monitoring**: Automated security alerts and logging

### Data Retention
- **Active accounts**: Data retained indefinitely while account is active
- **Price watches**: Automatically expire after 30 days
- **Deleted accounts**: Data permanently deleted within 30 days
- **Receipts**: Retained until you delete them or close your account
- **Price history**: Retained for the duration of price watch (30 days)

## Third-Party Services

### Services We Use
1. **MongoDB Atlas** (Database): Stores your account and receipt data
2. **Redis** (Optional Caching): Improves app performance
3. **Expo Push Notifications**: Delivers price drop alerts
4. **Oracle Cloud**: Hosts our backend infrastructure

### Data Shared with Third Parties
- **Expo**: Push notification tokens only (no personal data)
- **Cloud providers**: Encrypted data storage only
- **No advertising networks**: We do not use ad services
- **No analytics companies**: All analytics are internal

### Retailer Websites
- We scrape public price data from retailer websites
- No direct data sharing with retailers
- No cookies or tracking pixels from retailers
- Price checks are performed server-side, not from your device

## Your Privacy Rights

### Access and Control
You have the right to:
- **Access** all your data through the app
- **Export** your receipt data in standard formats
- **Update** your account information at any time
- **Delete** individual receipts or your entire account
- **Opt-out** of price tracking for specific items or all items
- **Control** notification preferences and alert thresholds

### Data Deletion
To delete your account and all associated data:
1. Open the SmartReceipt app
2. Go to Settings → Account → Delete Account
3. Confirm deletion
4. All data will be permanently deleted within 30 days

Or email us at privacy@smartreceipt.app

### California Privacy Rights (CCPA)
If you are a California resident, you have additional rights:
- **Right to know**: What data we collect and how we use it
- **Right to delete**: Request deletion of your personal information
- **Right to opt-out**: Opt-out of data "sales" (note: we do not sell data)
- **Right to non-discrimination**: We will not discriminate for exercising your rights

### GDPR Rights (European Users)
If you are in the EU/EEA, you have these rights:
- **Right of access**: Obtain a copy of your data
- **Right to rectification**: Correct inaccurate data
- **Right to erasure**: Delete your data ("right to be forgotten")
- **Right to restriction**: Limit how we process your data
- **Right to data portability**: Receive your data in a portable format
- **Right to object**: Object to certain processing activities

## Push Notifications

### Types of Notifications
1. **Price Drop Alerts**: When tracked item prices fall below your thresholds
2. **Expiration Reminders**: When price watches are about to expire (optional)
3. **Service Notifications**: Critical app updates or maintenance (rare)

### Notification Controls
- Enable/disable notifications in device settings
- Customize alert thresholds (10%, 20%, 30% price drops)
- Opt-out of specific notification types in app settings
- Unsubscribe from all notifications while keeping account active

### Notification Data
- Push tokens stored securely on our servers
- No message content visible to third parties
- Notifications sent via Expo Push Notification Service
- Device tokens can be revoked at any time

## Children's Privacy

SmartReceipt is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected information from a child under 13, we will delete it immediately.

## International Data Transfers

Our servers are located in the United States. If you access SmartReceipt from outside the U.S., your data may be transferred to, stored, and processed in the U.S. where data protection laws may differ from your country.

We implement appropriate safeguards for international data transfers, including:
- Encryption in transit and at rest
- Standard contractual clauses with service providers
- Regular security audits and compliance reviews

## Changes to Privacy Policy

We may update this Privacy Policy periodically. We will notify you of significant changes by:
- In-app notification
- Email to your registered address
- Updating the "Last Updated" date at the top

Continued use of the app after changes constitutes acceptance of the updated policy.

## Data Breach Notification

In the unlikely event of a data breach affecting your personal information, we will:
- Notify affected users within 72 hours
- Provide details about the breach and affected data
- Outline steps we're taking to address the breach
- Advise on protective measures you can take
- Comply with all applicable data breach notification laws

## Contact Us

For privacy-related questions, concerns, or requests:

**Email**: privacy@smartreceipt.app
**Data Protection Officer**: dpo@smartreceipt.app
**Mail**: SmartReceipt Privacy Team
[Your Company Address]

**Response Time**: We aim to respond within 48 hours

## Consent

By creating an account and using SmartReceipt, you consent to:
- Collection and processing of your data as described in this policy
- Automated price monitoring of items from your receipts
- Push notifications about price drops (can be disabled)
- Use of cookies and similar technologies for app functionality

You can withdraw consent at any time by deleting your account or contacting us.

---

**Version**: 2.0 (Phase 2 - Price Tracking)
**Effective Date**: February 14, 2026
**Governing Law**: [Your Jurisdiction]
