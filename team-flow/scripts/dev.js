const { spawn, execSync } = require('child_process');

// Kill old processes
[3000, 3001, 4000].forEach((port) => {
  try {
    execSync(`netstat -ano | findstr :${port}`, { shell: true, stdio: 'pipe' })
      .toString().split('\n').forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts[4]) try { execSync(`taskkill /F /PID ${parts[4]} 2>nul`, { stdio: 'ignore' }); } catch {}
      });
  } catch {}
});

const prefix = (name) => (text) => {
  text.toString().split('\n').forEach((line) => {
    if (line.trim()) process.stdout.write(`[${name}] ${line}\n`);
  });
};

const backend = spawn('npm.cmd', ['run', 'dev'], { cwd: 'backend', shell: true });
const frontend = spawn('npm.cmd', ['run', 'dev'], { cwd: 'frontend', shell: true });

let backendPort = '';
let frontendPort = '';
let backendReady = false;
let frontendReady = false;

backend.stdout.on('data', (data) => {
  const text = data.toString();
  prefix('backend')(text);
  if (text.includes('rodando em http')) {
    const m = text.match(/rodando em http:\/\/localhost:(\d+)/);
    if (m) backendPort = m[1];
  }
  if (text.includes('Nest application successfully started')) {
    backendReady = true; checkReady();
  }
});

backend.stderr.on('data', (data) => prefix('backend')(data));

frontend.stdout.on('data', (data) => {
  const text = data.toString();
  prefix('frontend')(text);
  const m = text.match(/Local:\s+http:\/\/localhost:(\d+)/);
  if (m) frontendPort = m[1];
  if (text.includes('Ready in')) { frontendReady = true; checkReady(); }
});

frontend.stderr.on('data', (data) => prefix('frontend')(data));

let shown = false;
function checkReady() {
  if (shown) return;
  if (frontendReady) {
    shown = true;
    setTimeout(showBanner, 600);
  }
}

function showBanner() {
  const fe = frontendPort || '3000';
  const be = backendPort || '3001';
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║           TeamFlow - PRONTO!                    ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  📱 Frontend: http://localhost:${fe}                ║`);
  console.log(`  ║  🖥️  API:     http://localhost:${be}/api            ║`);
  console.log(`  ║  📖 Docs:    http://localhost:${be}/api/docs        ║`);
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log('  ║  Contas de demonstração:                        ║');
  console.log('  ║  ana@teamflow.app     / 123456  (Admin)         ║');
  console.log('  ║  demo@teamflow.app    / 123456  (Membro)        ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log('  ║  🚀 npm run build    - Build produção           ║');
  console.log('  ║  🧪 npm test         - Rodar testes             ║');
  console.log('  ║  🐳 docker-compose   - Docker produção          ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
}

process.on('SIGINT', () => process.exit());
