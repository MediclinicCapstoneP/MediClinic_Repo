import React, { useState, useEffect } from 'react';
import { Star, Clock, Verified, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { reviewsService, type ReviewWithPatient } from '../../features/auth/utils/reviewsService';

interface LatestReviewsProps {
  clinicId?: string;
  limit?: number;
}


const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3 w-3 ${
            index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export const LatestReviews: React.FC<LatestReviewsProps> = ({ clinicId, limit = 5 }) => {
  const [reviews, setReviews] = useState<ReviewWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clinicId) {
      fetchReviews();
    }
  }, [clinicId, limit]);

  const fetchReviews = async () => {
    if (!clinicId) return;

    try {
      setLoading(true);
      const result = await reviewsService.getLatestReviews(clinicId, limit);
      
      if (result.success && result.reviews) {
        setReviews(result.reviews);
        setError(null);
      } else {
        setError(result.error || 'Failed to load reviews');
      }
    } catch (err) {
      setError('Failed to load reviews');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Latest Reviews</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Latest Reviews</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Unable to load reviews</p>
            <p className="text-sm text-gray-400">{error}</p>
            <button 
              onClick={fetchReviews}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Latest Reviews</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No reviews yet</p>
            <p className="text-sm text-gray-400">Patient reviews will appear here once they start leaving feedback.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Latest Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-start space-x-3">
              {/* Profile Picture with Verification Badge */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {review.patients.first_name.charAt(0)}{review.patients.last_name.charAt(0)}
                    </span>
                  </div>
                </div>
                {/* Verification Badge */}
                {review.is_verified && (
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Verified className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {review.patients.first_name} {review.patients.last_name}
                    </h4>
                    {review.appointments && (
                      <p className="text-xs text-gray-500">
                        {review.appointments.appointment_type?.replace('_', ' ')} • {new Date(review.appointments.appointment_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(review.created_at)}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-medium text-gray-700">
                    {review.rating}.0
                  </span>
                  {review.is_verified && (
                    <span className="text-xs text-green-600 font-medium">
                      Verified
                    </span>
                  )}
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    "{review.review_text}"
                  </p>
                )}

                {/* Quality Metrics */}
                {(review.service_quality || review.facility_cleanliness || review.staff_friendliness) && (
                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    {review.service_quality && (
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Service</p>
                        <p className="text-blue-600">{review.service_quality}/5</p>
                      </div>
                    )}
                    {review.facility_cleanliness && (
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Cleanliness</p>
                        <p className="text-green-600">{review.facility_cleanliness}/5</p>
                      </div>
                    )}
                    {review.staff_friendliness && (
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Staff</p>
                        <p className="text-purple-600">{review.staff_friendliness}/5</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {review.would_recommend ? (
                      <>
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Recommends</span>
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-600 font-medium">Does not recommend</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    IgabayCare Review
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* View All Reviews Button */}
        <div className="pt-4 border-t border-gray-100">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors">
            View All {reviews.length > limit ? `${reviews.length} ` : ''}Reviews
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
