import logoDark from '../assets/v1.svg';
import logoLight from '../assets/v2.svg';

export type AppTheme = 'light' | 'mono' | 'purple';

export interface ThemeTokens {
  shell: string;
  sidebar: string;
  sidebarBorder: string;
  main: string;
  mainCard: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  navActive: string;
  navIdle: string;
  btnPrimary: string;
  btnPrimaryHover: string;
  btnPrimaryText: string;
  btnSecondary: string;
  btnSecondaryBorder: string;
  btnSecondaryText: string;
  accent: string;
  input: string;
  inputBorder: string;
  progressTrack: string;
  progressFill: string;
  badge: string;
  badgeText: string;
  divider: string;
  logoBg: string;
  logoText: string;
  logo: string;
  isDark: boolean;
  widgetShell: string;
  widgetPanel: string;
  widgetWell: string;
  widgetWellHover: string;
}

const THEMES: Record<AppTheme, ThemeTokens> = {
  light: {
    shell: 'bg-[#F3F4F6]',
    sidebar: 'bg-white',
    sidebarBorder: 'border-gray-200',
    main: 'bg-[#F3F4F6]',
    mainCard: 'bg-white',
    card: 'bg-white',
    cardBorder: 'border-gray-200',
    text: 'text-gray-900',
    textMuted: 'text-gray-400',
    textSecondary: 'text-gray-500',
    navActive: 'bg-gray-100 text-gray-900',
    navIdle: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
    btnPrimary: 'bg-black hover:bg-gray-800',
    btnPrimaryHover: 'hover:bg-gray-800',
    btnPrimaryText: 'text-white',
    btnSecondary: 'bg-white hover:bg-gray-50',
    btnSecondaryBorder: 'border-gray-200',
    btnSecondaryText: 'text-gray-600',
    accent: 'text-gray-900',
    input: 'bg-white',
    inputBorder: 'border-gray-200',
    progressTrack: 'bg-gray-200',
    progressFill: 'bg-black',
    badge: 'bg-black',
    badgeText: 'text-white',
    divider: 'border-gray-200',
    logoBg: 'bg-black',
    logoText: 'text-white',
    logo: logoDark,
    isDark: false,
    widgetShell: 'bg-white/95 border-zinc-200/80',
    widgetPanel: 'bg-[#F4F4F5]/95 border-zinc-200/90',
    widgetWell: 'bg-white border-zinc-200/80',
    widgetWellHover: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700',
  },
  mono: {
    shell: 'bg-black',
    sidebar: 'bg-[#0A0A0A]',
    sidebarBorder: 'border-zinc-800',
    main: 'bg-black',
    mainCard: 'bg-[#111111]',
    card: 'bg-[#111111]',
    cardBorder: 'border-zinc-800',
    text: 'text-white',
    textMuted: 'text-zinc-500',
    textSecondary: 'text-zinc-400',
    navActive: 'bg-zinc-900 text-white',
    navIdle: 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white',
    btnPrimary: 'bg-white hover:bg-zinc-200',
    btnPrimaryHover: 'hover:bg-zinc-200',
    btnPrimaryText: 'text-black',
    btnSecondary: 'bg-transparent hover:bg-zinc-900',
    btnSecondaryBorder: 'border-zinc-700',
    btnSecondaryText: 'text-zinc-300',
    accent: 'text-white',
    input: 'bg-[#0A0A0A]',
    inputBorder: 'border-zinc-700',
    progressTrack: 'bg-zinc-800',
    progressFill: 'bg-white',
    badge: 'bg-white',
    badgeText: 'text-black',
    divider: 'border-zinc-800',
    logoBg: 'bg-white',
    logoText: 'text-black',
    logo: logoLight,
    isDark: true,
    widgetShell: 'bg-black/95 border-zinc-700/60',
    widgetPanel: 'bg-[#111111]/95 border-zinc-800/80',
    widgetWell: 'bg-[#0A0A0A] border-zinc-800/60',
    widgetWellHover: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200',
  },
  purple: {
    shell: 'bg-[#121016]',
    sidebar: 'bg-[#1A1625]',
    sidebarBorder: 'border-[#2D263F]',
    main: 'bg-[#121016]',
    mainCard: 'bg-[#1E1A2E]',
    card: 'bg-[#2D263F]',
    cardBorder: 'border-[#3D3555]',
    text: 'text-[#E0D7F5]',
    textMuted: 'text-[#8B7FA8]',
    textSecondary: 'text-[#A99BC4]',
    navActive: 'bg-[#2D263F] text-[#E0D7F5]',
    navIdle: 'text-[#8B7FA8] hover:bg-[#2D263F]/50 hover:text-[#E0D7F5]',
    btnPrimary: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',
    btnPrimaryHover: 'hover:bg-[#7C3AED]',
    btnPrimaryText: 'text-white',
    btnSecondary: 'bg-[#2D263F] hover:bg-[#3D3555]',
    btnSecondaryBorder: 'border-[#3D3555]',
    btnSecondaryText: 'text-[#C4B5FD]',
    accent: 'text-[#A78BFA]',
    input: 'bg-[#1A1625]',
    inputBorder: 'border-[#3D3555]',
    progressTrack: 'bg-[#2D263F]',
    progressFill: 'bg-[#8B5CF6]',
    badge: 'bg-[#8B5CF6]',
    badgeText: 'text-white',
    divider: 'border-[#2D263F]',
    logoBg: 'bg-[#8B5CF6]',
    logoText: 'text-white',
    logo: logoDark,
    isDark: true,
    widgetShell: 'bg-[#1A1625]/95 border-[#3D3555]/60',
    widgetPanel: 'bg-[#1E1A2E]/95 border-[#3D3555]/70',
    widgetWell: 'bg-[#121016] border-[#3D3555]/50',
    widgetWellHover: 'bg-[#2D263F] hover:bg-[#3D3555] text-[#E0D7F5]',
  },
};

export function getThemeTokens(theme: AppTheme): ThemeTokens {
  return THEMES[theme] ?? THEMES.light;
}

export function normalizeTheme(raw: string | undefined): AppTheme {
  if (raw === 'light' || raw === 'mono' || raw === 'purple') return raw;
  if (raw === 'dark') return 'mono';
  return 'light';
}
