import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import {
  getSystemHealth,
  getActivitySummary,
  scanCleanup,
  scanProtection,
  scanPerformance,
  runMaintenanceTasks,
  scanApplications,
  scanClutter,
  scanSpaceLens,
  scanCloudStorage,
  cleanSelectedPaths,
  revealInFileManager,
  terminateProcess,
  recordActivity,
  getIgnoreList,
  addIgnoreItem,
  removeIgnoreItem,
  runNetworkSpeedtest,
} from './systemEngine.ts';

const PORT = Number(process.env.PORT || 3847);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PUBLIC_DIR = path.resolve(__dirname, '../public');

let cachedCleanup: ReturnType<typeof scanCleanup> | null = null;
let cachedProtection: ReturnType<typeof scanProtection> | null = null;
let cachedPerformance: ReturnType<typeof scanPerformance> | null = null;
let cachedApps: ReturnType<typeof scanApplications> | null = null;
let cachedClutter: ReturnType<typeof scanClutter> | null = null;

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, getSystemHealth());
      return;
    }

    if (pathname === '/api/activity' && req.method === 'GET') {
      sendJson(res, 200, getActivitySummary());
      return;
    }

    if (pathname === '/api/smart-care/scan' && req.method === 'GET') {
      cachedCleanup = scanCleanup();
      cachedProtection = scanProtection();
      cachedPerformance = scanPerformance();
      cachedApps = scanApplications();
      cachedClutter = scanClutter();

      const clutterDuplicateWasted = cachedClutter.duplicateGroups.reduce((a, g) => a + g.wastedSize, 0);
      const clutterLargeTotal = cachedClutter.largeFiles.slice(0, 10).reduce((a, f) => a + f.size, 0);

      recordActivity({
        module: 'Smart Care',
        action: 'Full 5-Pillar System Scan',
        bytesCleaned: 0,
        itemsCount: cachedCleanup.totalItems,
        threatsScanned: cachedProtection.filesInspected,
        timeSavedSeconds: 45,
      });

      sendJson(res, 200, {
        cleanup: cachedCleanup,
        protection: cachedProtection,
        performance: cachedPerformance,
        applications: cachedApps,
        clutter: cachedClutter,
        summary: {
          junkBytes: cachedCleanup.totalSize,
          threatsCount: cachedProtection.threatsFound.length,
          filesInspected: cachedProtection.filesInspected,
          maintenanceCount: cachedPerformance.maintenanceTasks.filter((t) => t.recommended).length,
          loginItemsCount: cachedPerformance.loginItems.length,
          appsCount: cachedApps.apps.length,
          leftoversCount: cachedApps.leftovers.length,
          installersCount: cachedApps.installers.length,
          clutterBytes: clutterDuplicateWasted + clutterLargeTotal,
          duplicatesCount: cachedClutter.duplicateGroups.length,
        },
      });
      return;
    }

    if (pathname === '/api/cleanup/scan' && req.method === 'GET') {
      cachedCleanup = scanCleanup();
      sendJson(res, 200, cachedCleanup);
      return;
    }

    if (pathname === '/api/protection/scan' && req.method === 'GET') {
      cachedProtection = scanProtection();
      sendJson(res, 200, cachedProtection);
      return;
    }

    if (pathname === '/api/performance/scan' && req.method === 'GET') {
      cachedPerformance = scanPerformance();
      sendJson(res, 200, cachedPerformance);
      return;
    }

    if (pathname === '/api/performance/run' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const taskIds: string[] = Array.isArray(body.taskIds)
        ? body.taskIds
        : ['free_ram', 'flush_dns', 'purgeable_space'];
      sendJson(res, 200, runMaintenanceTasks(taskIds));
      return;
    }

    if (pathname === '/api/applications/scan' && req.method === 'GET') {
      cachedApps = scanApplications();
      sendJson(res, 200, cachedApps);
      return;
    }

    if (pathname === '/api/clutter/scan' && req.method === 'GET') {
      cachedClutter = scanClutter();
      sendJson(res, 200, cachedClutter);
      return;
    }

    if (pathname === '/api/spacelens/scan' && req.method === 'GET') {
      const targetPath = parsedUrl.searchParams.get('path') || undefined;
      sendJson(res, 200, scanSpaceLens(targetPath));
      return;
    }

    if (pathname === '/api/cloud/scan' && req.method === 'GET') {
      sendJson(res, 200, scanCloudStorage());
      return;
    }

    if (pathname === '/api/clean' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const paths: string[] = Array.isArray(body.paths) ? body.paths : [];
      const mode: 'trash' | 'permanent' | 'shred' | 'evict' = body.mode || 'trash';
      const moduleName: string = body.module || 'Cleanup';
      sendJson(res, 200, cleanSelectedPaths(paths, mode, moduleName));
      return;
    }

    if (pathname === '/api/reveal' && req.method === 'POST') {
      const body = await readJsonBody(req);
      sendJson(res, 200, revealInFileManager(body.path || ''));
      return;
    }

    if (pathname === '/api/process/kill' && req.method === 'POST') {
      const body = await readJsonBody(req);
      sendJson(res, 200, terminateProcess(Number(body.pid), Boolean(body.force)));
      return;
    }

    if (pathname === '/api/network/speedtest' && req.method === 'POST') {
      const result = await runNetworkSpeedtest();
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/ignore-list' && req.method === 'GET') {
      sendJson(res, 200, { items: getIgnoreList() });
      return;
    }

    if (pathname === '/api/ignore-list' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (body.action === 'remove') {
        sendJson(res, 200, { items: removeIgnoreItem(body.path || '') });
      } else {
        sendJson(res, 200, { items: addIgnoreItem(body.path || '') });
      }
      return;
    }

    // Serve static assets from dist/ or public/ for standalone Desktop App mode
    const cleanRel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const candidateDist = path.join(DIST_DIR, cleanRel);
    const candidatePublic = path.join(PUBLIC_DIR, cleanRel);
    const fileToServe =
      fs.existsSync(candidateDist) && fs.statSync(candidateDist).isFile()
        ? candidateDist
        : fs.existsSync(candidatePublic) && fs.statSync(candidatePublic).isFile()
          ? candidatePublic
          : path.join(DIST_DIR, 'index.html');

    if (fs.existsSync(fileToServe) && fs.statSync(fileToServe).isFile()) {
      const ext = path.extname(fileToServe).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      });
      fs.createReadStream(fileToServe).pipe(res);
      return;
    }

    sendJson(res, 404, { error: 'Not Found', path: pathname });
  } catch (err: any) {
    sendJson(res, 500, { error: err?.message || 'Internal Server Error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Clean Best Desktop Engine] Active on http://127.0.0.1:${PORT} (${process.platform})`);
});
