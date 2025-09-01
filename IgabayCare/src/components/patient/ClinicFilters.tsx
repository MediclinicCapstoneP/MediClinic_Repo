import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Star, DollarSign, Stethoscope, Navigation, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { clinicServicePricingService } from '../../features/auth/utils/clinicServicePricingService';

interface FilterOptions {
  location: {
    latitude: number | null;
    longitude: number | null;
    radius: number; // in kilometers
    useCurrentLocation: boolean;
  };
  services: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: {
    minimum: number;
  };
  sortBy: 'distance' | 'price_low' | 'price_high' | 'rating' | 'name';
}

interface ClinicFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  availableServices: string[];
  loading?: boolean;
}

const ClinicFilters: React.FC<ClinicFiltersProps> = ({ 
  onFiltersChange, 
  onApplyFilters,
  availableServices,
  loading = false 
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    location: {
      latitude: null,
      longitude: null,
      radius: 10,
      useCurrentLocation: false
    },
    services: [],
    priceRange: {
      min: 0,
      max: 5000
    },
    rating: {
      minimum: 0
    },
    sortBy: 'distance'
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showAdvancedFilters] = useState(true); // Always show filters for better UX

  // Update price range based on available services
  useEffect(() => {
    const updatePriceRange = async () => {
      try {
        const result = await clinicServicePricingService.getGlobalPriceRange();
        if (result.success && result.priceRange) {
          setFilters(prev => ({
            ...prev,
            priceRange: {
              min: prev.priceRange.min,
              max: Math.max(prev.priceRange.max, result.priceRange!.max)
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching price range:', error);
      }
    };

    updatePriceRange();
  }, []);

  // Get user's current location
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const newFilters = {
        ...filters,
        location: {
          ...filters.location,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          useCurrentLocation: true
        }
      };

      setFilters(newFilters);
      onFiltersChange(newFilters);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(
        error instanceof GeolocationPositionError 
          ? 'Location access denied. Please enable location services.'
          : 'Unable to get your location. Please try again.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Handle service selection
  const toggleService = (service: string) => {
    const newServices = filters.services.includes(service)
      ? filters.services.filter(s => s !== service)
      : [...filters.services, service];
    
    updateFilters({ services: newServices });
  };

  // Handle rating filter
  const handleRatingChange = (rating: number) => {
    updateFilters({ 
      rating: { minimum: rating } 
    });
  };

  // Clear all filters
  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      location: {
        latitude: null,
        longitude: null,
        radius: 10,
        useCurrentLocation: false
      },
      services: [],
      priceRange: {
        min: 0,
        max: 5000
      },
      rating: {
        minimum: 0
      },
      sortBy: 'distance'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const resetFilters = () => {
    clearFilters();
  };

  return (
    <Card className="mb-4 sm:mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filter Clinics
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-gray-600 hover:text-gray-800 px-2 sm:px-3 py-1 text-xs sm:text-sm"
          >
            Reset
          </Button>
        </div>

        <div className="space-y-4">
          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Location & Distance
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button
                onClick={getCurrentLocation}
                disabled={locationLoading || loading}
                variant={filters.location.useCurrentLocation ? "primary" : "outline"}
                size="sm"
                className="flex items-center justify-center w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-3 py-2"
              >
                {locationLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                {filters.location.useCurrentLocation ? 'Using Current Location' : 'Use My Location'}
              </Button>
              
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs sm:text-sm text-gray-600">Within</span>
                <select
                  value={filters.location.radius}
                  onChange={(e) => updateFilters({
                    location: { ...filters.location, radius: Number(e.target.value) }
                  })}
                  className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm min-w-0 flex-shrink-0"
                  disabled={!filters.location.useCurrentLocation}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>
            </div>
            
            {locationError && (
              <p className="text-sm text-red-600">{locationError}</p>
            )}
            
            {filters.location.useCurrentLocation && filters.location.latitude && (
              <p className="text-sm text-green-600">
                ✓ Location detected: {filters.location.latitude.toFixed(4)}, {filters.location.longitude?.toFixed(4)}
              </p>
            )}
          </div>

          {/* Services Filter */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
              <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Services Needed
            </label>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {availableServices.map((service) => (
                <button
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    filters.services.includes(service)
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
            {filters.services.length > 0 && (
              <p className="text-xs sm:text-sm text-blue-600">
                {filters.services.length} service{filters.services.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <>
              {/* Price Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Price Range (₱)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Minimum</label>
                    <Input
                      type="number"
                      value={filters.priceRange.min}
                      onChange={(e) => updateFilters({
                        priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                      })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Maximum</label>
                    <Input
                      type="number"
                      value={filters.priceRange.max}
                      onChange={(e) => updateFilters({
                        priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                      })}
                      placeholder="5000"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Minimum Rating
                </label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.rating.minimum === rating
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {rating === 0 ? 'Any' : (
                        <>
                          {rating}
                          <Star className="h-3 w-3 ml-1 fill-current" />
                          +
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Sort Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value as FilterOptions['sortBy'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="distance">Nearest First</option>
              <option value="price_low">Lowest Price First</option>
              <option value="price_high">Highest Price First</option>
              <option value="rating">Highest Rated First</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Clear All Filters
            </Button>
            {!filters.location.useCurrentLocation && (
              <Button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Find Nearby
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {(filters.services.length > 0 || filters.rating.minimum > 0 || filters.location.useCurrentLocation) && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.location.useCurrentLocation && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    📍 Within {filters.location.radius}km
                  </span>
                )}
                {filters.services.map((service) => (
                  <span key={service} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    🩺 {service}
                  </span>
                ))}
                {filters.rating.minimum > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    ⭐ {filters.rating.minimum}+ stars
                  </span>
                )}
                {(filters.priceRange.min > 0 || filters.priceRange.max < 5000) && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    💰 ₱{filters.priceRange.min}-{filters.priceRange.max}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Apply Filters Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={onApplyFilters}
            variant="primary"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
            disabled={loading}
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicFilters;
