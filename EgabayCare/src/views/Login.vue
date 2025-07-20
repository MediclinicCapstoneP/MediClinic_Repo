<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="/vite.svg" alt="iGabayAtiCare Logo" class="login-logo" />
                <h2>iGabayAtiCare</h2>
                <p class="login-welcome">Welcome Back 👋<br />Sign in to your account</p>
            </div>
            <form @submit.prevent="login" class="login-form">
                <div class="form-group">
                    <label for="email">Email address</label>
                    <input type="email" id="email" v-model="email" class="form-control" placeholder="Enter your email"
                        required />
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" v-model="password" class="form-control"
                        placeholder="Enter your password" required />
                </div>
                <button type="submit" class="btn-login" :disabled="loading">
                    <span v-if="loading">Logging in...</span>
                    <span v-else>Login</span>
                </button>
                <p class="register-link">
                    Don’t have an account?
                    <router-link to="/register-patient">Register here</router-link>
                </p>
            </form>
            <div v-if="error" class="alert-error">
                {{ error }}
            </div>
        </div>
    </div>
</template>

<script>
import { supabase } from '../services/supabase'

export default {
    data() {
        return {
            email: '',
            password: '',
            error: '',
            loading: false
        }
    },
    methods: {
        async login() {
            this.error = ''
            this.loading = true
            const { data, error } = await supabase.auth.signInWithPassword({
                email: this.email,
                password: this.password
            })
            this.loading = false
            if (error) {
                this.error = error.message
                return
            }

            // Get the logged-in user's ID
            const userId = data.user.id

            // Try to find the user in clinics table
            const { data: clinic } = await supabase
                .from('clinics')
                .select('id')
                .eq('id', userId)
                .single()

            if (clinic) {
                this.$router.push('/clinic-home')
                return
            }

            // Try to find the user in patients table
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('id', userId)
                .single()

            if (patient) {
                this.$router.push('/patient-home')
                return
            }

            // Default fallback
            this.$router.push('/')
        }
    }
}
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
}

.login-card {
    background: #fff;
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
    padding: 2.5rem 2rem 2rem 2rem;
    width: 100%;
    max-width: 370px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.login-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
}

.login-logo {
    width: 60px;
    height: 60px;
    margin-bottom: 0.5rem;
}

.login-welcome {
    color: #555;
    font-size: 1rem;
    margin-top: 0.5rem;
    text-align: center;
}

.login-form {
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

.btn-login {
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

.btn-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.register-link {
    text-align: center;
    margin-top: 0.5rem;
    font-size: 0.97rem;
}

.register-link a {
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
    .login-card {
        padding: 1.5rem 0.7rem 1.2rem 0.7rem;
        max-width: 98vw;
    }
}
</style>
