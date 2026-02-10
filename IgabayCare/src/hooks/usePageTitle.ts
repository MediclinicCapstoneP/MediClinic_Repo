import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTitleMap {
  [key: string]: string;
}

const pageTitleMap: PageTitleMap = {
  '/': 'iGabayAtiCare - Home',
  '/signin': 'Sign In - iGabayAtiCare',
  '/signup': 'Sign Up - iGabayAtiCare',
  '/clinic-signin': 'Clinic Sign In - iGabayAtiCare',
  '/clinic-signup': 'Clinic Sign Up - iGabayAtiCare',
  '/doctor-signin': 'Doctor Sign In - iGabayAtiCare',
  '/doctor-signup': 'Doctor Sign Up - iGabayAtiCare',
  '/learn-more': 'Learn More - iGabayAtiCare',
  '/auth/callback': 'Authentication - iGabayAtiCare',
  '/patient/dashboard': 'Patient Dashboard - iGabayAtiCare',
  '/patient/medical-history': 'Medical History - iGabayAtiCare',
  '/patient/payment-return': 'Payment Return - iGabayAtiCare',
  '/clinic/dashboard': 'Clinic Dashboard - iGabayAtiCare',
  '/doctors-dashboard': 'Doctor Dashboard - iGabayAtiCare',
  '/debug': 'Debug - iGabayAtiCare',
  '/appointment-display-test': 'Appointment Test - iGabayAtiCare',
  '/payment-debug': 'Payment Debug - iGabayAtiCare',
  '/chat': 'Chat - iGabayAtiCare',
  '/chatbot-test': 'Chatbot Test - iGabayAtiCare',
  '/push-notification-test': 'Notification Test - iGabayAtiCare',
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const title = pageTitleMap[path] || 'iGabayAtiCare';
    document.title = title;
  }, [location.pathname]);
};
