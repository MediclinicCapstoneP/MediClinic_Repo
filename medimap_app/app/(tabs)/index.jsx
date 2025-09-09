import { StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useRouter } from 'expo-router';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { authService } from '../../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // User is already authenticated, redirect to homepage
        router.replace('/homepage');
      }
    } catch (error) {
      console.log('Error checking auth status:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.patientSignIn({ email, password });
      
      if (result.success) {
        Alert.alert('Success', 'Logged in successfully!', [
          { text: 'OK', onPress: () => router.replace('/homepage') }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        Alert.alert('Success', 'Password reset email sent! Check your inbox.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.patientSignUp({ 
        email, 
        password, 
        firstName, 
        lastName 
      });
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully! Please check your email to verify your account.', [
          { text: 'OK', onPress: () => setIsSignUp(false) }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Sign up failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
      {/* App Logo / Title */}
      <Text style={styles.logo}>
        <Text style={{ color: "#003399", fontWeight: "bold" }}>iGabay</Text>
        <Text style={{ color: "#003399", fontWeight: "bold" }}>Ati</Text>
        <Text style={{ color: "#333", fontWeight: "bold" }}>Care</Text>
        <Text style={{ color: "green" }}>🍀</Text>
      </Text>

      <Text style={styles.loginText}>{isSignUp ? 'Sign Up' : 'Log in'}</Text>

      {/* Sign Up Fields */}
      {isSignUp && (
        <>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="black" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color="black" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </>
      )}

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail" size={20} color="black" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <FontAwesome name="lock" size={20} color="black" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password for Sign Up */}
      {isSignUp && (
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="black" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      )}

      {!isSignUp && (
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot Password</Text>
        </TouchableOpacity>
      )}

      {/* Sign In/Up Button */}
      <TouchableOpacity 
        style={[styles.signInBtn, loading && styles.disabledBtn]} 
        onPress={isSignUp ? handleSignUp : handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signInText}>{isSignUp ? 'Create Account' : 'Sign in'}</Text>
        )}
      </TouchableOpacity>

      {/* Toggle Sign Up/In */}
      <View style={styles.signupContainer}>
        <Text>{isSignUp ? 'Already have an account? ' : 'Dont have an Account? '}</Text>
        <TouchableOpacity onPress={() => {
          setIsSignUp(!isSignUp);
          setFirstName('');
          setLastName('');
          setConfirmPassword('');
          setEmail('');
          setPassword('');
        }}>
          <Text style={styles.signupText}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    fontSize: 28,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: "100%",
    height: 50,
    borderColor: "#ccc",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
    color: "gray",
  },
  signInBtn: {
    backgroundColor: "#00BFFF",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  signInText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  orText: {
    marginHorizontal: 10,
    color: "gray",
  },
  socialContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  socialBtn: {
    marginHorizontal: 15,
    padding: 10,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
  },
  signupContainer: {
    flexDirection: "row",
  },
  signupText: {
    color: "#00BFFF",
    fontWeight: "bold",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
