import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function NotificationScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
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

        {/* Page Title */}
        <Text style={styles.pageTitle}>🔔 Notifications</Text>

        {/* Notification Cards */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="payment" size={28} color="#1a4fb4" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Payment Successful</Text>
              <Text style={styles.cardSubtitle}>Your consultation has been confirmed.</Text>
              <Text style={styles.cardTime}>Today, 3:00 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="event-available" size={28} color="#1a4fb4" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Upcoming Appointment</Text>
              <Text style={styles.cardSubtitle}>Dr. Santos - Tomorrow at 10:00 AM</Text>
              <Text style={styles.cardTime}>Yesterday, 9:30 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="medical-services" size={28} color="#1a4fb4" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Prescription Update</Text>
              <Text style={styles.cardSubtitle}>New prescription available in your records.</Text>
              <Text style={styles.cardTime}>2 days ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Mark as Read Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="checkmark-done" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  cardTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#1a4fb4",
    borderRadius: 28,
    padding: 15,
    elevation: 5,
  },
});
