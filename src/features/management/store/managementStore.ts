import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import axios from 'axios';
import client from '../../../api/client';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: any;
    Echo: any;
  }
}

export const useManagementStore = defineStore('management', () => {
  // Configs
  const serviceName = ref(localStorage.getItem('service_name') || 'Loket Pendaftaran 1');
  const machineName = ref(localStorage.getItem('machine_name') || 'PC-LOKET-01');
  const localIp = ref(localStorage.getItem('local_ip') || '127.0.0.1');
  const macAddress = ref(localStorage.getItem('mac_address') || '');
  const mainAppUrl = ref(localStorage.getItem('main_app_url') || 'http://localhost:8030');

  // Reverb WebSocket variables
  const enableOnlineMode = ref(localStorage.getItem('enable_online') === 'true');
  const reverbHost = ref(localStorage.getItem('reverb_host') || '127.0.0.1');
  const reverbPort = ref(localStorage.getItem('reverb_port') || '8080');
  const reverbAppKey = ref(localStorage.getItem('reverb_app_key') || 'local_key');
  
  // App States
  const printers = ref<any[]>([]);
  const mappings = ref<any[]>([{ category: 'Gelang Pasien', printer_name: '' }]);
  const logs = ref<any[]>([]);
  const isOnlineConnected = ref(false);
  const isServerRunning = ref(false);

  // Watchers to persist values
  watch(serviceName, (val) => localStorage.setItem('service_name', val));
  watch(machineName, (val) => localStorage.setItem('machine_name', val));
  watch(localIp, (val) => localStorage.setItem('local_ip', val));
  watch(macAddress, (val) => localStorage.setItem('mac_address', val));
  watch(mainAppUrl, (val) => localStorage.setItem('main_app_url', val));
  watch(enableOnlineMode, (val) => {
    localStorage.setItem('enable_online', val.toString());
    if (val) connectEcho();
    else disconnectEcho();
  });
  watch(reverbHost, (val) => localStorage.setItem('reverb_host', val));
  watch(reverbPort, (val) => localStorage.setItem('reverb_port', val));
  watch(reverbAppKey, (val) => localStorage.setItem('reverb_app_key', val));

  // Pusher / Echo instance
  let echoInstance: any = null;

  function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    logs.value.unshift({ timestamp, message, type });
    if (logs.value.length > 200) {
      logs.value.pop();
    }
  }

  function connectEcho() {
    if (!enableOnlineMode.value) return;

    try {
      window.Pusher = Pusher;
      echoInstance = new Echo({
        broadcaster: 'reverb',
        key: reverbAppKey.value,
        wsHost: reverbHost.value,
        wsPort: parseInt(reverbPort.value),
        wssPort: parseInt(reverbPort.value),
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
      });

      echoInstance.connector.pusher.connection.bind('connected', () => {
        isOnlineConnected.value = true;
        addLog('[Reverb] Terhubung ke Server Reverb!', 'success');
      });

      echoInstance.connector.pusher.connection.bind('disconnected', () => {
        isOnlineConnected.value = false;
        addLog('[Reverb] Koneksi terputus dari Server Reverb', 'error');
      });

      const channelName = `printer.${machineName.value}`;
      echoInstance.channel(channelName)
        .listen('PrintJobDispatched', async (e: any) => {
          addLog(`[Job] Menerima print job: ${JSON.stringify(e)}`, 'info');
          try {
            await client.post('/print', e.payload);
            addLog(`[Job] Sukses mencetak dokumen.`, 'success');
          } catch (err: any) {
            addLog(`[Job] Gagal proxy print ke printer lokal: ${err.message}`, 'error');
          }
        });
    } catch (err: any) {
      addLog(`[Reverb] Gagal inisialisasi Echo: ${err.message}`, 'error');
    }
  }

  function disconnectEcho() {
    if (echoInstance) {
      echoInstance.disconnect();
      echoInstance = null;
      isOnlineConnected.value = false;
      addLog('[Reverb] Koneksi WebSocket dimatikan manual.', 'info');
    }
  }

  async function fetchPrinters() {
    try {
      const res = await client.get('/printers');
      if (res.data.success) {
        printers.value = res.data.data;
        isServerRunning.value = true;
        addLog(`[System] Berhasil membaca ${printers.value.length} printer di OS Windows`, 'success');
      }
    } catch (err: any) {
      isServerRunning.value = false;
      addLog(`[System] Gagal menghubungi Local Print Server: ${err.message}`, 'error');
    }
  }

  async function checkServerStatus() {
    try {
      const res = await client.get('/status');
      isServerRunning.value = res.data.success || res.data.service === 'running';
    } catch {
      isServerRunning.value = false;
    }
  }

  async function syncToServer() {
    try {
      const payload = {
        service_name: serviceName.value,
        machine_name: machineName.value,
        ip_address: localIp.value,
        mac_address: macAddress.value,
        printers: mappings.value
          .filter(m => m.printer_name && m.printer_name.trim() !== '')
          .map(m => ({
            printer_name: m.printer_name,
            target_labels: m.category ? m.category.split(',').map((s: string) => s.trim()) : []
          }))
      };

      const res = await axios.post(`${mainAppUrl.value}/api/print-service/register`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      addLog(`[Sync] Sinkronisasi ke server utama berhasil: ${res.data.message}`, 'success');
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      addLog(`[Sync] Sinkronisasi ke server gagal: ${msg}`, 'error');
      return { success: false, message: msg };
    }
  }

  async function unregisterFromServer() {
    try {
      const payload = {
        service_name: serviceName.value,
        mac_address: macAddress.value
      };

      const res = await axios.post(`${mainAppUrl.value}/api/print-service/unregister`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      addLog(`[System] Service berhasil dihapus dari server utama.`, 'success');
      return { success: true, message: res.data?.message || 'Berhasil dihapus' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      addLog(`[System] Gagal menghapus service dari server: ${msg}`, 'error');
      return { success: false, message: msg };
    }
  }

  return {
    serviceName,
    machineName,
    localIp,
    macAddress,
    mainAppUrl,
    enableOnlineMode,
    reverbHost,
    reverbPort,
    reverbAppKey,
    printers,
    mappings,
    logs,
    isOnlineConnected,
    isServerRunning,
    addLog,
    connectEcho,
    disconnectEcho,
    fetchPrinters,
    checkServerStatus,
    syncToServer,
    unregisterFromServer
  };
});
