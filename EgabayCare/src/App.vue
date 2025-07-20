<!-- src/App.vue -->
<template>
  
   
    <main class="py-4">
      <router-view />
    </main>
  
</template>

<script>
import Navbar from './layouts/Navbar.vue'

export default {
  components: {
    Navbar
  }
}
</script>

<style>
body {
  background-color: #f8f9fa;
  font-family: 'Segoe UI', sans-serif;
}
#app {
  padding: 0;
  margin: 0;
}

</style>
