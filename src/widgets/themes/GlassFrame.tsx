import type { ReactNode } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
export interface GlassFrameProps {
    def: WidgetDefinition;
    theme: WidgetThemeTokens;
    locale: Locale;
    size: WidgetSize;
    deviceName: string;
    locationLabel: string;
    status: string;
    lastSeen: string;
    onInfo: () => void;
    children: ReactNode;
}
const dims = (size: WidgetSize) => {
    const [w, h] = size.split('x').map(Number);
    const area = w * h;
    return { w, h, area, compact: area === 1, tall: h > w, wide: w > h, large: area >= 4 };
};
function stateColor(status: string, accent: string) {
    const value = status.toLowerCase();
    if (value.includes('critical') || value.includes('alarm'))
        return '#fb7185';
    if (value.includes('warn'))
        return '#fbbf24';
    if (value.includes('offline') || value.includes('error'))
        return '#94a3b8';
    return accent;
}
export function GlassFrame(p: GlassFrameProps) {
    const d = dims(p.size);
    const Icon = p.def.icon;
    const title = p.locale === 'fa' ? p.def.titleFa : p.def.titleEn;
    const statusColor = stateColor(p.status, p.theme.accent);
    const rtl = p.locale === 'fa';
    return <Box sx={{
            height: '100%', minHeight: 0, overflow: 'hidden', position: 'relative',
            borderRadius: d.compact ? '18px' : '22px', color: '#f8fbff',
            background: 'linear-gradient(145deg, rgba(8,20,37,.88) 0%, rgba(8,31,43,.82) 54%, rgba(7,43,48,.76) 100%)',
            border: '1px solid rgba(214,246,255,.16)',
            boxShadow: '0 18px 44px rgba(0,8,22,.30), inset 0 1px 0 rgba(255,255,255,.10), inset 0 -1px 0 rgba(125,211,252,.045)',
            backdropFilter: 'blur(10px) saturate(118%)',
            display: 'flex', flexDirection: 'column', isolation: 'isolate',
            transition: 'transform .18s ease, border-color .18s ease, box-shadow .18s ease',
            '&:hover': { transform: 'translateY(-1px)', borderColor: 'rgba(214,246,255,.25)', boxShadow: '0 22px 52px rgba(0,8,22,.34), inset 0 1px 0 rgba(255,255,255,.13)' },
        }}>
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            background: `radial-gradient(circle at 94% 4%, ${p.theme.accent}1c 0, transparent 24%), radial-gradient(circle at 5% 96%, ${p.theme.accent2}12 0, transparent 28%), linear-gradient(112deg, transparent 0 58%, rgba(255,255,255,.035) 71%, transparent 82%)` }}/>
    <Box sx={{ position: 'absolute', left: 14, right: 14, top: 0, height: '1px', pointerEvents: 'none', zIndex: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.34) 30%, rgba(125,211,252,.16) 68%, transparent)' }}/>
    <Box sx={{ position: 'absolute', left: 0, top: 20, bottom: 20, width: '1px', pointerEvents: 'none', zIndex: 1,
            background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.12), transparent)' }}/>

    <Box sx={{ position: 'relative', zIndex: 2, px: d.compact ? 1.15 : 1.35, pt: d.compact ? 1.05 : 1.15, pb: d.compact ? .45 : .55,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: .8, direction: rtl ? 'rtl' : 'ltr' }}>
      <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: .8, flex: 1 }}>
        <Box sx={{ width: d.compact ? 30 : 34, height: d.compact ? 30 : 34, borderRadius: '10px', flex: '0 0 auto', display: 'grid', placeItems: 'center',
            color: p.theme.accent, background: 'linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,.05))',
            border: '1px solid rgba(255,255,255,.19)', boxShadow: `inset 0 0 16px ${p.theme.accent}10, 0 8px 20px rgba(0,0,0,.11)` }}>
          <Icon sx={{ fontSize: d.compact ? 17 : 19 }}/>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: d.compact ? 13.2 : 14.4, lineHeight: 1.14, fontWeight: 800, letterSpacing: '-.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
          {!d.compact && <Typography sx={{ mt: .22, fontSize: 9.8, lineHeight: 1.2, color: 'rgba(227,242,248,.66)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.deviceName}</Typography>}
        </Box>
      </Box>
      <Tooltip title={rtl ? 'اطلاعات' : 'Info'}>
        <IconButton size="small" onClick={p.onInfo} sx={{ width: 27, height: 27, color: 'rgba(235,248,252,.68)', border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.035)', '&:hover': { background: 'rgba(255,255,255,.10)' } }}>
          <InfoOutlined sx={{ fontSize: 15 }}/>
        </IconButton>
      </Tooltip>
    </Box>

    {!d.compact && <Box sx={{ position: 'relative', zIndex: 2, px: 1.35, pb: .2, display: 'flex', alignItems: 'center', gap: .75, direction: rtl ? 'rtl' : 'ltr', minWidth: 0 }}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: .55, minWidth: 0 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor, boxShadow: `0 0 12px ${statusColor}99` }}/>
        <Typography sx={{ fontSize: 9.5, fontWeight: 750, color: 'rgba(235,248,252,.74)', whiteSpace: 'nowrap' }}>{p.status}</Typography>
      </Box>
      <Box sx={{ width: '1px', height: 10, flex: '0 0 1px', bgcolor: 'rgba(255,255,255,.15)' }}/>
      <Typography sx={{ fontSize: 9.5, color: 'rgba(227,242,248,.56)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.locationLabel}</Typography>
      {d.large && <Typography sx={{ marginInlineStart: 'auto', fontSize: 9.2, color: 'rgba(227,242,248,.48)', direction: rtl ? 'rtl' : 'ltr', whiteSpace: 'nowrap' }}>{p.lastSeen}</Typography>}
    </Box>}

    <Box sx={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, px: d.compact ? 1.15 : 1.35, pt: d.compact ? .5 : .8, pb: d.compact ? 1.05 : 1.2, overflow: 'hidden' }}>{p.children}</Box>
  </Box>;
}

