import React, { useEffect, useRef, useState } from 'react';
import { adyenPaymentService } from '../../services/adyenPaymentService';

interface GCashPaymentDebugProps {
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  amount: number;
  currency?: string;
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentCancel?: () => void;
}

const GCashPaymentDebug: React.FC<GCashPaymentDebugProps> = ({
  patientId,
  clinicId,
  appointmentId,
  amount,
  currency = 'PHP',
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<string>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const addLog = (step: string, message: string) => {
    const logEntry = `${new Date().toLocaleTimeString()} [${step}]: ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  const updateStep = (step: string, logMessage?: string) => {
    setCurrentStep(step);
    if (logMessage) {
      addLog(step, logMessage);
    }
  };

  useEffect(() => {
    if (patientId && clinicId && amount) {
      initializePaymentDebug();
    }
  }, [patientId, clinicId, amount]);

  const initializePaymentDebug = async () => {
    try {
      updateStep('checking-env', 'Checking environment variables...');
      
      // Environment check
      const envCheck = {
        ADYEN_ENVIRONMENT: import.meta.env.VITE_ADYEN_ENVIRONMENT,
        ADYEN_CLIENT_KEY: import.meta.env.VITE_ADYEN_CLIENT_KEY ? 'Present' : 'Missing',
        ADYEN_MERCHANT: import.meta.env.VITE_ADYEN_MERCHANT_ACCOUNT ? 'Present' : 'Missing',
        API_BASE_URL: import.meta.env.VITE_API_BASE_URL ? 'Present' : 'Missing'
      };
      addLog('env-check', `Environment: ${JSON.stringify(envCheck)}`);

      if (!import.meta.env.VITE_ADYEN_CLIENT_KEY || !import.meta.env.VITE_API_BASE_URL) {
        throw new Error('Missing required environment variables');
      }

      updateStep('creating-session', 'Creating payment session...');
      
      const sessionRequest = {
        patientId,
        clinicId,
        appointmentId,
        amount,
        currency,
        paymentMethod: 'gcash' as const,
        returnUrl: `${window.location.origin}/payment/return`
      };
      
      addLog('session-request', `Request: ${JSON.stringify(sessionRequest)}`);
      
      const sessionResult = await adyenPaymentService.createPaymentSession(sessionRequest);
      
      addLog('session-response', `Response: ${JSON.stringify({ success: sessionResult.success, error: sessionResult.error })}`);
      
      if (!sessionResult.success || !sessionResult.session) {
        throw new Error(sessionResult.error || 'Session creation failed');
      }

      setSessionData(sessionResult.session);
      updateStep('session-created', 'Session created successfully');

      updateStep('loading-adyen', 'Loading Adyen Web Components...');
      
      // Test if Adyen Web Components can be imported
      try {
        const { AdyenCheckout } = await import('@adyen/adyen-web');
        addLog('import-check', `AdyenCheckout type: ${typeof AdyenCheckout}`);
        
        if (typeof AdyenCheckout !== 'function') {
          throw new Error('AdyenCheckout is not a function');
        }
        
        updateStep('adyen-loaded', 'Adyen Web Components loaded');
        
        // Test configuration creation
        const { getAdyenConfiguration } = await import('../../services/adyenPaymentService');
        const config = getAdyenConfiguration({
          id: sessionResult.session.sessionId,
          sessionData: sessionResult.session.sessionData
        });
        
        addLog('config-check', `Config created: ${Object.keys(config).join(', ')}`);
        updateStep('config-ready', 'Configuration ready');
        
        // Test Adyen Checkout initialization
        updateStep('initializing-checkout', 'Initializing Adyen Checkout...');
        
        const checkoutInstance = await AdyenCheckout(config);
        addLog('checkout-init', `Checkout instance: ${typeof checkoutInstance}`);
        
        if (!checkoutInstance) {
          throw new Error('AdyenCheckout returned null/undefined');
        }
        
        updateStep('checkout-initialized', 'Checkout initialized successfully');
        
        // Test DOM element readiness
        if (!checkoutRef.current) {
          throw new Error('DOM element not ready');
        }
        
        updateStep('dom-ready', 'DOM element ready');
        
        // Test component availability
        let availableComponents = [];
        if (checkoutInstance.components) {
          availableComponents = Object.keys(checkoutInstance.components);
          addLog('components-check', `Available components: ${availableComponents.join(', ')}`);
        }
        
        if (typeof checkoutInstance.create === 'function') {
          addLog('create-check', 'create() method available');
        }
        
        updateStep('ready-to-mount', 'Ready to mount payment UI');
        
        // At this point we know everything is working, so we could attempt mounting
        // But for debugging purposes, we'll stop here to see if we get this far
        
      } catch (adyenError) {
        addLog('adyen-error', `Adyen error: ${adyenError.message}`);
        throw adyenError;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      updateStep('error', `Error: ${errorMessage}`);
    }
  };

  const retryPayment = () => {
    setError(null);
    setLogs([]);
    setSessionData(null);
    initializePaymentDebug();
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Payment Debug Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={retryPayment}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry Debug Test
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Step Display */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center mb-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <h3 className="text-lg font-medium text-blue-800">Payment Debug Mode</h3>
        </div>
        <p className="text-blue-700">
          Current Step: <span className="font-semibold">{currentStep}</span>
        </p>
        {sessionData && (
          <p className="text-sm text-blue-600 mt-1">
            Session ID: {sessionData.sessionId}
          </p>
        )}
      </div>

      {/* Payment Details */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Payment Details:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Patient ID: {patientId}</div>
          <div>Clinic ID: {clinicId}</div>
          <div>Amount: ₱{amount.toFixed(2)} {currency}</div>
          {appointmentId && <div>Appointment ID: {appointmentId}</div>}
        </div>
      </div>

      {/* Debug Logs */}
      <div className="p-4 bg-black text-green-400 rounded-lg">
        <h4 className="font-medium mb-2">Debug Logs:</h4>
        <div className="text-xs font-mono max-h-64 overflow-y-auto space-y-1">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500">Waiting for logs...</div>
          )}
        </div>
      </div>

      {/* Hidden checkout container for DOM testing */}
      <div ref={checkoutRef} className="hidden">
        {/* This is just for DOM element testing */}
      </div>

      {/* Controls */}
      <div className="flex space-x-3">
        <button
          onClick={retryPayment}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Restart Debug
        </button>
        <button
          onClick={onPaymentCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default GCashPaymentDebug;
