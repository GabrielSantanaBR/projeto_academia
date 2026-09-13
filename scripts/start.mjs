import { spawn } from 'node:child_process';
try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
process.env.NEXTAUTH_URL ||= process.env.RENDER_EXTERNAL_URL;
const fail = message => { console.error(message); process.exit(1); };
if (!process.env.DATABASE_URL?.startsWith('postgres')) fail('Defina DATABASE_URL para o PostgreSQL da aplicação.');
if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32 || /troque|change-me|example/i.test(process.env.NEXTAUTH_SECRET)) fail('Defina NEXTAUTH_SECRET com pelo menos 32 caracteres aleatórios.');
let url;
try { url = new URL(process.env.NEXTAUTH_URL); } catch { fail('Defina NEXTAUTH_URL com a URL pública da aplicação.'); }
if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) fail('A URL pública de produção deve usar HTTPS.');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '0.0.0.0', '-p', process.env.PORT || '3000'], { stdio: 'inherit', env: process.env });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', () => fail('Não foi possível iniciar a aplicação. Verifique a instalação e a build.'));
child.on('exit', code => process.exit(code ?? 0));
