/**
 * Debug Page - Authentication Debugging
 * Temporary page for diagnosing authentication issues
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthDebugComponent } from '../components/debug/AuthDebugComponent';

const DebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Authentication Debug</h1>
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              Development Only
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <AuthDebugComponent />
      </div>

      {/* Footer Warning */}
      <div className="bg-red-50 border-t border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-red-700 text-sm">
              <strong>Warning:</strong> This debug page should only be accessible in development. 
              Remove the debug route before deploying to production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;