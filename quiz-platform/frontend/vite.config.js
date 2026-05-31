import net from 'node:net';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(findFreePort(startPort + 1));
    });

    server.once('listening', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });

    server.listen(startPort, 'localhost');
  });
}

export default defineConfig(async () => {
  const port = await findFreePort(Number(process.env.FRONTEND_PORT) || 5173);

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port,
      strictPort: false
    }
  };
});
