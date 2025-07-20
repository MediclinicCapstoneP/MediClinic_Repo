<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <img src="/vite.svg" alt="iGabayAtiCare Logo" class="register-logo" />
        <h2>iGabayAtiCare</h2>
        <p class="register-welcome">Register Your Clinic</p>
      </div>
      <form @submit.prevent="registerClinic" class="register-form" enctype="multipart/form-data">
        <div class="form-group">
          <label>Clinic Name</label>
          <input type="text" v-model="clinicName" class="form-control" required />
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
          <label>Contact Number</label>
          <input type="text" v-model="contact" class="form-control" />
        </div>

        <div class="form-group">
          <label>Location</label>
          <input type="text" v-model="location" class="form-control" />
        </div>

        <div class="form-group">
          <label>Professional Certificate / Business Permit</label>
          <input type="file" @change="handleFileUpload" accept=".jpg,.jpeg,.png,.pdf" class="form-control" required />
        </div>

        <button class="btn-register" type="submit" :disabled="loading">
          <span v-if="loading">Submitting...</span>
          <span v-else>Register Clinic</span>
        </button>

        <p class="login-link">
          Already registered?
          <router-link to="/login">Login here</router-link>
        </p>

        <div v-if="error" class="alert-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script>
import { supabase } from '../services/supabase'

export default {
  data() {
    return {
      clinicName: '',
      email: '',
      password: '',
      contact: '',
      location: '',
      certificateFile: null,
      error: '',
      loading: false
    }
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0]
      this.certificateFile = file
    },
    async registerClinic() {
      this.error = ''
      this.loading = true

      try {
        // Step 1: Upload file to Supabase Storage (make sure you have a 'certificates' bucket)
        let uploadedFileUrl = null
        if (this.certificateFile) {
          const fileName = `${Date.now()}_${this.certificateFile.name}`
          const { data, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(fileName, this.certificateFile)

          if (uploadError) throw uploadError

          uploadedFileUrl = supabase.storage.from('certificates').getPublicUrl(fileName).data.publicUrl
        }

        // Step 2: Create Clinic Auth Account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: this.email,
          password: this.password,
          options: {
            data: {
              clinic_name: this.clinicName,
              role: 'clinic',
              contact: this.contact,
              location: this.location,
              certificate_url: uploadedFileUrl
            }
          }
        })

        if (signUpError) throw signUpError

        // Step 3: Insert into clinics table
        const userId = signUpData.user?.id
        if (userId) {
          const { error: dbError } = await supabase
            .from('clinics')
            .insert([{
              id: userId,
              name: this.clinicName,
              email: this.email,
              phone: this.contact,
              address: this.location,
              license_number: uploadedFileUrl,
              created_at: new Date(),
              is_verified: false
            }])
          if (dbError) throw dbError
        }

        alert('Please verify your email to activate the clinic account.')
        this.$router.push('/login')
      } catch (err) {
        this.error = err.message
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
    padding: 1.5rem 0.7rem 1.2rem 0.7rem;
    max-width: 98vw;
  }
}
</style>