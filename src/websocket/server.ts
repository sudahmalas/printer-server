import { WebSocketServer, WebSocket } from 'ws';

export function initWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log(`[WebSocket] Client connected from ${req.socket.remoteAddress}`);

    ws.on('message', (message) => {
      console.log(`[WebSocket] Received message: ${message}`);
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected`);
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error:`, error);
    });

    // Send connection success event
    ws.send(JSON.stringify({
      event: 'service.connected',
      data: {
        message: 'Connected to Klinik Print Service'
      }
    }));
  });

  // Heartbeat loop every 30 seconds
  setInterval(() => {
    const clients = wss.clients;
    if (clients.size > 0) {
      const heartbeatPayload = JSON.stringify({
        event: 'heartbeat',
        data: {
          service_name: 'Klinik Print Service Local',
          status: 'online',
          timestamp: new Date().toISOString()
        }
      });
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(heartbeatPayload);
        }
      });
    }
  }, 30000);

  console.log(`[WebSocket] Print Service WS is running on ws://127.0.0.1:${port}`);
  return wss;
}
