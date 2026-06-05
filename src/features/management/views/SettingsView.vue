<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useManagementStore } from '../store/managementStore';
import { Save, Monitor, Wifi, MapPin, MonitorSmartphone, Link, Network, RadioTower, Plug, KeyRound, Search, Loader2, X, Copy } from 'lucide-vue-next';
import Button from '../../../components/ui/Button.vue';
import Input from '../../../components/ui/Input.vue';
import Card from '../../../components/ui/Card.vue';
import client from '../../../api/client';

const store = useManagementStore();
const fetchingIp = ref(false);
const showIpModal = ref(false);
const availableIps = ref<string[]>([]);
const selectedIpForUse = ref<string | null>(null);

const networkDetails = ref<any[]>([]);

const openIpModal = async () => {
  fetchingIp.value = true;
  try {
    const res = await client.get('/network-ips');
    if (res.data.success && res.data.data) {
      networkDetails.value = res.data.data;
      availableIps.value = res.data.data.map((n: any) => n.ip);
      // Selalu tambahkan 127.0.0.1 sebagai opsi utama (Localhost)
      if (!availableIps.value.includes('127.0.0.1')) {
        availableIps.value.unshift('127.0.0.1');
      }
      
      selectedIpForUse.value = store.localIp;
      showIpModal.value = true;
    } else {
      alert('Gagal mengambil daftar IP jaringan.');
    }
  } catch (err) {
    console.error(err);
    alert('Gagal deteksi IP. Pastikan service berjalan.');
  } finally {
    fetchingIp.value = false;
  }
};

const applyIp = () => {
  if (selectedIpForUse.value) {
    store.localIp = selectedIpForUse.value;
    
    // Assign MAC Address if found
    const detail = networkDetails.value.find(n => n.ip === selectedIpForUse.value);
    if (detail && detail.mac && detail.mac !== '00:00:00:00:00:00') {
      store.macAddress = detail.mac;
    }
    
    store.addLog(`[System] Memilih IP: ${store.localIp}`, 'info');
    showIpModal.value = false;
  }
};

const copyIp = async (ip: string) => {
  try {
    await navigator.clipboard.writeText(ip);
    store.addLog(`[System] IP ${ip} disalin ke clipboard`, 'info');
    alert(`IP ${ip} berhasil disalin!`);
  } catch (err) {
    console.error(err);
  }
};

const saveConfig = async () => {
  // ... existing saveConfig code ...
  if (!store.macAddress) {
    try {
      const res = await client.get('/network-ips');
      if (res.data.success && res.data.data.length > 0) {
        // Fallback to first non-local MAC if empty
        const validMac = res.data.data.find((n: any) => n.mac && n.mac !== '00:00:00:00:00:00');
        if (validMac) {
          store.macAddress = validMac.mac;
        }
      }
    } catch(e) {}
  }

  store.addLog('[Sync] Menyimpan konfigurasi dan mendaftarkan ke server...', 'info');
  const res = await store.syncToServer();
  if (res.success) {
    alert('Sukses: ' + res.message);
  } else {
    alert('Gagal: ' + res.message);
  }
};

const unregisterConfig = async () => {
  if (confirm('Apakah Anda yakin ingin menghapus Printer Service ini dari Server Utama? Data akan hilang dari Dashboard Klinik.')) {
    store.addLog('[System] Menghapus service dari server...', 'info');
    const res = await store.unregisterFromServer();
    if (res.success) {
      alert('Sukses: ' + res.message);
    } else {
      alert('Gagal: ' + res.message);
    }
  }
};

onMounted(async () => {
  // Jika IP masih default (127.0.0.1) atau kosong, otomatis ambil dari network
  if (store.localIp === '127.0.0.1' || !store.localIp) {
    try {
      const res = await client.get('/network-ips');
      if (res.data.success && res.data.data.length > 0) {
        store.localIp = res.data.data[0].ip;
        if (res.data.data[0].mac && res.data.data[0].mac !== '00:00:00:00:00:00') {
           store.macAddress = res.data.data[0].mac;
        }
        store.addLog(`[System] IP Jaringan otomatis mendeteksi: ${store.localIp}`, 'info');
      }
    } catch (err) {
      console.log('Failed to auto-fetch IP', err);
    }
  }
});
</script>

<template>
  <div class="p-8 z-10 pb-32">
    <div class="max-w-4xl mx-auto space-y-8 animate-enter">
      
      <!-- Main Server Configuration Card -->
      <Card class="overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mr-4">
              <Monitor class="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800 tracking-tight">Main Server Identity</h3>
              <p class="text-xs text-slate-500 mt-0.5">Pengaturan identitas stasiun cetak dan koneksi server utama</p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Ruangan</label>
              <div class="relative group">
                <MapPin class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input v-model="store.serviceName" placeholder="Contoh: Loket Pendaftaran" class="w-full pl-9" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama PC (Unik)</label>
              <div class="relative group">
                <MonitorSmartphone class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input v-model="store.machineName" placeholder="Contoh: PC-LOKET-01" class="w-full pl-9" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL Server Aplikasi</label>
              <div class="relative group">
                <Link class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input v-model="store.mainAppUrl" placeholder="http://localhost:8030" class="w-full pl-9" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">IP Local PC Ini</label>
              <div class="flex gap-2">
                <div class="relative group flex-1">
                  <Network class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input v-model="store.localIp" placeholder="127.0.0.1" class="w-full pl-9" />
                </div>
                <Button @click="openIpModal" variant="outline" class="px-3 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600" title="Cari IP PC Ini" :disabled="fetchingIp">
                  <Loader2 v-if="fetchingIp" class="w-4 h-4 animate-spin" />
                  <Search v-else class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <!-- WebSocket Configuration Card -->
      <Card class="overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl">
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4" :class="store.enableOnlineMode ? 'bg-cyan-50/50' : 'bg-slate-50/80'">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors" :class="store.enableOnlineMode ? 'bg-cyan-100 border border-cyan-200' : 'bg-slate-100 border border-slate-200'">
              <Wifi class="w-5 h-5 transition-colors" :class="store.enableOnlineMode ? 'text-cyan-600' : 'text-slate-400'" />
            </div>
            <div>
              <h3 class="text-base font-bold tracking-tight transition-colors" :class="store.enableOnlineMode ? 'text-cyan-900' : 'text-slate-800'">Cloud WebSockets Tunnel</h3>
              <p class="text-xs mt-0.5 transition-colors" :class="store.enableOnlineMode ? 'text-cyan-700/80' : 'text-slate-500'">Konfigurasi koneksi real-time untuk Online Mode</p>
            </div>
          </div>
          <label class="flex items-center cursor-pointer select-none">
            <div class="relative">
              <input type="checkbox" v-model="store.enableOnlineMode" class="sr-only" />
              <div class="block w-10 h-6 rounded-full transition-colors" :class="store.enableOnlineMode ? 'bg-cyan-500' : 'bg-slate-200'"></div>
              <div class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform" :class="{'translate-x-4': store.enableOnlineMode}"></div>
            </div>
            <div class="ml-3 text-xs font-semibold" :class="store.enableOnlineMode ? 'text-cyan-700' : 'text-slate-600'">Online Mode</div>
          </label>
        </div>

        <div v-if="store.enableOnlineMode" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-enter">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reverb Host</label>
              <div class="relative group">
                <RadioTower class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                <Input v-model="store.reverbHost" placeholder="Contoh: 127.0.0.1" class="w-full pl-9 focus:border-cyan-500 focus:ring-cyan-500/20" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reverb Port</label>
              <div class="relative group">
                <Plug class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                <Input v-model="store.reverbPort" placeholder="Contoh: 8080" class="w-full pl-9 focus:border-cyan-500 focus:ring-cyan-500/20" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reverb App Key</label>
              <div class="relative group">
                <KeyRound class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                <Input v-model="store.reverbAppKey" placeholder="Contoh: local_key" class="w-full pl-9 focus:border-cyan-500 focus:ring-cyan-500/20" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Buttons -->
      <div class="flex gap-4 pt-2">
        <Button @click="saveConfig" class="flex-1 bg-gradient-to-r from-[#3db6bc] to-[#2a9d90] hover:from-[#2a9d90] hover:to-[#228b7e] text-white font-bold py-3.5 rounded-xl shadow-md shadow-[#3db6bc]/20 border-0 flex items-center justify-center gap-2 group transition-all">
          <Save class="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Simpan & Daftarkan Konfigurasi</span>
        </Button>

        <Button @click="unregisterConfig" class="px-6 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 group transition-all" title="Hapus dari Server Utama">
          <X class="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span class="hidden sm:inline">Hapus Service</span>
        </Button>
      </div>
      
    </div>
  </div>

  <!-- IP Selection Modal -->
  <div v-if="showIpModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity animate-enter">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-enter border border-slate-100 flex flex-col" style="animation-duration: 200ms;">
      
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200/50 flex items-center justify-center shadow-sm">
            <Network class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800">Pilih IP Jaringan PC</h3>
            <p class="text-[10px] text-slate-500 font-medium mt-0.5">IP lokal yang terdeteksi di perangkat ini</p>
          </div>
        </div>
        <button @click="showIpModal = false" class="text-slate-400 hover:text-slate-700 transition-colors p-1.5 bg-white hover:bg-slate-200 rounded-md shadow-sm border border-slate-100">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-3 max-h-[50vh] overflow-y-auto bg-white">
        <div 
          v-for="ip in availableIps" 
          :key="ip"
          @click="selectedIpForUse = ip"
          class="w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between group cursor-pointer"
          :class="selectedIpForUse === ip ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'"
        >
          <div class="flex items-center">
            <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center mr-4 transition-colors"
                 :class="selectedIpForUse === ip ? 'border-emerald-500' : 'border-slate-300 group-hover:border-emerald-300'">
              <div v-if="selectedIpForUse === ip" class="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <span class="font-mono text-sm font-bold" :class="selectedIpForUse === ip ? 'text-emerald-800' : 'text-slate-700'">{{ ip }}</span>
          </div>

          <button @click.stop="copyIp(ip)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="Salin IP ke Clipboard">
            <Copy class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <Button @click="showIpModal = false" variant="outline" class="px-6 py-2 rounded-lg font-semibold border-slate-200 hover:bg-slate-100 text-slate-600">
          Batal
        </Button>
        <Button @click="applyIp" :disabled="!selectedIpForUse" class="px-6 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 transition-colors flex items-center">
          Gunakan IP Ini
        </Button>
      </div>
      
    </div>
  </div>
</template>
