const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd, cwd = ROOT) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

console.log('=== Building and starting TeamFlow (Production) ===\n');

// Generate Prisma client
run('npx prisma generate', path.join(ROOT, 'backend'));

// Push schema
run('npx prisma db push', path.join(ROOT, 'backend'));

// Start with Docker Compose
run('docker-compose up --build -d');

console.log('\n=== TeamFlow is running! ===');
console.log('Frontend: http://localhost:3000');
console.log('Backend:  http://localhost:3001/api');
console.log('Swagger:  http://localhost:3001/api/docs');
console.log('MinIO:    http://localhost:9001 (minioadmin:minioadmin)');
