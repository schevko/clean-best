const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

app.setName('Clean Best');

let mainWindow = null;
let tray = null;
let serverProcess = null;

const PORT = Number(process.env.PORT || 3847);
const ROOT_DIR = path.resolve(__dirname, '..');
const ICON_PATH = path.join(ROOT_DIR, 'public/assets/AppIcon.png');

function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

const os = require('os');

function findNodeBinary() {
  const home = os.homedir();
  const candidates = [
    process.env.NODE_BINARY,
    path.join(home, '.nvm/versions/node/v24.22.0/bin/node'),
    '/opt/homebrew/bin/node',
    '/usr/local/bin/node',
    'node',
  ].filter(Boolean);

  for (const c of candidates) {
    if (c === 'node' || fs.existsSync(c)) return c;
  }
  return 'node';
}

async function ensureBackendServer() {
  const alreadyUp = await checkServerReady();
  if (alreadyUp) return;

  const home = os.homedir();
  const nodeBin = findNodeBinary();
  const tsxCli = path.join(ROOT_DIR, 'node_modules/tsx/dist/cli.mjs');
  const serverEntry = path.join(ROOT_DIR, 'server/index.ts');

  const env = {
    ...process.env,
    PORT: String(PORT),
    PATH: `${path.join(home, '.nvm/versions/node/v24.22.0/bin')}:/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || '/usr/bin:/bin:/usr/sbin:/sbin'}`,
  };

  serverProcess = spawn(nodeBin, [tsxCli, serverEntry], {
    cwd: ROOT_DIR,
    env,
    stdio: 'ignore',
  });

  for (let i = 0; i < 35; i++) {
    const ready = await checkServerReady();
    if (ready) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

function createTray() {
  if (tray) return;
  try {
    const img = nativeImage.createFromPath(ICON_PATH).resize({ width: 18, height: 18 });
    tray = new Tray(img);
    tray.setToolTip('Clean Best — System & AI Cleaner');
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Clean Best Aç / Open',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'RAM Belleği Rahatlat (Free Up RAM)',
        click: () => {
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port: PORT,
              path: '/api/performance/run',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            },
            (res) => res.resume()
          );
          req.on('error', () => {});
          req.write(JSON.stringify({ taskIds: ['free_ram', 'flush_dns'] }));
          req.end();
        },
      },
      { type: 'separator' },
      {
        label: 'Çıkış / Quit Clean Best',
        click: () => app.quit(),
      },
    ]);
    tray.setContextMenu(contextMenu);
  } catch {
    // Ignore tray creation errors on headless environments
  }
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  if (isMac && app.dock && fs.existsSync(ICON_PATH)) {
    try {
      app.dock.setIcon(ICON_PATH);
    } catch {}
  }

  mainWindow = new BrowserWindow({
    title: 'Clean Best',
    width: 1320,
    height: 850,
    minWidth: 1060,
    minHeight: 720,
    icon: ICON_PATH,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 18, y: 18 } : undefined,
    backgroundColor: '#090048',
    vibrancy: isMac ? 'under-window' : undefined,
    visualEffectState: isMac ? 'active' : undefined,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || `http://127.0.0.1:${PORT}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await ensureBackendServer();
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
    serverProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
