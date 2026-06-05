import { createApp } from 'vue';
import './index.css';
import App from './App.vue';
import pinia from './store';
import router from './router';

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
