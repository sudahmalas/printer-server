"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pdf_to_printer_1 = require("pdf-to-printer");
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_1 = __importDefault(require("fs"));
const isDev = !electron_1.app.isPackaged && process.env.NODE_ENV !== 'production';
// --- Memory Optimizations ---
// Menonaktifkan proses GPU untuk menghemat RAM hingga 40-50 MB
electron_1.app.disableHardwareAcceleration();
// Membatasi ukuran heap memori V8 Node.js maksimal 64MB (default bisa ratusan MB)
electron_1.app.commandLine.appendSwitch('js-flags', '--max-old-space-size=64');
let mainWindow = null;
let tray = null;
let db;
// --- Database Setup ---
const dbPath = path.join(electron_1.app.getPath('userData'), 'printer_mappings.sqlite');
db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err)
        console.error('Database connection error:', err);
    else {
        db.run(`CREATE TABLE IF NOT EXISTS mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      printer_name TEXT NOT NULL
    )`);
    }
});
// --- Express Server Setup ---
const server = (0, express_1.default)();
server.use((0, cors_1.default)());
server.use(express_1.default.json());
// API: Get physical printers
server.get('/printers', async (req, res) => {
    try {
        const printers = await (0, pdf_to_printer_1.getPrinters)();
        res.json({ success: true, data: printers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
const os_1 = __importDefault(require("os"));
// API: Get mappings
server.get('/mappings', (req, res) => {
    db.all('SELECT * FROM mappings', (err, rows) => {
        if (err)
            res.status(500).json({ success: false });
        else
            res.json({ success: true, data: rows });
    });
});
// API: Get Network IPs
server.get('/network-ips', (req, res) => {
    const nets = os_1.default.networkInterfaces();
    const results = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                results.push({ name, ip: net.address, mac: net.mac });
            }
        }
    }
    res.json({ success: true, data: results });
});
// API: Quick Status Check
server.get('/status', (req, res) => {
    res.json({ success: true, status: 'running' });
});
// API: Print Job Payload
// Expected: { jobs: [{ url: "...", category: "..." }] }
server.post('/print', async (req, res) => {
    const jobs = req.body.jobs;
    if (!jobs || !Array.isArray(jobs))
        return res.status(400).json({ success: false, message: 'Invalid payload' });
    try {
        for (const job of jobs) {
            // 1. Use explicit printer_name or find mapped printer
            let mappedPrinter = job.printer_name;
            if (!mappedPrinter && job.category) {
                mappedPrinter = await new Promise((resolve, reject) => {
                    db.get('SELECT printer_name FROM mappings WHERE category = ?', [job.category], (err, row) => {
                        if (err)
                            reject(err);
                        else if (!row)
                            reject(new Error(`No printer mapped for category: ${job.category}`));
                        else
                            resolve(row.printer_name);
                    });
                });
            }
            if (!mappedPrinter) {
                throw new Error(`Tidak ada printer yang dituju untuk dokumen ini.`);
            }
            // 2. Process Print
            console.log(`Printing job category: ${job.category} to printer: ${mappedPrinter}`);
            await processPrintJob(job, mappedPrinter);
        }
        res.json({ success: true, message: 'Print jobs dispatched' });
    }
    catch (error) {
        console.error('Print error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// API: Test Connection and Print
server.post('/test-connection', async (req, res) => {
    try {
        const { printer_name, test_mode } = req.body;
        if (test_mode && printer_name) {
            console.log(`[HTTP] Test print requested for printer: ${printer_name}`);
            const testHtmlUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(`
        <div style="font-family: sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #059669;">✅ Test Print Berhasil</h2>
          <p>Koneksi antara Aplikasi Utama dan Print Service berjalan dengan baik.</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">Waktu: ${new Date().toLocaleString()}</p>
          <p style="font-size: 12px; color: #666;">Target: ${printer_name}</p>
        </div>
      `);
            const dummyJob = { url: testHtmlUrl, lebar_mm: 0, tinggi_mm: 0 };
            await processPrintJob(dummyJob, printer_name);
            res.json({ success: true, message: 'Dokumen test print telah dikirim ke antrian printer: ' + printer_name });
        }
        else {
            res.json({ success: true, message: 'Print Service terhubung dengan baik (Ping OK).' });
        }
    }
    catch (error) {
        console.error('Test print error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
async function processPrintJob(job, printerName) {
    return new Promise((resolve, reject) => {
        let hiddenWindow = new electron_1.BrowserWindow({
            show: false,
            webPreferences: { nodeIntegration: false, contextIsolation: true }
        });
        let targetUrl = job.url;
        let tempHtmlPath = '';
        if (job.url.startsWith('data:image')) {
            tempHtmlPath = path.join(electron_1.app.getPath('temp'), `print_${Date.now()}.html`);
            const htmlContent = `<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;"><img src="${job.url}" style="width:100%;height:auto;display:block;"/></body></html>`;
            fs_1.default.writeFileSync(tempHtmlPath, htmlContent);
            targetUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
        }
        hiddenWindow.loadURL(targetUrl).then(async () => {
            try {
                const widthMm = job.lebar_mm || 0;
                const heightMm = job.tinggi_mm || 0;
                console.log(`[PrintJob] Received job with width: ${widthMm}mm, height: ${heightMm}mm`);
                const printOptions = {
                    printBackground: true,
                    preferCSSPageSize: true, // Masih kita gunakan sebagai fallback
                    marginsType: 1, // No margin
                };
                // Jika dimensi dikirim, kita paksa di tingkat OS
                if (widthMm > 0 && heightMm > 0) {
                    // Electron pageSize menggunakan Micron (1 mm = 1000 micron)
                    printOptions.pageSize = {
                        width: widthMm * 1000,
                        height: heightMm * 1000
                    };
                    // Set landscape jika lebarnya lebih besar dari tinggi
                    printOptions.landscape = widthMm > heightMm;
                }
                console.log(`[PrintJob] PDF Options:`, JSON.stringify(printOptions));
                const pdfBuffer = await hiddenWindow.webContents.printToPDF(printOptions);
                const tempPath = path.join(electron_1.app.getPath('temp'), `print_pdf_${Date.now()}.pdf`);
                fs_1.default.writeFileSync(tempPath, pdfBuffer);
                // Print using pdf-to-printer
                const ptp = require('pdf-to-printer');
                const ptpOptions = {
                    printer: printerName,
                    scale: "noscale",
                    pages: "1"
                };
                if (widthMm > heightMm) {
                    ptpOptions.orientation = "landscape";
                }
                await ptp.print(tempPath, ptpOptions);
                // Cleanup
                fs_1.default.unlinkSync(tempPath);
                if (tempHtmlPath && fs_1.default.existsSync(tempHtmlPath))
                    fs_1.default.unlinkSync(tempHtmlPath);
                hiddenWindow.close();
                hiddenWindow = null;
                resolve();
            }
            catch (err) {
                if (tempHtmlPath && fs_1.default.existsSync(tempHtmlPath))
                    fs_1.default.unlinkSync(tempHtmlPath);
                if (hiddenWindow)
                    hiddenWindow.close();
                reject(err);
            }
        }).catch(err => {
            if (tempHtmlPath && fs_1.default.existsSync(tempHtmlPath))
                fs_1.default.unlinkSync(tempHtmlPath);
            if (hiddenWindow)
                hiddenWindow.close();
            reject(err);
        });
    });
}
server.listen(18181, () => {
    console.log('[HTTP] Print Service API running on port 18181');
});
// --- Electron App Lifecycle ---
const iconPath = path.join(__dirname, '../public/favicon.ico');
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        title: 'ID-GROW Print Service',
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        show: false // start hidden, let Vue render first if needed
    });
    mainWindow.setMenuBarVisibility(false);
    if (isDev) {
        mainWindow.loadURL('http://localhost:3050');
        mainWindow.show();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow?.hide();
    });
}
function createTray() {
    tray = new electron_1.Tray(iconPath);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        { label: 'Show Dashboard', click: () => { mainWindow?.show(); } },
        { type: 'separator' },
        { label: 'Quit', click: () => {
                mainWindow?.destroy(); // Force close
                electron_1.app.quit();
            } }
    ]);
    tray.setToolTip('Klinik Print Service');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        mainWindow?.show();
    });
}
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.whenReady().then(() => {
        createWindow();
        createTray();
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0)
                createWindow();
        });
    });
}
