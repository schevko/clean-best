import React from 'react';
import { motion } from 'framer-motion';
import { CMM5_THEMES, ModuleId, playCmmSound } from '../theme';

interface UbiquitousButtonProps {
  activeModule: ModuleId;
  label: string;
  subLabel?: string;
  isScanning?: boolean;
  disabled?: boolean;
  soundEnabled?: boolean;
  onClick: () => void;
}

export const UbiquitousButton: React.FC<UbiquitousButtonProps> = ({
  activeModule,
  label,
  subLabel,
  isScanning = false,
  disabled = false,
  soundEnabled = true,
  onClick,
}) => {
  const theme = CMM5_THEMES[activeModule] || CMM5_THEMES.smartCare;

  return (
    <div className="relative w-[108px] h-[108px] shrink-0 flex flex-col items-center justify-center select-none z-30">
      {/* Outer Ambient Pulse Ring (contained within button bounds so it never causes scroll overflow) */}
      <motion.div
        animate={
          isScanning
            ? { opacity: [0.45, 0.85, 0.45] }
            : { opacity: [0.35, 0.65, 0.35] }
        }
        transition={
          isScanning
            ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
        }
        className="absolute inset-0 rounded-full blur-lg pointer-events-none"
        style={{ background: theme.buttonGlow }}
      />

      {/* Glassmorphic Outer Rim Ring (UbiquitousButtonUI signature bezel) */}
      <div className="relative p-[6px] rounded-full bg-white/10 backdrop-blur-xl border border-white/25 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        {/* Spinning Conic Halo when scanning */}
        {isScanning && (
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${theme.accentHex} 50%, transparent 100%)`,
              opacity: 0.75,
            }}
          />
        )}

        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.94 }}
          disabled={disabled}
          onMouseDown={() => playCmmSound('clickDown', soundEnabled)}
          onClick={() => {
            playCmmSound('clickUp', soundEnabled);
            onClick();
          }}
          className={`relative w-[96px] h-[96px] rounded-full flex flex-col items-center justify-center text-white font-semibold tracking-wide transition-all duration-300 bg-gradient-to-br ${theme.buttonGradient} shadow-[inset_0_2px_6px_rgba(255,255,255,0.45),0_6px_20px_rgba(0,0,0,0.35)] border border-white/35 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
        >
          {/* Specular Top Highlight */}
          <div
            className="absolute top-0 inset-x-2 h-8 rounded-t-full pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 100%)',
            }}
          />
          <span className="relative z-10 text-[15px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            {label}
          </span>
          {subLabel && (
            <span className="relative z-10 text-[10px] font-medium text-white/85 mt-0.5">
              {subLabel}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
};
