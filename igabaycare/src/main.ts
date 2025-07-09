
import PrimeVue from 'primevue/config';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ToastService from 'primevue/toastservice';
import App from './App.vue'
import router from './router'


//primevue css   
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';

//creation
const pinia = createPinia();
const app = createApp(App);

// PrimeVue configuration
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});


app.use(router)
app.use(PrimeVue);
app.use(ToastService);
app.use(pinia);
app.mount('#app')
