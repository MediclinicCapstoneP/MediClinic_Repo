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
          <input type="text" v-model="name" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="email" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Contact Number</label>
          <input type="text" v-model="phone" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" v-model="address" class="form-control" required />
        </div>
        <div class="form-group">
          <label>License Number</label>
          <input type="text" v-model="license_number" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Accreditation</label>
          <input type="text" v-model="accreditation" class="form-control" />
        </div>
        <div class="form-group">
          <label>Owner Name</label>
          <input type="text" v-model="owner_name" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" class="form-control" required />
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
export default {
  data() {
    return {
      name: '',
      email: '',
      phone: '',
      address: '',
      license_number: '',
      accreditation: '',
      owner_name: '',
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    async registerClinic() {
      this.error = ''
      this.loading = true
      try {
        const formData = {
          name: this.name,
          email: this.email,
          phone: this.phone,
          address: this.address,
          license_number: this.license_number,
          accreditation: this.accreditation,
          owner_name: this.owner_name,
          password: this.password
        }
        const response = await fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        const result = await response.json()
        if (result.res === 'success') {
          alert(result.msg)
          this.$router.push('/login')
        } else {
          this.error = result.msg
        }
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