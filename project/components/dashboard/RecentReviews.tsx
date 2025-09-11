import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '../../lib/supabase';

interface RecentReviewsProps {
  reviews: Review[];
}

export const RecentReviews: React.FC<RecentReviewsProps> = ({ reviews }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#10B981';
    if (rating >= 3) return '#F59E0B';
    return '#EF4444';
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? '#FFA500' : '#D1D5DB'}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderReviewCard = (review: any) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientInitial}>
              {review.patient ? 
                `${review.patient.first_name?.[0] || ''}${review.patient.last_name?.[0] || ''}` : 
                'P'
              }
            </Text>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {review.patient ? 
                `${review.patient.first_name || ''} ${review.patient.last_name || ''}`.trim() || 'Patient' :
                'Anonymous Patient'
              }
            </Text>
            <View style={styles.reviewMeta}>
              <Text style={styles.reviewDate}>
                {formatDate(review.created_at)}
              </Text>
              {review.appointment && (
                <Text style={styles.appointmentType}>
                  • {review.appointment.appointment_type?.replace('_', ' ') || 'Consultation'}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <View style={styles.ratingBadge}>
            <Text style={[styles.ratingText, { color: getRatingColor(review.rating) }]}>
              {review.rating}
            </Text>
            <Ionicons name="star" size={14} color={getRatingColor(review.rating)} />
          </View>
        </View>
      </View>

      {/* Star Rating */}
      <View style={styles.starsRow}>
        {renderStars(review.rating)}
        <Text style={styles.ratingLabel}>Overall Rating</Text>
      </View>

      {/* Review Text */}
      {review.review_text && (
        <View style={styles.reviewTextContainer}>
          <Text style={styles.reviewText} numberOfLines={3}>
            "{review.review_text}"
          </Text>
        </View>
      )}

      {/* Quality Metrics */}
      {(review.service_quality || review.facility_cleanliness || review.staff_friendliness) && (
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>Quality Ratings:</Text>
          <View style={styles.metricsRow}>
            {review.service_quality && (
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Service</Text>
                <Text style={styles.metricValue}>{review.service_quality}/5</Text>
              </View>
            )}
            {review.facility_cleanliness && (
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Cleanliness</Text>
                <Text style={styles.metricValue}>{review.facility_cleanliness}/5</Text>
              </View>
            )}
            {review.staff_friendliness && (
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Staff</Text>
                <Text style={styles.metricValue}>{review.staff_friendliness}/5</Text>
              </View>
            )}
            {review.wait_time_satisfaction && (
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Wait Time</Text>
                <Text style={styles.metricValue}>{review.wait_time_satisfaction}/5</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Recommendation */}
      <View style={styles.recommendationContainer}>
        <Ionicons 
          name={review.would_recommend ? 'thumbs-up' : 'thumbs-down'} 
          size={16} 
          color={review.would_recommend ? '#10B981' : '#EF4444'} 
        />
        <Text style={[
          styles.recommendationText,
          { color: review.would_recommend ? '#10B981' : '#EF4444' }
        ]}>
          {review.would_recommend ? 'Recommends this provider' : 'Would not recommend'}
        </Text>
      </View>
    </View>
  );

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Recent Reviews</Text>
          <Text style={styles.emptyText}>
            Patient reviews will appear here once they start leaving feedback about their experience.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reviewsScrollContainer}
      >
        {reviews.map(renderReviewCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    marginRight: 4,
  },
  reviewsScrollContainer: {
    paddingRight: 20,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewTextContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  metricsContainer: {
    marginBottom: 12,
  },
  metricsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyCard: {
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
