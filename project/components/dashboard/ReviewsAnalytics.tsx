import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
  qualityMetrics: {
    serviceQuality: number;
    facilityCleanliness: number;
    staffFriendliness: number;
    waitTimeSatisfaction: number;
    overallExperience: number;
  };
  recentReviews: any[];
}

interface ReviewsAnalyticsProps {
  reviewStats: ReviewStats;
}

export const ReviewsAnalytics: React.FC<ReviewsAnalyticsProps> = ({ reviewStats }) => {
  const renderRatingDistribution = () => {
    const maxCount = Math.max(...reviewStats.ratingDistribution.map(r => r.count), 1);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Rating Distribution</Text>
        <View style={styles.ratingChart}>
          {reviewStats.ratingDistribution
            .sort((a, b) => b.rating - a.rating)
            .map((item) => {
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const barColor = getRatingColor(item.rating);
              
              return (
                <View key={item.rating} style={styles.ratingRow}>
                  <View style={styles.ratingLabel}>
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Ionicons name="star" size={12} color="#FFA500" />
                  </View>
                  <View style={styles.ratingBarContainer}>
                    <View 
                      style={[
                        styles.ratingBar, 
                        { 
                          width: `${percentage}%`, 
                          backgroundColor: barColor 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.ratingCount}>{item.count}</Text>
                </View>
              );
            })}
        </View>
      </View>
    );
  };

  const renderQualityMetrics = () => {
    const metrics = [
      { key: 'serviceQuality', label: 'Service Quality', icon: 'medical', value: reviewStats.qualityMetrics.serviceQuality },
      { key: 'facilityCleanliness', label: 'Facility Cleanliness', icon: 'sparkles', value: reviewStats.qualityMetrics.facilityCleanliness },
      { key: 'staffFriendliness', label: 'Staff Friendliness', icon: 'people', value: reviewStats.qualityMetrics.staffFriendliness },
      { key: 'waitTimeSatisfaction', label: 'Wait Time', icon: 'time', value: reviewStats.qualityMetrics.waitTimeSatisfaction },
      { key: 'overallExperience', label: 'Overall Experience', icon: 'heart', value: reviewStats.qualityMetrics.overallExperience },
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Quality Metrics</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons 
                  name={metric.icon as any} 
                  size={20} 
                  color={getMetricColor(metric.value)} 
                />
                <Text style={styles.metricValue}>
                  {metric.value > 0 ? metric.value.toFixed(1) : '0.0'}
                </Text>
              </View>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <View style={styles.metricBarContainer}>
                <View 
                  style={[
                    styles.metricBar, 
                    { 
                      width: `${(metric.value / 5) * 100}%`,
                      backgroundColor: getMetricColor(metric.value)
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPieChart = () => {
    if (reviewStats.ratingDistribution.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyChartText}>No reviews yet</Text>
        </View>
      );
    }

    const total = reviewStats.ratingDistribution.reduce((sum, item) => sum + item.count, 0);
    let cumulativeAngle = 0;

    return (
      <View style={styles.pieChartContainer}>
        <Text style={styles.chartTitle}>Review Summary</Text>
        <View style={styles.pieChartWrapper}>
          {/* Simple pie chart representation using circular progress bars */}
          <View style={styles.pieChart}>
            <View style={styles.pieChartCenter}>
              <Text style={styles.totalReviews}>{reviewStats.totalReviews}</Text>
              <Text style={styles.totalReviewsLabel}>Total Reviews</Text>
              <View style={styles.averageRating}>
                <Ionicons name="star" size={16} color="#FFA500" />
                <Text style={styles.averageRatingText}>
                  {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Legend */}
          <View style={styles.pieChartLegend}>
            {reviewStats.ratingDistribution
              .sort((a, b) => b.rating - a.rating)
              .map((item) => {
                const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                return (
                  <View key={item.rating} style={styles.legendItem}>
                    <View 
                      style={[
                        styles.legendColor, 
                        { backgroundColor: getRatingColor(item.rating) }
                      ]} 
                    />
                    <Text style={styles.legendText}>
                      {item.rating}★ ({percentage}%)
                    </Text>
                  </View>
                );
              })}
          </View>
        </View>
      </View>
    );
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 5: return '#10B981';
      case 4: return '#3B82F6';
      case 3: return '#F59E0B';
      case 2: return '#EF4444';
      case 1: return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 4.0) return '#10B981';
    if (value >= 3.5) return '#3B82F6';
    if (value >= 3.0) return '#F59E0B';
    if (value >= 2.0) return '#EF4444';
    return '#DC2626';
  };

  if (reviewStats.totalReviews === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateCard}>
          <Ionicons name="star-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Reviews Yet</Text>
          <Text style={styles.emptyStateText}>
            Start providing excellent service to receive patient reviews and see your analytics here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Reviews & Analytics</Text>
        <View style={styles.summaryStats}>
          <Text style={styles.summaryText}>
            {reviewStats.averageRating.toFixed(1)} ⭐ from {reviewStats.totalReviews} reviews
          </Text>
        </View>
      </View>
      
      {/* Pie Chart */}
      {renderPieChart()}

      {/* Rating Distribution */}
      {renderRatingDistribution()}

      {/* Quality Metrics */}
      {renderQualityMetrics()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryStats: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  summaryText: {
    fontSize: 14,
    color: '#C2410C',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  pieChartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pieChartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E5E7EB',
  },
  pieChartCenter: {
    alignItems: 'center',
  },
  totalReviews: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalReviewsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  pieChartLegend: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#4B5563',
  },
  ratingChart: {
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  ratingBar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 30,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 80) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  metricBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  metricBar: {
    height: '100%',
    borderRadius: 2,
    minWidth: 2,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyStateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
