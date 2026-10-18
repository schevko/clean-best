// Exact CleanMyLiveBackground.framework RGBA presets decoded from CleanMyMac 5 ARM64 assembly (0x1db0..0x2d00)
export type ModuleId =
  | 'smartCare'
  | 'cleanup'
  | 'protection'
  | 'performance'
  | 'applications'
  | 'clutter'
  | 'spaceLens'
  | 'cloud'
  | 'myTools'
  | 'myActivity'
  | 'settings'
  | 'about';

export interface LiveBackgroundTheme {
  id: ModuleId;
  baseHex: string;
  orb1Hex: string;
  orb2Hex: string;
  orb3Hex: string;
  accentHex: string;
  buttonGradient: string;
  buttonGlow: string;
  introAsset: string;
  scanAsset: string;
}

export const CMM5_THEMES: Record<ModuleId, LiveBackgroundTheme> = {
  smartCare: {
    // Decoded at 0x1e20: Base #090048 | Orb1 #4F0038 | Orb2 #BA2EFC | Orb3 #ED2EFF
    id: 'smartCare',
    baseHex: '#090048',
    orb1Hex: '#4F0038',
    orb2Hex: '#BA2EFC',
    orb3Hex: '#ED2EFF',
    accentHex: '#E040FB',
    buttonGradient: 'from-[#BA2EFC] via-[#D82EFF] to-[#5E35B1]',
    buttonGlow: 'rgba(237, 46, 255, 0.55)',
    introAsset: '/assets/SmartCare_Intro.png',
    scanAsset: '/assets/SmartCare_IntroAppearance.png',
  },
  cleanup: {
    // Decoded at 0x1fc4: Base #002E0A | Orb1 #002B12 | Orb2 #00992B | Orb3 #85C200
    id: 'cleanup',
    baseHex: '#002E0A',
    orb1Hex: '#002B12',
    orb2Hex: '#00992B',
    orb3Hex: '#85C200',
    accentHex: '#2EE56B',
    buttonGradient: 'from-[#00B84C] via-[#1FD655] to-[#68B800]',
    buttonGlow: 'rgba(0, 214, 79, 0.55)',
    introAsset: '/assets/JunkCleanup_Intro.png',
    scanAsset: '/assets/JunkCleanup_ScanProgress.png',
  },
  protection: {
    // Decoded at 0x2198: Base #5C0026 | Orb1 #4F0038 | Orb2 #D400E8 | Orb3 #FF54F7
    id: 'protection',
    baseHex: '#5C0026',
    orb1Hex: '#4F0038',
    orb2Hex: '#D400E8',
    orb3Hex: '#FF54F7',
    accentHex: '#FF54F7',
    buttonGradient: 'from-[#D400E8] via-[#FF2EA6] to-[#FF54F7]',
    buttonGlow: 'rgba(255, 84, 247, 0.55)',
    introAsset: '/assets/Protection_Intro.png',
    scanAsset: '/assets/Protection_ScanProgress.png',
  },
  performance: {
    // Decoded at 0x234c: Base #781C00 | Orb1 #3B0F00 | Orb2 #FF4500 | Orb3 #FF7A00
    id: 'performance',
    baseHex: '#781C00',
    orb1Hex: '#3B0F00',
    orb2Hex: '#FF4500',
    orb3Hex: '#FF7A00',
    accentHex: '#FF7A00',
    buttonGradient: 'from-[#FF4500] via-[#FF6D00] to-[#FF9E00]',
    buttonGlow: 'rgba(255, 106, 0, 0.55)',
    introAsset: '/assets/Performance_Intro.png',
    scanAsset: '/assets/Performance_ScanProgress.png',
  },
  applications: {
    // Decoded at 0x24fc: Base #002761 | Orb1 #000A3D | Orb2 #8008DE | Orb3 #246EFF
    id: 'applications',
    baseHex: '#002761',
    orb1Hex: '#000A3D',
    orb2Hex: '#8008DE',
    orb3Hex: '#246EFF',
    accentHex: '#3B82F6',
    buttonGradient: 'from-[#246EFF] via-[#5346FF] to-[#8008DE]',
    buttonGlow: 'rgba(36, 110, 255, 0.55)',
    introAsset: '/assets/Applications_Intro.png',
    scanAsset: '/assets/Applications_ScanProgress.png',
  },
  clutter: {
    // Decoded at 0x26b4: Base #004A47 | Orb1 #002E2B | Orb2 #009EC2 | Orb3 #00C9BF
    id: 'clutter',
    baseHex: '#004A47',
    orb1Hex: '#002E2B',
    orb2Hex: '#009EC2',
    orb3Hex: '#00C9BF',
    accentHex: '#00E5D9',
    buttonGradient: 'from-[#009EC2] via-[#00B8B0] to-[#00E0C6]',
    buttonGlow: 'rgba(0, 201, 191, 0.55)',
    introAsset: '/assets/MyClutter_Intro.png',
    scanAsset: '/assets/MyClutter_ScanProgress.png',
  },
  spaceLens: {
    // Decoded at 0x2860: Base #120A33 | Orb1 #12002F | Orb2 #6100C2 | Orb3 #7E0BFF
    id: 'spaceLens',
    baseHex: '#120A33',
    orb1Hex: '#12002F',
    orb2Hex: '#6100C2',
    orb3Hex: '#7E0BFF',
    accentHex: '#9D4EDD',
    buttonGradient: 'from-[#6100C2] via-[#7E0BFF] to-[#A855F7]',
    buttonGlow: 'rgba(126, 11, 255, 0.55)',
    introAsset: '/assets/SpaceLens_Intro.png',
    scanAsset: '/assets/SpaceLens_ScanProgress.png',
  },
  cloud: {
    // Cloud Cleanup theme
    id: 'cloud',
    baseHex: '#001F4D',
    orb1Hex: '#001233',
    orb2Hex: '#0066FF',
    orb3Hex: '#38B6FF',
    accentHex: '#38B6FF',
    buttonGradient: 'from-[#0066FF] via-[#1E90FF] to-[#38B6FF]',
    buttonGlow: 'rgba(56, 182, 255, 0.55)',
    introAsset: '/assets/CloudStorage_Intro.png',
    scanAsset: '/assets/CloudStorage_ScanProgress.png',
  },
  myTools: {
    // My Tools Hub theme
    id: 'myTools',
    baseHex: '#140D36',
    orb1Hex: '#251452',
    orb2Hex: '#6B21A8',
    orb3Hex: '#3B82F6',
    accentHex: '#A78BFA',
    buttonGradient: 'from-[#6B21A8] via-[#7C3AED] to-[#3B82F6]',
    buttonGlow: 'rgba(124, 58, 237, 0.55)',
    introAsset: '/assets/SmartCare_Intro_Winter.png',
    scanAsset: '/assets/EmailCleanup_ScanProgress.png',
  },
  myActivity: {
    // Decoded at 0x2a14: Base #170F2E | Orb1 #292469 | Orb2 #5957A3 | Orb3 #47477D
    id: 'myActivity',
    baseHex: '#170F2E',
    orb1Hex: '#292469',
    orb2Hex: '#5957A3',
    orb3Hex: '#47477D',
    accentHex: '#818CF8',
    buttonGradient: 'from-[#4F46E5] via-[#6366F1] to-[#818CF8]',
    buttonGlow: 'rgba(99, 102, 241, 0.55)',
    introAsset: '/assets/SmartCare_Intro.png',
    scanAsset: '/assets/SmartCare_IntroAppearance.png',
  },
  settings: {
    // Decoded at 0x2bc4: Base #5D686E | Orb1 #4F0039 | Orb2 #2DEBB2 | Orb3 #FF8754
    id: 'settings',
    baseHex: '#242B35',
    orb1Hex: '#4F0039',
    orb2Hex: '#1D9A78',
    orb3Hex: '#C85A32',
    accentHex: '#2DEBB2',
    buttonGradient: 'from-[#1D9A78] via-[#2DEBB2] to-[#0EA5E9]',
    buttonGlow: 'rgba(45, 235, 178, 0.5)',
    introAsset: '/assets/SmartCare_Intro.png',
    scanAsset: '/assets/SmartCare_IntroAppearance.png',
  },
  about: {
    id: 'about',
    baseHex: '#13072E',
    orb1Hex: '#3B0764',
    orb2Hex: '#C026D3',
    orb3Hex: '#4F46E5',
    accentHex: '#E879F9',
    buttonGradient: 'from-[#C026D3] via-[#9333EA] to-[#4F46E5]',
    buttonGlow: 'rgba(232, 121, 249, 0.5)',
    introAsset: '/assets/AppIcon.png',
    scanAsset: '/assets/SmartCare_Intro.png',
  },
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDisplayPath(rawPath?: string): string {
  if (!rawPath) return '';
  return rawPath
    .replace(/^\/Users\/[^/]+(\/|$)/, '~$1')
    .replace(/^[A-Za-z]:\\Users\\[^\\]+(\\|$)/, '~$1');
}

export function formatHostname(rawHost?: string): string {
  if (!rawHost) return 'MacBook-Pro';
  const cleaned = rawHost.replace(/\.local$/i, '');
  if (/macbook-pro/i.test(cleaned)) return 'MacBook-Pro';
  if (/macbook-air/i.test(cleaned)) return 'MacBook-Air';
  if (/mac-studio/i.test(cleaned)) return 'Mac-Studio';
  if (/mac-mini/i.test(cleaned)) return 'Mac-mini';
  if (/imac/i.test(cleaned)) return 'iMac';
  return cleaned.replace(/^[^-]+-(?=Mac|PC|Desktop|Laptop)/i, '');
}

export function playCmmSound(
  type: 'clickDown' | 'clickUp' | 'scanFinished' | 'cleanFinished' | 'cleanFailed' | 'wipe',
  enabled = true
) {
  if (!enabled) return;
  const map: Record<typeof type, string> = {
    clickDown: '/assets/sounds/Click-mouse-down.wav',
    clickUp: '/assets/sounds/Click-mouse-up.wav',
    scanFinished: '/assets/sounds/ScanFinished.wav',
    cleanFinished: '/assets/sounds/CleanFinished.wav',
    cleanFailed: '/assets/sounds/CleanFailed.wav',
    wipe: '/assets/sounds/Wipe.wav',
  };
  try {
    const audio = new Audio(map[type]);
    audio.volume = type.startsWith('click') ? 0.45 : 0.65;
    audio.play().catch(() => {});
  } catch {
    // Ignore audio errors
  }
}
