const { spawn, execSync } = require('child_process');
const path = require('path');

// Kill processes on dev ports 3000 and 3001
try {
  execSync(`powershell -Command "Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
} catch {}

// Clean stale caches
const fs = require('fs');

const nextDir = path.join(__dirname, '..', 'frontend', '.next');
try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('[clean] Cache .next limpo');
  }
} catch (e) {
  console.warn('[clean] Não foi possível limpar .next:', e.message);
}

const distDir = path.join(__dirname, '..', 'backend', 'dist');
try {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('[clean] Build backend limpo');
  }
} catch (e) {
  console.warn('[clean] Não foi possível limpar dist:', e.message);
}

const prefix = (name) => (text) => {
  text.toString().split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed) process.stdout.write(`[${name}] ${trimmed}\n`);
  });
};

console.log('[dev] Iniciando backend...');
const backend = spawn('npm.cmd', ['run', 'dev'], { cwd: path.join(__dirname, '..', 'backend'), shell: true });

console.log('[dev] Iniciando frontend...');
const frontend = spawn('npm.cmd', ['run', 'dev'], { cwd: path.join(__dirname, '..', 'frontend'), shell: true });

let backendReady = false;
let frontendReady = false;
let shown = false;

backend.stdout.on('data', (data) => {
  const text = data.toString();
  prefix('backend')(text);
  if (!backendReady && text.includes('Nest application successfully started')) {
    backendReady = true;
    checkReady();
  }
});

backend.stderr.on('data', (data) => prefix('backend')(data));
backend.on('exit', (code) => {
  console.error(`[dev] Backend encerrou (código ${code})`);
  if (!backendReady) process.exit(1);
});

const http = require('http');

function waitForFrontend(retries = 60) {
  return new Promise((resolve) => {
    function check() {
      const req = http.get('http://localhost:3000', (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          // Confirma que HTML foi compilado (não é texto vazio nem erro cru)
          if (res.statusCode === 200 && body.includes('<html')) {
            resolve();
          } else if (retries > 0) {
            retries--;
            setTimeout(check, 1000);
          } else {
            resolve(); // desiste mas não quebra
          }
        });
      });
      req.on('error', () => {
        if (retries > 0) {
          retries--;
          setTimeout(check, 1000);
        } else {
          resolve();
        }
      });
      req.end();
    }
    check();
  });
}

frontend.stdout.on('data', (data) => {
  const text = data.toString();
  prefix('frontend')(text);
  if (!frontendReady && (text.includes('Ready in') || text.includes('ready in'))) {
    // Só marca como pronto após confirmar que o HTML compilou
    waitForFrontend().then(() => {
      frontendReady = true;
      checkReady();
    });
  }
});

frontend.stderr.on('data', (data) => prefix('frontend')(data));
frontend.on('exit', (code) => {
  console.error(`[dev] Frontend encerrou (código ${code})`);
  if (!frontendReady) process.exit(1);
});

function checkReady() {
  if (shown) return;
  if (backendReady && frontendReady) {
    shown = true;
    setTimeout(showBanner, 800);
  }
}

function showBanner() {
  const be = '3001';
  const fe = '3000';
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

process.on('SIGINT', () => {
  console.log('\n[dev] Encerrando...');
  backend.kill();
  frontend.kill();
  process.exit();
});
