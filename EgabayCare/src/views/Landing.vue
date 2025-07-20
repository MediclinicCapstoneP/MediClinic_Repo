<template>
  <div class="landing-container">
    <header class="landing-header">
      <div class="logo-title">
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
          <path
            d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
            fill="#0b80ee"
          />
        </svg>
        <span class="title">iGabayAtiCare</span>
      </div>
      <nav class="nav-links">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/login" class="nav-link">Login</router-link>
        <router-link to="/register-patient" class="nav-link">Register</router-link>
        <router-link to="#" class="nav-link">About Us</router-link>
      </nav>
    </header>

    <section class="hero">
      <h1>Your Health, Simplified</h1>
      <p>
        iGabayAtiCare connects you with registered clinics for real-time appointment booking and clinic management.
      </p>
      <div class="hero-actions">
        <router-link to="/login" class="btn primary">Get Started</router-link>
        <router-link to="/register-clinic" class="btn secondary">Register Your Clinic</router-link>
      </div>
    </section>

    <section class="features">
      <h2>Key Features</h2>
      <div class="feature-list">
        <div class="feature-card">
          <svg width="32" height="32" fill="#0b80ee" viewBox="0 0 256 256">
            <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"/>
          </svg>
          <h3>Real-Time Booking</h3>
          <p>Book appointments instantly with registered clinics, eliminating wait times and ensuring timely care.</p>
        </div>
        <div class="feature-card">
          <svg width="32" height="32" fill="#0b80ee" viewBox="0 0 256 256">
            <path d="M216,88H168V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V88H40a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16H88v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V168h48a16,16,0,0,0,16-16V104A16,16,0,0,0,216,88Zm0,64H160a8,8,0,0,0-8,8v56H104V160a8,8,0,0,0-8-8H40V104H96a8,8,0,0,0,8-8V40h48V96a8,8,0,0,0,8,8h56Z"/>
          </svg>
          <h3>Clinic Registration</h3>
          <p>Manage your clinic's appointments, patient records, and staff schedules efficiently through our platform.</p>
        </div>
        <div class="feature-card">
          <svg width="32" height="32" fill="#0b80ee" viewBox="0 0 256 256">
            <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z"/>
          </svg>
          <h3>AI Support</h3>
          <p>Get personalized health information and support through our AI-powered assistant, available 24/7.</p>
        </div>
      </div>
    </section>

    <footer class="landing-footer">
      <div class="footer-links">
        <router-link to="#" class="footer-link">Privacy Policy</router-link>
        <router-link to="#" class="footer-link">Terms of Service</router-link>
        <router-link to="#" class="footer-link">Contact Us</router-link>
      </div>
      <p class="copyright">&copy; 2024 iGabayAtiCare. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
// No script logic needed for static landing page
</script>

<style scoped>
.landing-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  font-family: 'Segoe UI', 'Public Sans', 'Noto Sans', sans-serif;
}

.hero, .features {
  flex: 1 0 auto;
}
.landing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: #fff;
  box-shadow: 0 2px 8px rgba(31,38,135,0.07);
}
.logo-title {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: bold;
  font-size: 1.3rem;
  color: #0b80ee;
}
.nav-links {
  display: flex;
  gap: 2rem;
}
.nav-link {
  color: #111518;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: color 0.2s;
}
.nav-link:hover {
  color: #0b80ee;
}
.hero {
  text-align: center;
  padding: 4rem 2rem 2rem 2rem;
  background: none;
}
.hero h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #0b80ee;
  margin-bottom: 1rem;
}
.hero p {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 2rem;
}
.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.btn {
  padding: 0.8rem 2rem;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  cursor: pointer;
  border: none;
  outline: none;
  display: inline-block;
}
.btn.primary {
  background: linear-gradient(90deg, #007bff 0%, #0b80ee 100%);
  color: #fff;
}
.btn.secondary {
  background: #fff;
  color: #0b80ee;
  border: 2px solid #0b80ee;
}
.btn.primary:hover,
.btn.secondary:hover {
  background: #0056b3;
  color: #fff;
  border-color: #0056b3;
}
.features {
  padding: 3rem 2rem;
  background: #fff;
  text-align: center;
}
.features h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #0b80ee;
  margin-bottom: 2rem;
}
.feature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
}
.feature-card {
  background: #f8f9fa;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(31,38,135,0.07);
  padding: 2rem 1.5rem;
  max-width: 300px;
  flex: 1 1 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.feature-card h3 {
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111518;
}
.feature-card p {
  margin-top: 0.5rem;
  color: #60768a;
  font-size: 1rem;
}
.landing-footer {
  background: #fff;
  padding: 2rem 1rem 1rem 1rem;
  text-align: center;
  margin-top: auto;
  box-shadow: 0 -2px 8px rgba(31,38,135,0.07);
}
.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}
.footer-link {
  color: #60768a;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}
.footer-link:hover {
  color: #0b80ee;
}
.copyright {
  color: #60768a;
  font-size: 1rem;
}
@media (max-width: 900px) {
  .feature-list {
    flex-direction: column;
    align-items: center;
  }
  .landing-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
}
</style>