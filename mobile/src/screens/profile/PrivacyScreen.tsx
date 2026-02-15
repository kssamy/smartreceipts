import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function PrivacyScreen({ navigation }: any) {
  const { clearAuth } = useAuthStore();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // TODO: Call delete account API
                      // await authAPI.deleteAccount();
                      await clearAuth();
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Our privacy policy details how we collect, use, and protect your data.',
      [
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const openTermsOfService = () => {
    navigation.navigate('Terms');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Data Collection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          <Text style={styles.sectionDescription}>
            Control what data we collect to improve your experience
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Analytics</Text>
              <Text style={styles.settingDescription}>
                Help improve the app by sharing anonymous usage data
              </Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Crash Reports</Text>
              <Text style={styles.settingDescription}>
                Automatically send crash reports to help fix bugs
              </Text>
            </View>
            <Switch
              value={crashReportsEnabled}
              onValueChange={setCrashReportsEnabled}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Personalization</Text>
              <Text style={styles.settingDescription}>
                Use your data to provide personalized recommendations
              </Text>
            </View>
            <Switch
              value={personalizationEnabled}
              onValueChange={setPersonalizationEnabled}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>
        </View>

        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Permissions</Text>
          <Text style={styles.sectionDescription}>
            Manage app access to device features
          </Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>📷 Camera</Text>
            <Text style={styles.infoText}>
              Required to scan receipts. You can manage this in Settings.
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🖼️ Photos</Text>
            <Text style={styles.infoText}>
              Required to select receipts from your photo library.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.linkButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data Storage</Text>
            <Text style={styles.infoText}>
              Your receipt data is securely stored and encrypted. Only you can access your receipts.
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data Retention</Text>
            <Text style={styles.infoText}>
              Receipt data is retained indefinitely unless you delete it or your account.
            </Text>
          </View>

          <TouchableOpacity style={styles.linkButton} onPress={openPrivacyPolicy}>
            <Text style={styles.linkButtonText}>Read Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity style={styles.menuItem} onPress={openPrivacyPolicy}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={openTermsOfService}>
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>

          <Text style={styles.dangerWarning}>
            Deleting your account will permanently remove all your data including receipts, analytics, and profile information. This action cannot be undone.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  linkButton: {
    marginTop: 12,
    paddingVertical: 10,
  },
  linkButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});
