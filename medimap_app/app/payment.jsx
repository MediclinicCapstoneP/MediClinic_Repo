import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PaymentScreen() {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { 
      id: 1, 
      name: "GCash", 
      icon: "phone-portrait", 
      description: "Pay using your GCash wallet",
      color: "#00D4AA"
    },
    { 
      id: 2, 
      name: "Bank Transfer", 
      icon: "card", 
      description: "Direct bank transfer",
      color: "#1a4fb4"
    },
    { 
      id: 3, 
      name: "Cash on Clinic", 
      icon: "cash", 
      description: "Pay when you arrive",
      color: "#28a745"
    },
    { 
      id: 4, 
      name: "Credit/Debit Card", 
      icon: "card-outline", 
      description: "Visa, Mastercard, or other cards",
      color: "#ff6b35"
    },
    { 
      id: 5, 
      name: "PayPal", 
      icon: "logo-paypal", 
      description: "PayPal account payment",
      color: "#0070ba"
    },
  ];

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      router.push('/(tabs)/homepage');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/homepage')}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.logo}>
            <Text style={{ color: "blue" }}>iGabayAti</Text>
            <Text style={{ color: "black" }}>Care</Text> 🍀
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.pageTitle}>💳 Payment Method</Text>
        <Text style={styles.subtitle}>Choose your preferred payment option</Text>

        {/* Payment Methods */}
        {paymentMethods.map((payment) => (
          <TouchableOpacity
            key={payment.id}
            style={[
              styles.paymentCard,
              selectedPayment === payment.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedPayment(payment.id)}
          >
            <View style={styles.cardContent}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: selectedPayment === payment.id ? "#fff" : payment.color + "20" }
              ]}>
                <Ionicons
                  name={payment.icon}
                  size={28}
                  color={selectedPayment === payment.id ? payment.color : payment.color}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.paymentTitle,
                  selectedPayment === payment.id && { color: "#fff" }
                ]}>
                  {payment.name}
                </Text>
                <Text style={[
                  styles.paymentDescription,
                  selectedPayment === payment.id && { color: "#eee" }
                ]}>
                  {payment.description}
                </Text>
              </View>
              {selectedPayment === payment.id && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Payment Summary */}
        {selectedPayment && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service:</Text>
              <Text style={styles.summaryValue}>Medical Consultation</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>₱500.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method:</Text>
              <Text style={styles.summaryValue}>
                {paymentMethods.find(p => p.id === selectedPayment)?.name}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₱500.00</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      {selectedPayment && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.payButton, isProcessing && styles.processingButton]}
            onPress={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <Ionicons name="refresh" size={20} color="#fff" style={styles.spinning} />
                <Text style={styles.payButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.payButtonText}>Pay ₱500.00</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  selectedCard: {
    backgroundColor: "#1a4fb4",
    shadowColor: "#1a4fb4",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
    borderColor: "#1a4fb4",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: "#666",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a4fb4",
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  payButton: {
    backgroundColor: "#1a4fb4",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#1a4fb4",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  processingButton: {
    backgroundColor: "#666",
  },
  payButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinning: {
    marginRight: 8,
  },
});
