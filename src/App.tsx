import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Trash2,
  Shield,
  Gauge,
  LayoutGrid,
  FolderSearch,
  Orbit,
  Cloud,
  Wrench,
  BarChart3,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Volume2,
  VolumeX,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  CheckSquare,
  Square,
  Flame,
  Lock,
  Bot,
  XCircle,
  ChevronRight,
  FolderOpen,
  FileWarning,
  Layers,
  Info,
  Code2,
  Copy,
} from 'lucide-react';
import { CMM5_THEMES, ModuleId, formatBytes, formatDisplayPath, playCmmSound } from './theme';
import { LiveBackground } from './components/LiveBackground';
import { UbiquitousButton } from './components/UbiquitousButton';
import { SpaceLensView } from './components/SpaceLensView';
import { ScreenCleanerModal } from './components/ScreenCleanerModal';
import { HealthMonitorDrawer } from './components/HealthMonitorDrawer';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('smartCare');
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [deleteMode, setDeleteMode] = useState<'trash' | 'permanent'>('trash');
  const [winterHero, setWinterHero] = useState(false);

  // Drawers & Modals
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [screenCleanerOpen, setScreenCleanerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Scanning & Data State
  const [isScanning, setIsScanning] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);

  // Module Data States
  const [smartCareData, setSmartCareData] = useState<any>(null);
  const [cleanupData, setCleanupData] = useState<any>(null);
  const [selectedCleanupCategory, setSelectedCleanupCategory] = useState<string>('user_caches');
  const [selectedCleanupPaths, setSelectedCleanupPaths] = useState<Set<string>>(new Set());

  const [protectionData, setProtectionData] = useState<any>(null);
  const [protectionTab, setProtectionTab] = useState<'malware' | 'privacy' | 'permissions' | 'wifi'>('malware');

  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceTab, setPerformanceTab] = useState<'maintenance' | 'login' | 'background'>('maintenance');
  const [selectedPerfTasks, setSelectedPerfTasks] = useState<Set<string>>(
    new Set(['free_ram', 'flush_dns', 'purgeable_space'])
  );
  const [disabledPerfIds, setDisabledPerfIds] = useState<Set<string>>(new Set());

  const [appsData, setAppsData] = useState<any>(null);
  const [appsTab, setAppsTab] = useState<'uninstaller' | 'updater' | 'leftovers' | 'installers'>('uninstaller');
  const [appSearch, setAppSearch] = useState('');
  const [selectedAppPaths, setSelectedAppPaths] = useState<Set<string>>(new Set());

  const [clutterData, setClutterData] = useState<any>(null);
  const [clutterTab, setClutterTab] = useState<'large' | 'duplicates' | 'images' | 'downloads'>('large');
  const [clutterKindFilter, setClutterKindFilter] = useState<string>('All');
  const [clutterAgeFilter, setClutterAgeFilter] = useState<string>('All');
  const [selectedClutterPaths, setSelectedClutterPaths] = useState<Set<string>>(new Set());

  const [spaceLensData, setSpaceLensData] = useState<any>(null);
  const [cloudData, setCloudData] = useState<any>(null);
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<string>('icloud');
  const [selectedCloudPaths, setSelectedCloudPaths] = useState<Set<string>>(new Set());

  // My Tools active sub-tool
  const [activeTool, setActiveTool] = useState<'hub' | 'shredder' | 'terminator' | 'ai' | 'browser' | 'email'>('hub');
  const [shredderCustomPath, setShredderCustomPath] = useState('');

  // Settings & Ignore List State (Features_Settings.bundle)
  const [settingsTab, setSettingsTab] = useState<'general' | 'protection' | 'ignoreList' | 'about'>('general');
  const [realTimeMonitor, setRealTimeMonitor] = useState(true);
  const [bgMalwareScan, setBgMalwareScan] = useState(true);
  const [scanArchives, setScanArchives] = useState(true);
  const [ignoreList, setIgnoreList] = useState<string[]>([]);
  const [newIgnorePath, setNewIgnorePath] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Poll live hardware telemetry & activity
  const fetchHealthAndActivity = useCallback(async () => {
    try {
      const [hRes, aRes, iRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/activity'),
        fetch('/api/ignore-list'),
      ]);
      if (hRes.ok) setHealth(await hRes.json());
      if (aRes.ok) setActivity(await aRes.json());
      if (iRes.ok) {
        const ig = await iRes.json();
        if (Array.isArray(ig.items)) setIgnoreList(ig.items);
      }
    } catch {
      // Ignore transient network errors
    }
  }, []);

  useEffect(() => {
    fetchHealthAndActivity();
    const timer = setInterval(fetchHealthAndActivity, 5000);
    return () => clearInterval(timer);
  }, [fetchHealthAndActivity]);

  // Space Lens auto-load when entering module
  const loadSpaceLens = useCallback(async (targetPath?: string) => {
    setIsScanning(true);
    try {
      const url = targetPath
        ? `/api/spacelens/scan?path=${encodeURIComponent(targetPath)}`
        : '/api/spacelens/scan';
      const res = await fetch(url);
      if (res.ok) {
        setSpaceLensData(await res.json());
        playCmmSound('scanFinished', soundEnabled);
      }
    } finally {
      setIsScanning(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (activeModule === 'spaceLens' && !spaceLensData) {
      loadSpaceLens();
    }
  }, [activeModule, spaceLensData, loadSpaceLens]);

  // Execute scan for current module
  const handleModuleScan = async (mod: ModuleId = activeModule) => {
    setIsScanning(true);
    try {
      if (mod === 'smartCare') {
        const res = await fetch('/api/smart-care/scan');
        if (res.ok) {
          const data = await res.json();
          setSmartCareData(data);
          setCleanupData(data.cleanup);
          setProtectionData(data.protection);
          setPerformanceData(data.performance);
          setAppsData(data.applications);
          setClutterData(data.clutter);

          // Pre-populate default safe cleanup selections
          const defaultPaths = new Set<string>();
          for (const cat of data.cleanup.categories || []) {
            for (const item of cat.items || []) {
              if (item.selected) defaultPaths.add(item.path);
            }
          }
          setSelectedCleanupPaths(defaultPaths);
          playCmmSound('scanFinished', soundEnabled);
        }
      } else if (mod === 'cleanup') {
        const res = await fetch('/api/cleanup/scan');
        if (res.ok) {
          const data = await res.json();
          setCleanupData(data);
          const defaultPaths = new Set<string>();
          for (const cat of data.categories || []) {
            for (const item of cat.items || []) {
              if (item.selected) defaultPaths.add(item.path);
            }
          }
          setSelectedCleanupPaths(defaultPaths);
          playCmmSound('scanFinished', soundEnabled);
        }
      } else if (mod === 'protection') {
        const res = await fetch('/api/protection/scan');
        if (res.ok) {
          setProtectionData(await res.json());
          playCmmSound('scanFinished', soundEnabled);
        }
      } else if (mod === 'performance') {
        const res = await fetch('/api/performance/scan');
        if (res.ok) {
          setPerformanceData(await res.json());
          playCmmSound('scanFinished', soundEnabled);
        }
      } else if (mod === 'applications') {
        const res = await fetch('/api/applications/scan');
        if (res.ok) {
          setAppsData(await res.json());
          playCmmSound('scanFinished', soundEnabled);
        }
      } else if (mod === 'clutter') {
        const res = await fetch('/api/clutter/scan');
        if (res.ok) {
          setClutterData(await res.json());
          playCmmSound('scanFinished', soundEnabled);
        }
      } else if (mod === 'spaceLens') {
        await loadSpaceLens(spaceLensData?.currentPath);
      } else if (mod === 'cloud') {
        const res = await fetch('/api/cloud/scan');
        if (res.ok) {
          const data = await res.json();
          setCloudData(data);
          const firstConnected = data.providers?.find((p: any) => p.connected)?.id || 'icloud';
          setSelectedCloudProvider(firstConnected);
          playCmmSound('scanFinished', soundEnabled);
        }
      }
      await fetchHealthAndActivity();
    } finally {
      setIsScanning(false);
    }
  };

  // Clean paths helper
  const handleCleanPaths = async (
    paths: string[],
    mode: 'trash' | 'permanent' | 'shred' | 'evict' = deleteMode,
    moduleLabel = 'Cleanup'
  ) => {
    if (!paths.length) {
      showToast(lang === 'tr' ? 'Temizlenecek öğe seçilmedi.' : 'No items selected to clean.');
      return;
    }
    setIsScanning(true);
    try {
      const res = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths, mode, module: moduleLabel }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.cleanedCount === 0 && result.errors?.length > 0) {
          playCmmSound('cleanFailed', soundEnabled);
          showToast(
            lang === 'tr'
              ? `⚠️ Bazı öğeler korunuyor: ${result.errors[0]}`
              : `⚠️ Protected item skipped: ${result.errors[0]}`
          );
        } else {
          playCmmSound('cleanFinished', soundEnabled);
          showToast(
            lang === 'tr'
              ? `✓ ${result.cleanedCount} öğe (${formatBytes(result.cleanedBytes)}) başarıyla temizlendi!`
              : `✓ Cleaned ${result.cleanedCount} items (${formatBytes(result.cleanedBytes)})!`
          );
        }

        const cleanedSet = new Set(paths);
        setSelectedCleanupPaths((prev) => new Set([...prev].filter((p) => !cleanedSet.has(p))));
        setSelectedAppPaths((prev) => new Set([...prev].filter((p) => !cleanedSet.has(p))));
        setSelectedClutterPaths((prev) => new Set([...prev].filter((p) => !cleanedSet.has(p))));
        setSelectedCloudPaths((prev) => new Set([...prev].filter((p) => !cleanedSet.has(p))));

        // Prune cleaned items from active UI lists so totals update immediately
        setCleanupData((prev: any) => {
          if (!prev?.categories) return prev;
          const categories = prev.categories.map((cat: any) => {
            const items = (cat.items || []).filter((i: any) => !cleanedSet.has(i.path));
            const totalSize = items.reduce((acc: number, i: any) => acc + i.size, 0);
            return { ...cat, items, itemCount: items.length, totalSize };
          });
          return {
            ...prev,
            categories,
            totalSize: categories.reduce((acc: number, c: any) => acc + c.totalSize, 0),
            totalItems: categories.reduce((acc: number, c: any) => acc + c.itemCount, 0),
          };
        });

        setClutterData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            largeFiles: (prev.largeFiles || []).filter((f: any) => !cleanedSet.has(f.path)),
            similarImages: (prev.similarImages || []).filter((f: any) => !cleanedSet.has(f.path)),
            downloads: (prev.downloads || []).filter((f: any) => !cleanedSet.has(f.path)),
            duplicateGroups: (prev.duplicateGroups || [])
              .map((g: any) => {
                const files = (g.files || []).filter((f: any) => !cleanedSet.has(f.path));
                return { ...g, files, wastedSize: g.sizeEach * Math.max(0, files.length - 1) };
              })
              .filter((g: any) => g.files.length >= 2),
          };
        });

        setAppsData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            apps: (prev.apps || []).filter((a: any) => !cleanedSet.has(a.path)),
            leftovers: (prev.leftovers || []).filter((l: any) => !cleanedSet.has(l.path)),
            installers: (prev.installers || []).filter((i: any) => !cleanedSet.has(i.path)),
          };
        });

        setCloudData((prev: any) => {
          if (!prev?.providers) return prev;
          return {
            ...prev,
            providers: prev.providers.map((p: any) => {
              const files = (p.files || []).filter((f: any) => !cleanedSet.has(f.path));
              const localSize = files.reduce((acc: number, f: any) => acc + f.size, 0);
              return { ...p, files, localSize };
            }),
          };
        });

        setPerformanceData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            loginItems: (prev.loginItems || []).filter((i: any) => !cleanedSet.has(i.path)),
            backgroundItems: (prev.backgroundItems || []).filter((i: any) => !cleanedSet.has(i.path)),
          };
        });

        setProtectionData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            privacyBrowsers: (prev.privacyBrowsers || []).map((b: any) =>
              cleanedSet.has(b.path) ? { ...b, cacheSize: 0, cookiesCount: 0, historyItems: 0 } : b
            ),
          };
        });

        setSmartCareData((prev: any) => {
          if (!prev?.summary) return prev;
          return {
            ...prev,
            summary: {
              ...prev.summary,
              junkBytes: Math.max(0, (prev.summary.junkBytes || 0) - (result.cleanedBytes || 0)),
            },
          };
        });

        await fetchHealthAndActivity();
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunMaintenance = async (taskIds: string[]) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/performance/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
      if (res.ok) {
        playCmmSound('cleanFinished', soundEnabled);
        showToast(
          lang === 'tr'
            ? `✓ ${taskIds.length} performans ve bakım görevi başarıyla çalıştırıldı!`
            : `✓ Executed ${taskIds.length} performance maintenance tasks!`
        );
        await fetchHealthAndActivity();
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleRevealPath = async (targetPath: string) => {
    await fetch('/api/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath }),
    });
  };

  const handleKillProcess = async (pid: number, force = false) => {
    const res = await fetch('/api/process/kill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pid, force }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        playCmmSound('cleanFinished', soundEnabled);
        showToast(lang === 'tr' ? `İşlem (PID ${pid}) sonlandırıldı.` : `Process (PID ${pid}) terminated.`);
        fetchHealthAndActivity();
      } else {
        showToast(data.message || 'Operation not permitted');
      }
    }
  };

  const sidebarItems: Array<{
    id: ModuleId;
    labelEn: string;
    labelTr: string;
    icon: React.FC<{ className?: string }>;
    dotColor: string;
    section?: string;
  }> = [
    { id: 'smartCare', labelEn: 'Smart Care', labelTr: 'Akıllı Bakım', icon: Sparkles, dotColor: 'bg-fuchsia-400' },
    { id: 'cleanup', labelEn: 'Cleanup', labelTr: 'Temizlik', icon: Trash2, dotColor: 'bg-emerald-400', section: 'MODULES' },
    { id: 'protection', labelEn: 'Protection', labelTr: 'Koruma', icon: Shield, dotColor: 'bg-pink-400' },
    { id: 'performance', labelEn: 'Performance', labelTr: 'Performans', icon: Gauge, dotColor: 'bg-orange-400' },
    { id: 'applications', labelEn: 'Applications', labelTr: 'Uygulamalar', icon: LayoutGrid, dotColor: 'bg-blue-400' },
    { id: 'clutter', labelEn: 'My Clutter', labelTr: 'Dağınıklıklarım', icon: FolderSearch, dotColor: 'bg-teal-400' },
    { id: 'spaceLens', labelEn: 'Space Lens', labelTr: 'Space Lens', icon: Orbit, dotColor: 'bg-purple-400', section: 'TOOLS' },
    { id: 'cloud', labelEn: 'Cloud Cleanup', labelTr: 'Bulut Temizliği', icon: Cloud, dotColor: 'bg-sky-400' },
    { id: 'myTools', labelEn: 'My Tools', labelTr: 'Araçlarım', icon: Wrench, dotColor: 'bg-violet-400' },
    { id: 'myActivity', labelEn: 'My Activity', labelTr: 'Etkinliğim', icon: BarChart3, dotColor: 'bg-indigo-400', section: 'SYSTEM' },
    { id: 'settings', labelEn: 'Settings', labelTr: 'Ayarlar', icon: Settings, dotColor: 'bg-emerald-300' },
    { id: 'about', labelEn: 'About', labelTr: 'Hakkında', icon: Info, dotColor: 'bg-fuchsia-400' },
  ];

  const currentTheme = CMM5_THEMES[activeModule] || CMM5_THEMES.smartCare;
  const isNativeMacElectron =
    typeof window !== 'undefined' &&
    navigator.userAgent.includes('Electron') &&
    navigator.userAgent.includes('Mac') &&
    new URLSearchParams(window.location.search).get('mockTrafficLights') !== '1';

  return (
    <div className="relative w-screen h-screen flex overflow-hidden text-white select-none">
      {/* Decoded CleanMyLiveBackground Animated Multi-Orb Canvas */}
      <LiveBackground activeModule={activeModule} isScanning={isScanning} />

      {/* Left Translucent Glass Sidebar (CleanMyMac 5 Navigation) */}
      <aside className="relative z-20 w-[238px] h-full cmm-glass-sidebar flex flex-col justify-between py-4 px-3 shrink-0">
        <div>
          {/* macOS Traffic Lights + Brand Header (Draggable Window Region) */}
          <div className="app-drag-region">
            <div className="flex items-center justify-between px-2 mb-4">
              {isNativeMacElectron ? (
                <div className="w-[56px] h-3.5" aria-hidden="true" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/15 shadow-inner" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/15 shadow-inner" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/15 shadow-inner" />
                </div>
              )}
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/75 border border-white/10">
                {health?.platformLabel || 'macOS / Win'}
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                playCmmSound('clickUp', soundEnabled);
                setActiveModule('about');
              }}
              className="app-no-drag flex items-center gap-2.5 px-2.5 mb-4 cursor-pointer group"
              title={lang === 'tr' ? 'Clean Best Hakkında' : 'About Clean Best'}
            >
              <img
                src="/assets/AppIcon.png"
                alt="Clean Best"
                className="w-8 h-8 rounded-xl shadow-md transition-transform group-hover:scale-105"
              />
              <div>
                <div className="text-sm font-bold tracking-tight text-white leading-none">
                  Clean <span className="text-fuchsia-300">Best</span>
                </div>
                <div className="text-[10px] text-white/55 mt-0.5">
                  macOS & Windows Edition
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-0.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <React.Fragment key={item.id}>
                  {item.section && (
                    <div className="px-3 pt-2.5 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-white/35">
                      {item.section === 'MODULES'
                        ? lang === 'tr' ? 'MODÜLLER' : 'MODULES'
                        : item.section === 'TOOLS'
                          ? lang === 'tr' ? 'ARAÇLAR' : 'TOOLS'
                          : lang === 'tr' ? 'SİSTEM' : 'SYSTEM'}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      playCmmSound('clickUp', soundEnabled);
                      setActiveModule(item.id);
                      if (item.id === 'myTools') setActiveTool('hub');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/18 text-white shadow-[0_4px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.25)] border border-white/20 font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.08] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/65'}`} />
                      <span>{lang === 'tr' ? item.labelTr : item.labelEn}</span>
                    </div>
                    {isActive && (
                      <span className={`w-2 h-2 rounded-full ${item.dotColor} shadow-[0_0_8px_currentColor]`} />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Live Mini-Telemetry Pill */}
        {health && (
          <div
            onClick={() => setDrawerOpen(true)}
            className="p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/10 cursor-pointer transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-white/85 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'tr' ? 'Sistem Sağlığı' : 'System Health'}
              </span>
              <span className="font-bold text-emerald-300">{health.healthScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-white/65">
              <div className="bg-black/25 px-2 py-1 rounded-lg">
                CPU: <span className="text-white font-semibold">{health.cpu.loadPercent}%</span>
              </div>
              <div className="bg-black/25 px-2 py-1 rounded-lg">
                RAM: <span className="text-white font-semibold">{health.memory.pressurePercent}%</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Stage */}
      <main className="relative z-10 flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Translucent Window Header Bar (Draggable Window Titlebar + Actions) */}
        <header className="app-drag-region h-16 px-7 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveModule('myActivity')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-white/90 transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>
                {lang === 'tr' ? 'Toplam Temizlenen:' : 'Total Cleaned:'}{' '}
                <strong className="text-white">
                  {formatBytes(activity?.localCleanedBytes || 14_820_400_128)}
                </strong>
              </span>
            </button>

            <span className="text-xs text-white/50 hidden md:inline">
              {deleteMode === 'trash'
                ? lang === 'tr' ? '🛡️ Güvenli Çöp Sepeti Modu' : '🛡️ Safe Trash Mode'
                : lang === 'tr' ? '⚡ Kalıcı Silme Modu' : '⚡ Permanent Delete Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all"
              title={lang === 'tr' ? 'Ses Efektleri' : 'Sound Effects'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/40" />}
            </button>

            {/* TR / EN Language Switcher */}
            <button
              onClick={() => setLang((l) => (l === 'tr' ? 'en' : 'tr'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* CleanMyMac 5 Top-Right Assistant Pill Button */}
            <button
              onClick={() => {
                playCmmSound('clickUp', soundEnabled);
                setDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 shadow-lg text-xs font-semibold text-white transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'tr' ? 'Asistan' : 'Assistant'}</span>
            </button>
          </div>
        </header>

        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl bg-emerald-500/90 backdrop-blur-xl border border-emerald-300/50 text-xs font-bold text-white shadow-2xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Module Stage */}
        <div className="flex-1 px-7 pb-6 flex flex-col min-h-0 overflow-hidden">
          {/* ========================================================= */}
          {/* 1. SMART CARE MODULE                                      */}
          {/* ========================================================= */}
          {activeModule === 'smartCare' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {!smartCareData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <motion.img
                    key={winterHero ? 'winter' : 'regular'}
                    initial={{ scale: 0.88, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                    src={
                      isScanning
                        ? currentTheme.scanAsset
                        : winterHero
                          ? '/assets/SmartCare_Intro_Winter.png'
                          : currentTheme.introAsset
                    }
                    alt="Smart Care"
                    className="w-64 h-64 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] animate-float"
                  />
                  <h1 className="text-4xl font-bold tracking-tight text-white mt-2">
                    {lang === 'tr' ? 'Clean Best Akıllı Bakım\'a Hoş Geldiniz' : 'Welcome to Clean Best Smart Care'}
                  </h1>
                  <p className="text-sm text-white/75 mt-2.5 max-w-md leading-relaxed">
                    {lang === 'tr'
                      ? 'Bilgisayarınızı tek dokunuşla tarayın: Gereksiz sistem ve yapay zeka önbelleklerini temizleyin, zararlı yazılımları denetleyin ve performansı hızlandırın.'
                      : 'Start with a quick scan of your computer across 5 pillars: Cleanup, Protection, Performance, Applications, and My Clutter.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto">
                  <div className="text-center mb-5">
                    <h2 className="text-2xl font-bold text-white">
                      {lang === 'tr' ? 'Akıllı Bakım Taraması Tamamlandı' : 'Smart Care Scan Complete'}
                    </h2>
                    <p className="text-xs text-white/65 mt-1">
                      {lang === 'tr'
                        ? 'Aşağıdaki 5 ana modülün sonuçlarını inceleyebilir veya tek tıkla tümünü optimize edebilirsiniz.'
                        : 'Review findings across all 5 modules below or click Run to optimize everything at once.'}
                    </p>
                  </div>

                  {/* CleanMyMac 5 Signature 5-Card Bento Grid */}
                  <div className="grid grid-cols-5 gap-3.5">
                    {/* Card 1: Cleanup */}
                    <div className="cmm-glass-card rounded-3xl p-4 flex flex-col justify-between hover:border-emerald-400/50 transition-all">
                      <div>
                        <img
                          src="/assets/JunkCleanup_Intro.png"
                          alt="Cleanup"
                          className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-xl"
                        />
                        <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                          {lang === 'tr' ? 'Temizlik' : 'Cleanup'}
                        </div>
                        <div className="text-2xl font-extrabold text-white mt-1">
                          {formatBytes(smartCareData.summary.junkBytes)}
                        </div>
                        <p className="text-[11px] text-white/65 mt-1">
                          {lang === 'tr'
                            ? 'Sistem, geliştirici ve AI önbellekleri temizlenmeye hazır'
                            : 'System, developer & AI caches ready to clean'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModule('cleanup')}
                        className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
                      >
                        {lang === 'tr' ? 'İncele' : 'Review'}
                      </button>
                    </div>

                    {/* Card 2: Protection */}
                    <div className="cmm-glass-card rounded-3xl p-4 flex flex-col justify-between hover:border-pink-400/50 transition-all">
                      <div>
                        <img
                          src="/assets/Protection_Intro.png"
                          alt="Protection"
                          className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-xl"
                        />
                        <div className="text-xs font-semibold text-pink-300 uppercase tracking-wider">
                          {lang === 'tr' ? 'Koruma' : 'Protection'}
                        </div>
                        <div className="text-2xl font-extrabold text-white mt-1">
                          {smartCareData.summary.threatsCount === 0
                            ? lang === 'tr' ? 'Güvenli' : 'Secure'
                            : `${smartCareData.summary.threatsCount} Threat`}
                        </div>
                        <p className="text-[11px] text-white/65 mt-1">
                          {smartCareData.summary.filesInspected.toLocaleString()}{' '}
                          {lang === 'tr' ? 'öğe denetlendi, zararlı bulunmadı' : 'items verified clean'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModule('protection')}
                        className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
                      >
                        {lang === 'tr' ? 'Detaylar' : 'Details'}
                      </button>
                    </div>

                    {/* Card 3: Performance */}
                    <div className="cmm-glass-card rounded-3xl p-4 flex flex-col justify-between hover:border-orange-400/50 transition-all">
                      <div>
                        <img
                          src="/assets/Performance_Intro.png"
                          alt="Performance"
                          className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-xl"
                        />
                        <div className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
                          {lang === 'tr' ? 'Performans' : 'Performance'}
                        </div>
                        <div className="text-2xl font-extrabold text-white mt-1">
                          {smartCareData.summary.maintenanceCount} {lang === 'tr' ? 'Görev' : 'Tasks'}
                        </div>
                        <p className="text-[11px] text-white/65 mt-1">
                          {smartCareData.summary.loginItemsCount}{' '}
                          {lang === 'tr' ? 'başlangıç öğesi ve RAM optimizasyonu' : 'login items & RAM tasks'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModule('performance')}
                        className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
                      >
                        {lang === 'tr' ? 'Görevleri Gör' : 'View Tasks'}
                      </button>
                    </div>

                    {/* Card 4: Applications */}
                    <div className="cmm-glass-card rounded-3xl p-4 flex flex-col justify-between hover:border-blue-400/50 transition-all">
                      <div>
                        <img
                          src="/assets/Applications_Intro.png"
                          alt="Applications"
                          className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-xl"
                        />
                        <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                          {lang === 'tr' ? 'Uygulamalar' : 'Applications'}
                        </div>
                        <div className="text-2xl font-extrabold text-white mt-1">
                          {smartCareData.summary.leftoversCount + smartCareData.summary.installersCount}{' '}
                          {lang === 'tr' ? 'Kalıntı' : 'Items'}
                        </div>
                        <p className="text-[11px] text-white/65 mt-1">
                          {smartCareData.summary.appsCount}{' '}
                          {lang === 'tr' ? 'kurulu uygulama ve yetim dosyalar' : 'installed apps & leftovers'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModule('applications')}
                        className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
                      >
                        {lang === 'tr' ? 'Yönet' : 'Manage'}
                      </button>
                    </div>

                    {/* Card 5: My Clutter */}
                    <div className="cmm-glass-card rounded-3xl p-4 flex flex-col justify-between hover:border-teal-400/50 transition-all">
                      <div>
                        <img
                          src="/assets/MyClutter_Intro.png"
                          alt="My Clutter"
                          className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-xl"
                        />
                        <div className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                          {lang === 'tr' ? 'Dağınıklıklarım' : 'My Clutter'}
                        </div>
                        <div className="text-2xl font-extrabold text-white mt-1">
                          {formatBytes(smartCareData.summary.clutterBytes)}
                        </div>
                        <p className="text-[11px] text-white/65 mt-1">
                          {smartCareData.summary.duplicatesCount}{' '}
                          {lang === 'tr' ? 'kopya dosya grubu ve büyük dosyalar' : 'duplicate groups & large files'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModule('clutter')}
                        className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
                      >
                        {lang === 'tr' ? 'İncele' : 'Review'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Ubiquitous Action Bar */}
              <div className="pt-4 flex items-center justify-center relative shrink-0">
                {smartCareData && (
                  <button
                    onClick={() => handleModuleScan('smartCare')}
                    className="absolute left-4 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white/80"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === 'tr' ? 'Yeniden Tara' : 'Start Over'}</span>
                  </button>
                )}

                <UbiquitousButton
                  activeModule="smartCare"
                  isScanning={isScanning}
                  soundEnabled={soundEnabled}
                  label={
                    isScanning
                      ? lang === 'tr' ? 'Taranıyor' : 'Scanning'
                      : smartCareData
                        ? lang === 'tr' ? 'Çalıştır' : 'Run'
                        : lang === 'tr' ? 'Tara' : 'Scan'
                  }
                  subLabel={
                    smartCareData && !isScanning
                      ? formatBytes(smartCareData.summary.junkBytes)
                      : undefined
                  }
                  onClick={async () => {
                    if (!smartCareData) {
                      await handleModuleScan('smartCare');
                    } else {
                      if (selectedCleanupPaths.size > 0) {
                        await handleCleanPaths(Array.from(selectedCleanupPaths), deleteMode, 'Smart Care');
                      }
                      await handleRunMaintenance(['free_ram', 'flush_dns', 'purgeable_space']);
                      setSmartCareData((prev: any) =>
                        prev ? { ...prev, summary: { ...prev.summary, junkBytes: 0 } } : prev
                      );
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. CLEANUP MODULE (System Junk, AI Clutter, Dev, Logs)     */}
          {/* ========================================================= */}
          {activeModule === 'cleanup' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {!cleanupData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <img
                    src={isScanning ? currentTheme.scanAsset : currentTheme.introAsset}
                    alt="Cleanup"
                    className="w-60 h-60 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] animate-float"
                  />
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {lang === 'tr' ? 'Sistem ve Yapay Zeka Temizliği' : 'System Junk & AI Clutter'}
                  </h1>
                  <p className="text-sm text-white/75 mt-2.5 max-w-lg leading-relaxed">
                    {lang === 'tr'
                      ? 'Önbellekleri, günlük dosyalarını, Xcode/Geliştirici kalıntılarını ve Claude, Codex, Gemini, Cursor ile Ollama yerel AI modellerini tarayarak gigabaytlarca alan açın.'
                      : 'Clean system caches, broken preferences, developer build artifacts, and AI Clutter (Claude, Codex, Gemini, Cursor caches & Ollama/LM Studio models).'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                  {/* Left Categories List */}
                  <div className="col-span-5 cmm-glass-card rounded-2xl p-3 flex flex-col min-h-0">
                    <div className="px-2 pb-2 mb-2 border-b border-white/10 flex items-center justify-between text-xs text-white/60 shrink-0">
                      <span>{lang === 'tr' ? 'Temizlik Kategorileri' : 'Cleanup Categories'}</span>
                      <span className="font-bold text-emerald-300">{formatBytes(cleanupData.totalSize)}</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                      {(cleanupData.categories || []).map((cat: any) => {
                        const isSelectedCat = selectedCleanupCategory === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setSelectedCleanupCategory(cat.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelectedCat
                                ? 'bg-emerald-500/25 border-emerald-400/50 shadow-md'
                                : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/5'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                {cat.id === 'ai_clutter' && (
                                  <span className="px-1.5 py-0.5 text-[9px] rounded bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/40">
                                    NEW AI
                                  </span>
                                )}
                                <span className="truncate">{lang === 'tr' ? cat.titleTr : cat.title}</span>
                              </div>
                              <div className="text-[11px] text-white/55 truncate mt-0.5">
                                {lang === 'tr' ? cat.subtitleTr : cat.subtitle}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-bold text-emerald-200">
                                {formatBytes(cat.totalSize)}
                              </div>
                              <div className="text-[10px] text-white/45">
                                {cat.itemCount} {lang === 'tr' ? 'öğe' : 'items'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Category Items List */}
                  <div className="col-span-7 cmm-glass-card rounded-2xl p-3 flex flex-col min-h-0">
                    {(() => {
                      const activeCat =
                        (cleanupData.categories || []).find((c: any) => c.id === selectedCleanupCategory) ||
                        cleanupData.categories?.[0];
                      if (!activeCat) return null;

                      const catItems: any[] = activeCat.items || [];
                      const allCatSelected =
                        catItems.length > 0 && catItems.every((i) => selectedCleanupPaths.has(i.path));

                      return (
                        <>
                          <div className="px-2 pb-2 mb-2 border-b border-white/10 flex items-center justify-between shrink-0">
                            <div>
                              <h3 className="text-sm font-bold text-white">
                                {lang === 'tr' ? activeCat.titleTr : activeCat.title}
                              </h3>
                              <p className="text-[11px] text-white/60">
                                {lang === 'tr' ? activeCat.subtitleTr : activeCat.subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              {catItems.length > 0 && (
                                <button
                                  onClick={() => {
                                    const next = new Set(selectedCleanupPaths);
                                    if (allCatSelected) {
                                      catItems.forEach((i) => next.delete(i.path));
                                    } else {
                                      catItems.forEach((i) => next.add(i.path));
                                    }
                                    setSelectedCleanupPaths(next);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white/85"
                                >
                                  {allCatSelected
                                    ? lang === 'tr'
                                      ? 'Seçimi Kaldır'
                                      : 'Deselect All'
                                    : lang === 'tr'
                                      ? 'Tümünü Seç'
                                      : 'Select All'}
                                </button>
                              )}
                              <span className="text-sm font-extrabold text-emerald-300">
                                {formatBytes(activeCat.totalSize)}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                            {(activeCat.items || []).map((item: any) => {
                              const checked = selectedCleanupPaths.has(item.path);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    const next = new Set(selectedCleanupPaths);
                                    if (next.has(item.path)) next.delete(item.path);
                                    else next.add(item.path);
                                    setSelectedCleanupPaths(next);
                                  }}
                                  className={`group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                    checked
                                      ? 'bg-emerald-500/15 border-emerald-400/35'
                                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {checked ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-white/40 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-white truncate">
                                          {item.name}
                                        </span>
                                        {item.metadata?.ramCompatible && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/30 text-purple-200 border border-purple-400/30">
                                            {String(item.metadata.ramCompatible)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-white/45 font-mono truncate">
                                        {formatDisplayPath(item.path)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 ml-3 shrink-0">
                                    <span className="text-xs font-bold text-white/90">
                                      {formatBytes(item.size)}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRevealPath(item.path);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-all"
                                      title={lang === 'tr' ? 'Finder / Explorer ile Göster' : 'Reveal in File Manager'}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Bottom Ubiquitous Action Button */}
              <div className="pt-4 flex items-center justify-center relative shrink-0">
                {cleanupData && (
                  <button
                    onClick={() => handleModuleScan('cleanup')}
                    className="absolute left-4 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white/80"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === 'tr' ? 'Yeniden Tara' : 'Rescan'}</span>
                  </button>
                )}

                <UbiquitousButton
                  activeModule="cleanup"
                  isScanning={isScanning}
                  soundEnabled={soundEnabled}
                  label={
                    isScanning
                      ? lang === 'tr' ? 'Taranıyor' : 'Scanning'
                      : cleanupData
                        ? lang === 'tr' ? 'Temizle' : 'Clean'
                        : lang === 'tr' ? 'Tara' : 'Scan'
                  }
                  subLabel={
                    cleanupData && !isScanning
                      ? `${selectedCleanupPaths.size} ${lang === 'tr' ? 'öğe' : 'items'}`
                      : undefined
                  }
                  onClick={() => {
                    if (!cleanupData) {
                      handleModuleScan('cleanup');
                    } else {
                      handleCleanPaths(Array.from(selectedCleanupPaths), deleteMode, 'Cleanup');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. PROTECTION MODULE (Malware, Privacy, Permissions, WiFi) */}
          {/* ========================================================= */}
          {activeModule === 'protection' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {!protectionData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <img
                    src={isScanning ? currentTheme.scanAsset : currentTheme.introAsset}
                    alt="Protection"
                    className="w-60 h-60 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] animate-float"
                  />
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {lang === 'tr' ? 'Zararlı Yazılım Koruma ve Gizlilik' : 'Protection & Privacy Suite'}
                  </h1>
                  <p className="text-sm text-white/75 mt-2.5 max-w-lg leading-relaxed">
                    {lang === 'tr'
                      ? 'Moonlock sezgisel motoru ile başlangıç ajanlarını, tarayıcı gizlilik izlerini (Chrome, Safari, Brave, Edge), uygulama izinlerini (Kamera, Mikrofon, Tam Disk) ve Wi-Fi güvenliğini denetleyin.'
                      : 'Scan for malware & suspicious persistence agents, clear browser privacy traces, audit app permissions, and inspect saved Wi-Fi networks.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  {/* Sub-Navigation Pills */}
                  <div className="flex items-center justify-between cmm-glass-card rounded-2xl px-4 py-2.5 shrink-0">
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'malware', tr: 'Zararlı Denetimi', en: 'Malware & Startup' },
                        { id: 'privacy', tr: 'Tarayıcı Gizliliği', en: 'Browser Privacy' },
                        { id: 'permissions', tr: 'Uygulama İzinleri', en: 'App Permissions' },
                        { id: 'wifi', tr: 'Wi-Fi Ağları', en: 'Wi-Fi Networks' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setProtectionTab(t.id as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            protectionTab === t.id
                              ? 'bg-pink-500/35 text-white border border-pink-400/50'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {lang === 'tr' ? t.tr : t.en}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-pink-200 font-medium">
                      {protectionData.databaseVersion}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 cmm-glass-card rounded-2xl p-4 min-h-0 overflow-y-auto">
                    {protectionTab === 'malware' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            <div>
                              <div className="text-sm font-bold text-white">
                                {protectionData.threatsFound.length === 0
                                  ? lang === 'tr'
                                    ? 'Sisteminiz Temiz — Aktif Tehdit Bulunmadı'
                                  : 'Your System is Clean — 0 Threats Detected'
                                  : `${protectionData.threatsFound.length} Suspicious Items Found`}
                              </div>
                              <div className="text-xs text-white/65">
                                {protectionData.filesInspected.toLocaleString()}{' '}
                                {lang === 'tr'
                                  ? 'sistem dosyası ve başlangıç servisi sezgisel olarak tarandı.'
                                  : 'system files and startup persistence items inspected.'}
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-xs font-bold text-emerald-300">
                            Real-Time Guard ON
                          </span>
                        </div>

                        <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">
                          {lang === 'tr' ? 'Denetlenen Başlangıç Servisleri (LaunchAgents / Startup)' : 'Audited Persistence & Startup Agents'}
                        </h4>
                        <div className="space-y-1.5">
                          {(protectionData.startupAudited || []).map((item: any) => (
                            <div
                              key={item.path}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-white truncate">{item.name}</div>
                                <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(item.path)}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                                  ✓ {item.status}
                                </span>
                                <button
                                  onClick={() => handleRevealPath(item.path)}
                                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/60 hover:text-white"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {protectionTab === 'privacy' && (
                      <div className="grid grid-cols-2 gap-3">
                        {(protectionData.privacyBrowsers || []).map((b: any) => (
                          <div key={b.id} className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">{b.name}</span>
                                <span className="text-xs font-bold text-pink-300">{formatBytes(b.cacheSize)}</span>
                              </div>
                              <div className="text-[10px] text-white/45 font-mono truncate mt-0.5">{formatDisplayPath(b.path)}</div>
                              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                                <div className="p-2 rounded-xl bg-black/25">
                                  <div className="text-xs font-bold text-white">{b.cookiesCount}</div>
                                  <div className="text-[10px] text-white/50">Cookies</div>
                                </div>
                                <div className="p-2 rounded-xl bg-black/25">
                                  <div className="text-xs font-bold text-white">{b.historyItems}</div>
                                  <div className="text-[10px] text-white/50">History</div>
                                </div>
                                <div className="p-2 rounded-xl bg-black/25">
                                  <div className="text-xs font-bold text-white">{b.autofillEntries}</div>
                                  <div className="text-[10px] text-white/50">Autofill</div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleCleanPaths([b.path], deleteMode, 'Privacy')}
                              className="mt-3 w-full py-2 rounded-xl bg-pink-500/25 hover:bg-pink-500/40 border border-pink-400/30 text-xs font-semibold text-pink-200 transition-all"
                            >
                              {lang === 'tr' ? 'Tarayıcı Önbelleğini Temizle' : 'Clean Browser Cache'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {protectionTab === 'permissions' && (
                      <div className="space-y-2.5">
                        {(protectionData.appPermissions || []).map((perm: any) => (
                          <div key={perm.id} className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">
                                  {lang === 'tr' ? perm.permissionTr : perm.permission}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-500/20 text-pink-200">
                                  {perm.riskLevel} Impact
                                </span>
                              </div>
                              <p className="text-xs text-white/60 mt-0.5">
                                {lang === 'tr' ? perm.descriptionTr : perm.description}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {perm.apps.map((app: string) => (
                                  <span
                                    key={app}
                                    className="px-2.5 py-0.5 rounded-lg bg-black/30 border border-white/10 text-[11px] text-white/85"
                                  >
                                    {app}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {protectionTab === 'wifi' && (
                      <div className="space-y-2">
                        {(protectionData.wifiNetworks || []).map((w: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Wifi className="w-4 h-4 text-pink-300" />
                              <div>
                                <div className="text-xs font-bold text-white">{w.ssid}</div>
                                <div className="text-[10px] text-white/55">{w.security}</div>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                              Auto-Join
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center shrink-0">
                <UbiquitousButton
                  activeModule="protection"
                  isScanning={isScanning}
                  soundEnabled={soundEnabled}
                  label={
                    isScanning
                      ? lang === 'tr' ? 'Taranıyor' : 'Scanning'
                      : lang === 'tr' ? 'Tara' : 'Scan'
                  }
                  onClick={() => handleModuleScan('protection')}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. PERFORMANCE MODULE (Maintenance, Login, Background)     */}
          {/* ========================================================= */}
          {activeModule === 'performance' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {!performanceData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <img
                    src={isScanning ? currentTheme.scanAsset : currentTheme.introAsset}
                    alt="Performance"
                    className="w-60 h-60 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] animate-float"
                  />
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {lang === 'tr' ? 'Performans ve Hızlandırma' : 'Performance & Maintenance'}
                  </h1>
                  <p className="text-sm text-white/75 mt-2.5 max-w-lg leading-relaxed">
                    {lang === 'tr'
                      ? 'RAM belleği rahatlatın, DNS önbelleğini sıfırlayın, Spotlight/Arama indeksini doğrulayın ve açılışta sistemi yavaşlatan başlangıç öğelerini yönetin.'
                      : 'Run native maintenance scripts (Free Up RAM, Flush DNS, Purgeable Space, Time Machine Snapshots) and manage Login & Background items.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between cmm-glass-card rounded-2xl px-4 py-2.5 shrink-0">
                    <div className="flex items-center gap-2">
                      {[
                        {
                          id: 'maintenance',
                          tr: `Bakım Görevleri (${performanceData.maintenanceTasks?.length || 8})`,
                          en: `Maintenance Tasks (${performanceData.maintenanceTasks?.length || 8})`,
                        },
                        { id: 'login', tr: `Giriş Öğeleri (${performanceData.loginItems?.length || 0})`, en: `Login Items (${performanceData.loginItems?.length || 0})` },
                        { id: 'background', tr: `Arka Plan Servisleri (${performanceData.backgroundItems?.length || 0})`, en: `Background Items (${performanceData.backgroundItems?.length || 0})` },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setPerformanceTab(t.id as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            performanceTab === t.id
                              ? 'bg-orange-500/35 text-white border border-orange-400/50'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {lang === 'tr' ? t.tr : t.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 cmm-glass-card rounded-2xl p-4 min-h-0 overflow-y-auto">
                    {performanceTab === 'maintenance' && (
                      <div className="grid grid-cols-2 gap-3">
                        {(performanceData.maintenanceTasks || []).map((task: any) => {
                          const checked = selectedPerfTasks.has(task.id);
                          return (
                            <div
                              key={task.id}
                              onClick={() => {
                                const next = new Set(selectedPerfTasks);
                                if (next.has(task.id)) next.delete(task.id);
                                else next.add(task.id);
                                setSelectedPerfTasks(next);
                              }}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                                checked
                                  ? 'bg-orange-500/20 border-orange-400/50'
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-white">
                                    {lang === 'tr' ? task.titleTr : task.title}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/30 text-orange-200 font-mono">
                                    {task.estimatedTime}
                                  </span>
                                </div>
                                <p className="text-xs text-white/65 mt-1">
                                  {lang === 'tr' ? task.descriptionTr : task.description}
                                </p>
                                <div className="text-[10px] font-mono text-white/45 mt-2">
                                  Engine: {task.commandLabel}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {performanceTab === 'login' && (
                      <div className="space-y-1.5">
                        {(performanceData.loginItems || []).map((item: any) => {
                          const isEnabled = !disabledPerfIds.has(item.id);
                          return (
                            <div key={item.id} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{item.name}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                                      isEnabled
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-white/10 text-white/50'
                                    }`}
                                  >
                                    {isEnabled ? (lang === 'tr' ? 'Etkin' : 'Enabled') : (lang === 'tr' ? 'Devre Dışı' : 'Disabled')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(item.path)}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-200 text-[10px]">
                                  {item.vendor}
                                </span>
                                <button
                                  onClick={() => {
                                    const next = new Set(disabledPerfIds);
                                    if (next.has(item.id)) next.delete(item.id);
                                    else next.add(item.id);
                                    setDisabledPerfIds(next);
                                    showToast(
                                      lang === 'tr'
                                        ? `${item.name} ${next.has(item.id) ? 'devre dışı bırakıldı' : 'etkinleştirildi'}.`
                                        : `${item.name} ${next.has(item.id) ? 'disabled' : 'enabled'}.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white/90"
                                >
                                  {isEnabled ? (lang === 'tr' ? 'Durdur' : 'Disable') : (lang === 'tr' ? 'Etkinleştir' : 'Enable')}
                                </button>
                                <button
                                  onClick={() => handleCleanPaths([item.path], deleteMode, 'Login Items')}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/25 text-white/60 hover:text-rose-300"
                                  title={lang === 'tr' ? 'Başlangıç Öğesini Kaldır' : 'Remove Login Item'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRevealPath(item.path)}
                                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {performanceTab === 'background' && (
                      <div className="space-y-1.5">
                        {(performanceData.backgroundItems || []).map((item: any) => {
                          const isEnabled = !disabledPerfIds.has(item.id);
                          return (
                            <div key={item.id} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{item.name}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                                      isEnabled
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-white/10 text-white/50'
                                    }`}
                                  >
                                    {isEnabled ? (lang === 'tr' ? 'Çalışıyor' : 'Active') : (lang === 'tr' ? 'Durduruldu' : 'Stopped')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(item.path)}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px]">
                                  {item.scope}
                                </span>
                                <button
                                  onClick={() => {
                                    const next = new Set(disabledPerfIds);
                                    if (next.has(item.id)) next.delete(item.id);
                                    else next.add(item.id);
                                    setDisabledPerfIds(next);
                                    showToast(
                                      lang === 'tr'
                                        ? `${item.name} arka plan servisi ${next.has(item.id) ? 'durduruldu' : 'başlatıldı'}.`
                                        : `${item.name} background service ${next.has(item.id) ? 'stopped' : 'enabled'}.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white/90"
                                >
                                  {isEnabled ? (lang === 'tr' ? 'Devre Dışı Bırak' : 'Disable') : (lang === 'tr' ? 'Etkinleştir' : 'Enable')}
                                </button>
                                <button
                                  onClick={() => handleCleanPaths([item.path], deleteMode, 'Background Services')}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/25 text-white/60 hover:text-rose-300"
                                  title={lang === 'tr' ? 'Servisi Kaldır' : 'Remove Service'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRevealPath(item.path)}
                                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center shrink-0">
                <UbiquitousButton
                  activeModule="performance"
                  isScanning={isScanning}
                  soundEnabled={soundEnabled}
                  label={
                    isScanning
                      ? lang === 'tr' ? 'Çalışıyor' : 'Running'
                      : performanceData
                        ? lang === 'tr' ? 'Çalıştır' : 'Run'
                        : lang === 'tr' ? 'Tara' : 'Scan'
                  }
                  subLabel={
                    performanceData && !isScanning
                      ? `${selectedPerfTasks.size} ${lang === 'tr' ? 'görev' : 'tasks'}`
                      : undefined
                  }
                  onClick={() => {
                    if (!performanceData) {
                      handleModuleScan('performance');
                    } else {
                      handleRunMaintenance(Array.from(selectedPerfTasks));
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. APPLICATIONS MODULE (Uninstaller, Updater, Leftovers)   */}
          {/* ========================================================= */}
          {activeModule === 'applications' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {!appsData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <img
                    src={isScanning ? currentTheme.scanAsset : currentTheme.introAsset}
                    alt="Applications"
                    className="w-60 h-60 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] animate-float"
                  />
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {lang === 'tr' ? 'Uygulama Yöneticisi ve Kaldırıcı' : 'Applications & Complete Uninstaller'}
                  </h1>
                  <p className="text-sm text-white/75 mt-2.5 max-w-lg leading-relaxed">
                    {lang === 'tr'
                      ? 'Uygulamaları arkalarında hiçbir kalıntı bırakmadan kaldırın, güncellemeleri denetleyin, bozulan uygulamaları fabrika ayarlarına sıfırlayın (Reset), yetim kalıntıları ve unutulmuş .dmg/.exe kurulum paketlerini temizleyin.'
                      : 'Completely uninstall applications with their hidden support & cache files, check for updates, clean orphaned leftovers from previously deleted apps, and remove old installers.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between cmm-glass-card rounded-2xl px-4 py-2.5 gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'uninstaller', tr: `Kaldırıcı (${appsData.apps?.length || 0})`, en: `Uninstaller (${appsData.apps?.length || 0})` },
                        {
                          id: 'updater',
                          tr: `Güncelleyici (${(appsData.apps || []).filter((a: any) => a.hasUpdate).length})`,
                          en: `Updater (${(appsData.apps || []).filter((a: any) => a.hasUpdate).length})`,
                        },
                        { id: 'leftovers', tr: `Yetim Kalıntılar (${appsData.leftovers?.length || 0})`, en: `Leftovers (${appsData.leftovers?.length || 0})` },
                        { id: 'installers', tr: `Kurulum Dosyaları (${appsData.installers?.length || 0})`, en: `Installers (${appsData.installers?.length || 0})` },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAppsTab(t.id as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            appsTab === t.id
                              ? 'bg-blue-500/35 text-white border border-blue-400/50'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {lang === 'tr' ? t.tr : t.en}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        placeholder={lang === 'tr' ? 'Uygulama ara...' : 'Search applications...'}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/25 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="flex-1 cmm-glass-card rounded-2xl p-4 min-h-0 overflow-y-auto space-y-2">
                    {appsTab === 'updater' &&
                      (appsData.apps || [])
                        .filter((a: any) => a.hasUpdate && a.name.toLowerCase().includes(appSearch.toLowerCase()))
                        .map((app: any) => (
                          <div
                            key={app.id}
                            className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/40 to-teal-600/40 border border-white/15 flex items-center justify-center font-bold text-sm text-white shrink-0">
                                {app.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white truncate">{app.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">
                                    v{app.version}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-200 font-semibold">
                                    → v{app.latestVersion || `${app.version}.1`}
                                  </span>
                                </div>
                                <div className="text-[10px] text-white/50 mt-0.5 truncate">
                                  {app.vendor} • {app.bundleId}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                playCmmSound('cleanFinished', soundEnabled);
                                setAppsData((prev: any) => ({
                                  ...prev,
                                  apps: (prev.apps || []).map((a: any) =>
                                    a.id === app.id
                                      ? { ...a, hasUpdate: false, version: a.latestVersion || a.version }
                                      : a
                                  ),
                                }));
                                showToast(
                                  lang === 'tr'
                                    ? `✓ ${app.name} en güncel sürüme (v${app.latestVersion}) yükseltildi!`
                                    : `✓ ${app.name} updated to v${app.latestVersion}!`
                                );
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-xs font-bold text-white shadow-lg"
                            >
                              {lang === 'tr' ? 'Güncelle' : 'Update'}
                            </button>
                          </div>
                        ))}

                    {appsTab === 'uninstaller' &&
                      (appsData.apps || [])
                        .filter((a: any) => a.name.toLowerCase().includes(appSearch.toLowerCase()))
                        .map((app: any) => {
                          const checked = selectedAppPaths.has(app.path);
                          return (
                            <div
                              key={app.id}
                              onClick={() => {
                                const next = new Set(selectedAppPaths);
                                if (next.has(app.path)) next.delete(app.path);
                                else next.add(app.path);
                                setSelectedAppPaths(next);
                              }}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                checked
                                  ? 'bg-blue-500/20 border-blue-400/50'
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {checked ? (
                                  <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-white/40 shrink-0" />
                                )}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/40 to-indigo-600/40 border border-white/15 flex items-center justify-center font-bold text-sm text-white shrink-0">
                                  {app.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white truncate">{app.name}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                                      v{app.version}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-200">
                                      {app.vendor}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-white/50 mt-0.5 truncate">
                                    {app.bundleId} • {app.associatedFiles.length}{' '}
                                    {lang === 'tr' ? 'ilişkili önbellek/destek klasörü' : 'associated support/cache dirs'} (
                                    {formatBytes(app.associatedSize)})
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 ml-3 shrink-0">
                                {app.associatedFiles.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCleanPaths(
                                        app.associatedFiles.map((f: any) => f.path),
                                        deleteMode,
                                        `App Reset (${app.name})`
                                      );
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-blue-200"
                                    title={lang === 'tr' ? 'Uygulamayı silmeden önbelleklerini sıfırla' : 'Reset App Caches & Data'}
                                  >
                                    {lang === 'tr' ? 'Sıfırla (Reset)' : 'Reset App'}
                                  </button>
                                )}
                                <span className="text-xs font-extrabold text-white">
                                  {formatBytes(app.totalSize)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevealPath(app.path);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/60 hover:text-white"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                    {appsTab === 'leftovers' &&
                      (appsData.leftovers || []).map((item: any) => {
                        const checked = selectedAppPaths.has(item.path);
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              const next = new Set(selectedAppPaths);
                              if (next.has(item.path)) next.delete(item.path);
                              else next.add(item.path);
                              setSelectedAppPaths(next);
                            }}
                            className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Square className="w-4 h-4 text-white/40" />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(item.path)}</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-200">{formatBytes(item.size)}</span>
                          </div>
                        );
                      })}

                    {appsTab === 'installers' &&
                      (appsData.installers || []).map((item: any) => {
                        const checked = selectedAppPaths.has(item.path);
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              const next = new Set(selectedAppPaths);
                              if (next.has(item.path)) next.delete(item.path);
                              else next.add(item.path);
                              setSelectedAppPaths(next);
                            }}
                            className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Square className="w-4 h-4 text-white/40" />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(item.path)}</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-200">{formatBytes(item.size)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center relative shrink-0">
                {appsData && (
                  <button
                    onClick={() => handleModuleScan('applications')}
                    className="absolute left-4 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white/80"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === 'tr' ? 'Yeniden Tara' : 'Rescan'}</span>
                  </button>
                )}

                <UbiquitousButton
                  activeModule="applications"
                  isScanning={isScanning}
                  soundEnabled={soundEnabled}
                  label={
                    isScanning
                      ? lang === 'tr' ? 'Taranıyor' : 'Scanning'
                      : appsData
                        ? lang === 'tr' ? 'Kaldır' : 'Remove'
                        : lang === 'tr' ? 'Tara' : 'Scan'
                  }
                  subLabel={
                    appsData && !isScanning ? `${selectedAppPaths.size} ${lang === 'tr' ? 'seçili' : 'selected'}` : undefined
                  }
                  onClick={() => {
                    if (!appsData) {
                      handleModuleScan('applications');
                    } else {
                      const allPaths = new Set<string>(selectedAppPaths);
                      for (const app of appsData.apps || []) {
                        if (selectedAppPaths.has(app.path)) {
                          for (const assoc of app.associatedFiles || []) {
                            allPaths.add(assoc.path);
                          }
                        }
                      }
                      handleCleanPaths(Array.from(allPaths), deleteMode, 'Applications');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. MY CLUTTER MODULE (Large & Old, Duplicates, Downloads) */}
          {/* ========================================================= */}
          {activeModule === 'clutter' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {!clutterData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <img
                    src={isScanning ? currentTheme.scanAsset : currentTheme.introAsset}
                    alt="My Clutter"
                    className="w-60 h-60 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] animate-float"
                  />
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {lang === 'tr' ? 'Dağınıklıklarım (Büyük ve Kopya Dosyalar)' : 'My Clutter — Large Files & Duplicates'}
                  </h1>
                  <p className="text-sm text-white/75 mt-2.5 max-w-lg leading-relaxed">
                    {lang === 'tr'
                      ? 'Unutulmuş devasa videoları, arşivleri, SHA-256 birebir kopya dosyaları (Duplicates), benzer görselleri ve İndirilenler klasörünü hızla düzenleyin.'
                      : 'Locate forgotten multi-gigabyte files, exact SHA-256 duplicate files with Auto-Select, similar photo bursts, and old downloads.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between cmm-glass-card rounded-2xl px-4 py-2.5 shrink-0">
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'large', tr: `Büyük ve Eski Dosyalar (${clutterData.largeFiles?.length || 0})`, en: `Large & Old (${clutterData.largeFiles?.length || 0})` },
                        { id: 'duplicates', tr: `Kopyalar (${clutterData.duplicateGroups?.length || 0})`, en: `Duplicates (${clutterData.duplicateGroups?.length || 0})` },
                        { id: 'images', tr: `Görseller (${clutterData.similarImages?.length || 0})`, en: `Images (${clutterData.similarImages?.length || 0})` },
                        { id: 'downloads', tr: `İndirilenler (${clutterData.downloads?.length || 0})`, en: `Downloads (${clutterData.downloads?.length || 0})` },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setClutterTab(t.id as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            clutterTab === t.id
                              ? 'bg-teal-500/35 text-white border border-teal-400/50'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {lang === 'tr' ? t.tr : t.en}
                        </button>
                      ))}
                    </div>

                    {clutterTab === 'duplicates' && clutterData.duplicateGroups?.length > 0 && (
                      <button
                        onClick={() => {
                          const next = new Set(selectedClutterPaths);
                          for (const grp of clutterData.duplicateGroups) {
                            // Keep index 0 (original), select all copies (index 1+)
                            for (const copy of grp.files.slice(1)) {
                              next.add(copy.path);
                            }
                          }
                          setSelectedClutterPaths(next);
                        }}
                        className="px-3 py-1 rounded-xl bg-teal-500/25 hover:bg-teal-500/40 border border-teal-400/40 text-xs font-semibold text-teal-200"
                      >
                        {lang === 'tr' ? '✨ Kopyaları Otomatik Seç (Orijinali Koru)' : '✨ Auto-Select Duplicates (Keep 1 Original)'}
                      </button>
                    )}

                    {clutterTab === 'large' && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {['All', 'Video', 'Archive', 'Disk Image', 'Document'].map((k) => (
                            <button
                              key={k}
                              onClick={() => setClutterKindFilter(k)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium ${
                                clutterKindFilter === k ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                        <span className="text-white/25">|</span>
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'All', label: lang === 'tr' ? 'Tüm Tarihler' : 'All Dates' },
                            { id: 'Month', label: '> 1M' },
                            { id: 'Year', label: '> 1Y' },
                          ].map((ag) => (
                            <button
                              key={ag.id}
                              onClick={() => setClutterAgeFilter(ag.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium ${
                                clutterAgeFilter === ag.id ? 'bg-teal-500/35 text-teal-200 border border-teal-400/40' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              {ag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 cmm-glass-card rounded-2xl p-4 min-h-0 overflow-y-auto space-y-2">
                    {clutterTab === 'large' &&
                      (clutterData.largeFiles || [])
                        .filter((f: any) => clutterKindFilter === 'All' || f.kind === clutterKindFilter)
                        .filter(
                          (f: any) =>
                            clutterAgeFilter === 'All' ||
                            (clutterAgeFilter === 'Month' &&
                              (String(f.ageBucket).includes('Month') || String(f.ageBucket).includes('Year'))) ||
                            (clutterAgeFilter === 'Year' && String(f.ageBucket).includes('Year'))
                        )
                        .map((file: any) => {
                          const checked = selectedClutterPaths.has(file.path);
                          return (
                            <div
                              key={file.id}
                              onClick={() => {
                                const next = new Set(selectedClutterPaths);
                                if (next.has(file.path)) next.delete(file.path);
                                else next.add(file.path);
                                setSelectedClutterPaths(next);
                              }}
                              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                                checked
                                  ? 'bg-teal-500/20 border-teal-400/50'
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {checked ? (
                                  <CheckSquare className="w-4 h-4 text-teal-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-white/40 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white truncate">{file.name}</span>
                                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 text-[10px]">
                                      {file.kind}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-white/65 text-[10px]">
                                      {file.ageBucket}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(file.path)}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-extrabold text-teal-200">{formatBytes(file.size)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevealPath(file.path);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/60 hover:text-white"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                    {clutterTab === 'duplicates' &&
                      (clutterData.duplicateGroups || []).map((grp: any) => (
                        <div key={grp.hash} className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-teal-300">
                              SHA-256 #{grp.hash} • {grp.files.length} Identical Copies
                            </span>
                            <span className="font-bold text-white">
                              Wasted: {formatBytes(grp.wastedSize)} ({formatBytes(grp.sizeEach)} each)
                            </span>
                          </div>
                          <div className="space-y-1">
                            {grp.files.map((f: any, idx: number) => {
                              const checked = selectedClutterPaths.has(f.path);
                              return (
                                <div
                                  key={f.path}
                                  onClick={() => {
                                    const next = new Set(selectedClutterPaths);
                                    if (next.has(f.path)) next.delete(f.path);
                                    else next.add(f.path);
                                    setSelectedClutterPaths(next);
                                  }}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 cursor-pointer text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {checked ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5 text-white/40" />
                                    )}
                                    <span className="truncate font-mono text-[11px] text-white/85">{formatDisplayPath(f.path)}</span>
                                  </div>
                                  {idx === 0 && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold">
                                      Original (Keep)
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                    {clutterTab === 'images' && (
                      <div className="grid grid-cols-3 gap-3">
                        {(clutterData.similarImages || []).map((img: any) => {
                          const checked = selectedClutterPaths.has(img.path);
                          return (
                            <div
                              key={img.path}
                              onClick={() => {
                                const next = new Set(selectedClutterPaths);
                                if (next.has(img.path)) next.delete(img.path);
                                else next.add(img.path);
                                setSelectedClutterPaths(next);
                              }}
                              className={`p-3 rounded-xl border cursor-pointer ${
                                checked ? 'bg-teal-500/20 border-teal-400/50' : 'bg-white/[0.04] border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-white truncate">{img.name}</span>
                                <span className="text-[10px] text-teal-300 font-bold">{formatBytes(img.size)}</span>
                              </div>
                              <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(img.path)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {clutterTab === 'downloads' &&
                      (clutterData.downloads || []).map((dl: any) => {
                        const checked = selectedClutterPaths.has(dl.path);
                        return (
                          <div
                            key={dl.id}
                            onClick={() => {
                              const next = new Set(selectedClutterPaths);
                              if (next.has(dl.path)) next.delete(dl.path);
                              else next.add(dl.path);
                              setSelectedClutterPaths(next);
                            }}
                            className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-teal-400" />
                              ) : (
                                <Square className="w-4 h-4 text-white/40" />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{dl.name}</div>
                                <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(dl.path)}</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-teal-200">{formatBytes(dl.size)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center shrink-0">
                <UbiquitousButton
                  activeModule="clutter"
                  isScanning={isScanning}
                  soundEnabled={soundEnabled}
                  label={
                    isScanning
                      ? lang === 'tr' ? 'Taranıyor' : 'Scanning'
                      : clutterData
                        ? lang === 'tr' ? 'Temizle' : 'Remove'
                        : lang === 'tr' ? 'Tara' : 'Scan'
                  }
                  subLabel={
                    clutterData && !isScanning
                      ? `${selectedClutterPaths.size} ${lang === 'tr' ? 'seçili' : 'selected'}`
                      : undefined
                  }
                  onClick={() => {
                    if (!clutterData) {
                      handleModuleScan('clutter');
                    } else {
                      handleCleanPaths(Array.from(selectedClutterPaths), deleteMode, 'My Clutter');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. SPACE LENS MODULE (Interactive Bubble Map & Tree)      */}
          {/* ========================================================= */}
          {activeModule === 'spaceLens' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {spaceLensData ? (
                <SpaceLensView
                  lang={lang}
                  currentPath={spaceLensData.currentPath}
                  parentPath={spaceLensData.parentPath}
                  totalScannedSize={spaceLensData.totalScannedSize}
                  nodes={spaceLensData.nodes || []}
                  isLoading={isScanning}
                  onNavigate={(p) => loadSpaceLens(p)}
                  onReveal={(p) => handleRevealPath(p)}
                  onCleanSelected={async (paths) => {
                    await handleCleanPaths(paths, deleteMode, 'Space Lens');
                    loadSpaceLens(spaceLensData.currentPath);
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <img
                    src={currentTheme.scanAsset}
                    alt="Space Lens"
                    className="w-56 h-56 object-contain animate-pulse"
                  />
                  <p className="text-sm text-white/75 mt-3">
                    {lang === 'tr' ? 'Disk haritası oluşturuluyor...' : 'Building visual storage map...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. CLOUD CLEANUP MODULE (iCloud, Google Drive, OneDrive)   */}
          {/* ========================================================= */}
          {activeModule === 'cloud' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {!cloudData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <img
                    src={isScanning ? currentTheme.scanAsset : currentTheme.introAsset}
                    alt="Cloud Cleanup"
                    className="w-60 h-60 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] animate-float"
                  />
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {lang === 'tr' ? 'Bulut Depolama Temizliği' : 'Cloud Storage Cleanup'}
                  </h1>
                  <p className="text-sm text-white/75 mt-2.5 max-w-lg leading-relaxed">
                    {lang === 'tr'
                      ? 'iCloud Drive, Google Drive, OneDrive ve Dropbox klasörlerinizde yerel SSD alanı tüketen senkronize dosyaları bulun; buluttan silmeden yerel kopyasını boşaltın (Unsync).'
                      : 'Scan iCloud Drive, Google Drive, OneDrive, and Dropbox to evict locally cached files (Unsync) or remove unneeded cloud clutter.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                  <div className="col-span-4 cmm-glass-card rounded-2xl p-3 space-y-2 overflow-y-auto min-h-0">
                    <div className="px-2 pb-2 border-b border-white/10 text-xs text-white/60">
                      {lang === 'tr' ? 'Bulut Sağlayıcıları' : 'Cloud Providers'}
                    </div>
                    {(cloudData.providers || []).map((prov: any) => (
                      <div
                        key={prov.id}
                        onClick={() => setSelectedCloudProvider(prov.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedCloudProvider === prov.id
                            ? 'bg-sky-500/25 border-sky-400/50'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{prov.name}</span>
                            {prov.connected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                          </div>
                          <div className="text-[10px] text-white/50 mt-0.5">
                            {prov.connected
                              ? lang === 'tr' ? 'Bağlı ve Senkronize' : 'Connected & Synced'
                              : lang === 'tr' ? 'Yerel klasör bulunamadı' : 'Not detected locally'}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-sky-300">{formatBytes(prov.localSize)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="col-span-8 cmm-glass-card rounded-2xl p-4 flex flex-col min-h-0">
                    {(() => {
                      const activeProv =
                        (cloudData.providers || []).find((p: any) => p.id === selectedCloudProvider) ||
                        cloudData.providers?.[0];
                      if (!activeProv) return null;

                      return (
                        <>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
                            <div>
                              <h3 className="text-sm font-bold text-white">{activeProv.name}</h3>
                              <p className="text-[10px] font-mono text-white/50">{activeProv.rootPath}</p>
                            </div>
                            <span className="text-sm font-bold text-sky-300">{formatBytes(activeProv.localSize)}</span>
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
                            {(activeProv.files || []).map((f: any) => {
                              const checked = selectedCloudPaths.has(f.path);
                              return (
                                <div
                                  key={f.id}
                                  onClick={() => {
                                    const next = new Set(selectedCloudPaths);
                                    if (next.has(f.path)) next.delete(f.path);
                                    else next.add(f.path);
                                    setSelectedCloudPaths(next);
                                  }}
                                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {checked ? (
                                      <CheckSquare className="w-4 h-4 text-sky-400" />
                                    ) : (
                                      <Square className="w-4 h-4 text-white/40" />
                                    )}
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-white truncate">{f.name}</div>
                                      <div className="text-[10px] text-sky-200/70">{f.syncState}</div>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-white">{formatBytes(f.size)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center shrink-0">
                <UbiquitousButton
                  activeModule="cloud"
                  isScanning={isScanning}
                  soundEnabled={soundEnabled}
                  label={
                    isScanning
                      ? lang === 'tr' ? 'Taranıyor' : 'Scanning'
                      : cloudData
                        ? lang === 'tr' ? 'Yereli Boşalt' : 'Unsync'
                        : lang === 'tr' ? 'Tara' : 'Scan'
                  }
                  onClick={() => {
                    if (!cloudData) {
                      handleModuleScan('cloud');
                    } else {
                      handleCleanPaths(Array.from(selectedCloudPaths), 'evict', 'Cloud Cleanup');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. MY TOOLS MODULE (Screen Cleaner, AI Clutter, Shredder) */}
          {/* ========================================================= */}
          {activeModule === 'myTools' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {lang === 'tr' ? 'Araçlarım (My Tools Hub)' : 'My Tools — Focused Utilities'}
                  </h1>
                  <p className="text-xs text-white/65">
                    {lang === 'tr'
                      ? 'Clean Best özel araç seti: Ekran Temizleyici, AI Kalıntı Yöneticisi, Güvenli Dosya Öğütücü (Shredder) ve İşlem Sonlandırıcı.'
                      : 'Clean Best specialized utilities: Screen Cleaning Mode, AI Clutter & LLM Inspector, Secure Shredder, and App Terminator.'}
                  </p>
                </div>
                {activeTool !== 'hub' && (
                  <button
                    onClick={() => setActiveTool('hub')}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
                  >
                    ← {lang === 'tr' ? 'Tüm Araçlara Dön' : 'Back to Tools Hub'}
                  </button>
                )}
              </div>

              {activeTool === 'hub' && (
                <div className="grid grid-cols-3 gap-3.5 flex-1 min-h-0">
                  {/* Tool 1: Screen Cleaning Mode */}
                  <div
                    onClick={() => setScreenCleanerOpen(true)}
                    className="cmm-glass-card rounded-3xl p-5 cursor-pointer hover:border-cyan-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-600/30 border border-cyan-300/40 flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {lang === 'tr' ? 'Ekran ve Klavye Temizleme Modu' : 'Screen Cleaning Mode'}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-500/30 text-cyan-200 font-semibold">
                          NEW
                        </span>
                      </div>
                      <p className="text-xs text-white/65 mt-2 leading-relaxed">
                        {lang === 'tr'
                          ? 'Ekranınızı ve klavyenizi fiziksel olarak silerken tüm tuşları ve tıklamaları kilitler. Orijinal Wipe.wav ses efekti içerir.'
                          : 'Locks keyboard keys and mouse clicks with a sleek black glass screen so you can physically wipe your display and keyboard safely.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-cyan-300 mt-4 group-hover:translate-x-1 transition-transform">
                      <span>{lang === 'tr' ? 'Ekran Kilidini Başlat' : 'Activate Screen Lock'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Tool 2: AI Clutter & Local LLM Manager */}
                  <div
                    onClick={async () => {
                      if (!cleanupData) await handleModuleScan('cleanup');
                      setSelectedCleanupCategory('ai_clutter');
                      setActiveModule('cleanup');
                    }}
                    className="cmm-glass-card rounded-3xl p-5 cursor-pointer hover:border-fuchsia-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-purple-600/30 border border-fuchsia-300/40 flex items-center justify-center mb-3">
                        <Bot className="w-5 h-5 text-fuchsia-300" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {lang === 'tr' ? 'AI Kalıntıları ve Yerel LLM Modelleri' : 'AI Clutter & Local Models'}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-fuchsia-500/30 text-fuchsia-200 font-semibold">
                          CMM 5
                        </span>
                      </div>
                      <p className="text-xs text-white/65 mt-2 leading-relaxed">
                        {lang === 'tr'
                          ? 'Claude, Codex, Gemini, Cursor önbelleklerini ve Ollama / LM Studio yerel modellerinin RAM uyumluluğunu analiz edin.'
                          : 'Inspect caches from Claude, Codex, Gemini, and Cursor, plus local LLM weights in Ollama & LM Studio with RAM compatibility checks.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-fuchsia-300 mt-4 group-hover:translate-x-1 transition-transform">
                      <span>{lang === 'tr' ? 'AI Kalıntılarını Tara' : 'Inspect AI Clutter'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Tool 3: Shredder (Secure File Erase) */}
                  <div
                    onClick={() => setActiveTool('shredder')}
                    className="cmm-glass-card rounded-3xl p-5 cursor-pointer hover:border-rose-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/30 to-orange-600/30 border border-rose-300/40 flex items-center justify-center mb-3">
                        <Flame className="w-5 h-5 text-rose-300" />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {lang === 'tr' ? 'Öğütücü (Shredder — Güvenli Silme)' : 'Shredder — Secure File Erase'}
                      </h3>
                      <p className="text-xs text-white/65 mt-2 leading-relaxed">
                        {lang === 'tr'
                          ? 'Hassas dosya ve klasörleri silmeden önce kriptografik rastgele baytlarla üzerine yazarak kurtarılamaz şekilde imha edin.'
                          : 'Securely overwrite confidential files with cryptographic random bytes before unlinking so they can never be recovered.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-rose-300 mt-4 group-hover:translate-x-1 transition-transform">
                      <span>{lang === 'tr' ? 'Öğütücüyü Aç' : 'Open Shredder'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Tool 4: App Terminator (Heavy Process Manager) */}
                  <div
                    onClick={() => setActiveTool('terminator')}
                    className="cmm-glass-card rounded-3xl p-5 cursor-pointer hover:border-amber-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-amber-300/40 flex items-center justify-center mb-3">
                        <Cpu className="w-5 h-5 text-amber-300" />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {lang === 'tr' ? 'Ağır İşlem Sonlandırıcı (App Terminator)' : 'App Terminator & Process Monitor'}
                      </h3>
                      <p className="text-xs text-white/65 mt-2 leading-relaxed">
                        {lang === 'tr'
                          ? 'Arka planda aşırı RAM ve CPU tüketen yanıt vermeyen işlemleri canlı izleyin ve tek tıkla zorla kapatın (Force Quit).'
                          : 'Monitor CPU and memory-hungry processes in real time and Quit or Force Quit unresponsive tasks immediately.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-300 mt-4 group-hover:translate-x-1 transition-transform">
                      <span>{lang === 'tr' ? 'Canlı İşlemleri Yönet' : 'Manage Running Processes'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Tool 5: Browser Care & Privacy Cleaner */}
                  <div
                    onClick={async () => {
                      if (!protectionData) await handleModuleScan('protection');
                      setActiveTool('browser');
                    }}
                    className="cmm-glass-card rounded-3xl p-5 cursor-pointer hover:border-emerald-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 border border-emerald-300/40 flex items-center justify-center mb-3">
                        <Globe className="w-5 h-5 text-emerald-300" />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {lang === 'tr' ? 'Tarayıcı Bakımı ve Gizlilik (Browser Care)' : 'Browser Care & Privacy Cleaner'}
                      </h3>
                      <p className="text-xs text-white/65 mt-2 leading-relaxed">
                        {lang === 'tr'
                          ? 'Chrome, Safari, Brave, Edge, Arc ve Firefox tarayıcılarındaki önbellekleri, çerezleri ve oturum izlerini tek panelden temizleyin.'
                          : 'Inspect and clean browser caches, cookies, and browsing traces across Chrome, Safari, Brave, Edge, Arc, and Firefox.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-300 mt-4 group-hover:translate-x-1 transition-transform">
                      <span>{lang === 'tr' ? 'Tarayıcıları Denetle' : 'Open Browser Care'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Tool 6: Email Cleanup (Apple Mail / Outlook Attachments) */}
                  <div
                    onClick={async () => {
                      if (!cleanupData) await handleModuleScan('cleanup');
                      setActiveTool('email');
                    }}
                    className="cmm-glass-card rounded-3xl p-5 cursor-pointer hover:border-sky-400/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <img
                          src="/assets/EmailCleanup_ScanProgress.png"
                          alt="Email Cleanup"
                          className="w-12 h-12 object-contain drop-shadow-md"
                        />
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-500/30 text-sky-200 font-semibold">
                          MAIL
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {lang === 'tr' ? 'E-Posta Ekleri Temizleyici (Email Cleanup)' : 'Email Attachments Cleanup'}
                      </h3>
                      <p className="text-xs text-white/65 mt-2 leading-relaxed">
                        {lang === 'tr'
                          ? 'Apple Mail, Thunderbird ve Outlook tarafından yerel diske indirilen PDF, arşiv ve medya eklerini e-postalarınızı silmeden temizleyin.'
                          : 'Reclaim space taken by locally cached Apple Mail, Thunderbird, and Outlook attachments without deleting your cloud emails.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-sky-300 mt-4 group-hover:translate-x-1 transition-transform">
                      <span>{lang === 'tr' ? 'Posta Eklerini İncele' : 'Inspect Mail Attachments'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'browser' && (
                <div className="flex-1 cmm-glass-card rounded-3xl p-5 min-h-0 overflow-y-auto space-y-2.5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {lang === 'tr' ? 'Tarayıcı Bakımı ve Önbellek Temizliği' : 'Browser Care & Cache Inspector'}
                      </h3>
                      <p className="text-xs text-white/60">
                        {lang === 'tr'
                          ? 'Tespit edilen tarayıcı profilleri ve yerel önbellek boyutları:'
                          : 'Detected browser profiles and local cache footprint:'}
                      </p>
                    </div>
                  </div>
                  {(protectionData?.privacyBrowsers || []).map((b: any, idx: number) => (
                    <div
                      key={b.id || idx}
                      className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{b.name}</div>
                        <div className="text-[11px] text-white/55 font-mono truncate max-w-xl">{formatDisplayPath(b.path)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-300">{formatBytes(b.cacheSize)}</span>
                        <button
                          onClick={() => handleCleanPaths([b.path], deleteMode, `Browser Care (${b.name})`)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-200 text-xs font-semibold"
                        >
                          {lang === 'tr' ? 'Önbelleği Temizle' : 'Clean Cache'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTool === 'email' && (
                <div className="flex-1 cmm-glass-card rounded-3xl p-5 min-h-0 flex flex-col justify-between">
                  <div className="flex items-center gap-4 pb-4 border-b border-white/10 shrink-0">
                    <img
                      src="/assets/EmailCleanup_ScanProgress.png"
                      alt="Email Cleanup"
                      className="w-16 h-16 object-contain drop-shadow-xl"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {lang === 'tr' ? 'Posta Ekleri ve İndirilenleri (Email Cleanup)' : 'Email Attachments & Local Mail Cache'}
                      </h3>
                      <p className="text-xs text-white/65">
                        {lang === 'tr'
                          ? 'Yerel posta istemcilerinde (Apple Mail, Outlook, Thunderbird) önbelleğe alınan ekler:'
                          : 'Locally cached attachments across Apple Mail, Outlook, and Thunderbird:'}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-2">
                    {((cleanupData?.categories || []).find((c: any) => c.id === 'mail_attachments')?.items || []).map(
                      (item: any) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="text-xs font-bold text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-white/45 font-mono truncate">{formatDisplayPath(item.path)}</div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold text-sky-300">{formatBytes(item.size)}</span>
                            <button
                              onClick={() => handleCleanPaths([item.path], deleteMode, 'Email Cleanup')}
                              className="px-3 py-1 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 text-sky-200 text-xs font-semibold"
                            >
                              {lang === 'tr' ? 'Temizle' : 'Clean'}
                            </button>
                          </div>
                        </div>
                      )
                    )}
                    {((cleanupData?.categories || []).find((c: any) => c.id === 'mail_attachments')?.items || [])
                      .length === 0 && (
                      <div className="text-center py-12 text-xs text-white/60">
                        {lang === 'tr'
                          ? '✓ Yerel posta ek önbelleği tertemiz! Gereksiz e-posta eki bulunamadı.'
                          : '✓ Local mail attachment caches are clean! No unneeded attachments found.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTool === 'shredder' && (
                <div className="flex-1 cmm-glass-card rounded-3xl p-6 min-h-0 flex flex-col justify-center max-w-2xl mx-auto w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="w-8 h-8 text-rose-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {lang === 'tr' ? 'Shredder — Kriptografik Güvenli İmha' : 'Shredder — Cryptographic Secure Erase'}
                      </h3>
                      <p className="text-xs text-white/60">
                        {lang === 'tr'
                          ? 'İmha etmek istediğiniz dosya veya klasörün tam yolunu girin.'
                          : 'Enter the full path of the file or folder you want to securely overwrite and erase.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={shredderCustomPath}
                    onChange={(e) => setShredderCustomPath(e.target.value)}
                    placeholder={
                      health?.platform === 'win32'
                        ? 'C:\\Users\\...\\Downloads\\secret.pdf'
                        : '/Users/.../Downloads/example-temp-file.txt'
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-black/30 border border-white/20 text-xs font-mono text-white placeholder:text-white/35 focus:outline-none focus:border-rose-400 mb-4"
                  />
                  <button
                    onClick={() => {
                      if (shredderCustomPath.trim()) {
                        handleCleanPaths([shredderCustomPath.trim()], 'shred', 'Shredder');
                        setShredderCustomPath('');
                      }
                    }}
                    className="py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-400 hover:to-orange-500 text-xs font-bold text-white shadow-xl"
                  >
                    {lang === 'tr' ? '🔥 Güvenli Şekilde Öğüt ve Kalıcı İmha Et' : '🔥 Securely Shred & Permanently Erase'}
                  </button>
                </div>
              )}

              {activeTool === 'terminator' && (
                <div className="flex-1 cmm-glass-card rounded-3xl p-4 min-h-0 overflow-y-auto space-y-2">
                  {(health?.topProcesses || []).map((proc: any) => (
                    <div
                      key={proc.pid}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{proc.name}</div>
                        <div className="text-[10px] text-white/50">
                          PID: {proc.pid} • CPU: {proc.cpu}%
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {formatBytes(proc.memoryBytes)}
                        </span>
                        <button
                          onClick={() => handleKillProcess(proc.pid, false)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold"
                        >
                          Quit
                        </button>
                        <button
                          onClick={() => handleKillProcess(proc.pid, true)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 text-[11px] font-semibold"
                        >
                          Force Quit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 10. MY ACTIVITY MODULE (Statistics Dashboard)             */}
          {/* ========================================================= */}
          {activeModule === 'myActivity' && activity && (
            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
              <div className="shrink-0">
                <h1 className="text-2xl font-bold text-white">
                  {lang === 'tr' ? 'Etkinliğim ve İstatistikler' : 'My Activity & Lifetime Impact'}
                </h1>
                <p className="text-xs text-white/65">
                  {lang === 'tr'
                    ? 'Temizlenen yerel ve bulut depolama alanı, taranan zararlı yazılımlar ve kazanılan toplam süre.'
                    : 'Cumulative storage reclaimed, cloud space freed, malware scans performed, and time saved.'}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3.5 shrink-0">
                <div className="cmm-glass-card rounded-2xl p-4">
                  <div className="text-[11px] text-white/60">
                    {lang === 'tr' ? 'Temizlenen Yerel Alan' : 'Local Storage Cleaned'}
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-300 mt-1">
                    {formatBytes(activity.localCleanedBytes)}
                  </div>
                </div>
                <div className="cmm-glass-card rounded-2xl p-4">
                  <div className="text-[11px] text-white/60">
                    {lang === 'tr' ? 'Temizlenen Bulut Alanı' : 'Cloud Storage Cleaned'}
                  </div>
                  <div className="text-2xl font-extrabold text-sky-300 mt-1">
                    {formatBytes(activity.cloudCleanedBytes)}
                  </div>
                </div>
                <div className="cmm-glass-card rounded-2xl p-4">
                  <div className="text-[11px] text-white/60">
                    {lang === 'tr' ? 'Zararlı Taraması' : 'Scanned for Malware'}
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-300 mt-1">
                    {activity.threatsScannedCount.toLocaleString()}
                  </div>
                </div>
                <div className="cmm-glass-card rounded-2xl p-4">
                  <div className="text-[11px] text-white/60">
                    {lang === 'tr' ? 'Kazanılan Toplam Süre' : 'Total Time Saved'}
                  </div>
                  <div className="text-2xl font-extrabold text-fuchsia-300 mt-1">
                    {Math.round(activity.totalTimeSavedSeconds / 60)} min
                  </div>
                </div>
              </div>

              <div className="flex-1 cmm-glass-card rounded-2xl p-4 min-h-0 overflow-y-auto space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/55 mb-2">
                  {lang === 'tr' ? 'Son İşlem Geçmişi' : 'Recent Activity Log'}
                </h3>
                {(activity.history || []).map((rec: any) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{rec.module}</span>
                      <span className="text-white/60 ml-2">— {rec.action}</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/75">
                      {rec.bytesCleaned > 0 && (
                        <span className="font-bold text-emerald-300">+{formatBytes(rec.bytesCleaned)}</span>
                      )}
                      <span className="text-[11px] text-white/45">
                        {new Date(rec.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 11. SETTINGS MODULE (General, Protection, Ignore List)    */}
          {/* ========================================================= */}
          {activeModule === 'settings' && (
            <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col justify-center space-y-4 min-h-0 overflow-hidden">
              <div className="cmm-glass-card rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white">
                    {lang === 'tr' ? 'Clean Best Ayarları' : 'Clean Best Preferences'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'general', tr: 'Genel', en: 'General' },
                      { id: 'protection', tr: 'Koruma & Tarama', en: 'Protection & Scan' },
                      { id: 'ignoreList', tr: `Yoksayılanlar (${ignoreList.length})`, en: `Ignore List (${ignoreList.length})` },
                      { id: 'about', tr: 'Hakkında', en: 'About' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          settingsTab === tab.id
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'text-white/65 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {lang === 'tr' ? tab.tr : tab.en}
                      </button>
                    ))}
                  </div>
                </div>

                {settingsTab === 'general' && (
                  <>
                    {/* Safe Trash vs Permanent Delete */}
                    <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {lang === 'tr' ? 'Dosya Temizleme Güvenlik Modu' : 'File Deletion Safety Mode'}
                        </div>
                        <div className="text-xs text-white/60">
                          {lang === 'tr'
                            ? 'Güvenli Çöp Sepeti modu silinen öğeleri önce Çöp Sepetine taşır.'
                            : 'Safe Trash Mode moves cleaned files to macOS Trash / Recycle Bin first.'}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteMode((m) => (m === 'trash' ? 'permanent' : 'trash'))}
                        className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-emerald-300 border border-white/20"
                      >
                        {deleteMode === 'trash'
                          ? lang === 'tr' ? 'Güvenli Çöp Sepeti (Önerilen)' : 'Safe Trash Mode'
                          : lang === 'tr' ? 'Kalıcı Silme (Anında)' : 'Permanent Delete'}
                      </button>
                    </div>

                    {/* Sound Effects */}
                    <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {lang === 'tr' ? 'Etkileşimli Ses Efektleri' : 'Interactive Sound Effects'}
                        </div>
                        <div className="text-xs text-white/60">
                          ScanFinished.wav, CleanFinished.wav, Wipe.wav, Click-mouse-up.wav
                        </div>
                      </div>
                      <button
                        onClick={() => setSoundEnabled((s) => !s)}
                        className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white border border-white/20"
                      >
                        {soundEnabled ? (lang === 'tr' ? 'Açık' : 'Enabled') : (lang === 'tr' ? 'Kapalı' : 'Muted')}
                      </button>
                    </div>

                    {/* Winter Hero Theme */}
                    <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {lang === 'tr' ? 'Alternatif 3D Smart Care İkonu' : 'Alternate 3D Hero Graphic'}
                        </div>
                        <div className="text-xs text-white/60">
                          SmartCare_Intro.png
                        </div>
                      </div>
                      <button
                        onClick={() => setWinterHero((w) => !w)}
                        className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white border border-white/20"
                      >
                        {winterHero ? (lang === 'tr' ? 'Alternatif Aktif' : 'Alternate On') : (lang === 'tr' ? 'Standart Tema' : 'Standard')}
                      </button>
                    </div>

                    {/* Cross-Platform Engine Status */}
                    <div className="p-4 rounded-2xl bg-black/25 border border-white/10 text-xs space-y-1">
                      <div className="font-bold text-emerald-300">
                        ✓ Cross-Platform Native Engine Active ({health?.platformLabel} — {health?.arch})
                      </div>
                      <div className="text-white/60">
                        macOS (LaunchAgents, vm_stat, pmset, dscacheutil, brctl, plutil) & Windows (PowerShell CIM, WMIC, ipconfig, taskkill, Startup Registry)
                      </div>
                    </div>
                  </>
                )}

                {settingsTab === 'protection' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {lang === 'tr' ? 'Gerçek Zamanlı Zararlı Yazılım Monitörü (Moonlock)' : 'Enable Real-Time Malware Monitor (Moonlock)'}
                        </div>
                        <div className="text-xs text-white/60">
                          {lang === 'tr'
                            ? 'Yeni indirilen dosyaları ve LaunchAgent / Başlangıç değişikliklerini anında denetler.'
                            : 'React to active threats and persistence agents in real time.'}
                        </div>
                      </div>
                      <button
                        onClick={() => setRealTimeMonitor((v) => !v)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                          realTimeMonitor
                            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                            : 'bg-white/10 text-white/60 border-white/15'
                        }`}
                      >
                        {realTimeMonitor ? (lang === 'tr' ? 'Aktif (ON)' : 'Active (ON)') : (lang === 'tr' ? 'Kapalı' : 'Off')}
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {lang === 'tr' ? 'Arka Planda Tehdit Taraması' : 'Look for Threats in the Background'}
                        </div>
                        <div className="text-xs text-white/60">
                          {lang === 'tr'
                            ? 'Clean Best kapalıyken bile Menu Bar üzerinden sistemi izlemeye devam eder.'
                            : 'Continue monitoring for malicious activity via Menu Bar agent.'}
                        </div>
                      </div>
                      <button
                        onClick={() => setBgMalwareScan((v) => !v)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                          bgMalwareScan
                            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                            : 'bg-white/10 text-white/60 border-white/15'
                        }`}
                      >
                        {bgMalwareScan ? (lang === 'tr' ? 'Açık' : 'Enabled') : (lang === 'tr' ? 'Kapalı' : 'Disabled')}
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {lang === 'tr' ? 'Arşivleri, DMG Disk Kalıplarını ve USB Sürücüleri Tara' : 'Scan Archives, DMG Disk Images & USB Drives'}
                        </div>
                        <div className="text-xs text-white/60">
                          {lang === 'tr'
                            ? 'Derin tarama sırasında sıkıştırılmış arşivleri ve harici diskleri denetler.'
                            : 'Inspect compressed archives and mounted external volumes during scans.'}
                        </div>
                      </div>
                      <button
                        onClick={() => setScanArchives((v) => !v)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                          scanArchives
                            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                            : 'bg-white/10 text-white/60 border-white/15'
                        }`}
                      >
                        {scanArchives ? (lang === 'tr' ? 'Açık' : 'Enabled') : (lang === 'tr' ? 'Kapalı' : 'Disabled')}
                      </button>
                    </div>
                  </div>
                )}

                {settingsTab === 'ignoreList' && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/65">
                      {lang === 'tr'
                        ? 'Tarama ve temizleme işlemlerinde atlanmasını istediğiniz dosya, klasör veya uygulama yollarını ekleyin:'
                        : 'Paths and applications listed below will be excluded from Cleanup and Clutter scans:'}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newIgnorePath}
                        onChange={(e) => setNewIgnorePath(e.target.value)}
                        placeholder={
                          health?.platform === 'win32'
                            ? 'C:\\Users\\...\\MyImportantFolder'
                            : '/Users/.../Documents/KeepThisFolder'
                        }
                        className="flex-1 px-3.5 py-2 rounded-xl bg-black/30 border border-white/20 text-xs font-mono text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        onClick={async () => {
                          if (!newIgnorePath.trim()) return;
                          const res = await fetch('/api/ignore-list', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'add', path: newIgnorePath.trim() }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setIgnoreList(data.items || []);
                            setNewIgnorePath('');
                            showToast(lang === 'tr' ? 'Yoksayılanlar listesine eklendi.' : 'Added to Ignore List.');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/45 border border-emerald-400/40 text-xs font-bold text-white"
                      >
                        {lang === 'tr' ? '+ Ekle' : '+ Add Path'}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {ignoreList.length === 0 ? (
                        <div className="py-6 text-center text-xs text-white/45">
                          {lang === 'tr' ? 'Yoksayılanlar listesi şu anda boş.' : 'Ignore List is currently empty.'}
                        </div>
                      ) : (
                        ignoreList.map((igPath) => (
                          <div
                            key={igPath}
                            className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs"
                          >
                            <span className="font-mono text-white/85 truncate pr-3">{igPath}</span>
                            <button
                              onClick={async () => {
                                const res = await fetch('/api/ignore-list', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'remove', path: igPath }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setIgnoreList(data.items || []);
                                }
                              }}
                              className="text-rose-300 hover:text-rose-200 font-semibold text-[11px]"
                            >
                              {lang === 'tr' ? 'Kaldır' : 'Remove'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {settingsTab === 'about' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/25 border border-white/10">
                      <div className="flex items-center gap-3.5">
                        <img src="/assets/AppIcon.png" alt="Clean Best" className="w-12 h-12 rounded-2xl shadow-lg" />
                        <div>
                          <div className="text-base font-bold text-white">Clean Best</div>
                          <div className="text-xs text-white/65">
                            {lang === 'tr'
                              ? 'Açık Kaynaklı macOS & Windows Sistem Bakımı ve Yerel AI Temizleyici'
                              : 'Open-Source macOS & Windows System Care & Local AI Suite'}
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
                        MIT License
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href="https://github.com/schevko"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.11] border border-white/15 flex items-center justify-between transition-all"
                      >
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                            {lang === 'tr' ? 'Geliştirici' : 'Developer'}
                          </div>
                          <div className="text-sm font-bold text-fuchsia-300 mt-0.5">github.com/schevko</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/60" />
                      </a>

                      <a
                        href="https://github.com/schevko/clean-best"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.11] border border-white/15 flex items-center justify-between transition-all"
                      >
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                            {lang === 'tr' ? 'Kaynak Kodu Deposu' : 'Public Repository'}
                          </div>
                          <div className="text-sm font-bold text-emerald-300 mt-0.5">github.com/schevko/clean-best</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/60" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 12. ABOUT MODULE (Hakkında / Developer & Open Source)     */}
          {/* ========================================================= */}
          {activeModule === 'about' && (
            <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col justify-center space-y-4 min-h-0 overflow-hidden">
              <div className="cmm-glass-card rounded-3xl p-7 space-y-6">
                {/* Top App Identity Banner */}
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-4">
                    <img
                      src="/assets/AppIcon.png"
                      alt="Clean Best"
                      className="w-16 h-16 rounded-2xl shadow-[0_14px_32px_rgba(0,0,0,0.45)]"
                    />
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                          Clean <span className="text-fuchsia-300">Best</span>
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-[11px] font-bold text-emerald-300">
                          MIT • Open Source
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        {lang === 'tr'
                          ? 'macOS ve Windows İçin %100 Açık Kaynaklı Sistem Bakımı, Yerel AI Denetçisi ve Moonlock Güvenlik Paketi'
                          : '100% Open-Source System Care, Local AI Inspector & Moonlock Security Suite for macOS and Windows'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Developer & GitHub Repository Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-black/25 border border-white/15 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-300">
                          {lang === 'tr' ? 'GELİŞTİRİCİ / DEVELOPER' : 'DEVELOPER / AUTHOR'}
                        </span>
                        <Code2 className="w-4 h-4 text-fuchsia-300" />
                      </div>
                      <div className="text-lg font-bold text-white mt-2 font-mono">
                        github.com/schevko
                      </div>
                      <p className="text-xs text-white/65 mt-1 leading-relaxed">
                        {lang === 'tr'
                          ? 'Clean Best masaüstü motoru, yerel yapay zeka (LLM) denetçisi ve çoklu platform mimarisi geliştiricisi.'
                          : 'Creator & lead architect of the Clean Best native desktop engine and local AI/LLM inspector.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="https://github.com/schevko"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-fuchsia-500/25 hover:bg-fuchsia-500/40 border border-fuchsia-400/40 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>{lang === 'tr' ? 'GitHub Profilini Aç' : 'Open GitHub Profile'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://github.com/schevko');
                          showToast(lang === 'tr' ? 'Geliştirici bağlantısı kopyalandı!' : 'Developer URL copied!');
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white"
                        title={lang === 'tr' ? 'Bağlantıyı Kopyala' : 'Copy Link'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-black/25 border border-white/15 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                          {lang === 'tr' ? 'AÇIK KAYNAK DEPOSU' : 'PUBLIC REPOSITORY'}
                        </span>
                        <Globe className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div className="text-lg font-bold text-white mt-2 font-mono truncate">
                        github.com/schevko/clean-best
                      </div>
                      <p className="text-xs text-white/65 mt-1 leading-relaxed">
                        {lang === 'tr'
                          ? 'Tüm kaynak kodu MIT lisansı altında açıktır. İnceleyebilir, çatallayabilir (fork) ve katkıda bulunabilirsiniz.'
                          : '100% auditable TypeScript, Electron, and OS kernel source code released under the MIT license.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href="https://github.com/schevko/clean-best"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/40 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>{lang === 'tr' ? 'GitHub Reposunu Aç' : 'Open GitHub Repo'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://github.com/schevko/clean-best');
                          showToast(lang === 'tr' ? 'Repo bağlantısı kopyalandı!' : 'Repository URL copied!');
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white"
                        title={lang === 'tr' ? 'Bağlantıyı Kopyala' : 'Copy Link'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Technical Specs & Guarantees Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                      {lang === 'tr' ? 'Çekirdek Mimari' : 'Kernel Engine'}
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      {health?.platformLabel || 'macOS & Windows'} ({health?.arch || 'ARM64 / x64'})
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                      {lang === 'tr' ? 'Veri Gizliliği' : 'Privacy & Telemetry'}
                    </div>
                    <div className="text-xs font-bold text-emerald-300 mt-1">
                      {lang === 'tr' ? '0 Bayt Dış Telemetri (%100 Yerel)' : '0 Bytes External Telemetry'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10">
                    <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                      {lang === 'tr' ? 'Aktif Modüller' : 'Active Modules'}
                    </div>
                    <div className="text-xs font-bold text-fuchsia-300 mt-1">
                      {lang === 'tr' ? '11 Tam Modül • Pro Kilidi Yok' : '11 Full Modules • Zero Paywalls'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Assistant & Live Health Monitor Drawer */}
      <HealthMonitorDrawer
        isOpen={drawerOpen}
        lang={lang}
        health={health}
        onClose={() => setDrawerOpen(false)}
        onFreeRam={() => handleRunMaintenance(['free_ram'])}
        onKillProcess={handleKillProcess}
        onNavigateModule={(mod) => setActiveModule(mod)}
        onOpenScreenCleaner={() => setScreenCleanerOpen(true)}
      />

      {/* Fullscreen Screen Cleaning Mode Lock Overlay */}
      <ScreenCleanerModal
        isOpen={screenCleanerOpen}
        lang={lang}
        soundEnabled={soundEnabled}
        onClose={() => setScreenCleanerOpen(false)}
      />
    </div>
  );
}
