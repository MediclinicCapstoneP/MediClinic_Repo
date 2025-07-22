<!-- src/views/RegisterPatient.vue -->
<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <img src="/favicon.ico" alt="iGabayAtiCare Logo" class="register-logo" />
        <h2>iGabayAtiCare</h2>
        <p class="register-welcome">Create your patient account</p>
      </div>
      <form @submit.prevent="register" class="register-form">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" v-model="fullName" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="email" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" v-model="phone" class="form-control" />
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" v-model="address" class="form-control" />
        </div>
        <button class="btn-register" type="submit" :disabled="loading">
          <span v-if="loading">Registering...</span>
          <span v-else>Register</span>
        </button>
        <p class="login-link">
          Already have an account?
          <router-link to="/login">Login here</router-link>
        </p>
      </form>
      <div v-if="error" class="alert-error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  data() {
    return {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      error: '',
      loading: false
    }
  },
  methods: {
    async register() {
      this.error = ''
      this.loading = true

      try {
        // Validate required fields
        if (!this.fullName || !this.email || !this.password) {
          this.error = 'Please fill in all required fields.'
          this.loading = false
          return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(this.email)) {
          this.error = 'Please enter a valid email address.'
          this.loading = false
          return
        }

        // Check if email already exists in patients table
        const { data: existingPatient, error: checkError } = await supabase
          .from('patients')
          .select('id')
          .eq('email', this.email)
          .maybeSingle()

        if (checkError) {
          console.error('Error checking existing patient:', checkError)
        } else if (existingPatient) {
          this.error = 'An account with this email already exists.'
          this.loading = false
          return
        }

        // Create Supabase auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: this.email,
          password: this.password,
          options: {
            data: {
              full_name: this.fullName,
              phone: this.phone,
              address: this.address,
              role: 'patient'
            }
          }
        })

        if (authError) {
          this.error = authError.message
          this.loading = false
          return
        }
        const userId = authData.user?.id

        // Insert patient data into patients table
        const { error: insertError } = await supabase
          .from('patients')
          .insert([
            {
              id: userId,
              email: this.email,
              phone: this.phone || null,
              password_hash: 'managed_by_auth',
              full_name: this.fullName,
              address: this.address || null
              // created_at will use DB default
            }
          ])

        if (insertError) {
          console.error('Error inserting patient:', insertError)
          this.error = 'Failed to create patient account. Please try again.'
          this.loading = false
          return
        }

        // Success
        alert('Account created successfully! Please check your email to verify your account.')
        this.$router.push('/login')

      } catch (err) {
        console.error('Registration error:', err)
        this.error = 'Something went wrong during registration. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
}

.register-card {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  padding: 2.5rem 2rem 2rem 2rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.register-logo {
  width: 60px;
  height: 60px;
  margin-bottom: 0.5rem;
}

.register-welcome {
  color: #555;
  font-size: 1rem;
  margin-top: 0.5rem;
  text-align: center;
}

.register-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-group {
  width: 100%;
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.form-group label {
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.7rem;
  font-size: 1rem;
  background: #f9fafb;
  transition: border 0.2s;
}

.form-control:focus {
  border-color: #007bff;
  outline: none;
}

.btn-register {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(90deg, #007bff 0%, #00c6ff 100%);
  color: #fff;
  border: none;
  border-radius: 0.7rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  margin-bottom: 0.7rem;
  transition: background 0.2s;
}

.btn-register:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.97rem;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.alert-error {
  margin-top: 1rem;
  color: #fff;
  background: #e74c3c;
  padding: 0.7rem 1rem;
  border-radius: 0.7rem;
  text-align: center;
  width: 100%;
}

@media (max-width: 500px) {
  .register-card {
    padding: 1.5rem 0.7rem 1.2rem 0.7rem !important;
    max-width: 98vw !important;
  }

  .register-form {
    padding: 0 !important;
  }
}
</style>
