import DemoDashboard from './demo/DemoDashboard';
import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import WidgetsOutlined from '@mui/icons-material/WidgetsOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import { ShowcaseToolbar } from './components/ShowcaseToolbar';
import { widgetCategories, widgetRegistry, widgetThemes } from './widgets';
import { WidgetCard } from './widgets/core/WidgetCard';
import type { Locale, WidgetCategory, WidgetThemeId } from './widgets/core/types';
import { tr } from './i18n/translations';

const validThemes = new Set(Object.keys(widgetThemes));
const validCategories = new Set<string>(widgetCategories);

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const qaMode = query.get('qa') === '1';

  if (qaMode) {
    const themeParam = query.get('theme') ?? 'material';
    const categoryParam = query.get('category') ?? 'metrics';
    const localeParam = query.get('locale') === 'fa' ? 'fa' : 'en';
    const themeId = (validThemes.has(themeParam) ? themeParam : 'material') as WidgetThemeId;
    const category = (validCategories.has(categoryParam) ? categoryParam : 'metrics') as WidgetCategory;
    return <WidgetQaPage themeId={themeId} category={category} locale={localeParam} />;
  }

  if (query.get('gallery') === '1') return <ShowcaseApp/>;
  return <DemoDashboard/>;
}

function ShowcaseApp() {
  const [locale,setLocale]=useState<Locale>('en');
  const [themeId,setThemeId]=useState<WidgetThemeId>('material');
  const [category,setCategory]=useState<WidgetCategory|'all'>('all');
  const [search,setSearch]=useState('');
  const t=tr(locale); const widgetTheme=widgetThemes[themeId];

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return widgetRegistry.filter(w => (category==='all'||w.category===category) && (!q || [w.id,w.titleEn,w.titleFa,w.descriptionFa].join(' ').toLowerCase().includes(q)));
  },[category,search]);
  const counts=useMemo(()=>widgetRegistry.reduce<Record<string,number>>((acc,w)=>{acc.all=(acc.all??0)+1;acc[w.category]=(acc[w.category]??0)+1;return acc;},{}),[]);

  return <Box sx={{ minHeight:'100vh', pb:6 }} dir={locale==='fa'?'rtl':'ltr'}>
    <Box sx={{ bgcolor:'#0b1220', color:'#fff', position:'relative', overflow:'hidden', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
      <Box sx={{ position:'absolute',width:380,height:380,borderRadius:'50%',bgcolor:'primary.main',filter:'blur(120px)',opacity:.26,right:'8%',top:-250 }} />
      <Container maxWidth={false} sx={{ px:{xs:2,md:4},py:{xs:3,md:4.2},position:'relative' }}>
        <Typography variant="overline" sx={{ color:'#9fb5ff', fontWeight:800, letterSpacing:1.4 }}>MODULAR · BILINGUAL · THEMEABLE</Typography>
        <Typography variant="h3" sx={{ mt:.3,fontWeight:850,fontSize:{xs:30,md:44},letterSpacing:'-.035em' }}>{t.title}</Typography>
        <Typography sx={{ mt:1,color:'#aab5c8',maxWidth:720,fontSize:{xs:14,md:16} }}>{t.subtitle}</Typography>
        <Box sx={{ display:'flex',gap:1.2,mt:3,flexWrap:'wrap' }}>
          <Stat icon={<WidgetsOutlined/>} value={widgetRegistry.length} label={locale==='fa'?'نوع ویجت':'widget types'} />
          <Stat icon={<PaletteOutlined/>} value={Object.keys(widgetThemes).length} label={locale==='fa'?'تم مستقل':'widget themes'} />
          <Stat icon={<GridViewOutlined/>} value={9} label={locale==='fa'?'اندازه شبکه':'grid sizes'} />
        </Box>
      </Container>
    </Box>

    <Container maxWidth={false} sx={{ px:{xs:2,md:4},mt:-1.2 }}>
      <Paper elevation={0} sx={{ p:{xs:1.5,md:2}, border:'1px solid #e5e9f2', borderRadius:4, boxShadow:'0 12px 28px rgba(15,23,42,.06)', position:'sticky', top:8, zIndex:20 }}>
        <ShowcaseToolbar locale={locale} onLocale={setLocale} themeId={themeId} onTheme={setThemeId} category={category} onCategory={setCategory} search={search} onSearch={setSearch} counts={counts} />
      </Paper>

      <Box sx={{ mt:3, mb:1.5, display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:2 }}>
        <Typography sx={{ fontWeight:850,fontSize:22 }}>{filtered.length} {t.widgets}</Typography>
        <Typography variant="body2" color="text.secondary">{widgetTheme.label} · {category==='all'?'All categories':category}</Typography>
      </Box>

      {filtered.length ? <Box sx={{
        p: widgetTheme.id==='gaming' || widgetTheme.id==='glass' || widgetTheme.id==='industrial' ? {xs:1,md:1.5} : 0,
        borderRadius:4,
        background: widgetTheme.id==='gaming' ? 'radial-gradient(circle at 18% 0%, rgba(25,247,255,.10), transparent 28%), #040914' : widgetTheme.id==='glass' || widgetTheme.id==='industrial' ? widgetTheme.background : 'transparent',
        transition:'background .25s ease',
      }}><Box className="widget-grid">
        {filtered.map(def=><WidgetCard key={def.id} def={def} theme={widgetTheme} locale={locale} />)}
      </Box></Box> : <Paper variant="outlined" sx={{p:6,textAlign:'center',borderRadius:4}}><Typography color="text.secondary">{t.noResults}</Typography></Paper>}
    </Container>
  </Box>;
}

function WidgetQaPage({ themeId, category, locale }: { themeId:WidgetThemeId; category:WidgetCategory; locale:Locale }) {
  const theme = widgetThemes[themeId];
  const widgets = widgetRegistry.filter(w => w.category === category);
  const pageBackground = themeId === 'industrial' ? theme.background : themeId === 'gaming'
    ? 'radial-gradient(circle at 20% 0%, rgba(25,247,255,.10), transparent 28%), #040914'
    : themeId === 'glass'
      ? theme.background
      : '#edf1f5';

  return <Box data-qa-page="true" sx={{ minHeight:'100vh', minWidth:1920, bgcolor:'#edf1f5', background:pageBackground, py:3, px:3 }} dir={locale==='fa'?'rtl':'ltr'}>
    <Box sx={{ mb:3, p:2, borderRadius:2, bgcolor:themeId==='gaming'||themeId==='glass'||themeId==='industrial'?'rgba(2,8,23,.52)':'#fff', color:themeId==='gaming'||themeId==='glass'||themeId==='industrial'?'#fff':'#111827', border:`1px solid ${theme.border}` }}>
      <Typography sx={{fontSize:22,fontWeight:900}}>Visual QA · {theme.label} · {category}</Typography>
      <Typography sx={{mt:.4,fontSize:12,opacity:.7}}>Every supported size is rendered below. Generated for overlap, clipping and responsive-content inspection.</Typography>
    </Box>

    {widgets.map(def => <Box key={def.id} data-qa-widget-section={def.id} sx={{ mb:4.5 }}>
      <Box sx={{ display:'flex', alignItems:'baseline', gap:1.3, mb:1.2, color:themeId==='gaming'||themeId==='glass'||themeId==='industrial'?'#fff':'#111827' }}>
        <Typography sx={{fontSize:18,fontWeight:900}}>{def.titleEn}</Typography>
        <Typography sx={{fontSize:11,opacity:.65,direction:'ltr'}}>{def.id}</Typography>
        <Typography sx={{fontSize:11,opacity:.65,direction:'ltr'}}>{def.supportedSizes.join(' · ')}</Typography>
      </Box>
      <Box className="qa-widget-grid">
        {def.supportedSizes.map(size => <QaErrorBoundary key={`${def.id}-${size}`} defId={def.id} size={size} themeId={theme.id}>
          <WidgetCard def={def} theme={theme} locale={locale} forcedSize={size} qaMode />
        </QaErrorBoundary>)}
      </Box>
    </Box>)}
  </Box>;
}


class QaErrorBoundary extends Component<{
  children: ReactNode;
  defId: string;
  size: string;
  themeId: string;
}, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Widget QA] ${this.props.defId} ${this.props.size}`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const sizeClass = `size-${this.props.size.replace('x','-')}`;
    return <Box
      className={`widget-grid-item ${sizeClass}`}
      data-qa-error="true"
      data-widget-id={this.props.defId}
      data-widget-size={this.props.size}
      data-widget-theme={this.props.themeId}
      sx={{
        minWidth:0,
        minHeight:0,
        height:'100%',
        overflow:'hidden',
        p:2,
        borderRadius:3,
        border:'2px solid #ef4444',
        bgcolor:'#fff1f2',
        color:'#991b1b',
        display:'flex',
        flexDirection:'column',
        justifyContent:'center',
        gap:1,
      }}
    >
      <Typography sx={{fontWeight:900,fontSize:14}}>Widget render error</Typography>
      <Typography sx={{fontWeight:800,fontSize:12,direction:'ltr'}}>{this.props.defId} · {this.props.size}</Typography>
      <Typography sx={{fontSize:11,lineHeight:1.5,direction:'ltr',wordBreak:'break-word'}}>{this.state.error.message}</Typography>
    </Box>;
  }
}

function Stat({icon,value,label}:{icon:React.ReactNode;value:number;label:string}) {
  return <Box sx={{display:'flex',alignItems:'center',gap:1,px:1.4,py:.9,border:'1px solid rgba(255,255,255,.12)',bgcolor:'rgba(255,255,255,.05)',borderRadius:2.5}}><Box sx={{display:'grid',placeItems:'center',color:'#9fb5ff','& svg':{fontSize:18}}}>{icon}</Box><Typography sx={{fontWeight:850}}>{value}</Typography><Typography variant="caption" sx={{color:'#aab5c8'}}>{label}</Typography></Box>;
}
