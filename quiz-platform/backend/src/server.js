require('dotenv').config();

const net = require('node:net');
const app = require('./app');

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

    server.listen(startPort, '127.0.0.1');
  });
}

async function start() {
  const requestedPort = Number(process.env.PORT) || 3000;
  const port = await findFreePort(requestedPort);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Backend URL: http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
