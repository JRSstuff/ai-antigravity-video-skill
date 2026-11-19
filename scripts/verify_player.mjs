// Visual & Functional Verification Test for 3D Scene & Animation Player
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

async function run() {
  fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });

  // 1. HTTP Server
  const server = http.createServer((req, res) => {
    const rawUrl = req.url.split('?')[0];
    const u = decodeURIComponent(rawUrl === '/' ? '/index.html' : rawUrl);
    const filePath = path.join(ROOT, u.replace(/^\//, ''));

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found: ' + u);
    }
  });

  const port = 8240;
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  console.log(`Server listening on http://127.0.0.1:${port}`);

  // 2. Spawn Chrome
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-three-test-'));
  const proc = spawn(
    CHROME,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${prof}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1280,720',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let dbgPort;
  for (let i = 0; i < 150 && !dbgPort; i++) {
    try {
      const portFile = fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8');
      dbgPort = +portFile.split('\n')[0];
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  if (!dbgPort) {
    throw new Error('Failed to get DevTools active port');
  }

  // 3. Connect WebSocket CDP
  const tabs = await fetch(`http://127.0.0.1:${dbgPort}/json`).then((r) => r.json());
  const wsUrl = tabs[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => (ws.onopen = resolve));

  let msgId = 1;
  const pending = new Map();
  const consoleLogs = [];

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data.result);
      pending.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
      consoleLogs.push(text);
      console.log('BROWSER CONSOLE:', text);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('BROWSER EXCEPTION:', data.params.exceptionDetails);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to http://127.0.0.1:' + port + '/index.html...');
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
  await new Promise((r) => setTimeout(r, 2500));

  // Helper to capture screenshot
  async function screenshot(outPath) {
    const res = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${outPath}`);
  }

  // Step 1: Initial Studio + Quaternius (Beat 1 - Idle)
  await screenshot(path.join(ROOT, 'review/step1_studio_idle.jpg'));

  // Step 2: Jump to Beat 2 (Talk + Green Shirt)
  await send('Runtime.evaluate', { expression: `window.app.timeline.jumpToStep(1);` });
  await new Promise((r) => setTimeout(r, 1200));
  await screenshot(path.join(ROOT, 'review/step2_studio_talk.jpg'));

  // Step 3: Jump to Beat 3 (Gesture + Amber Shirt)
  await send('Runtime.evaluate', { expression: `window.app.timeline.jumpToStep(2);` });
  await new Promise((r) => setTimeout(r, 1200));
  await screenshot(path.join(ROOT, 'review/step3_studio_gesture.jpg'));

  // Step 4: Swap Room to Cozy Bedroom
  console.log('Testing dynamic room swap to cozy_bedroom...');
  await send('Runtime.evaluate', { expression: `window.app.setRoom('bedroom');` });
  await new Promise((r) => setTimeout(r, 1200));
  await screenshot(path.join(ROOT, 'review/step4_bedroom_swap.jpg'));

  // Step 5: Swap Character to Kenney Character
  console.log('Testing dynamic character swap to kenney_character...');
  await send('Runtime.evaluate', { expression: `window.app.setCharacter('kenney');` });
  await new Promise((r) => setTimeout(r, 1200));
  await screenshot(path.join(ROOT, 'review/step5_kenney_swap.jpg'));

  console.log('All verification steps completed successfully!');

  // Cleanup
  ws.close();
  proc.kill();
  server.close();
  await new Promise((r) => setTimeout(r, 400));
  try {
    fs.rmSync(prof, { recursive: true, force: true });
  } catch (e) {
    // Temp dir cleanup ignored on fast Windows process exit
  }
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
