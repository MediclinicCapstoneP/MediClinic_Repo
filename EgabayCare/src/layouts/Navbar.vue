<template>
  <nav class="navbar">
    <div class="navbar-logo">
      <img src="/vite.svg" alt="Logo" />
      <span>iGabayAtiCare</span>
    </div>
    <ul class="navbar-links">
      <li><router-link to="/">Home</router-link></li>
      <li><router-link to="/login">Login</router-link></li>
      <li><router-link to="/register-patient">Register</router-link></li>
    </ul>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0.7rem 2rem;
  box-shadow: 0 2px 8px rgba(31,38,135,0.07);
}
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: bold;
  font-size: 1.2rem;
  color: #007bff;
}
.navbar-logo img {
  width: 40px;
  height: 40px;
}
.navbar-links {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.navbar-links a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: color 0.2s;
}
.navbar-links a:hover {
  color: #0056b3;
}
</style>