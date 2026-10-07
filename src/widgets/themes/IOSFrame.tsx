import type { ReactNode } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';

export interface IOSFrameProps {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
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
  const d = dims(p.size);
  const Icon = p.def.icon;
  const title = p.locale === 'fa' ? p.def.titleFa : p.def.titleEn;
  const tone = statusTone(p.status);
  const rtl = p.locale === 'fa';

  return <Box sx={{
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: d.compact ? '18px' : '20px',
    background: 'linear-gradient(180deg,rgba(255,255,255,.94),rgba(248,249,251,.94))',
    border: '1px solid rgba(60,60,67,.10)',
    boxShadow: '0 10px 28px rgba(15,23,42,.075), inset 0 1px 0 rgba(255,255,255,.82)',
    display: 'flex',
    flexDirection: 'column',
    color: '#1C1C1E',
    transition: 'transform .18s ease, box-shadow .18s ease',
    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 14px 34px rgba(15,23,42,.095), inset 0 1px 0 rgba(255,255,255,.9)' },
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
          bgcolor: 'rgba(10,132,255,.11)',
          color: '#0A84FF',
          flex: '0 0 auto',
        }}><Icon sx={{ fontSize: d.compact ? 18 : 19 }} /></Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: d.compact ? 13 : 14, lineHeight: 1.15, fontWeight: 720, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
          {!d.compact && <Typography sx={{ mt: .22, fontSize: 9.8, color: '#8E8E93', fontWeight: 590, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.roomy ? p.deviceName : p.locationLabel}</Typography>}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: .45, flex: '0 0 auto' }}>
        {!d.compact && <Box sx={{ display: 'flex', alignItems: 'center', gap: .45 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: tone }} />{d.wide && <Typography sx={{ fontSize: 9.8, color: '#8E8E93', fontWeight: 650, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.status}</Typography>}</Box>}
        {p.onInfo && <Tooltip title={rtl ? 'اطلاعات' : 'Info'}><IconButton size="small" onClick={p.onInfo} sx={{ width: 28, height: 28, color: '#8E8E93', bgcolor: 'rgba(118,118,128,.06)', '&:hover': { bgcolor: 'rgba(118,118,128,.12)' } }}><MoreHoriz sx={{ fontSize: 18 }} /></IconButton></Tooltip>}
      </Box>
    </Box>

    <Box sx={{ flex: 1, minHeight: 0, px: d.compact ? 1.2 : 1.4, pt: d.compact ? .35 : .55, pb: d.roomy ? .8 : 1.15, overflow: 'hidden' }}>{p.children}</Box>

    {d.roomy && <Box sx={{
      minHeight: 28,
      px: 1.4,
      pb: .85,
      pt: .55,
      borderTop: '1px solid rgba(60,60,67,.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1,
      direction: rtl ? 'rtl' : 'ltr',
      flex: '0 0 auto',
    }}><Typography sx={{ fontSize: 9.8, color: '#8E8E93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.locationLabel}</Typography><Typography sx={{ fontSize: 9.8, color: '#8E8E93', direction: 'ltr', whiteSpace: 'nowrap' }}>{p.lastSeen}</Typography></Box>}
  </Box>;
}
