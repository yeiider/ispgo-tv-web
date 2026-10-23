// Empaqueta dist/ para cada televisor:
//   tizen -> out/IspGo-TV-Samsung-<versión>.wgt (sin firmar: se firma con el certificado de Samsung)
//   webos -> out/IspGo-TV-LG-<versión>.ipk
// La versión sale de VERSION (en CI) o de package.json.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';

const target = process.argv[2];
const version = process.env.VERSION || JSON.parse(readFileSync('package.json', 'utf8')).version;
const dir = `out/${target}`;

rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
cpSync('dist', dir, { recursive: true });

if (target === 'tizen') {
  writeFileSync(`${dir}/config.xml`, readFileSync('tizen/config.xml', 'utf8').replace('@VERSION@', version));
  const file = `IspGo-TV-Samsung-${version}.wgt`;
  rmSync(`out/${file}`, { force: true });
  execFileSync('zip', ['-r', '-q', `../${file}`, '.'], { cwd: dir, stdio: 'inherit' });
  console.log(`out/${file}`);
} else if (target === 'webos') {
  writeFileSync(`${dir}/appinfo.json`, readFileSync('webos/appinfo.json', 'utf8').replace('@VERSION@', version));
  execFileSync('npx', ['ares-package', dir, '-o', 'out', '--no-minify'], { stdio: 'inherit' });
  const file = `IspGo-TV-LG-${version}.ipk`;
  renameSync(`out/net.ispgo.tv_${version}_all.ipk`, `out/${file}`);
  console.log(`out/${file}`);
} else {
  console.error('Uso: node scripts/package.mjs tizen|webos');
  process.exit(1);
}
