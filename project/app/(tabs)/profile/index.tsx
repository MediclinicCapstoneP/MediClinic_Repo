import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, Patient, Clinic, Doctor } from '../../../lib/supabase';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');

  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    if (!user || !user.profile) {
      setLoading(false);
      return;
    }
    const role = user.role;
    const data = user.profile.data as Patient | Clinic | Doctor;
    if (role === 'patient') {
      const p = data as Patient;
      setFirstName(p.first_name || '');
      setLastName(p.last_name || '');
      setPhone(p.phone || '');
      setDateOfBirth(p.date_of_birth || '');
      setAddress(p.address || '');
    } else if (role === 'doctor') {
      const d = data as Doctor;
      setFullName(d.full_name || '');
      setSpecialization(d.specialization || '');
      setPhone(d.phone || '');
    } else if (role === 'clinic') {
      const c = data as Clinic;
      setClinicName(c.clinic_name || '');
      setPhone(c.phone || '');
      setAddress(c.address || '');
      setCity(c.city || '');
      setState(c.state || '');
      setZipCode(c.zip_code || '');
    }
    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      if (user.role === 'patient') {
        const { error } = await supabase
          .from('patients')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone,
            date_of_birth: dateOfBirth,
            address,
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else if (user.role === 'doctor') {
        const { error } = await supabase
          .from('doctors')
          .update({
            full_name: fullName,
            specialization,
            phone,
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else if (user.role === 'clinic') {
        const { error } = await supabase
          .from('clinics')
          .update({
            clinic_name: clinicName,
            phone,
            address,
            city,
            state,
            zip_code: zipCode,
          })
          .eq('user_id', user.id);
        if (error) throw error;
      }
      Alert.alert('Success', 'Profile updated');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Sign in to edit your profile</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {user.role === 'patient' && (
          <View>
            <Text style={styles.label}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
            <Text style={styles.label}>Last Name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
          </View>
        )}

        {user.role === 'doctor' && (
          <View>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
            <Text style={styles.label}>Specialization</Text>
            <TextInput style={styles.input} value={specialization} onChangeText={setSpecialization} />
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        )}

        {user.role === 'clinic' && (
          <View>
            <Text style={styles.label}>Clinic Name</Text>
            <TextInput style={styles.input} value={clinicName} onChangeText={setClinicName} />
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
            <Text style={styles.label}>City</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} />
            <Text style={styles.label}>State</Text>
            <TextInput style={styles.input} value={state} onChangeText={setState} />
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput style={styles.input} value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" />
          </View>
        )}

        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 14, color: '#374151', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#FFFFFF' },
  button: { marginTop: 24, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

