import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

type PaymentWebViewProps = {
  url: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onClose: () => void;
};

const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  url,
  onSuccess,
  onError,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (url) {
      console.log('PaymentWebView: Loading URL:', url);
    }
  }, [url]);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url: currentUrl } = navState;
    console.log('PaymentWebView: Navigation changed to:', currentUrl);

    // Handle successful payment (PayMongo redirects to success_url)
    if (currentUrl.includes('/payment/success') || currentUrl.includes('payment/success')) {
      onSuccess();
      return false; // Prevent further navigation
    }

    // Handle cancelled payment (PayMongo redirects to cancel_url)
    if (currentUrl.includes('/payment/cancel') || currentUrl.includes('payment/cancel')) {
      onClose();
      return false; // Prevent further navigation
    }

    // Handle failed payment
    if (currentUrl.includes('/failed') || currentUrl.includes('failed')) {
      onError('Payment failed. Please try again.');
      return false; // Prevent further navigation
    }

    // Handle deep linking for 3D Secure (redirect to external browser)
    // PayMongo may redirect to bank pages for authentication
    if (
      currentUrl.startsWith('http') && 
      !currentUrl.includes('paymongo.com') &&
      !currentUrl.includes('payment/')
    ) {
      WebBrowser.openBrowserAsync(currentUrl);
      return false; // Prevent WebView from loading the URL
    }

    return true;
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    onError('Failed to load payment page. Please check your internet connection and try again.');
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView HTTP error:', nativeEvent);
    if (nativeEvent.statusCode >= 400) {
      onError(`Payment page error (${nativeEvent.statusCode}). Please try again.`);
    }
  };

  if (!url) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onHttpError={handleHttpError}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={Platform.OS === 'android'}
        onShouldStartLoadWithRequest={(request) => {
          const requestUrl = request.url;

          // Handle payment success/cancel redirects
          if (requestUrl.includes('/payment/success') || requestUrl.includes('payment/success')) {
            onSuccess();
            return false;
          }

          if (requestUrl.includes('/payment/cancel') || requestUrl.includes('payment/cancel')) {
            onClose();
            return false;
          }

          // Handle deep linking for 3D Secure (redirect to external browser)
          // PayMongo may redirect to bank pages for authentication
          if (
            requestUrl.startsWith('http') && 
            !requestUrl.includes('paymongo.com') &&
            !requestUrl.includes('payment/')
          ) {
            WebBrowser.openBrowserAsync(requestUrl);
            return false;
          }

          return true;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default PaymentWebView;
