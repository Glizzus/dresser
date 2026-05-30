import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import './style.css';
import App from './App.vue';

const Dresser = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f8fbfa',
      100: '#f3f6f5',
      200: '#e3e9e2',
      300: '#cfd9ce',
      400: '#99ae98',
      500: '#667f65',
      600: '#495c4b',
      700: '#3f5340',
      800: '#242c21',
      900: '#151f14',
      950: '#080e07',
    },
  },
});

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Dresser,
  },
});

app.mount('#app');
