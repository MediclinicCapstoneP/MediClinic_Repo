import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


function ProfileHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>
        <Text style={{color: 'blue'}}>iGabayAti</Text>
        <Text style={{color: 'black'}}>Care</Text>🍀
      </Text>
      <TouchableOpacity style={styles.profileButton}>
        <Text style={styles.profileButtonText}>A</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <ProfileHeader />

        <Text style={styles.greeting}>👋 Hello!</Text>
        <Text style={styles.userName}>Louis Argawanon</Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <TextInput placeholder="Search..." style={styles.searchInput} />
          <Ionicons name="search" size={20} color="gray" />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/schedule')}
          >
            <MaterialIcons name="event" size={24} color="black" />
            <Text>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/viewappointment')}
          >
            <FontAwesome5 name="clipboard-list" size={22} color="black" />
            <Text>View Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="map-outline" size={24} color="black" />
            <Text>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Info Card */}
        <View style={styles.infoCard}>
          <View>
            <Text style={styles.cardTitle}>Get the Best Medical Service</Text>
            <Text style={styles.cardText}>Get quality care from trusted medical professionals</Text>
            <Text style={styles.cardText}>dedicated to your health.</Text>
          </View>
          <Image source={{uri: 'https://via.placeholder.com/80'}} style={styles.doctorImage} />
        </View>

        {/* Bottom Info Card */}
        <View style={styles.bottomCard}>
          <Image source={{uri: 'https://via.placeholder.com/80'}} style={styles.doctorImage} />
          <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>Book. Consult. Heal. All with <Text style={{color: 'blue'}}>iGabayAtiCare</Text>.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating AI Button - bottom right */}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    backgroundColor: '#eae8e8ff',
    width: 60,
    height: 60,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 1.5,
    shadowOffset: { width: 0, height: 4},
    shadowRadius: 5,
  },
  profileButtonText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: 30,
  },
  greeting: {
    marginTop: 10,
    fontSize: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: '#e1f5fe',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    width: 100,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#9a9898f1',
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  bottomCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#9a9898f1',
    borderRadius: 10,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardText: {
    fontSize: 14,
    marginTop: 5,
  },
  doctorImage: {
    width: 80,
    height: 80,
    marginLeft: 10,
    borderRadius: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1a4fb4',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
});
