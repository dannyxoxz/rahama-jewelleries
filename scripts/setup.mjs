import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'backend');
const envFile = path.join(backend, '.env');

if (!fs.existsSync(envFile)) {
  const password = `Rahama-${crypto.randomBytes(5).toString('hex')}!`;
  const secret = crypto.randomBytes(40).toString('hex');
  let env = fs.readFileSync(path.join(backend, '.env.example'), 'utf8');
  env = env
    .replace('JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS', `JWT_SECRET=${secret}`)
    .replace('ADMIN_EMAIL=admin@rahamaessentials.com', 'ADMIN_EMAIL=admin@rahama.com')
    .replace('ADMIN_PASSWORD=CHANGE_THIS_TO_A_LONG_UNIQUE_PASSWORD', `ADMIN_PASSWORD=${password}`);
  fs.writeFileSync(envFile, env, { mode: 0o600 });
  console.log('\nADMIN LOGIN — SAVE THESE DETAILS');
  console.log('Email:    admin@rahama.com');
  console.log(`Password: ${password}\n`);
} else {
  console.log('Existing backend/.env kept unchanged.');
}

for (const [label, cwd] of [
  ['root tools', root],
  ['backend packages', backend],
  ['frontend packages', path.join(root, 'frontend')]
]) {
  console.log(`\nInstalling ${label}...`);
  execSync('npm install', { cwd, stdio: 'inherit' });
}
console.log('\nSetup complete. Run npm run dev or double-click start.bat.');
