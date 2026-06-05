import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('auth_token') === 'true');
  const errorMsg = ref('');

  function login(passcode: string) {
    const savedPasscode = localStorage.getItem('app_passcode') || 'admin';
    if (passcode === savedPasscode) {
      isAuthenticated.value = true;
      localStorage.setItem('auth_token', 'true');
      errorMsg.value = '';
      return true;
    } else {
      errorMsg.value = 'Passcode tidak valid. Hubungi administrator Klinik.';
      return false;
    }
  }

  function logout() {
    isAuthenticated.value = false;
    localStorage.removeItem('auth_token');
  }

  return {
    isAuthenticated,
    errorMsg,
    login,
    logout,
  };
});
