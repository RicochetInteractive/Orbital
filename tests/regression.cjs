// Ejecutar: node tests/regression.cjs. Navegador real, sin dependencias npm.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const candidates = [process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const browser = candidates.find(file => fs.existsSync(file));
if (!browser) throw Error('Instala Edge/Chrome/Chromium o define BROWSER_PATH.');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'orbita-regression-'));
try {
  const result = spawnSync(browser, ['--headless', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files',
    `--user-data-dir=${profile}`, '--dump-dom', '--virtual-time-budget=2000',
    pathToFileURL(path.join(__dirname, 'game.test.html')).href], { encoding: 'utf8', timeout: 90000, maxBuffer: 8 * 1024 * 1024, windowsHide: true });
  const report = result.stdout?.match(/<pre id="results">([\s\S]*?)<\/pre>/)?.[1];
  if (!report || !/\d+\/\d+ PASS/.test(report)) throw Error(result.error?.message || 'El navegador no terminó las pruebas. ' + result.stderr?.slice(-1200));
  console.log(report);
  if (/FAIL/.test(report)) process.exitCode = 1;
} finally {
  // Exclusivamente la carpeta temporal creada por este proceso.
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}
