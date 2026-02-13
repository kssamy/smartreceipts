import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { analyticsAPI } from '../../services/api';
import { format, subDays } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [trendsData, setTrendsData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      // Load overview
      const overviewResponse = await analyticsAPI.getOverview({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setOverview(overviewResponse.data.data);

      // Load category breakdown
      const categoryResponse = await analyticsAPI.getSpendingByCategory({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setCategoryData(categoryResponse.data.data.categories);

      // Load trends
      const trendsResponse = await analyticsAPI.getSpendingTrends({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy: 'week',
      });
      setTrendsData(trendsResponse.data.data.trends);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Prepare chart data
  const pieChartData = categoryData.slice(0, 5).map((cat, index) => ({
    name: cat.category,
    amount: cat.totalSpent,
    color: getColorForIndex(index),
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  const barChartData = {
    labels: trendsData?.slice(-7).map((t: any) => t.period.split('-').pop() || '') || [],
    datasets: [
      {
        data: trendsData?.slice(-7).map((t: any) => t.totalSpent) || [0],
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent (30d)</Text>
            <Text style={styles.summaryValue}>
              ${overview?.totalSpent?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Receipts</Text>
            <Text style={styles.summaryValue}>
              {overview?.receiptCount || 0}
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard} style={{ marginHorizontal: 16 }}>
          <Text style={styles.summaryLabel}>Avg. Receipt</Text>
          <Text style={styles.summaryValue}>
            ${overview?.avgReceiptAmount?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {/* Pie Chart - Spending by Category */}
        {pieChartData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Spending by Category</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Bar Chart - Weekly Trends */}
        {trendsData && trendsData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Weekly Spending Trends</Text>
            <BarChart
              data={barChartData}
              width={screenWidth - 32}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        )}

        {/* Category List */}
        {categoryData.length > 0 && (
          <View style={styles.categoryList}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {categoryData.map((cat, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getColorForIndex(index) },
                    ]}
                  />
                  <Text style={styles.categoryName}>{cat.category}</Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryAmount}>
                    ${cat.totalSpent.toFixed(2)}
                  </Text>
                  <Text style={styles.categoryPercentage}>
                    {cat.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function getColorForIndex(index: number): string {
  const colors = [
    '#007AFF',
    '#34C759',
    '#FF9500',
    '#FF3B30',
    '#5856D6',
    '#FF2D55',
    '#5AC8FA',
    '#FFCC00',
  ];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
});
