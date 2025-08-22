import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './core/router'

// Create Vue app instance
const app = createApp(App)

// Setup Pinia store
const pinia = createPinia()
app.use(pinia)

// Setup router
app.use(router)

// Mount the app
app.mount('#app')

// Initialize authentication state on app start

// Note: The auth initialization will be handled in App.vue
// to ensure proper Vue context is available
