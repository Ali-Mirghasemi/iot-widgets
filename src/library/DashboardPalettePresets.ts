import type { DashboardPalette } from './WidgetThemeProvider';

/** Reusable starter palettes; applications can pass any CSS-compatible colors. */
export const dashboardPalettePresets:ReadonlyArray<{id:string;label:string;palette:DashboardPalette}> = [
  {id:'violet',label:'Violet',palette:{primary:'#8197ff',secondary:'#4bd6bd'}},
  {id:'ocean',label:'Ocean',palette:{primary:'#43a5e7',secondary:'#4bdfce'}},
  {id:'emerald',label:'Emerald',palette:{primary:'#2cb993',secondary:'#e6af56'}},
  {id:'sunset',label:'Sunset',palette:{primary:'#f78b68',secondary:'#b291ef'}},
];

export const dashboardSurfacePalettes = {
  dark:{background:'#0c1220',surface:'#161f2f',text:'#f1f5ff',muted:'#9facbf',border:'#29364b'},
  light:{background:'#f1f5fa',surface:'#ffffff',text:'#152033',muted:'#667389',border:'#e3e9f1'},
} as const;
