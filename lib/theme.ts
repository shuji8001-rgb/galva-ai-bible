export type ColorThemeId = 
  | 'light-snow' 
  | 'light-crystal' 
  | 'light-platinum' 
  | 'light-emerald' 
  | 'light-sakura' 
  | 'light-amber' 
  | 'dark-zinc';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  badge: string;
  isLight: boolean;
  description: string;
  previewColors: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
  };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'light-snow',
    name: '☀️ ピュア・スノーホワイト (最高輝度・真っ白)',
    badge: '超明色・推奨',
    isLight: true,
    description: '純白の背景とクリアな青。最も明るくクリーンで、直射日光下やオフィスでも圧倒的な視認性。',
    previewColors: {
      bg: '#ffffff',
      surface: '#f8fafc',
      primary: '#0284c7',
      accent: '#38bdf8',
    },
  },
  {
    id: 'light-crystal',
    name: '💎 クリスタル・アイスブルー (爽快な明るい青白)',
    badge: '透明感',
    isLight: true,
    description: '澄み渡る氷のような淡いスカイブルーと純白。爽やかさと清潔感を極めた明るいデザイン。',
    previewColors: {
      bg: '#f0f9ff',
      surface: '#ffffff',
      primary: '#0284c7',
      accent: '#0ea5e9',
    },
  },
  {
    id: 'light-platinum',
    name: '🏛️ プラチナ・シルバー (明るい金属光沢)',
    badge: '高級感',
    isLight: true,
    description: 'めっき鋼材の品格漂うプラチナシルバーと白。落ち着きとコントラストを両立した明るいグレー。',
    previewColors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      primary: '#334155',
      accent: '#64748b',
    },
  },
  {
    id: 'light-emerald',
    name: '🌿 フレッシュ・ミント (爽やか安全グリーン)',
    badge: 'JIS・安全',
    isLight: true,
    description: '柔らかなミントホワイトと鮮快なエメラルドグリーン。安全・安心を意識した明るいスタイル。',
    previewColors: {
      bg: '#f0fdf4',
      surface: '#ffffff',
      primary: '#059669',
      accent: '#10b981',
    },
  },
  {
    id: 'light-sakura',
    name: '🌸 サクラ・ブロッサム (柔らかな明るいローズ)',
    badge: '華やか',
    isLight: true,
    description: 'ほんのり淡いサクラホワイトとローズピンク。温かく親しみやすい明るいトーン。',
    previewColors: {
      bg: '#fff1f2',
      surface: '#ffffff',
      primary: '#e11d48',
      accent: '#f43f5e',
    },
  },
  {
    id: 'light-amber',
    name: '🏖️ ウォーム・バニラ (目に優しい明るいクリーム)',
    badge: '温かみ',
    isLight: true,
    description: '温もりあるバニラアイボリーと上品なアンバーゴールド。長時間見ても疲れない上質な明るさ。',
    previewColors: {
      bg: '#fffbeb',
      surface: '#ffffff',
      primary: '#d97706',
      accent: '#f59e0b',
    },
  },
  {
    id: 'dark-zinc',
    name: '🌌 ダーク・チタン (夜間・コントラスト)',
    badge: '夜間用',
    isLight: false,
    description: '夜間作業や眩しさを抑えたい時のディープチタン＆ネイビー。',
    previewColors: {
      bg: '#0f172a',
      surface: '#1e293b',
      primary: '#38bdf8',
      accent: '#0284c7',
    },
  },
];

const STORAGE_KEY = 'galva_color_theme';

export function getStoredTheme(): ColorThemeId {
  if (typeof window === 'undefined') return 'light-snow';
  const saved = localStorage.getItem(STORAGE_KEY) as ColorThemeId;
  return saved && COLOR_THEMES.some((t) => t.id === saved) ? saved : 'light-snow';
}

export function setStoredTheme(themeId: ColorThemeId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, themeId);
  applyThemeToDOM(themeId);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: themeId }));
}

export function applyThemeToDOM(themeId: ColorThemeId): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  // 以前のテーマクラスを削除
  COLOR_THEMES.forEach((t) => {
    root.classList.remove(`theme-${t.id}`);
    if (body) body.classList.remove(`theme-${t.id}`);
  });
  // 新テーマクラスを適用
  root.classList.add(`theme-${themeId}`);
  if (body) body.classList.add(`theme-${themeId}`);
}
