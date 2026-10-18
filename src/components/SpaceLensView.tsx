import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Folder,
  File,
  ArrowLeft,
  Home,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckSquare,
  Square,
  HardDrive,
  ChevronRight,
} from 'lucide-react';
import { formatBytes, formatDisplayPath } from '../theme';

export interface SpaceLensNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  itemCount: number;
  lastModified: number;
  percentage: number;
}

interface SpaceLensViewProps {
  lang: 'tr' | 'en';
  currentPath: string;
  parentPath: string | null;
  totalScannedSize: number;
  nodes: SpaceLensNode[];
  isLoading: boolean;
  onNavigate: (targetPath?: string) => void;
  onReveal: (targetPath: string) => void;
  onCleanSelected: (paths: string[]) => void;
}

const BUBBLE_COLORS = [
  'from-purple-500/80 via-fuchsia-500/60 to-indigo-700/80 border-fuchsia-300/40',
  'from-violet-500/80 via-purple-600/60 to-blue-800/80 border-violet-300/40',
  'from-fuchsia-500/75 via-pink-600/55 to-purple-900/80 border-pink-300/40',
  'from-indigo-500/75 via-blue-600/55 to-violet-900/80 border-indigo-300/40',
  'from-cyan-500/70 via-blue-600/50 to-indigo-900/80 border-cyan-300/40',
  'from-emerald-500/70 via-teal-600/50 to-cyan-900/80 border-emerald-300/40',
];

export const SpaceLensView: React.FC<SpaceLensViewProps> = ({
  lang,
  currentPath,
  parentPath,
  totalScannedSize,
  nodes,
  isLoading,
  onNavigate,
  onReveal,
  onCleanSelected,
}) => {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const toggleSelect = (p: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedPaths);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setSelectedPaths(next);
  };

  const selectedTotalBytes = nodes
    .filter((n) => selectedPaths.has(n.path))
    .reduce((acc, n) => acc + n.size, 0);

  // Top 11 nodes for circular bubble packing layout
  const topBubbles = nodes.slice(0, 11);
  const maxNodeSize = Math.max(1, topBubbles[0]?.size || 1);

  // Deterministic circular spiral coordinates around center
  const bubblePositions = [
    { x: 50, y: 48 },
    { x: 24, y: 34 },
    { x: 76, y: 35 },
    { x: 27, y: 69 },
    { x: 73, y: 68 },
    { x: 50, y: 17 },
    { x: 50, y: 80 },
    { x: 13, y: 53 },
    { x: 87, y: 53 },
    { x: 35, y: 20 },
    { x: 66, y: 20 },
  ];

  const isWindowsPath = currentPath.includes('\\');
  const sep = isWindowsPath ? '\\' : '/';
  const pathSegments = currentPath.split(/[/\\]/).filter(Boolean);

  const buildSegmentTarget = (index: number) => {
    const slice = pathSegments.slice(0, index + 1);
    return isWindowsPath ? slice.join('\\') : '/' + slice.join('/');
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden gap-4">
      {/* Top Breadcrumb & Controls Bar */}
      <div className="cmm-glass-card rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => parentPath && onNavigate(parentPath)}
            disabled={!parentPath || isLoading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors shrink-0"
            title={lang === 'tr' ? 'Üst Klasöre Çık' : 'Up One Level'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate(undefined)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            title={lang === 'tr' ? 'Ev Klasörü (Home)' : 'Home Directory'}
          >
            <Home className="w-4 h-4" />
          </button>

          {/* Interactive Clickable Breadcrumb Pills */}
          <div className="flex items-center gap-1 text-xs text-white/85 font-mono bg-black/25 px-3 py-1.5 rounded-xl border border-white/10 overflow-x-auto">
            <HardDrive className="w-3.5 h-3.5 text-purple-300 mr-1 shrink-0" />
            {!isWindowsPath && (
              <button
                onClick={() => onNavigate('/')}
                className="hover:text-fuchsia-300 transition-colors px-1 rounded"
              >
                /
              </button>
            )}
            {pathSegments.map((seg, idx) => {
              const target = buildSegmentTarget(idx);
              const isLast = idx === pathSegments.length - 1;
              const isUserSeg =
                idx === 1 &&
                (pathSegments[0] === 'Users' || pathSegments[0]?.toLowerCase() === 'users');
              const displaySeg = isUserSeg ? '~ (Home)' : seg;
              return (
                <React.Fragment key={target}>
                  <button
                    onClick={() => onNavigate(target)}
                    className={`px-1.5 py-0.5 rounded-md transition-colors truncate max-w-[140px] ${
                      isLast
                        ? 'bg-purple-500/30 text-white font-bold'
                        : 'hover:bg-white/10 text-white/75 hover:text-white'
                    }`}
                  >
                    {displaySeg}
                  </button>
                  {!isLast && <ChevronRight className="w-3 h-3 text-white/35 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-white/60">
              {lang === 'tr' ? 'Klasör Toplamı' : 'Scanned Folder Size'}
            </div>
            <div className="text-sm font-bold text-purple-200">{formatBytes(totalScannedSize)}</div>
          </div>

          {selectedPaths.size > 0 && (
            <button
              onClick={() => {
                onCleanSelected(Array.from(selectedPaths));
                setSelectedPaths(new Set());
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-xs font-semibold shadow-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'tr' ? 'Seçilenleri Sil' : 'Remove Selected'} ({formatBytes(selectedTotalBytes)})
              </span>
            </button>
          )}

          <button
            onClick={() => onNavigate(currentPath)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            title={lang === 'tr' ? 'Yeniden Tara' : 'Rescan'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Split View: Left Folder List + Right Interactive Bubble Map */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Column: Detailed Directory Tree List */}
        <div className="col-span-5 cmm-glass-card rounded-2xl p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10 text-xs text-white/60 shrink-0">
            <span>{lang === 'tr' ? `Öğeler (${nodes.length})` : `Items (${nodes.length})`}</span>
            <span>{lang === 'tr' ? 'Boyut / Oran' : 'Size / Share'}</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
            {nodes.map((node) => {
              const isSelected = selectedPaths.has(node.path);
              return (
                <div
                  key={node.path}
                  onClick={() => {
                    if (node.isDirectory) onNavigate(node.path);
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    node.isDirectory ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isSelected
                      ? 'bg-purple-500/25 border-purple-400/50'
                      : 'bg-white/[0.04] hover:bg-white/[0.10] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={(e) => toggleSelect(node.path, e)}
                      className="text-white/60 hover:text-white transition-colors shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-fuchsia-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        node.isDirectory
                          ? 'bg-gradient-to-br from-purple-500/40 to-indigo-600/40 text-purple-200'
                          : 'bg-white/10 text-white/75'
                      }`}
                    >
                      {node.isDirectory ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{node.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-fuchsia-400 to-purple-500 rounded-full"
                            style={{ width: `${Math.max(3, Math.min(100, node.percentage))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/50">{node.percentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-xs font-semibold text-white/90">{formatBytes(node.size)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReveal(node.path);
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
        </div>

        {/* Right Column: CleanMyMac 5 Interactive Circular Bubble Map */}
        <div className="col-span-7 cmm-glass-card rounded-2xl relative overflow-hidden flex items-center justify-center p-4">
          {/* Concentric Orbital Grid Lines */}
          <div className="absolute w-[440px] h-[440px] rounded-full border border-white/[0.06] pointer-events-none" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-white/[0.07] pointer-events-none" />
          <div className="absolute w-[160px] h-[160px] rounded-full border border-white/[0.08] pointer-events-none" />

          <div className="relative w-full h-full min-h-[360px]">
            {topBubbles.map((bubble, idx) => {
              const pos = bubblePositions[idx] || { x: 50, y: 50 };
              const ratio = Math.pow(bubble.size / maxNodeSize, 0.32);
              const diameter = idx === 0
                ? 148
                : Math.max(66, Math.min(124, Math.round(ratio * 126)));
              const colorClass = BUBBLE_COLORS[idx % BUBBLE_COLORS.length];

              return (
                <motion.div
                  key={bubble.path}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.04, type: 'spring', stiffness: 220, damping: 20 }}
                  whileHover={{ scale: 1.08, zIndex: 20 }}
                  onClick={() => {
                    if (bubble.isDirectory) onNavigate(bubble.path);
                    else toggleSelect(bubble.path);
                  }}
                  style={{
                    width: `${diameter}px`,
                    height: `${diameter}px`,
                    left: `calc(${pos.x}% - ${diameter / 2}px)`,
                    top: `calc(${pos.y}% - ${diameter / 2}px)`,
                  }}
                  className={`absolute rounded-full bg-gradient-to-br ${colorClass} backdrop-blur-xl border flex flex-col items-center justify-center p-2 text-center cursor-pointer shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_2px_6px_rgba(255,255,255,0.35)] select-none`}
                >
                  {bubble.isDirectory ? (
                    <Folder className="w-4 h-4 text-white/85 mb-0.5 shrink-0" />
                  ) : (
                    <File className="w-3.5 h-3.5 text-white/75 mb-0.5 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[85%]">
                    {bubble.name}
                  </span>
                  <span className="text-[10px] font-semibold text-white/85 mt-0.5">
                    {formatBytes(bubble.size)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/55 pointer-events-none">
            <span>
              {lang === 'tr'
                ? '💡 Klasör balonlarına tıklayarak içine girebilirsiniz'
                : '💡 Click any folder bubble to drill down into its contents'}
            </span>
            <span>
              {formatDisplayPath(currentPath)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
