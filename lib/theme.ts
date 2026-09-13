export type ColorThemeId = 'zinc' | 'cyan' | 'amber' | 'emerald' | 'monochrome';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  badge: string;
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
    id: 'zinc',
    name: 'ジンク・メタルシルバー',
    badge: 'ガルバ推奨',
    description: '溶融亜鉛の金属光沢とスパングルを表現。銀灰色とスカイブルーの洗練された濃淡。',
    previewColors: {
      bg: '#090d16',
      surface: '#131b2e',
      primary: '#38bdf8',
      accent: '#94a3b8',
    },
  },
  {
    id: 'cyan',
    name: 'ディープ・シアン',
    badge: '知性・品管',
    description: '深海の漆黒ネイビーと氷光シアン。コントラストが高く視認性に優れた濃淡パレット。',
    previewColors: {
      bg: '#04101d',
      surface: '#0c1e33',
      primary: '#06b6d4',
      accent: '#38bdf8',
    },
  },
  {
    id: 'amber',
    name: 'インダストリアル・アンバー',
    badge: '現場・熱量',
    description: '亜鉛浴の熱量と工場の安全灯。漆黒カーボンと温かみある琥珀色の重厚な濃淡。',
    previewColors: {
      bg: '#0c0a09',
      surface: '#1c1917',
      primary: '#f59e0b',
      accent: '#fbbf24',
    },
  },
  {
    id: 'emerald',
    name: 'フォレスト・エメラルド',
    badge: 'JIS・品質',
    description: '深緑のダークスレートと鮮やかなエメラルド。落ち着きと信頼感を醸し出す濃淡。',
    previewColors: {
      bg: '#05130d',
      surface: '#0f241a',
      primary: '#10b981',
      accent: '#34d399',
    },
  },
  {
    id: 'monochrome',
    name: 'オブシディアン・モノトーン',
    badge: '極上ミニマル',
    description: '色数を極限まで絞り込み、黒・白・プラチナ灰の濃淡のみで構成された極致スタイル。',
    previewColors: {
      bg: '#000000',
      surface: '#121212',
      primary: '#ffffff',
      accent: '#a1a1aa',
    },
  },
];

const STORAGE_KEY = 'galva_color_theme';

export function getStoredTheme(): ColorThemeId {
  if (typeof window === 'undefined') return 'zinc';
  const saved = localStorage.getItem(STORAGE_KEY) as ColorThemeId;
  return saved && COLOR_THEMES.some((t) => t.id === saved) ? saved : 'zinc';
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
