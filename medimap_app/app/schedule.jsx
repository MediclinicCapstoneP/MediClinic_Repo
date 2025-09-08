import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/homepage')}>
        </TouchableOpacity>
        <Text style={styles.logoText}>iGabayAtiCare🍀</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Schedule Title */}
      <Text style={styles.scheduleTitle}>Schedule</Text>
      <Text style={styles.subTitle}>Today's Schedule:</Text>

      {/* Schedule Card */}
      <View style={styles.card}>
        <Text style={styles.time}>10:30 AM</Text>
        <View style={styles.cardContent}>
          <Text style={styles.clinicTitle}>Bogo Clinical Laboratory</Text>
          <Text style={styles.clinicLocation}>
            Location: Bogo Clinical Laboratory{"\n"}
            BRGY. San Vicente, Bogo City{"\n"}
            (At the back of the PNB Bogo)
          </Text>
        </View>
      </View>

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
    paddingHorizontal: 20, // more left/right spacing
    paddingTop: 30, // more top spacing
    paddingBottom: 100, // keeps bottom free + space for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginLeft: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a4fb4",
  },
  scheduleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 20,
  },
  subTitle: {
    fontSize: 15,
    marginBottom: 25,
    marginLeft: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    elevation: 3,
    shadowColor: "#000000ff",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
    marginBottom: 25,
    marginLeft: 20,
    marginRight: 20,
  },
  time: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardContent: {
    marginLeft: 5,
  },
  clinicTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  clinicLocation: {
    fontSize: 14,
    color: "#444",
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20, // stays on right side
    backgroundColor: '#1a4fb4',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
});
