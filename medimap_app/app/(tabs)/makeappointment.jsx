import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from 'expo-router';
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MakeAppointmentScreen() {
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const clinics = [
    { id: 1, name: "Bogo Clinical Laboratory", location: "San Vicente, Bogo City (Behind PNB)" },
    { id: 2, name: "iCare Medical Center", location: "Mandaue City, Cebu" },
    { id: 3, name: "St. Gabriel Clinic", location: "Cebu City, Capitol Site" },
  ];

  const payments = [
    { id: 1, name: "GCash", icon: "phone-portrait" },
    { id: 2, name: "Bank Transfer", icon: "card" },
    { id: 3, name: "Cash on Clinic", icon: "cash" },
  ];

  // Success Screen
  if (isConfirmed) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="green" />
        <Text style={styles.successTitle}>Appointment Confirmed!</Text>
        <Text style={styles.successDetails}>
          {selectedClinic &&
            clinics.find((c) => c.id === selectedClinic)?.name}
        </Text>
        <Text style={styles.successDetails}>{date.toDateString()}</Text>
        <Text style={styles.successDetails}>
          {time &&
            time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Text style={styles.successDetails}>
          Payment: {selectedPayment && payments.find((p) => p.id === selectedPayment)?.name}
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.push('/(tabs)/homepage')}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
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

      <Text style={styles.pageTitle}>📅 Make an Appointment</Text>

      {/* Step 1: Select Clinic */}
      <Text style={styles.sectionTitle}>Select a Clinic</Text>
      {clinics.map((clinic) => (
        <TouchableOpacity
          key={clinic.id}
          style={[
            styles.card,
            selectedClinic === clinic.id && styles.selectedCard,
          ]}
          onPress={() => setSelectedClinic(clinic.id)}
        >
          <Text
            style={[
              styles.cardTitle,
              selectedClinic === clinic.id && { color: "#fff" },
            ]}
          >
            {clinic.name}
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              selectedClinic === clinic.id && { color: "#eee" },
            ]}
          >
            {clinic.location}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Step 2: Pick Date */}
      {selectedClinic && (
        <>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#1a4fb4" />
            <Text style={styles.inputText}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </>
      )}

      {/* Step 3: Pick Time */}
      {selectedClinic && (
        <>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time" size={20} color="#1a4fb4" />
            <Text style={styles.inputText}>
              {time
                ? time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Choose Time"}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}
        </>
      )}

      {/* Step 4: Payment Method */}
      {selectedClinic && date && time && (
        <>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {payments.map((pay) => (
            <TouchableOpacity
              key={pay.id}
              style={[
                styles.card,
                selectedPayment === pay.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedPayment(pay.id)}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={pay.icon}
                  size={22}
                  color={selectedPayment === pay.id ? "#fff" : "#1a4fb4"}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.cardTitle,
                    selectedPayment === pay.id && { color: "#fff" },
                  ]}
                >
                  {pay.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Step 5: Confirm Booking */}
      {selectedClinic && date && time && selectedPayment && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => setIsConfirmed(true)}
        >
          <Text style={styles.confirmText}>Confirm Booking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10 
  },
  logo: { fontSize: 20, fontWeight: "bold" },
  pageTitle: { fontSize: 22, fontWeight: "bold", marginVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginVertical: 10 },
  card: {
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
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardSubtitle: { fontSize: 14, color: "#555" },
  inputButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  inputText: { marginLeft: 10, fontSize: 15 },
  confirmButton: {
    backgroundColor: "#1a4fb4",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#1a4fb4",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#f8f9fa",
  },
  successTitle: { fontSize: 24, fontWeight: "bold", marginVertical: 15 },
  successDetails: { fontSize: 16, marginBottom: 5 },
  doneButton: {
    backgroundColor: "#1a4fb4",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#1a4fb4",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  doneText: { color: "#fff", fontWeight: "bold" },
});
