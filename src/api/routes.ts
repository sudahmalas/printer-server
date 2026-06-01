import { Router, Request, Response } from 'express';
import { getPrinters } from 'pdf-to-printer';

export const apiRouter = Router();

// /status : Cek apakah service berjalan
apiRouter.get('/status', (req: Request, res: Response) => {
  res.json({ success: true, service: 'running' });
});

// /printers : Membaca daftar printer fisik yang terinstall di OS Windows
apiRouter.get('/printers', async (req: Request, res: Response) => {
  try {
    const printers = await getPrinters();
    res.json({ success: true, data: printers });
  } catch (error: any) {
    console.error('[HTTP] Error fetching printers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// /test-connection : Uji coba koneksi dari aplikasi utama
apiRouter.post('/test-connection', (req: Request, res: Response) => {
  console.log('[HTTP] Received test-connection request from', req.ip);
  res.json({ success: true, message: 'Connection to Print Service successful' });
});
