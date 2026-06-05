<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';
import { Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-vue-next';
import Button from '../../../components/ui/Button.vue';
import Input from '../../../components/ui/Input.vue';
import Card from '../../../components/ui/Card.vue';

const authStore = useAuthStore();
const router = useRouter();

const passcode = ref('');
const showPasscode = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const togglePasscode = () => {
  showPasscode.value = !showPasscode.value;
};

const handleLogin = async () => {
  if (!passcode.value) return;
  isLoading.value = true;
  errorMessage.value = '';

  setTimeout(() => {
    const success = authStore.login(passcode.value);
    isLoading.value = false;
    if (success) {
      router.push('/dashboard');
    } else {
      errorMessage.value = authStore.errorMsg;
    }
  }, 600);
};
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-slate-900 font-sans relative overflow-hidden">
    <!-- Premium background gradients -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

    <div class="w-full max-w-md p-4 z-10 animate-enter">
      <!-- Brand Logo & Title -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-20 h-20 bg-white border border-slate-200/20 rounded-2xl flex items-center justify-center p-3 mb-4 shadow-xl">
          <img src="/logo.png" alt="ID Grow Logo" class="w-full h-full object-contain" />
        </div>
        <h1 class="text-2xl font-bold text-white tracking-wide">ID Grow Print Service</h1>
        <p class="text-sm text-slate-400 mt-1">Bridge Konfigurasi Cetak Klinik</p>
      </div>

      <!-- Login Card -->
      <Card class="bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-2xl p-8 rounded-2xl">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">Administrator Lock</h2>
            <p class="text-xs text-slate-400">Masukkan passcode untuk akses pengaturan</p>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passcode</label>
            <div class="relative">
              <span class="absolute left-3 top-3 text-slate-500">
                <Lock class="w-4 h-4" />
              </span>
              <Input
                v-model="passcode"
                :type="showPasscode ? 'text' : 'password'"
                placeholder="Masukkan passcode (default: admin)"
                class="pl-9 pr-10 py-3 bg-slate-900/60 focus:bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                @click="togglePasscode"
                class="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Eye v-if="showPasscode" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <p v-if="errorMessage" class="text-xs text-red-400 mt-1 font-medium">{{ errorMessage }}</p>
          </div>

          <Button type="submit" :disabled="isLoading" class="w-full py-3 mt-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memverifikasi...
            </span>
            <span v-else>Buka Kunci Akses</span>
          </Button>
        </form>
      </Card>

      <!-- Footer Info -->
      <div class="mt-8 flex items-center justify-center space-x-1.5 text-xs text-slate-500">
        <HelpCircle class="w-4 h-4" />
        <span>Kontrol cetak aman berstandar ID Grow</span>
      </div>
    </div>
  </div>
</template>
