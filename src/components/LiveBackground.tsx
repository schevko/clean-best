import React from 'react';
import { CMM5_THEMES, ModuleId } from '../theme';

interface LiveBackgroundProps {
  activeModule: ModuleId;
  isScanning?: boolean;
}

export const LiveBackground: React.FC<LiveBackgroundProps> = ({ activeModule, isScanning }) => {
  const theme = CMM5_THEMES[activeModule] || CMM5_THEMES.smartCare;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden transition-colors duration-1000 ease-out z-0"
      style={{ backgroundColor: theme.baseHex }}
    >
      {/* Orb 1: Deep primary ambient shadow/glow */}
      <div
        className="absolute -top-[18%] -left-[10%] w-[72vw] h-[72vw] rounded-full blur-[110px] transition-all duration-1000 cmm-orb-1"
        style={{
          background: `radial-gradient(circle, ${theme.orb1Hex} 0%, transparent 70%)`,
          opacity: isScanning ? 0.78 : 0.62,
        }}
      />

      {/* Orb 2: Mid-tone vibrant rotating radial gradient */}
      <div
        className="absolute top-[8%] -right-[15%] w-[68vw] h-[68vw] rounded-full blur-[130px] transition-all duration-1000 cmm-orb-2"
        style={{
          background: `radial-gradient(circle, ${theme.orb2Hex} 0%, transparent 70%)`,
          opacity: isScanning ? 0.68 : 0.52,
        }}
      />

      {/* Orb 3: Highlight accent orb at bottom-center behind UbiquitousButton */}
      <div
        className="absolute -bottom-[22%] left-[18%] w-[64vw] h-[64vw] rounded-full blur-[125px] transition-all duration-1000 cmm-orb-3"
        style={{
          background: `radial-gradient(circle, ${theme.orb3Hex} 0%, transparent 68%)`,
          opacity: isScanning ? 0.72 : 0.50,
        }}
      />

      {/* Subtle radial vignette & specular glass sheen */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 58% 38%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.22) 65%, rgba(0,0,0,0.48) 100%)',
        }}
      />
    </div>
  );
};
