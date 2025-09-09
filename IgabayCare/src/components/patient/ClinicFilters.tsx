import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Star, DollarSign, Stethoscope, Navigation, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Collapsible filters

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
    <div className="mb-4 sm:mb-6">
      {/* Horizontal Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
        {/* Main Filter Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Filters Label with Toggle */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {showAdvancedFilters ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>

          {/* Near Me Button */}
          <Button
            onClick={getCurrentLocation}
            disabled={locationLoading || loading}
            variant={filters.location.useCurrentLocation ? "primary" : "outline"}
            size="sm"
            className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
              filters.location.useCurrentLocation 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {locationLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3" />
            )}
            Near Me
          </Button>

          {/* Distance Options */}
          {filters.location.useCurrentLocation && (
            <>
              {[1, 5, 10, 25, 50].map((distance) => (
                <button
                  key={distance}
                  onClick={() => updateFilters({
                    location: { ...filters.location, radius: distance }
                  })}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filters.location.radius === distance
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {distance}+
                </button>
              ))}
            </>
          )}

          {/* Specialty Tags */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {availableServices.slice(0, 6).map((service) => (
              <button
                key={service}
                onClick={() => toggleService(service)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.services.includes(service)
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {service}
              </button>
            ))}
            {availableServices.length > 6 && (
              <span className="px-3 py-1.5 text-sm text-gray-500 bg-gray-50 rounded-md border border-gray-200">
                +{availableServices.length - 6} more
              </span>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value as FilterOptions['sortBy'] })}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="distance">Nearest</option>
            <option value="price_low">Price: Low</option>
            <option value="price_high">Price: High</option>
            <option value="rating">Rating</option>
            <option value="name">Name</option>
          </select>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border-gray-300"
          >
            Reset
          </Button>
        </div>

        {/* Location Error */}
        {locationError && (
          <div className="mt-2 text-sm text-red-600">
            {locationError}
          </div>
        )}

        {/* Location Success */}
        {filters.location.useCurrentLocation && filters.location.latitude && (
          <div className="mt-2 text-sm text-green-600">
            ✓ Using your current location
          </div>
        )}

        {/* Advanced Filters (Collapsible) */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Price Range Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (₱)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={filters.priceRange.min}
                    onChange={(e) => updateFilters({
                      priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                    })}
                    placeholder="Min"
                    min="0"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={filters.priceRange.max}
                    onChange={(e) => updateFilters({
                      priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                    })}
                    placeholder="Max"
                    min="0"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <div className="flex gap-1">
                  {[0, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      className={`flex items-center px-2 py-1 rounded text-sm transition-colors ${
                        filters.rating.minimum === rating
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {rating === 0 ? 'Any' : (
                        <>
                          {rating}
                          <Star className="h-3 w-3 ml-1 fill-current" />
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* All Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  All Services
                </label>
                <div className="max-h-24 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {availableServices.map((service) => (
                      <button
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          filters.services.includes(service)
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(filters.services.length > 0 || filters.rating.minimum > 0 || filters.location.useCurrentLocation || filters.priceRange.min > 0 || filters.priceRange.max < 5000) && (
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
        )}
      </div>
    </div>
  );
};

export default ClinicFilters;
