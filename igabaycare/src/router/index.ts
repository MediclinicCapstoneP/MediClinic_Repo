import { createRouter, createWebHistory, RouterView } from 'vue-router'

import LandingView from '../views/LandingView.vue'
import HomeView from '../views/HomeView.vue';



const routes = [
   { path: '/landing', component:LandingView , name: 'LandingView.vue' },
   {path: '/', component: HomeView, name: 'HomeView.vue' },

];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // Always scroll to top when navigating
    return { top: 0 }
  }
});
export default router
