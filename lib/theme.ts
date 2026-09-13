export type ColorThemeId = 
  | 'modern-galva' 
  | 'classic-slate' 
  | 'serene-sage' 
  | 'warm-craft' 
  | 'clean-white' 
  | 'deep-titan';

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
    id: 'modern-galva',
    name: '👑 モダン・ガルバ (推奨・黄金バランス)',
    badge: '黄金比率',
    isLight: true,
    description: '上品なソフトスレート背景と純白カード、引き締まったダークヘッダー。白飛びせず目に優しい最高峰のUIバランス。',
    previewColors: {
      bg: '#eef2f6',
      surface: '#ffffff',
      primary: '#2563eb',
      accent: '#0f172a',
    },
  },
  {
    id: 'classic-slate',
    name: '🏛️ クラシック・スレート (落ち着いた工業美)',
    badge: '品格',
    isLight: true,
    description: '亜鉛めっき鋼材の質感を想起させる落ち着いたチタンスレート。コントラストが高く長時間の作業に最適。',
    previewColors: {
      bg: '#e2e8f0',
      surface: '#ffffff',
      primary: '#334155',
      accent: '#0284c7',
    },
  },
  {
    id: 'serene-sage',
    name: '🌿 セージ＆エメラルド (目に優しい自然派)',
    badge: '疲労軽減',
    isLight: true,
    description: '柔らかなセージグリーンの背景と深みのあるエメラルド。眩しさを抑えたリラックスできる配色。',
    previewColors: {
      bg: '#e8efe9',
      surface: '#ffffff',
      primary: '#047857',
      accent: '#059669',
    },
  },
  {
    id: 'warm-craft',
    name: '🏖️ ウォーム・クラフト (温かみのあるアイボリー)',
    badge: '温もり',
    isLight: true,
    description: '上質なクラフト紙のような淡いアイボリーサンド。柔らかな光の反射で文字がくっきり読めるデザイン。',
    previewColors: {
      bg: '#f4efe6',
      surface: '#ffffff',
      primary: '#b45309',
      accent: '#d97706',
    },
  },
  {
    id: 'clean-white',
    name: '☀️ クリーン・ライト (明るいオフィス仕様)',
    badge: '爽快',
    isLight: true,
    description: '明るさを保ちつつ境界線をくっきり際立たせたクリアライト。',
    previewColors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      primary: '#0284c7',
      accent: '#38bdf8',
    },
  },
  {
    id: 'deep-titan',
    name: '🌌 ディープ・チタン (夜間ダークモード)',
    badge: '夜間',
    isLight: false,
    description: '夜間や暗所での作業に特化した高コントラストダーク。',
    previewColors: {
      bg: '#0b1120',
      surface: '#1e293b',
      primary: '#38bdf8',
      accent: '#60a5fa',
    },
  },
];

const STORAGE_KEY = 'galva_color_theme';

export function getStoredTheme(): ColorThemeId {
  if (typeof window === 'undefined') return 'modern-galva';
  const saved = localStorage.getItem(STORAGE_KEY) as ColorThemeId;
  return saved && COLOR_THEMES.some((t) => t.id === saved) ? saved : 'modern-galva';
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
  // 以前のテーマクラスおよびdarkクラスを削除
  root.classList.remove('dark');
  if (body) body.classList.remove('dark');
  COLOR_THEMES.forEach((t) => {
    root.classList.remove(`theme-${t.id}`);
    if (body) body.classList.remove(`theme-${t.id}`);
  });
  // 新しいテーマクラスを付与
  root.classList.add(`theme-${themeId}`);
  if (body) body.classList.add(`theme-${themeId}`);
  if (!COLOR_THEMES.find((t) => t.id === themeId)?.isLight) {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
  }
}
