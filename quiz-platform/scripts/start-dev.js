const { spawn } = require('node:child_process');
const net = require('node:net');

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

function run(label, command, args, env) {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: { ...process.env, ...env }
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${label}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${label}] ${data}`);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      process.stderr.write(`[${label}] exited with code ${code}\n`);
    }
  });

  return child;
}

async function main() {
  const backendPort = await findFreePort(Number(process.env.PORT) || 3000);
  const frontendPort = await findFreePort(Number(process.env.FRONTEND_PORT) || 5173);
  const backendUrl = `http://localhost:${backendPort}`;
  const frontendUrl = `http://localhost:${frontendPort}`;

  console.log(`Detected backend port: ${backendPort}`);
  console.log(`Detected frontend port: ${frontendPort}`);
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log('Launching backend + frontend automatically...');

  const backend = run('backend', 'npm', ['--workspace', 'backend', 'run', 'dev'], {
    PORT: String(backendPort),
    FRONTEND_URL: frontendUrl
  });

  const frontend = run('frontend', 'npm', ['--workspace', 'frontend', 'run', 'dev', '--', '--host', 'localhost'], {
    FRONTEND_PORT: String(frontendPort),
    VITE_API_URL: backendUrl
  });

  const shutdown = () => {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
