import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AppointmentScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/homepage')}>
          </TouchableOpacity>
          <Text style={styles.logo}>
            <Text style={{ color: "blue" }}>iGabayAti</Text>
            <Text style={{ color: "black" }}>Care</Text> 🍀
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Page Title */}
        <Text style={styles.pageTitle}>📋 My Appointments</Text>

        {/* Appointment Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="event-available" size={28} color="#1a4fb4" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Dr. Santos</Text>
              <Text style={styles.cardSubtitle}>Sept 5, 2025 - 10:00 AM</Text>
              <Text style={styles.cardText}>Patient: Louis Argawanon</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel Appointment</Text>
          </TouchableOpacity>
        </View>

        {/* Add More Future Appointments */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="event-available" size={28} color="#1a4fb4" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Dr. Cruz</Text>
              <Text style={styles.cardSubtitle}>Sept 12, 2025 - 2:30 PM</Text>
              <Text style={styles.cardText}>Patient: Louis Argawanon</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Button to Add Appointment */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
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
    marginBottom: 20,
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
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
  cardText: {
    fontSize: 14,
    marginTop: 5,
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: "#ffcccc",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#b40000",
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#1a4fb4",
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
});
