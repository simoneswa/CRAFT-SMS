const { spawnSync } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname, 'CRAFT_SMS', 'frontend');

console.log('--- STARTING DEBUG BUILD ---');
console.log('Target directory:', frontendDir);

const result = spawnSync('pnpm', ['exec', 'next', 'build'], {
  cwd: frontendDir,
  env: { ...process.env, NODE_OPTIONS: '--trace-uncaught' },
  stdio: 'inherit',
  shell: true
});

if (result.error) {
  console.error('Failed to start build:', result.error);
}
process.exit(result.status || 0);
