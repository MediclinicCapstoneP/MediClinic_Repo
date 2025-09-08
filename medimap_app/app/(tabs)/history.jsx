import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          <Text style={{ color: "#1a4fb4" }}>iGabayAti</Text>
          <Text style={{ color: "#4CAF50" }}>Care🍀</Text>
        </Text>
      </View>

      {/* History Title */}
      <Text style={styles.historyTitle}>History</Text>
      <Text style={styles.subTitle}>Latest</Text>

      {/* Scrollable History Cards */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Online Payment Successful!</Text>
          <Text style={styles.cardText}>
            Your payment of ₱xxx.xx to make an appointment.
          </Text>
          <Text style={styles.timestamp}>yesterday 5:20 PM</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your done making appointment</Text>
          <Text style={styles.cardText}>
            Your schedule of consultation.
          </Text>
          <Text style={styles.timestamp}>yesterday 5:30 PM</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient 1 Prescription Success</Text>
          <Text style={styles.cardText}>
            Amoxicillin 500 mg – Take one capsule orally three times a day for
            7 days.
          </Text>
          <Text style={styles.timestamp}>yesterday 9:08 PM</Text>
        </View>
      </ScrollView>

      {/* Floating AI Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 80,
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 20,
  },
  subTitle: {
    fontSize: 14,
    marginBottom: 15,
    marginLeft: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000000ff",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5},
    shadowRadius: 3,
    marginLeft: 20,
    marginRight: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a4fb4",
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 11,
    color: "#666",
    textAlign: "right",
  },
  fab: {
    position: "absolute",
    bottom: 20, // lifted up from edge
    right: 20, // lifted in from edge
    backgroundColor: "#1a4fb4",
    borderRadius: 35,
    padding: 15,
    elevation: 5,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: "#888",
  },
});
