import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface Review {
  id: string;
  patientName: string;
  patientImage: string;
  rating: number;
  reviewText: string;
  source: 'Yelp' | 'PatientPop' | 'Facebook' | 'Google';
  timestamp: string;
  images?: string[];
}

interface LatestReviewsProps {
  reviews?: Review[];
}

const mockReviews: Review[] = [
  {
    id: '1',
    patientName: 'Deena Timmons',
    patientImage: '/api/placeholder/40/40',
    rating: 5,
    reviewText: 'I must once again praise Dr. Coleman for her outstanding advise and medical care. Her skills as a physician are stellar, and she will only recommend procedures that can enhance your physical beauty. The office is immaculate, colorful and inviting.',
    source: 'Yelp',
    timestamp: '5 hours ago',
    images: [
      '/api/placeholder/80/80',
      '/api/placeholder/80/80',
      '/api/placeholder/80/80',
      '/api/placeholder/80/80'
    ]
  },
  {
    id: '2',
    patientName: 'Sheila Lee',
    patientImage: '/api/placeholder/40/40',
    rating: 5,
    reviewText: 'Dr. Coleman is the consumate professional. I have seen dermatologists in NYC and Beverly Hills, and she is by far the most knowledeable. As a physician, her primary concern is health, skin care, and screening.',
    source: 'PatientPop',
    timestamp: '2 days ago'
  },
  {
    id: '3',
    patientName: 'Sarah Doyle',
    patientImage: '/api/placeholder/40/40',
    rating: 5,
    reviewText: 'Dr. Coleman clearly cares about her patients and spent time walking me through my skin\'s health and things I can do to stay looking my best.',
    source: 'Facebook',
    timestamp: '5 days ago'
  }
];

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'Yelp':
      return (
        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">Y</span>
        </div>
      );
    case 'PatientPop':
      return (
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">P</span>
        </div>
      );
    case 'Facebook':
      return (
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">f</span>
        </div>
      );
    case 'Google':
      return (
        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">G</span>
        </div>
      );
    default:
      return null;
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'Yelp':
      return 'text-red-600';
    case 'PatientPop':
      return 'text-green-600';
    case 'Facebook':
      return 'text-blue-600';
    case 'Google':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

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

export const LatestReviews: React.FC<LatestReviewsProps> = ({ reviews = mockReviews }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Latest Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-start space-x-3">
              {/* Profile Picture with Source Badge */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {review.patientName.charAt(0)}
                    </span>
                  </div>
                </div>
                {/* Source Badge */}
                <div className="absolute -bottom-1 -right-1">
                  {getSourceIcon(review.source)}
                </div>
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {review.patientName}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{review.timestamp}</span>
                  </div>
                </div>

                {/* Rating and Source */}
                <div className="flex items-center space-x-2 mb-3">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-gray-500">
                    from {review.source}
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {review.reviewText}
                </p>

                {/* Review Images (if any) */}
                {review.images && review.images.length > 0 && (
                  <div className="flex space-x-2 mb-3">
                    {review.images.slice(0, 4).map((image, index) => (
                      <div
                        key={index}
                        className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-xs">IMG</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Source Link */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${getSourceColor(review.source)}`}>
                    {review.source} Review
                  </span>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    View Full Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* View All Reviews Button */}
        <div className="pt-4 border-t border-gray-100">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors">
            View All Reviews
          </button>
        </div>
      </CardContent>
    </Card>
  );
}; 