import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../features/auth/store/authStore';
import LoginView from '../features/auth/views/LoginView.vue';
import MainLayout from '../layouts/MainLayout.vue';
import DashboardView from '../features/management/views/DashboardView.vue';
import SettingsView from '../features/management/views/SettingsView.vue';
import LogsView from '../features/management/views/LogsView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: MainLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView,
        },
        {
          path: 'logs',
          name: 'logs',
          component: LogsView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

router.beforeEach((to, from) => {
  const authStore = useAuthStore();
  if (to.path !== '/login' && !authStore.isAuthenticated) {
    return '/login';
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    return '/dashboard';
  }
  return true;
});

export default router;
