import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Debug component to show loading state and help identify loading issues
 */
export const LoadingDebug: React.FC = () => {
  const { loading, user, supabaseUser, error, availableRoles } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 max-w-sm z-50">
      <h4 className="font-bold text-yellow-800 mb-2">🔍 Auth Debug Info</h4>
      <div className="text-xs space-y-1 text-yellow-700">
        <div>🔄 Loading: {loading ? 'YES' : 'NO'}</div>
        <div>👤 User: {user ? 'EXISTS' : 'NULL'}</div>
        <div>🔐 Supabase User: {supabaseUser ? 'EXISTS' : 'NULL'}</div>
        <div>🎭 Available Roles: {JSON.stringify(availableRoles)}</div>
        <div>❌ Error: {error ? error.message : 'NONE'}</div>
        <div>⏰ Time: {new Date().toLocaleTimeString()}</div>
      </div>
      {loading && (
        <div className="mt-2 text-xs text-yellow-600">
          ⚠️ Stuck in loading state? Check console for errors.
        </div>
      )}
    </div>
  );
};
