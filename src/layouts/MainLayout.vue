<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../features/auth/store/authStore';
import { useManagementStore } from '../features/management/store/managementStore';
import { Printer, Settings2, Activity, LogOut, RefreshCw, Server, Wifi, WifiOff } from 'lucide-vue-next';
import Button from '../components/ui/Button.vue';

const authStore = useAuthStore();
const managementStore = useManagementStore();
const router = useRouter();
const route = useRoute();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const handleSync = async () => {
  managementStore.addLog('[Sync] Menjalankan sinkronisasi manual ke server Laravel...', 'info');
  const result = await managementStore.syncToServer();
  if (result.success) {
    alert('Sukses: ' + result.message);
  } else {
    alert('Gagal: ' + result.message);
  }
};

let statusInterval: any = null;

onMounted(async () => {
  // Initial check
  await managementStore.checkServerStatus();
  await managementStore.fetchPrinters();
  
  if (managementStore.enableOnlineMode) {
    managementStore.connectEcho();
  }

  // Periodic health check every 15s
  statusInterval = setInterval(async () => {
    await managementStore.checkServerStatus();
    if (managementStore.isServerRunning && managementStore.printers.length === 0) {
      await managementStore.fetchPrinters();
    }
  }, 15000);
});

onUnmounted(() => {
  if (statusInterval) clearInterval(statusInterval);
  managementStore.disconnectEcho();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex font-sans text-slate-800">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl relative z-10 select-none">
      <div class="h-16 flex items-center px-6 border-b border-slate-800">
        <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 mr-3 shrink-0">
          <img src="/logo.png" alt="Logo" class="w-full h-full object-contain" />
        </div>
        <h1 class="text-sm font-bold text-white tracking-wider uppercase">ID Grow Print</h1>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 py-6 px-4 space-y-1.5">
        <router-link
          to="/dashboard"
          class="flex items-center px-4 py-3 rounded-lg transition-all group font-medium"
          :class="route.path === '/dashboard' ? 'bg-emerald-500/10 text-emerald-400 font-semibold shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'"
        >
          <Settings2 class="w-5 h-5 mr-3 group-hover:scale-105 transition-transform" />
          <span>Device Mappings</span>
        </router-link>
        <router-link
          to="/settings"
          class="flex items-center px-4 py-3 rounded-lg transition-all group font-medium"
          :class="route.path === '/settings' ? 'bg-emerald-500/10 text-emerald-400 font-semibold shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'"
        >
          <Server class="w-5 h-5 mr-3 group-hover:scale-105 transition-transform" />
          <span>Server Config</span>
        </router-link>
        <router-link
          to="/logs"
          class="flex items-center px-4 py-3 rounded-lg transition-all group font-medium"
          :class="route.path === '/logs' ? 'bg-emerald-500/10 text-emerald-400 font-semibold shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'"
        >
          <Activity class="w-5 h-5 mr-3 group-hover:scale-105 transition-transform" />
          <span>System Logs</span>
        </router-link>
      </div>

      <!-- Sidebar Footers & Connections -->
      <div class="p-4 border-t border-slate-800 space-y-4">
        <!-- Status Panel -->
        <div class="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 space-y-3 text-xs">
          <!-- Local Server Status -->
          <div class="flex items-center justify-between">
            <div class="flex items-center text-slate-400">
              <Server class="w-3.5 h-3.5 mr-2" />
              <span>Local Service</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="w-1.5 h-1.5 rounded-full" :class="managementStore.isServerRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"></span>
              <span class="font-semibold" :class="managementStore.isServerRunning ? 'text-emerald-400' : 'text-red-400'">
                {{ managementStore.isServerRunning ? 'Active' : 'Stopped' }}
              </span>
            </div>
          </div>

          <!-- WebSocket Status -->
          <div class="flex items-center justify-between" v-if="managementStore.enableOnlineMode">
            <div class="flex items-center text-slate-400">
              <component :is="managementStore.isOnlineConnected ? Wifi : WifiOff" class="w-3.5 h-3.5 mr-2" />
              <span>Cloud Tunnel</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="w-1.5 h-1.5 rounded-full" :class="managementStore.isOnlineConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
              <span class="font-semibold" :class="managementStore.isOnlineConnected ? 'text-emerald-400' : 'text-amber-400'">
                {{ managementStore.isOnlineConnected ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>
        </div>

        <!-- IP Address display -->
        <div class="text-[11px] text-slate-500 px-1">
          <span>Port: {{ managementStore.localIp }}:18181</span>
        </div>

        <!-- Logout button -->
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-all text-xs font-semibold"
        >
          <LogOut class="w-4 h-4 mr-2" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 relative">
      <!-- Decorative background blur -->
      <div class="absolute top-0 left-0 right-0 h-64 bg-emerald-500/5 -z-10 blur-3xl"></div>

      <!-- Topbar Header -->
      <header class="h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-8 z-10 shrink-0">
        <h2 class="text-lg font-bold text-slate-800">
          {{ route.path === '/logs' ? 'System Diagnostics & Logs' : route.path === '/settings' ? 'Server Configuration' : 'Printer Routing Configuration' }}
        </h2>
        <Button @click="handleSync" variant="outline" class="h-9 text-xs">
          <RefreshCw class="w-3.5 h-3.5 mr-2" />
          Sync to Server
        </Button>
      </header>

      <!-- Content viewport -->
      <div class="flex-1 overflow-auto">
        <router-view v-slot="{ Component, route: currentRoute }">
          <transition name="page" mode="out-in">
            <div :key="currentRoute.path" class="h-full">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
