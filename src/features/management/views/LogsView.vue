<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useManagementStore } from '../store/managementStore';
import { Terminal, Trash2, Copy, Download, Search, Check, RefreshCw } from 'lucide-vue-next';
import Button from '../../../components/ui/Button.vue';
import Input from '../../../components/ui/Input.vue';
import Card from '../../../components/ui/Card.vue';

const store = useManagementStore();
const searchQuery = ref('');
const filterType = ref<'all' | 'info' | 'success' | 'error'>('all');
const copied = ref(false);
const consoleContainer = ref<HTMLDivElement | null>(null);

const filteredLogs = computed(() => {
  return store.logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          log.timestamp.includes(searchQuery.value);
    const matchesType = filterType.value === 'all' || log.type === filterType.value;
    return matchesSearch && matchesType;
  });
});

const scrollToBottom = () => {
  if (consoleContainer.value) {
    consoleContainer.value.scrollTop = 0; // reverse log order or standard? Since we did store.logs.unshift, logs are prepended. Let's check how we display them.
  }
};

const clearLogs = () => {
  store.logs = [];
  store.addLog('[System] Diagnostik log dibersihkan manual.', 'info');
};

const copyLogs = () => {
  const logsText = store.logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
  navigator.clipboard.writeText(logsText);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
};

const exportLogs = () => {
  const logsText = store.logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
  const blob = new Blob([logsText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `print-service-logs-${new Date().toISOString().slice(0,10)}.log`;
  link.click();
  URL.revokeObjectURL(url);
};

watch(() => store.logs.length, () => {
  nextTick(() => scrollToBottom());
});

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="p-8">
    <div class="max-w-4xl mx-auto space-y-6 animate-enter">
      
      <!-- Diagnostic Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card class="flex items-center space-x-4 p-5">
          <div class="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <Terminal class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs text-slate-400 font-semibold uppercase">Total Log</p>
            <h4 class="text-2xl font-bold text-slate-800">{{ store.logs.length }}</h4>
          </div>
        </Card>
        
        <Card class="flex items-center space-x-4 p-5">
          <div class="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
            <Trash2 class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs text-slate-400 font-semibold uppercase">Error Terdeteksi</p>
            <h4 class="text-2xl font-bold text-slate-800">
              {{ store.logs.filter(l => l.type === 'error').length }}
            </h4>
          </div>
        </Card>

        <Card class="flex items-center space-x-4 p-5">
          <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Check class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs text-slate-400 font-semibold uppercase">Sukses Cetak</p>
            <h4 class="text-2xl font-bold text-slate-800">
              {{ store.logs.filter(l => l.type === 'success' && l.message.includes('Sukses')).length }}
            </h4>
          </div>
        </Card>
      </div>

      <!-- Controls & Terminal -->
      <Card class="p-0 overflow-hidden border border-slate-200">
        <!-- Console controls -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div class="flex items-center space-x-3 w-full sm:w-auto">
            <div class="relative w-full sm:w-64">
              <Search class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input v-model="searchQuery" placeholder="Cari log..." class="pl-9 py-2 bg-white" />
            </div>
            
            <select v-model="filterType" class="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none cursor-pointer">
              <option value="all">Semua Tipe</option>
              <option value="info">Info</option>
              <option value="success">Sukses</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button @click="copyLogs" variant="outline" size="sm" class="h-8 text-xs bg-white">
              <Check v-if="copied" class="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <Copy v-else class="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>{{ copied ? 'Disalin' : 'Salin' }}</span>
            </Button>
            <Button @click="exportLogs" variant="outline" size="sm" class="h-8 text-xs bg-white">
              <Download class="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Unduh</span>
            </Button>
            <Button @click="clearLogs" variant="outline" size="sm" class="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border-red-200 hover:border-red-300">
              <Trash2 class="w-3.5 h-3.5 mr-1.5" />
              <span>Bersihkan</span>
            </Button>
          </div>
        </div>

        <!-- Terminal Output -->
        <div 
          ref="consoleContainer"
          class="bg-slate-950 font-mono text-xs p-6 h-96 overflow-y-auto space-y-2 select-text"
        >
          <div v-if="filteredLogs.length === 0" class="text-slate-500 text-center py-20">
            Tidak ada data log yang cocok.
          </div>
          <div 
            v-else 
            v-for="(log, idx) in filteredLogs" 
            :key="idx" 
            class="flex items-start leading-relaxed"
            :class="{
              'text-slate-400': log.type === 'info',
              'text-emerald-400': log.type === 'success',
              'text-red-400': log.type === 'error'
            }"
          >
            <span class="text-slate-600 select-none mr-3">[{{ log.timestamp }}]</span>
            <span class="font-bold select-none mr-2">[{{ log.type.toUpperCase() }}]</span>
            <span class="flex-1 break-all">{{ log.message }}</span>
          </div>
        </div>
      </Card>
      
    </div>
  </div>
</template>
