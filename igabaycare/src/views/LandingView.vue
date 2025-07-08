<script>
  import BottomNavbar from '@/components/LandingP/BottomNavbar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow p-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">Hello, Shahin Alam</h1>
        <p class="text-gray-500 text-sm">Welcome to iGabayAtiCare</p>
      </div>
      <img src="@/assets/avatar.jpg" class="w-12 h-12 rounded-full" alt="User Avatar" />
    </header>

    <!-- Main Content -->
    <main class="flex-1 p-4">
      <!-- Search Bar -->
      <div class="mb-4">
        <input
          type="text"
          placeholder="Search services, doctors..."
          class="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      <!-- Services Row -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="flex flex-col items-center">
          <div class="bg-teal-100 p-3 rounded-full mb-2">
            <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <span class="text-xs">Book</span>
        </div>
        <div class="flex flex-col items-center">
          <div class="bg-orange-100 p-3 rounded-full mb-2">
            <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/></svg>
          </div>
          <span class="text-xs">History</span>
        </div>
        <div class="flex flex-col items-center">
          <div class="bg-purple-100 p-3 rounded-full mb-2">
            <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21h13a2 2 0 002-2v-1a7 7 0 00-7-7h-2a7 7 0 00-7 7v1a2 2 0 002 2z"/></svg>
          </div>
          <span class="text-xs">Profile</span>
        </div>
        <div class="flex flex-col items-center">
          <div class="bg-blue-100 p-3 rounded-full mb-2">
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z"/></svg>
          </div>
          <span class="text-xs">Payments</span>
        </div>
      </div>

      <!-- Promo Card -->
      <div class="bg-blue-100 rounded-lg p-4 flex items-center mb-6">
        <div class="flex-1">
          <h2 class="font-bold text-lg">Get the Best Medical Service</h2>
          <p class="text-sm text-gray-600">Book appointments with top clinics and doctors easily.</p>
        </div>
        <img src="@/assets/Doctor.jpg" class="w-16 h-16 rounded-full" alt="Doctor" />
      </div>

      <!-- Upcoming Appointments -->
      <h3 class="font-bold mb-2">Upcoming Appointments</h3>
      <div class="flex space-x-4 overflow-x-auto">
        <div class="bg-white rounded-lg shadow p-4 min-w-[200px]">
          <div class="text-teal-600 font-bold text-lg">12 Tue</div>
          <div class="text-gray-700">09:00 AM</div>
          <div class="text-gray-500 text-sm">Dr. Min Akhter</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 min-w-[200px]">
          <div class="text-teal-600 font-bold text-lg">15 Fri</div>
          <div class="text-gray-700">02:00 PM</div>
          <div class="text-gray-500 text-sm">Dr. Zex Khan</div>
        </div>
      </div>
    </main>
    <BottomNavbar />
  </div>
</template>



