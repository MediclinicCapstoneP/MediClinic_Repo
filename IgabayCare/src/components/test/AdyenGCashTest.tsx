import React from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentExample from '../payment/PaymentExample';
import { Button } from '../ui/Button';

const AdyenGCashTest: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Adyen GCash Integration Test</h1>
              <p className="text-gray-600 mt-1">Test your Adyen GCash payment setup</p>
            </div>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>← Back to App</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <PaymentExample />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="text-center text-gray-500">
            <p className="text-sm">
              This is a test page for Adyen GCash integration. Make sure you have:
            </p>
            <ul className="text-xs mt-2 space-y-1">
              <li>✅ Updated your .env file with Adyen credentials</li>
              <li>✅ Deployed Supabase Edge Functions</li>
              <li>✅ Configured webhooks in Adyen Customer Area</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdyenGCashTest;
