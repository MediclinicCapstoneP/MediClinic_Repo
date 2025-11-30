/**
 * Rating and Feedback Modal - Patient rating system for clinic and doctor
 * Allows patients to rate their experience and provide feedback after appointment completion
 */

import React, { useState } from 'react';
import { enhancedBookingService, type RatingData } from '../../services/enhancedBookingService';
import { Button } from '../ui/Button';
import { 
  Star, MessageSquare, CheckCircle, AlertCircle, X, XCircle, Loader2,
  ThumbsUp, Calendar, User
} from 'lucide-react';

interface RatingFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    patient_id: string;
    clinic_name: string;
    doctor_name?: string;
    appointment_date: string;
    appointment_time: string;
  };
  onRatingSubmitted?: () => void;
}

interface RatingCategory {
  name: string;
  label: string;
  description: string;
}

export const RatingFeedbackModal: React.FC<RatingFeedbackModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRatingSubmitted
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Rating state
  const [clinicRating, setClinicRating] = useState<number>(0);
  const [doctorRating, setDoctorRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState<{ clinic: number; doctor: number }>({ clinic: 0, doctor: 0 });

  // Rating categories
  const ratingCategories: RatingCategory[] = [
    { name: 'clinic', label: 'Clinic Experience', description: 'Overall clinic service, environment, and staff' },
    { name: 'doctor', label: 'Doctor Service', description: 'Doctor\'s professionalism, care, and communication' }
  ];

  // Star rating component
  const StarRating: React.FC<{
    rating: number;
    hovered: number;
    onRatingChange: (rating: number) => void;
    onHover: (rating: number) => void;
    disabled?: boolean;
  }> = ({ rating, hovered, onRatingChange, onHover, disabled = false }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          className={`p-1 transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (clinicRating === 0 && (!appointment.doctor_name || doctorRating === 0)) {
      setError('Please provide at least one rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ratingData: RatingData = {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        clinic_rating: clinicRating > 0 ? clinicRating : undefined,
        doctor_rating: doctorRating > 0 ? doctorRating : undefined,
        feedback: feedback.trim() || undefined
      };

      const result = await enhancedBookingService.submitRating(ratingData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onRatingSubmitted?.();
          // Reset form
          setClinicRating(0);
          setDoctorRating(0);
          setFeedback('');
          setSuccess(false);
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  // Get rating label
  const getRatingLabel = (rating: number | undefined): string => {
    if (!rating || rating === 0) return '';
    if (rating <= 2) return 'Poor';
    if (rating === 3) return 'Average';
    if (rating === 4) return 'Good';
    return 'Excellent';
  };

  // Get rating color
  const getRatingColor = (rating: number | undefined): string => {
    if (!rating || rating === 0) return 'text-gray-500';
    if (rating <= 2) return 'text-red-600';
    if (rating === 3) return 'text-yellow-600';
    if (rating === 4) return 'text-green-600';
    return 'text-green-700';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
              <p className="text-gray-600 mt-1">Help us improve our service</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">Your feedback has been submitted successfully.</p>
            </div>
          ) : (
            <>
              {/* Appointment Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })} at {appointment.appointment_time}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    {appointment.clinic_name}
                  </div>
                  {appointment.doctor_name && (
                    <div className="flex items-center sm:col-span-2">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      Dr. {appointment.doctor_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center mb-6">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Rating Categories */}
              <div className="space-y-6 mb-6">
                {/* Clinic Rating */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {ratingCategories[0].label}
                    </h3>
                    <p className="text-sm text-gray-600">{ratingCategories[0].description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <StarRating
                      rating={clinicRating}
                      hovered={hoveredRating.clinic}
                      onRatingChange={setClinicRating}
                      onHover={(rating) => setHoveredRating(prev => ({ ...prev, clinic: rating }))}
                    />
                    {clinicRating > 0 && (
                      <span className={`text-sm font-medium ${getRatingColor(clinicRating)}`}>
                        {getRatingLabel(clinicRating)}
                      </span>
                    )}
                  </div>
                  
                  {clinicRating > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <ThumbsUp className="h-4 w-4" />
                        <span>Thank you for rating the clinic!</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Doctor Rating */}
                {appointment.doctor_name && (
                  <div className="bg-white border rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {ratingCategories[1].label}
                      </h3>
                      <p className="text-sm text-gray-600">{ratingCategories[1].description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <StarRating
                        rating={doctorRating}
                        hovered={hoveredRating.doctor}
                        onRatingChange={setDoctorRating}
                        onHover={(rating) => setHoveredRating(prev => ({ ...prev, doctor: rating }))}
                      />
                      {doctorRating > 0 && (
                        <span className={`text-sm font-medium ${getRatingColor(doctorRating)}`}>
                          {getRatingLabel(doctorRating)}
                        </span>
                      )}
                    </div>
                    
                    {doctorRating > 0 && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <ThumbsUp className="h-4 w-4" />
                          <span>Thank you for rating Dr. {appointment.doctor_name}!</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Feedback */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Additional Feedback <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience, suggestions for improvement, or any specific comments..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your feedback helps us provide better service to all patients.
                </p>
              </div>

              {/* Rating Guidelines */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Rating Guidelines</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="font-medium">5 Stars:</span>
                    <span>Excellent service, exceeded expectations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">4 Stars:</span>
                    <span>Good service, met expectations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">3 Stars:</span>
                    <span>Average service, room for improvement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">1-2 Stars:</span>
                    <span>Poor service, needs significant improvement</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRating}
                  disabled={loading || (clinicRating === 0 && (!appointment.doctor_name || doctorRating === 0))}
                  loading={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Rating'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Rating Summary Component for displaying ratings
interface RatingSummaryProps {
  clinicRating?: number;
  doctorRating?: number;
  totalRatings?: number;
  showDetails?: boolean;
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({
  clinicRating,
  doctorRating,
  totalRatings = 0,
  showDetails = false
}) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
        {showDetails && (
          <span className="ml-2 text-sm font-medium text-gray-700">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  if (!clinicRating && !doctorRating) {
    return (
      <div className="text-center py-4 bg-gray-50 rounded-lg">
        <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clinicRating && clinicRating > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Clinic</span>
          {renderStars(clinicRating)}
        </div>
      )}
      
      {doctorRating && doctorRating > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Doctor</span>
          {renderStars(doctorRating)}
        </div>
      )}
      
      {totalRatings > 0 && showDetails && (
        <div className="text-center text-xs text-gray-500">
          Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
