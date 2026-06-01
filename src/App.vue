<template>
  <div class="min-h-screen bg-slate-50 flex font-sans text-slate-800">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl relative z-10">
      <div class="h-16 flex items-center px-6 border-b border-slate-800">
        <Printer class="w-6 h-6 text-emerald-400 mr-3" />
        <h1 class="text-lg font-bold text-white tracking-wide">ID-GROW</h1>
      </div>
      <div class="flex-1 py-6 px-4 space-y-2">
        <a href="#" class="flex items-center px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors group">
          <Settings2 class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
          <span class="font-medium">Device Mappings</span>
        </a>
        <a href="#" class="flex items-center px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors group">
          <Activity class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
          <span class="font-medium">Print Logs</span>
        </a>
      </div>
      <div class="p-6 border-t border-slate-800">
        <div class="flex items-center">
          <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-3"></div>
          <span class="text-sm font-medium">Service Active</span>
        </div>
        <p class="text-xs text-slate-500 mt-1">IP: {{ localIp }}:18181</p>
        <div class="mt-4 pt-4 border-t border-slate-700">
          <p class="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Server Aplikasi Utama</p>
          <div class="flex items-center text-xs text-slate-300 bg-slate-800 rounded px-2 py-1.5 break-all">
            {{ mainAppUrl }}
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 relative">
      <!-- Decorative background blur -->
      <div class="absolute top-0 left-0 right-0 h-64 bg-emerald-500/5 -z-10 blur-3xl"></div>

      <!-- Topbar -->
      <header class="h-16 glass-card border-b border-slate-200/50 flex items-center justify-between px-8 z-10">
        <h2 class="text-xl font-semibold text-slate-800">Printer Routing Configuration</h2>
        <button @click="saveConfig" class="flex items-center px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-md text-sm font-medium text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all">
          <RefreshCw class="w-4 h-4 mr-2" />
          Sync to Server
        </button>
      </header>
      
      <!-- Content Area -->
      <div class="flex-1 overflow-auto p-8 z-10">
        <div class="max-w-4xl mx-auto space-y-6">
          <!-- Server Configuration Card -->
          <div class="glass-card rounded-xl overflow-hidden animate-enter mb-6">
            <div class="px-6 py-5 border-b border-slate-100 bg-white/50">
              <h3 class="text-lg font-semibold text-slate-800">Server Configuration</h3>
              <p class="text-sm text-slate-500 mt-1">Pengaturan identitas stasiun cetak dan koneksi server</p>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Ruangan</label>
                <input v-model="serviceName" type="text" placeholder="Contoh: Loket Pendaftaran" 
                       class="w-full text-sm border-slate-200 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama PC (Unik)</label>
                <input v-model="machineName" type="text" placeholder="Contoh: PC-LOKET-01" 
                       class="w-full text-sm border-slate-200 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">URL Server Aplikasi</label>
                <input v-model="mainAppUrl" type="text" placeholder="http://localhost:8030" 
                       class="w-full text-sm border-slate-200 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">IP Local PC Ini</label>
                <input v-model="localIp" type="text" placeholder="127.0.0.1" 
                       class="w-full text-sm border-slate-200 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-slate-50/50 focus:bg-white" />
              </div>
            </div>
          </div>
          
          <div class="glass-card rounded-xl overflow-hidden animate-enter">
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
              <div>
                <h3 class="text-lg font-semibold text-slate-800">Active Mappings</h3>
                <p class="text-sm text-slate-500 mt-1">Route label categories to physical local printers</p>
              </div>
              <button @click="addMapping" class="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors text-sm font-medium">
                <Plus class="w-4 h-4 mr-2" />
                Add Route
              </button>
            </div>

            <div class="p-6">
              <div v-if="printers.length === 0" class="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 class="w-8 h-8 animate-spin mb-4" />
                <p>Detecting OS Printers...</p>
              </div>

              <div v-else class="space-y-4">
                <div v-for="(map, idx) in mappings" :key="idx" 
                     class="flex gap-4 items-end bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group">
                  
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Label Category</label>
                    <div class="relative">
                      <Tag class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input v-model="map.category" type="text" placeholder="e.g. Gelang Pasien" 
                             class="w-full text-sm border-slate-200 border rounded-lg pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div class="flex-shrink-0 flex items-center justify-center w-10 pb-3 text-slate-300">
                    <ArrowRight class="w-5 h-5" />
                  </div>

                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Hardware</label>
                    <div class="relative">
                      <Printer class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <select v-model="map.printer_name" 
                              class="w-full text-sm border-slate-200 border rounded-lg pl-9 pr-4 py-2.5 appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white cursor-pointer">
                        <option value="" disabled>Select physical printer...</option>
                        <option v-for="p in printers" :key="p.deviceId" :value="p.name">{{ p.name }}</option>
                      </select>
                      <ChevronDown class="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <button @click="removeMapping(idx)" class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
            
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button @click="saveConfig" class="flex items-center px-6 py-2.5 bg-slate-800 text-white rounded-lg shadow-md hover:bg-slate-900 transition-all font-medium text-sm">
                <Save class="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Printer, Settings2, Activity, RefreshCw, Plus, Trash2, ArrowRight, Save, Loader2, Tag, ChevronDown } from 'lucide-vue-next';

// Dalam aplikasi production, IP ini diambil otomatis melalui IPC dari main process (Node 'os' module)
// dan mainAppUrl bisa diedit melalui form Pengaturan oleh user.
const serviceName = ref(localStorage.getItem('service_name') || 'Loket Pendaftaran 1');
const machineName = ref(localStorage.getItem('machine_name') || 'PC-LOKET-01');
const localIp = ref(localStorage.getItem('local_ip') || '127.0.0.1');
const mainAppUrl = ref(localStorage.getItem('main_app_url') || 'http://localhost:8030');

watch(serviceName, (val) => localStorage.setItem('service_name', val));
watch(machineName, (val) => localStorage.setItem('machine_name', val));
watch(localIp, (val) => localStorage.setItem('local_ip', val));
watch(mainAppUrl, (val) => localStorage.setItem('main_app_url', val));

const printers = ref<any[]>([]);
const mappings = ref([{ category: 'Gelang Pasien', printer_name: '' }]);

onMounted(async () => {
  try {
    const res = await fetch('http://127.0.0.1:18181/printers');
    const json = await res.json();
    if (json.success) printers.value = json.data;
  } catch (error) {
    console.error('Failed to load printers:', error);
  }
});

const addMapping = () => {
  mappings.value.push({ category: '', printer_name: '' });
};

const removeMapping = (idx: number) => {
  mappings.value.splice(idx, 1);
};

const saveConfig = async () => {
  try {
    const payload = {
      service_name: serviceName.value,
      machine_name: machineName.value,
      ip_address: localIp.value, 
      printers: mappings.value
        .filter(m => m.printer_name && m.printer_name.trim() !== '')
        .map(m => ({
          printer_name: m.printer_name,
          target_labels: m.category ? m.category.split(',').map(s => s.trim()) : []
        }))
    };
    
    // Kirim data registrasi ke API Laravel Utama
    const res = await fetch(`${mainAppUrl.value}/api/print-service/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gagal menyimpan data (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    alert('Sukses: ' + data.message);
  } catch (error: any) {
    console.error(error);
    alert('Terjadi kesalahan: ' + error.message);
  }
};
</script>
