// API configuration
// Oracle Cloud Backend
export const API_URL = process.env.API_URL || 'http://152.70.114.100:3000/api/v1';

// Debug logging
console.log('🔧 API Configuration:', {
  'process.env.API_URL': process.env.API_URL,
  'Final API_URL': API_URL,
});

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH_TOKEN: '/auth/refresh',
  PROFILE: '/auth/profile',

  // Receipts
  RECEIPTS: '/receipts',
  RECEIPT_BY_ID: (id: string) => `/receipts/${id}`,

  // Analytics
  DASHBOARD_OVERVIEW: '/analytics/overview',
  SPENDING_BY_CATEGORY: '/analytics/category',
  SPENDING_TRENDS: '/analytics/trends',
  TOP_ITEMS: '/analytics/top-items',
  SPENDING_BY_STORE: '/analytics/stores',
};
