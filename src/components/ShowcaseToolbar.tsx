import {
  Box, Chip, FormControl, InputAdornment, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import TranslateRounded from '@mui/icons-material/TranslateRounded';
import type { Locale, WidgetCategory, WidgetThemeId } from '../widgets/core/types';
import { categoryLabels, tr } from '../i18n/translations';
import { widgetThemeList } from '../widgets/core/themeTokens';

interface Props {
  locale: Locale;
  onLocale: (v: Locale) => void;
  themeId: WidgetThemeId;
  onTheme: (v: WidgetThemeId) => void;
  category: WidgetCategory | 'all';
  onCategory: (v: WidgetCategory | 'all') => void;
  search: string;
  onSearch: (v: string) => void;
  counts: Record<string, number>;
}

export function ShowcaseToolbar(props: Props) {
  const t = tr(props.locale);
  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(240px,1fr) auto auto' }, gap: 1.5, alignItems: 'center' }}>
      <TextField
        size="small" value={props.search} onChange={e => props.onSearch(e.target.value)} placeholder={t.search}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 3 } }}
      />
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <Select value={props.themeId} onChange={e => props.onTheme(e.target.value as WidgetThemeId)} sx={{ bgcolor: '#fff', borderRadius: 3 }}>
          {widgetThemeList.map(item => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>)}
        </Select>
      </FormControl>
      <ToggleButtonGroup exclusive size="small" value={props.locale} onChange={(_,v)=>v&&props.onLocale(v)} sx={{ bgcolor:'#fff', borderRadius:3 }}>
        <ToggleButton value="en" sx={{ gap: .6, px: 1.4 }}><TranslateRounded fontSize="small"/> EN</ToggleButton>
        <ToggleButton value="fa" sx={{ px: 1.4 }}>فارسی</ToggleButton>
      </ToggleButtonGroup>
    </Box>

    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', direction: props.locale === 'fa' ? 'rtl' : 'ltr' }}>
      <Chip clickable label={`${t.all} · ${props.counts.all ?? 0}`} color={props.category==='all'?'primary':'default'} variant={props.category==='all'?'filled':'outlined'} onClick={()=>props.onCategory('all')} />
      {(Object.keys(categoryLabels) as WidgetCategory[]).map(cat => <Chip key={cat} clickable
        label={`${categoryLabels[cat][props.locale]} · ${props.counts[cat] ?? 0}`}
        color={props.category===cat?'primary':'default'} variant={props.category===cat?'filled':'outlined'} onClick={()=>props.onCategory(cat)} />)}
    </Box>
  </Box>;
}
