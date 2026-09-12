// Razorpay Standard Checkout, embedded via WebView.
//
// react-native-razorpay (the official native SDK) does not support React
// Native's New Architecture, which Expo SDK 57 requires - so instead of a
// native module we load Razorpay's own hosted checkout.js inside a WebView
// (react-native-webview, which is New Architecture compatible) and bridge its
// result back over postMessage. This is Razorpay's own documented approach
// for hybrid/WebView apps and needs no extra native code or dev-client work.
import React, { useMemo } from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors } from '../theme';
import type { RazorpayOrder } from '../services/payments';

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Props {
  order: RazorpayOrder | null;
  contact?: string | null;
  email?: string | null;
  onSuccess: (result: RazorpaySuccess) => void;
  onFailed: (reason: string) => void;
  onDismiss: () => void;
}

export default function RazorpayCheckout({ order, contact, email, onSuccess, onFailed, onDismiss }: Props) {
  const html = useMemo(() => {
    if (!order) return '';
    // Amount travels the wire in rupees; Razorpay's own API wants paise.
    const options = {
      key: order.gateway_key_id,
      amount: Math.round(order.amount * 100),
      currency: order.currency,
      name: 'Top Rider',
      description: 'Ride payment',
      order_id: order.gateway_order_id,
      prefill: {
        ...(contact ? { contact } : {}),
        ...(email ? { email } : {}),
      },
      theme: { color: colors.navy800 },
    };
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
</head>
<body style="margin:0;">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
    var options = ${JSON.stringify(options)};
    options.handler = function (response) {
      post({
        type: 'success',
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
    };
    options.modal = { ondismiss: function () { post({ type: 'dismiss' }); } };
    try {
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        post({ type: 'failed', reason: (response.error && response.error.description) || 'Payment failed' });
      });
      rzp.open();
    } catch (e) {
      post({ type: 'failed', reason: 'Could not open checkout' });
    }
  </script>
</body>
</html>`;
  }, [order, contact, email]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let data: { type: string; reason?: string } & Partial<RazorpaySuccess>;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      onDismiss();
      return;
    }
    if (data.type === 'success' && data.razorpay_payment_id && data.razorpay_order_id && data.razorpay_signature) {
      onSuccess({
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_signature: data.razorpay_signature,
      });
    } else if (data.type === 'failed') {
      onFailed(data.reason || 'Payment failed');
    } else {
      onDismiss();
    }
  };

  if (!order) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onDismiss} presentationStyle="pageSheet">
      <View style={styles.root}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onMessage={handleMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
