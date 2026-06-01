import express from 'express';
import cors from 'cors';
import http from 'http';
import { apiRouter } from './api/routes';
import { initWebSocketServer } from './websocket/server';

const HTTP_PORT = 18181;
const WS_PORT = 18182;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP API Routes
app.use('/', apiRouter);

// Start HTTP Server
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Print Service API is running on http://127.0.0.1:${HTTP_PORT}`);
});

// Start WebSocket Server
initWebSocketServer(WS_PORT);

console.log('Klinik Print Service initializing...');
