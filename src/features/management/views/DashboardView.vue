<script setup lang="ts">
import { onMounted } from 'vue';
import { useManagementStore } from '../store/managementStore';
import { Plus, Trash2, Save, Loader2, Radio, Printer } from 'lucide-vue-next';
import Button from '../../../components/ui/Button.vue';
import Select from '../../../components/ui/Select.vue';
import Card from '../../../components/ui/Card.vue';

const store = useManagementStore();

const addMapping = () => {
  store.mappings.push({ category: '', printer_name: '' });
  store.addLog('[Config] Menambahkan baris pemetaan baru', 'info');
};

const removeMapping = (idx: number) => {
  store.mappings.splice(idx, 1);
  store.addLog('[Config] Menghapus baris pemetaan ke-' + (idx + 1), 'info');
};

const saveConfig = async () => {
  store.addLog('[Sync] Menyimpan konfigurasi dan mendaftarkan ke server...', 'info');
  const res = await store.syncToServer();
  if (res.success) {
    alert('Sukses: ' + res.message);
  } else {
    alert('Gagal: ' + res.message);
  }
};

onMounted(() => {
  store.fetchPrinters();
});
</script>

<template>
  <div class="p-8 z-10">
    <div class="max-w-4xl mx-auto space-y-8 animate-enter">
      
      <!-- Active Mappings Card -->
      <Card class="overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 class="text-base font-bold text-slate-800 flex items-center">
              <Radio class="w-4 h-4 mr-2 text-emerald-500" />
              Pemetaan Printer Aktif
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Pilih printer fisik yang digunakan oleh Print Service ini</p>
          </div>
          <Button @click="addMapping" size="sm" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <Plus class="w-3.5 h-3.5 mr-1.5" />
            Tambah Printer
          </Button>
        </div>

        <div class="p-6 space-y-3">
          <!-- Loading OS printers indicator -->
          <div v-if="(store.printers || []).length === 0 && store.isServerRunning" class="py-8 flex flex-col items-center justify-center text-slate-400">
            <Loader2 class="w-6 h-6 animate-spin mb-3 text-emerald-500" />
            <p class="text-xs">Mendeteksi Printer di Windows...</p>
          </div>

          <div v-else-if="!store.isServerRunning" class="py-8 flex flex-col items-center justify-center text-slate-400">
            <p class="text-xs text-red-500 font-semibold mb-2">Local Print Service Server is offline</p>
            <p class="text-[11px]">Pastikan backend electron dijalankan dan port 18181 terbuka.</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="(map, idx) in store.mappings" :key="idx" 
                 class="flex gap-3 items-center bg-slate-50/50 border border-slate-200/60 px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              
              <!-- Index badge -->
              <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                {{ idx + 1 }}
              </div>

              <!-- Physical Hardware Select -->
              <div class="flex-1">
                <Select 
                  v-model="map.printer_name" 
                  :options="(store.printers || []).map(p => ({ label: p.name, value: p.name }))"
                  placeholder="Pilih hardware printer fisik..."
                >
                  <template #icon>
                    <Printer class="w-4 h-4" />
                  </template>
                </Select>
              </div>

              <!-- Delete Action button -->
              <button @click="removeMapping(idx)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shrink-0">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <!-- Empty state when no mappings -->
            <div v-if="store.mappings.length === 0" class="py-8 text-center text-slate-400">
              <Printer class="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p class="text-xs">Belum ada printer yang dipetakan.</p>
              <p class="text-[11px] mt-1">Klik "Tambah Printer" untuk menambahkan.</p>
            </div>
          </div>
        </div>
        
        <!-- Bottom sync action -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button @click="saveConfig" class="bg-slate-800 hover:bg-slate-950 text-white font-semibold">
            <Save class="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Card>
      
    </div>
  </div>
</template>
