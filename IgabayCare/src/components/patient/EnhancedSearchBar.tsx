import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, MapPin, Stethoscope, User } from 'lucide-react';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { searchService, type SearchResult } from '../../services/searchService';

interface EnhancedSearchBarProps {
  onSearchSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ 
  onSearchSelect, 
  placeholder = "Search clinics, doctors, or services...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search functionality
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchService.search(searchQuery);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    setQuery(result.title);
    setShowResults(false);
    onSearchSelect(result);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  // Get popular suggestions
  const getPopularSuggestions = () => {
    return [
      'General Medicine',
      'Dental',
      'Pediatrics',
      'Cardiology',
      'Dermatology',
      'Orthopedics',
      'Laboratory',
      'X-Ray',
      'Vaccination',
      'Consultation'
    ];
  };

  // Get icon for result type
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'clinic':
        return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'doctor':
        return <User className="h-4 w-4 text-green-600" />;
      case 'service':
        return <Stethoscope className="h-4 w-4 text-purple-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get color for result type
  const getResultColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'clinic':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'doctor':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'service':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border border-gray-200">
          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="p-4">
                {query ? (
                  <div className="text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No results found for "{query}"</p>
                    <p className="text-sm mt-1">Try searching for clinics, doctors, or services</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3 px-2">Popular Searches:</p>
                    <div className="flex flex-wrap gap-2 px-2 pb-2">
                      {getPopularSuggestions().map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setQuery(suggestion);
                            performSearch(suggestion);
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full border ${getResultColor(result.type)}`}>
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {result.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getResultColor(result.type)}`}>
                            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </span>
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-sm text-gray-600 mt-1">
                            {result.subtitle}
                          </p>
                        )}
                        
                        {result.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Click outside to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default EnhancedSearchBar;
