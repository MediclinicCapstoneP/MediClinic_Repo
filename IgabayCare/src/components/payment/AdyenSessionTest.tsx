import React, { useState } from 'react';
import { adyenPaymentService } from '../../services/adyenPaymentService';

const AdyenSessionTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testSession = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing session creation...');
      
      const sessionResult = await adyenPaymentService.createPaymentSession({
        patientId: 'test-patient-123',
        clinicId: 'test-clinic-456',
        amount: 100,
        currency: 'PHP',
        paymentMethod: 'gcash',
        returnUrl: `${window.location.origin}/payment/return`,
        reference: `TEST-${Date.now()}`
      });

      console.log('Session result:', sessionResult);
      setResult(sessionResult);
      
      if (!sessionResult.success) {
        setError(sessionResult.error || 'Unknown error');
      }

    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Adyen Session Test</h2>
      
      <button
        onClick={testSession}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Session Creation'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold text-red-800">Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 border rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AdyenSessionTest;
