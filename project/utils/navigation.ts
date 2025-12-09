import { router } from 'expo-router';

type PaymentParams = {
  amount: number;
  description: string;
  referenceId?: string;
};

export const navigateToPayment = (params: PaymentParams) => {
  const { amount, description, referenceId } = params;
  
  router.push({
    pathname: '/payment/[id]',
    params: {
      id: referenceId || 'payment',
      amount: amount.toString(),
      description: encodeURIComponent(description),
    },
  });
};

// Example usage:
// navigateToPayment({
//   amount: 1000, // Amount in PHP (e.g., 1000 = ₱1,000.00)
//   description: 'Payment for appointment #12345',
//   referenceId: 'appt_12345',
// });
