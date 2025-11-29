import React, { useState } from 'react';
import { searchService, type SearchResult } from '../../services/searchService';
import { Button } from '../ui/Button';

const SearchTest: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchService.search(query);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await searchService.initialize();
      console.log('Search service initialized');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Search Functionality Test</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        <Button onClick={handleInitialize} disabled={loading} variant="outline">
          Initialize Search Service
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({results.length})</h3>
          {results.map((result, index) => (
            <div key={`${result.type}-${result.id}-${index}`} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{result.title}</h4>
                  <p className="text-gray-600">{result.subtitle}</p>
                  {result.description && (
                    <p className="text-gray-500 text-sm mt-1">{result.description}</p>
                  )}
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {result.type}
                </span>
              </div>
              {result.relevanceScore && (
                <p className="text-xs text-gray-400 mt-2">Relevance: {result.relevanceScore}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Test Suggestions:</h4>
        <ul className="space-y-1">
          <li>• Try searching for clinic names (e.g., "Medical", "Health")</li>
          <li>• Try searching for services (e.g., "Dental", "Cardiology")</li>
          <li>• Try searching for specializations (e.g., "General Medicine")</li>
          <li>• Try partial matches (e.g., "Card" for Cardiology)</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchTest;
