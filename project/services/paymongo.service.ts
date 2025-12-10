import { Platform } from 'react-native';
import { encode } from 'base-64';

// Use base-64 package for encoding (works in React Native and Web)
const btoaFunction = (str: string): string => {
  return encode(str);
};

// PayMongo requires SECRET KEY for creating checkout sessions (not public key)
const PAYMONGO_SECRET_KEY = process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY;
const API_URL = 'https://api.paymongo.com/v1';

// Ensure success/cancel URLs use an HTTPS host (PayMongo rejects custom schemes)
const WEB_APP_BASE_URL = (process.env.EXPO_PUBLIC_APP_WEB_URL || 'https://igabaycare.com').replace(/\/$/, '');

const getAppUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${normalizedPath}`;
  }

  return `${WEB_APP_BASE_URL}${normalizedPath}`;
};

export interface CheckoutSession {
  id: string;
  type: string;
  attributes: {
    billing: {
      address: {
        city: string;
        country: string;
        line1: string;
        line2: string;
        postal_code: string;
        state: string;
      };
      email: string;
      name: string;
      phone: string | null;
    };
    checkout_url: string;
    client_key: string;
    description: string;
    line_items: Array<{
      amount: number;
      currency: string;
      description: string;
      name: string;
      quantity: number;
    }>;
    livemode: boolean;
    merchant: string;
    payment_method_types: string[];
    reference_number: string;
    send_email_receipt: boolean;
    show_description: boolean;
    show_line_items: boolean;
    status: string;
    success_url: string;
    created_at: number;
    updated_at: number;
    metadata?: Record<string, string>;
  };
}

interface CustomerInfo {
  email?: string;
  name?: string;
  phone?: string;
  address?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface CheckoutSessionOptions {
  paymentMethodTypes?: string[];
  customerInfo?: CustomerInfo;
  metadata?: Record<string, string>;
}

export const createCheckoutSession = async (
  amount: number,
  description: string,
  options: CheckoutSessionOptions = {}
): Promise<CheckoutSession> => {
  if (!PAYMONGO_SECRET_KEY) {
    const errorMsg = 'PayMongo secret key is not configured. Please set EXPO_PUBLIC_PAYMONGO_SECRET_KEY in your environment variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log('Creating PayMongo checkout session with amount:', amount);

  const {
    paymentMethodTypes = ['card', 'gcash', 'grab_pay'],
    customerInfo,
    metadata,
  } = options;

  const response = await fetch(`${API_URL}/checkout_sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${btoaFunction(PAYMONGO_SECRET_KEY + ':')}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: amount * 100, // Convert to centavos
          payment_method_types: paymentMethodTypes,
          currency: 'PHP',
          description,
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          success_url: getAppUrl('/payment/success'),
          cancel_url: getAppUrl('/payment/cancel'),
          billing: customerInfo ? {
            name: customerInfo.name || 'Customer',
            email: customerInfo.email || 'customer@example.com',
            phone: customerInfo.phone || null,
            address: {
              line1: customerInfo.address?.line1 || 'N/A',
              line2: customerInfo.address?.line2 || '',
              city: customerInfo.address?.city || 'N/A',
              state: customerInfo.address?.state || 'N/A',
              postal_code: customerInfo.address?.postal_code || '0000',
              country: customerInfo.address?.country || 'PH',
            },
          } : {
            name: 'Customer',
            email: 'customer@example.com',
            phone: null,
            address: {
              line1: 'N/A',
              line2: '',
              city: 'N/A',
              state: 'N/A',
              postal_code: '0000',
              country: 'PH',
            },
          },
          line_items: [
            {
              amount: amount * 100,
              currency: 'PHP',
              description,
              name: 'Appointment Payment',
              quantity: 1,
            },
          ],
          metadata: {
            source: 'igabaycare_app',
            type: 'appointment_payment',
            ...(metadata || {}),
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.detail || 'Failed to create checkout session');
  }

  const { data } = await response.json();
  return data as CheckoutSession;
};

export const retrieveCheckoutSession = async (sessionId: string): Promise<CheckoutSession> => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo secret key is not configured. Please set EXPO_PUBLIC_PAYMONGO_SECRET_KEY in your environment variables.');
  }

  const response = await fetch(`${API_URL}/checkout_sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Basic ${btoaFunction(PAYMONGO_SECRET_KEY + ':')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.detail || 'Failed to retrieve checkout session');
  }

  const { data } = await response.json();
  return data as CheckoutSession;
};
