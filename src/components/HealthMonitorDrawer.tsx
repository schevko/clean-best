import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Cpu,
  HardDrive,
  BatteryCharging,
  Wifi,
  ShieldCheck,
  Zap,
  Activity,
  XCircle,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Lock,
  Gauge,
  Bluetooth,
} from 'lucide-react';
import { formatBytes, formatHostname } from '../theme';

interface HealthMonitorDrawerProps {
  isOpen: boolean;
  lang: 'tr' | 'en';
  health: any;
  onClose: () => void;
  onFreeRam: () => void;
  onKillProcess: (pid: number, force: boolean) => void;
  onNavigateModule: (mod: any) => void;
  onOpenScreenCleaner?: () => void;
}

export const HealthMonitorDrawer: React.FC<HealthMonitorDrawerProps> = ({
  isOpen,
  lang,
  health,
  onClose,
  onFreeRam,
  onKillProcess,
  onNavigateModule,
  onOpenScreenCleaner,
}) => {
  const [speedtesting, setSpeedtesting] = useState(false);
  const [speedResult, setSpeedResult] = useState<{
    downloadMbps: number;
    uploadMbps: number;
    pingMs: number;
    server: string;
  } | null>(null);

  const getTranslatedStatus = (status: string) => {
    if (lang !== 'tr') return status;
    if (status === 'Excellent') return 'Mükemmel';
    if (status === 'Good') return 'İyi';
    return 'Bakım Öneriliyor';
  };

  const handleRunSpeedtest = async () => {
    setSpeedtesting(true);
    try {
      const res = await fetch('/api/network/speedtest', { method: 'POST' });
      if (res.ok) {
        setSpeedResult(await res.json());
      }
    } catch {
      // Ignore
    } finally {
      setSpeedtesting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && health && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed top-3 right-3 bottom-3 w-[405px] z-50 rounded-3xl bg-[#130E2B]/90 backdrop-blur-3xl border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'tr' ? 'Asistan & Sistem Monitörü' : 'Assistant & Health Monitor'}
                  </h3>
                  <p className="text-[11px] text-white/60">
                    {formatHostname(health.hostname)} • {health.osVersion}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Overall Health Score + Real-Time Malware Monitor Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-purple-500/20 border border-emerald-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {lang === 'tr'
                          ? `Bilgisayar Sağlığı: ${getTranslatedStatus(health.healthStatus)}`
                          : `System Health: ${health.healthStatus}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      {lang === 'tr'
                        ? 'Moonlock Gerçek Zamanlı Koruma: AKTİF'
                        : 'Real-time Malware Monitor: ON (Moonlock)'}
                    </p>
                  </div>
                  <div className="w-13 h-13 px-3 py-1.5 rounded-2xl bg-black/30 border border-emerald-400/40 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-emerald-300">{health.healthScore}</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/50">Score</span>
                  </div>
                </div>
              </div>

              {/* 2x2 Hardware Widgets (Memory+Swap, CPU, Disk, Network+Speedtest) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Memory + Swap Widget */}
                <div className="cmm-glass-card rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80">RAM + Swap</span>
                    <span className="text-xs font-bold text-fuchsia-300">{health.memory.pressurePercent}%</span>
                  </div>
                  <div className="my-2">
                    <div className="text-sm font-bold text-white">
                      {formatBytes(health.memory.usedBytes)}
                    </div>
                    <div className="text-[10px] text-white/55">
                      {lang === 'tr' ? 'Boş:' : 'Free:'} {formatBytes(health.memory.freeBytes)} • Swap:{' '}
                      {formatBytes(health.memory.swapUsedBytes || 0)}
                    </div>
                  </div>
                  <button
                    onClick={onFreeRam}
                    className="w-full py-1.5 rounded-xl bg-fuchsia-500/25 hover:bg-fuchsia-500/40 border border-fuchsia-400/30 text-[11px] font-semibold text-fuchsia-200 transition-all flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{lang === 'tr' ? 'RAM Rahatlat' : 'Free Up RAM'}</span>
                  </button>
                </div>

                {/* CPU Widget */}
                <div className="cmm-glass-card rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80">CPU</span>
                    <Cpu className="w-4 h-4 text-orange-300" />
                  </div>
                  <div className="my-2">
                    <div className="text-sm font-bold text-white">
                      {health.cpu.loadPercent}% {lang === 'tr' ? 'Yük' : 'Load'}
                    </div>
                    <div className="text-[10px] text-white/55 truncate" title={health.cpu.model}>
                      {health.cpu.cores} Cores • ~{health.cpu.temperatureCelsius}°C
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${health.cpu.loadPercent}%` }}
                    />
                  </div>
                </div>

                {/* Disk Widget */}
                <div className="cmm-glass-card rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80 truncate">{health.disk.name}</span>
                    <HardDrive className="w-4 h-4 text-cyan-300 shrink-0" />
                  </div>
                  <div className="my-2">
                    <div className="text-sm font-bold text-white">
                      {formatBytes(health.disk.freeBytes)} {lang === 'tr' ? 'Boş' : 'Free'}
                    </div>
                    <div className="text-[10px] text-emerald-300">
                      +{formatBytes(health.disk.purgeableBytes)} {lang === 'tr' ? 'Temizlenebilir' : 'Purgeable'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateModule('cleanup');
                      onClose();
                    }}
                    className="w-full py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/30 text-[11px] font-semibold text-cyan-200 transition-all"
                  >
                    {lang === 'tr' ? 'Alan Aç' : 'Free Up Space'}
                  </button>
                </div>

                {/* Network + Live Speedtest Widget */}
                <div className="cmm-glass-card rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80 truncate">{health.network.wifiName}</span>
                    <Wifi className="w-4 h-4 text-blue-300 shrink-0" />
                  </div>
                  {speedResult ? (
                    <div className="my-1.5 space-y-0.5 text-[10px]">
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span>↓ {speedResult.downloadMbps} Mbps</span>
                        <span>↑ {speedResult.uploadMbps} Mbps</span>
                      </div>
                      <div className="text-white/55">Ping: {speedResult.pingMs} ms</div>
                    </div>
                  ) : (
                    <div className="my-1.5 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-white/85">
                        <span className="flex items-center gap-1 text-emerald-300">
                          <ArrowDown className="w-3 h-3" /> Down
                        </span>
                        <span className="font-mono">{formatBytes(health.network.rxBytesPerSec)}/s</span>
                      </div>
                      <div className="flex items-center justify-between text-white/85">
                        <span className="flex items-center gap-1 text-sky-300">
                          <ArrowUp className="w-3 h-3" /> Up
                        </span>
                        <span className="font-mono">{formatBytes(health.network.txBytesPerSec)}/s</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleRunSpeedtest}
                    disabled={speedtesting}
                    className="w-full py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/35 border border-blue-400/30 text-[11px] font-semibold text-blue-200 transition-all flex items-center justify-center gap-1"
                  >
                    <Gauge className="w-3 h-3" />
                    <span>
                      {speedtesting
                        ? lang === 'tr'
                          ? 'Ölçülüyor...'
                          : 'Testing...'
                        : lang === 'tr'
                          ? 'Hız Testi (Speedtest)'
                          : 'Test Speed'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Battery & Connected Bluetooth Devices Monitor (CleanMyMac_5_Menu.app Monitor_ConnectedDevices) */}
              <div className="cmm-glass-card rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Bluetooth className="w-4 h-4 text-sky-400" />
                    <span>
                      {lang === 'tr' ? 'Batarya ve Bağlı Cihazlar' : 'Battery & Connected Devices'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                    <BatteryCharging className="w-3.5 h-3.5" />
                    {health.battery.percent}% ({health.battery.statusText})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(health.connectedDevices || []).map((dev: any, idx: number) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-white/85 truncate pr-2">{dev.name}</span>
                      <span className="font-bold text-emerald-300 shrink-0">{dev.batteryPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assistant Smart Recommendations */}
              <div className="cmm-glass-card rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>{lang === 'tr' ? 'Akıllı Asistan Önerileri' : 'Assistant Recommendations'}</span>
                </div>
                <div
                  onClick={() => {
                    onNavigateModule('cleanup');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {lang === 'tr' ? 'Yapay Zeka & Geliştirici Önbelleklerini İncele' : 'Review AI Clutter & Developer Caches'}
                    </div>
                    <div className="text-[11px] text-white/60">
                      {lang === 'tr'
                        ? 'Claude, Cursor ve sistem önbelleklerini güvenle temizleyin'
                        : 'Clean Claude, Cursor, and system caches safely'}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-fuchsia-300">→</span>
                </div>

                {onOpenScreenCleaner && (
                  <div
                    onClick={() => {
                      onClose();
                      onOpenScreenCleaner();
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-cyan-300 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {lang === 'tr' ? 'Ekran ve Klavye Temizleme Modu' : 'Wipe Your Screen & Keyboard Safely'}
                        </div>
                        <div className="text-[11px] text-white/60">
                          {lang === 'tr'
                            ? 'Tuşları kilitleyerek ekranınızı güvenle silin'
                            : 'Lock keyboard & clicks to clean your display'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-cyan-300">→</span>
                  </div>
                )}
              </div>

              {/* Heavy Processes / App Terminator */}
              <div className="cmm-glass-card rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-white">
                    {lang === 'tr' ? 'Yoğun Kaynak Kullanan İşlemler' : 'Heavy Background Processes'}
                  </span>
                  <span className="text-[10px] text-white/50">RAM / CPU</span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {(health.topProcesses || []).slice(0, 8).map((proc: any) => (
                    <div
                      key={proc.pid}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white truncate">{proc.name}</div>
                        <div className="text-[10px] text-white/50">
                          PID {proc.pid} • CPU {proc.cpu}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-white/85">
                          {formatBytes(proc.memoryBytes)}
                        </span>
                        <button
                          onClick={() => onKillProcess(proc.pid, false)}
                          className="p-1 rounded-lg hover:bg-rose-500/25 text-white/50 hover:text-rose-300 transition-colors"
                          title={lang === 'tr' ? 'İşlemi Sonlandır (Quit)' : 'Quit Process'}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
