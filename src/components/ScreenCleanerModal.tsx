import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, ShieldCheck, Volume2 } from 'lucide-react';
import { playCmmSound } from '../theme';

interface ScreenCleanerModalProps {
  isOpen: boolean;
  lang: 'tr' | 'en';
  soundEnabled: boolean;
  onClose: () => void;
}

export const ScreenCleanerModal: React.FC<ScreenCleanerModalProps> = ({
  isOpen,
  lang,
  soundEnabled,
  onClose,
}) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [wipeCount, setWipeCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setHoldProgress(0);
      return;
    }

    playCmmSound('wipe', soundEnabled);

    let interval: ReturnType<typeof setInterval> | null = null;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape' && !interval) {
        interval = setInterval(() => {
          setHoldProgress((prev) => {
            if (prev >= 100) {
              if (interval) clearInterval(interval);
              onClose();
              return 100;
            }
            return prev + 10;
          });
        }, 120);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        setHoldProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [isOpen, onClose, soundEnabled]);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => {
        setWipeCount((c) => c + 1);
        playCmmSound('wipe', soundEnabled);
      }}
      className="fixed inset-0 z-50 bg-[#05050A] flex flex-col items-center justify-center select-none cursor-crosshair overflow-hidden"
    >
      {/* Animated Squeegee Sheen Wave */}
      <motion.div
        key={wipeCount}
        initial={{ x: '-100%', opacity: 0.5 }}
        animate={{ x: '120%', opacity: 0 }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
        className="absolute inset-y-0 w-64 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12 pointer-events-none"
      />

      <div className="relative z-10 max-w-md text-center px-6 py-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-600/30 border border-cyan-300/40 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Lock className="w-8 h-8 text-cyan-300" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {lang === 'tr' ? 'Ekran ve Klavye Temizleme Modu Aktif' : 'Screen & Keyboard Cleaning Mode Active'}
        </h2>
        <p className="text-sm text-white/65 leading-relaxed mb-6">
          {lang === 'tr'
            ? 'Tüm klavye tuşları ve fare tıklamaları geçici olarak kilitlendi. Ekranınızı ve klavyenizi güvenle silebilirsiniz.'
            : 'All keyboard keys and accidental clicks are locked so you can safely wipe your display and keyboard.'}
        </p>

        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setWipeCount((c) => c + 1);
              playCmmSound('wipe', soundEnabled);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-cyan-200 border border-white/10 transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>{lang === 'tr' ? 'Cam Silme Efekti (Wipe)' : 'Trigger Wipe Polish'}</span>
          </button>

          <button
            onDoubleClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-semibold text-emerald-200 border border-emerald-400/30 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'tr' ? 'Çıkmak İçin Çift Tıkla' : 'Double-Click to Unlock'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-white/50 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>
              {lang === 'tr'
                ? 'Kilidi açmak için ESC tuşuna basılı tutun veya yukarıdaki butona çift tıklayın'
                : 'Hold ESC key or double-click the button above to exit Screen Cleaner'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-100"
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
