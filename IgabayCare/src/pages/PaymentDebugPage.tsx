import React, { useState } from 'react';
import GCashPayment from '../components/payment/GCashPayment';
import GCashPaymentDebug from '../components/payment/GCashPaymentDebug';
import AdyenSessionTest from '../components/payment/AdyenSessionTest';

const PaymentDebugPage: React.FC = () => {
  const [debugMode, setDebugMode] = useState<'session-test' | 'debug-component' | 'normal-component'>('session-test');
  const [testParams, setTestParams] = useState({
    patientId: 'test-patient-123',
    clinicId: 'test-clinic-456',
    appointmentId: 'test-appointment-789',
    amount: 100.00
  });

  const handlePaymentSuccess = (result: any) => {
    console.log('Payment Success:', result);
    alert('Payment Success! Check console for details.');
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment Error:', error);
    alert('Payment Error! Check console for details.');
  };

  const handlePaymentCancel = () => {
    console.log('Payment Cancelled');
    alert('Payment Cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment System Debug</h1>
          <p className="text-gray-600 mb-6">
            Use this page to test and debug the payment components. Check your browser console for detailed logs.
          </p>

          {/* Debug Mode Selector */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Debug Mode</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setDebugMode('session-test')}
                className={`px-4 py-2 rounded-md ${
                  debugMode === 'session-test' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                1. Session Test Only
              </button>
              <button
                onClick={() => setDebugMode('debug-component')}
                className={`px-4 py-2 rounded-md ${
                  debugMode === 'debug-component' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                2. Step-by-Step Debug
              </button>
              <button
                onClick={() => setDebugMode('normal-component')}
                className={`px-4 py-2 rounded-md ${
                  debugMode === 'normal-component' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                3. Normal Component
              </button>
            </div>
          </div>

          {/* Test Parameters */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Test Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={testParams.patientId}
                  onChange={(e) => setTestParams(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic ID</label>
                <input
                  type="text"
                  value={testParams.clinicId}
                  onChange={(e) => setTestParams(prev => ({ ...prev, clinicId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID</label>
                <input
                  type="text"
                  value={testParams.appointmentId}
                  onChange={(e) => setTestParams(prev => ({ ...prev, appointmentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  value={testParams.amount}
                  onChange={(e) => setTestParams(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Component Display Area */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {debugMode === 'session-test' && 'Session Test Only'}
            {debugMode === 'debug-component' && 'Step-by-Step Debug Component'}
            {debugMode === 'normal-component' && 'Normal Payment Component'}
          </h2>

          {debugMode === 'session-test' && (
            <div>
              <p className="text-gray-600 mb-4">
                This will only test session creation without any UI components.
              </p>
              <AdyenSessionTest />
            </div>
          )}

          {debugMode === 'debug-component' && (
            <div>
              <p className="text-gray-600 mb-4">
                This will show each step of the initialization process with detailed logs.
              </p>
              <GCashPaymentDebug
                patientId={testParams.patientId}
                clinicId={testParams.clinicId}
                appointmentId={testParams.appointmentId}
                amount={testParams.amount}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onPaymentCancel={handlePaymentCancel}
              />
            </div>
          )}

          {debugMode === 'normal-component' && (
            <div>
              <p className="text-gray-600 mb-4">
                This is the normal payment component with improved error handling.
              </p>
              <GCashPayment
                patientId={testParams.patientId}
                clinicId={testParams.clinicId}
                appointmentId={testParams.appointmentId}
                amount={testParams.amount}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onPaymentCancel={handlePaymentCancel}
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="text-yellow-700 space-y-2 list-decimal list-inside">
            <li><strong>Session Test Only:</strong> Tests if your backend and Adyen session creation is working.</li>
            <li><strong>Step-by-Step Debug:</strong> Shows exactly where the initialization process fails.</li>
            <li><strong>Normal Component:</strong> Tests the actual payment component with improved error handling.</li>
          </ol>
          <p className="text-yellow-700 mt-3">
            <strong>Always check your browser console</strong> for detailed logs and error messages!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentDebugPage;
