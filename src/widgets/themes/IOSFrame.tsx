import type { ReactNode } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
import type { ResolvedWidgetView } from '../../library/adaptive';

export interface IOSFrameProps {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
  view?: ResolvedWidgetView;
  deviceName: string;
  locationLabel: string;
  status: string;
  lastSeen: string;
  onInfo?: () => void;
  children: ReactNode;
}

const dims = (size: WidgetSize) => {
  const [w, h] = size.split('x').map(Number);
  const area = w * h;
  return { w, h, area, compact: w === 1 && h === 1, roomy: area >= 4 || w >= 3 || h >= 2, wide: w > h, tall: h > w };
};

function statusTone(status: string) {
  const low = status.toLowerCase();
  if (low.includes('critical') || low.includes('alarm')) return '#FF453A';
  if (low.includes('warn')) return '#FF9F0A';
  return '#30D158';
}

export function IOSFrame(p: IOSFrameProps) {
  const original=dims(p.size);
  const d={...original,compact:p.view==='compact'||original.compact,roomy:p.view==='compact'||p.view==='standard'?false:original.roomy};
  const Icon = p.def.icon;
  const title = p.locale === 'fa' ? p.def.titleFa : p.def.titleEn;
  const tone = statusTone(p.status);
  const rtl = p.locale === 'fa';
  // Cupertino cards must use the same light/dark semantic surface as their
  // children. Previously the frame was always white while compact readings
  // inherited white text from the dark dashboard palette.
  const dark = p.theme.inheritPalette === true && p.theme.paletteMode === 'dark';
  const ink = p.theme.inheritPalette ? p.theme.foreground : '#1C1C1E';
  const secondary = dark ? '#BAC6D9' : '#636366';
  const tertiary = dark ? '#A6B4C9' : '#73737A';
  const border = dark ? p.theme.border : 'rgba(60,60,67,.12)';
  const face = dark ? p.theme.surface : '#F8F9FB';
  const panel = dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.72)';
  const fill = dark ? 'rgba(220,231,255,.12)' : 'rgba(118,118,128,.10)';
  const fillStrong = dark ? 'rgba(220,231,255,.18)' : 'rgba(118,118,128,.16)';

  return <Box data-ios-palette={dark ? 'dark' : 'light'} data-ios-surface-color={face} sx={{
    height: '100%',
    width: '100%',
    minHeight: 0,
    minWidth: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    // Fill the positioned IoTWidget/WidgetCard slot even if a parent has
    // an intrinsically-sized flex child. Percentage height alone previously
    // let the header/footer collapse into a short strip on Nexus cards.
    position: 'absolute',
    inset: 0,
    borderRadius: d.compact ? '18px' : '20px',
    background: dark ? `linear-gradient(155deg,${face},${face})` : 'linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,249,251,.94))',
    backgroundColor: face,
    border: `1px solid ${border}`,
    boxShadow: dark ? '0 12px 30px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06)' : '0 10px 28px rgba(15,23,42,.075), inset 0 1px 0 rgba(255,255,255,.82)',
    '--iot-ios-label': ink,
    '--iot-ios-secondary': secondary,
    '--iot-ios-tertiary': tertiary,
    '--iot-ios-separator': border,
    '--iot-ios-fill': fill,
    '--iot-ios-fill-strong': fillStrong,
    '--iot-ios-surface': panel,
    '--iot-ios-blue': p.theme.inheritPalette ? p.theme.accent : '#0A84FF',
    display: 'flex',
    flexDirection: 'column',
    color: ink,
    transition: 'transform .18s ease, box-shadow .18s ease',
    '&:hover': { transform: 'translateY(-1px)', boxShadow: dark ? '0 14px 34px rgba(0,0,0,.28)' : '0 14px 34px rgba(15,23,42,.095), inset 0 1px 0 rgba(255,255,255,.9)' },
  }}>
    <Box sx={{
      minHeight: d.compact ? 48 : 53,
      px: d.compact ? 1.15 : 1.35,
      pt: d.compact ? 1.05 : 1.15,
      pb: d.compact ? .55 : .6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: .8,
      direction: rtl ? 'rtl' : 'ltr',
      flex: '0 0 auto',
    }}>
      <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: .8, flex: 1 }}>
        <Box sx={{
          width: d.compact ? 31 : 34,
          height: d.compact ? 31 : 34,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: `${p.theme.accent}19`,
          color: p.theme.accent,
          flex: '0 0 auto',
        }}><Icon sx={{ fontSize: d.compact ? 18 : 19 }} /></Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: d.compact ? 13 : 14, lineHeight: 1.15, fontWeight: 720, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
          {!d.compact && <Typography sx={{ mt: .22, fontSize: 9.8, color: tertiary, fontWeight: 590, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.roomy ? p.deviceName : p.locationLabel}</Typography>}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: .45, flex: '0 0 auto' }}>
        {!d.compact && <Box sx={{ display: 'flex', alignItems: 'center', gap: .45 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: tone }} />{d.wide && <Typography sx={{ fontSize: 9.8, color: tertiary, fontWeight: 650, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.status}</Typography>}</Box>}
        {p.onInfo && <Tooltip title={rtl ? 'اطلاعات' : 'Info'}><IconButton size="small" onClick={p.onInfo} sx={{ width: 28, height: 28, color: tertiary, bgcolor: fill, '&:hover': { bgcolor: fillStrong } }}><MoreHoriz sx={{ fontSize: 18 }} /></IconButton></Tooltip>}
      </Box>
    </Box>

    <Box sx={{ flex: 1, minHeight: 0, px: d.compact ? 1.2 : 1.4, pt: d.compact ? .35 : .55, pb: d.roomy ? .8 : 1.15, overflow: 'hidden' }}>{p.children}</Box>

    {d.roomy && <Box sx={{
      minHeight: 28,
      px: 1.4,
      pb: .85,
      pt: .55,
      borderTop: `1px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1,
      direction: rtl ? 'rtl' : 'ltr',
      flex: '0 0 auto',
    }}><Typography sx={{ fontSize: 9.8, color: tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.locationLabel}</Typography><Typography sx={{ fontSize: 9.8, color: tertiary, direction: 'ltr', whiteSpace: 'nowrap' }}>{p.lastSeen}</Typography></Box>}
  </Box>;
}
