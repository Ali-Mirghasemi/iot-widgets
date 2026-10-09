import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, IconButton, Menu, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import LocalShippingRounded from '@mui/icons-material/LocalShippingRounded';
import SettingsOutlined from '@mui/icons-material/TuneRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CheckRounded from '@mui/icons-material/CheckRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import LayersRounded from '@mui/icons-material/LayersRounded';
import CircleRounded from '@mui/icons-material/CircleRounded';
import WidgetsRounded from '@mui/icons-material/WidgetsRounded';
import ViewQuiltRounded from '@mui/icons-material/ViewQuiltRounded';
import { IoTWidget } from '../library/IoTWidget';
import { DashboardGrid, settleDashboard, type DashboardItem } from '../library/DashboardGrid';
import { WidgetThemeProvider, type DashboardAppearance } from '../library/WidgetThemeProvider';
import { widgetThemeList } from '../widgets/core/themeTokens';
import { getWidgetDefinition } from '../library/catalog';
import type { WidgetThemeId } from '../widgets/core/types';
import { getWidgetGridMinimum, widgetSizeForGrid } from '../library/adaptive';

const palettePresets = [
  {name:'Violet',primary:'#8197ff',secondary:'#4bd6bd'},
  {name:'Ocean',primary:'#43a5e7',secondary:'#4bdfce'},
  {name:'Emerald',primary:'#2cb993',secondary:'#e6af56'},
  {name:'Sunset',primary:'#f78b68',secondary:'#b291ef'},
];
const initialAppearance:DashboardAppearance={themeId:'studio',mode:'dark',colorMode:'inherit',palette:{primary:'#8197ff',secondary:'#4bd6bd'}};
const instance=(id:string,widgetId:string,x:number,y:number,w:number,h:number,data?:Record<string,unknown>):DashboardItem=>({id,widgetId,x,y,w,h,data});
const labHistory=[18.2,18.7,19.8,19.1,21.5,22.4,21.8,23.9,24.1,23.7,24.8];
const demoBoards:Record<string,{label:string,description:string,items:DashboardItem[]}>= {
 lab:{label:'Adaptive widget lab',description:'Resize a card to see compact, standard and detailed states',items:[
  {...instance('temp-compact','temperature',0,0,3,2,{value:24.8,unit:'°C',history:labHistory}),view:'compact'},
  {...instance('temp-standard','temperature',3,0,3,2,{value:24.8,unit:'°C',min:0,max:50,history:labHistory}),view:'standard'},
  instance('temp-large','temperature',6,0,6,3,{value:24.8,unit:'°C',history:labHistory}),
  instance('battery','battery',0,2,3,2,{value:78,voltage:'3.91 V'}),
  instance('pressure','pressure',3,2,3,2,{value:2.6,max:6}),
  instance('map','map',0,4,6,4),
  instance('graph','time-series',6,4,6,4,{values:[22,26,24,30,35,31,43,42,49,50,53,58,57,62,59,64]}),
 ]},
 factory:{label:'Factory overview',description:'Industrial equipment and environmental telemetry',items:[
  instance('temp','temperature',0,0,3,2,{value:24.8,trend:2.4,deviceName:'Warehouse · TH-04',history:[20.1,21.2,20.8,22.4,23.1,22.9,24.0,23.7,24.3,24.8]}),
  instance('power','power',3,0,3,2,{value:284,trend:-4.2,deviceName:'Power feed · 01',history:[305,298,296,293,307,303,299,291,287,284]}),
  instance('air','air-quality',6,0,3,2,{value:64,max:200,deviceName:'Air node · 12'}),
  instance('battery','battery',9,0,3,2,{value:87,voltage:'4.02 V',remaining:'13h 24m'}),
  instance('trend','time-series',0,2,6,3,{values:[23,27,24,30,35,32,31,39,37,42,47,44,49,50,48,55,60,57],total:'24.8°C'}),
  instance('tank','water-level',6,2,3,3,{value:68,liters:'1,360 L'}),
  instance('chart','bar-chart',9,2,3,3,{values:[32,54,42,60,44,72,63,78,55,88,79,93],total:'128 kWh'}),
  instance('humidity','humidity',0,5,3,2,{value:48,trend:1.7}),
  instance('pressure','pressure',3,5,3,2,{value:2.6,max:6}),
  instance('switch','switch',6,5,3,2,{value:true,deviceName:'Cooling fan · F-02'}),
  instance('signal','signal',9,5,3,2,{value:-74,network:'LTE / RSRP'}),
 ]},
 energy:{label:'Energy monitoring',description:'Power quality, production load, and daily consumption',items:[
  instance('total-energy','energy',0,0,3,2,{value:189.4,unit:'kWh',trend:-3.2,history:[130,133,141,143,158,163,168,179,182,189.4]}),
  instance('current','current',3,0,3,2,{value:18.2,unit:'A',trend:1.4}),
  instance('voltage','voltage',6,0,3,2,{value:230.4,unit:'V',trend:.4}),
  instance('load','power',9,0,3,2,{value:4.28,unit:'kW',trend:-2.1}),
  instance('trend','area-chart',0,2,8,3,{values:[22,31,26,35,42,33,44,51,47,59,63,57,61,55,68,73],total:'189.4 kWh'}),
  instance('bars','bar-chart',8,2,4,3,{values:[35,44,49,38,63,65,52,73,79,61,81,91],total:'4.28 kW'}),
  instance('status','device-status',0,5,4,2,{value:true}),
  instance('battery','battery',4,5,4,2,{value:84}),
  instance('alarm','alarms',8,5,4,2),
 ]},
 fleet:{label:'Fleet tracking',description:'Simulated GPS assets, connectivity, and recent activity',items:[
  instance('speed','speed',0,0,3,2,{value:74,max:160}),
  instance('signal','signal',3,0,3,2,{value:-72}),
  instance('battery','battery',6,0,3,2,{value:76}),
  instance('location','location',9,0,3,2,{latitude:35.7219,longitude:51.3347}),
  instance('map','map',0,2,8,4),
  instance('distance','distance',8,2,4,2,{value:142.6,unit:'km',trend:3.1}),
  instance('route','route',8,4,4,2),
  instance('movement','time-series',0,6,8,3,{values:[20,25,33,28,40,51,43,31,27,46,54,63,57,71],total:'74 km/h'}),
  instance('events','events',8,6,4,3),
 ]},
};
const loadItems=(key:string):DashboardItem[]=>{
  const minFor=(item:DashboardItem,n:number)=>getWidgetGridMinimum(getWidgetDefinition(item.widgetId),n);
  try{const str=window.localStorage.getItem('iot-demo-layout-'+key);if(str){const parsed:unknown=JSON.parse(str);if(Array.isArray(parsed)&&parsed.every(x=>x&&typeof x==='object'&&typeof x.widgetId==='string'&&typeof x.w==='number'))return settleDashboard(parsed as DashboardItem[],undefined,12,minFor);}}catch{/* ignore unavailable storage */}
  return settleDashboard(demoBoards[key].items.map(i=>({...i})),undefined,12,minFor);
};
const darkTokens={background:'#0c1220',surface:'#161f2f',text:'#f1f5ff',muted:'#9facbf',border:'#29364b'};
const lightTokens={background:'#f1f5fa',surface:'#ffffff',text:'#152033',muted:'#667389',border:'#e3e9f1'};

export default function DemoDashboard(){
 const [board,setBoard]=useState('factory');
 const [items,setItems]=useState<DashboardItem[]>(()=>loadItems('factory'));
 const [appearance,setAppearance]=useState<DashboardAppearance>(initialAppearance);
 const [edit,setEdit]=useState(false);
 const [expanded,setExpanded]=useState<DashboardItem|null>(null);
 const [context,setContext]=useState<{id:string;left:number;top:number}|null>(null);
 const [mobileNav,setMobileNav]=useState(false);
 const [mobileInspector,setMobileInspector]=useState(false);
 const [showCatalog,setShowCatalog]=useState(false);
 const [advancedPalette,setAdvancedPalette]=useState(false);
 const dark=appearance.mode==='dark';const tokens=dark?darkTokens:lightTokens;
 const appearanceResolved=useMemo<DashboardAppearance>(()=>({...appearance,palette:{...tokens,...appearance.palette}}),[appearance,tokens]);
 const muiTheme=useMemo(()=>createTheme({palette:{mode:appearance.mode,primary:{main:appearance.palette.primary},secondary:{main:appearance.palette.secondary},background:{default:tokens.background,paper:tokens.surface}},shape:{borderRadius:13},typography:{fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif'}}),[appearance.mode,appearance.palette.primary,appearance.palette.secondary,tokens]);
 const setPal=(updates:Partial<DashboardAppearance['palette']>)=>setAppearance(a=>({...a,palette:{...a.palette,...updates}}));
 useEffect(()=>{try{window.localStorage.setItem('iot-demo-layout-'+board,JSON.stringify(items));}catch{/* storage optional */}},[board,items]);
 const changeBoard=(next:string)=>{setBoard(next);setItems(loadItems(next));setEdit(false);setContext(null);};
 const patch=(id:string,updates:Partial<DashboardItem>)=>setItems(curr=>curr.map(i=>i.id===id?{...i,...updates}:i));
 const addWidget=(id:string)=>{const def=getWidgetDefinition(id);if(!def)return;const maxY=Math.max(0,...items.map(x=>x.y+x.h));setItems(current=>{const min=getWidgetGridMinimum(def,12);return settleDashboard([...current,instance(`${id}-${Date.now()}`,id,0,maxY,Math.max(3,min.w),Math.max(2,min.h))],undefined,12,(i,n)=>getWidgetGridMinimum(getWidgetDefinition(i.widgetId),n));});setShowCatalog(false);setEdit(true);};
 const saveJson=()=>{const json=JSON.stringify({schemaVersion:1,appearance,board,items},null,2);const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`iot-${board}-dashboard.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const renderWidget=(item:DashboardItem,expandedView=false)=>{
   const def=getWidgetDefinition(item.widgetId);
   if(!def) return null;
   return <IoTWidget key={item.id} widgetId={item.widgetId} themeId={item.themeId??appearance.themeId}
     colorMode={item.colorMode} size={widgetSizeForGrid(def,item.w,item.h,expandedView)}
     view={expandedView?'detailed':item.view??'auto'} expanded={expandedView} data={item.data} metadata={item.metadata}/>;
 };
 const sideNav=(<Box sx={{display:'flex',flexDirection:'column',gap:.5}}>{Object.entries(demoBoards).map(([id,b])=>{const Icon=id==='factory'?DashboardRounded:id==='energy'?BoltRounded:id==='lab'?ViewQuiltRounded:LocalShippingRounded;return <Button key={id} onClick={()=>{changeBoard(id);setMobileNav(false);}} fullWidth startIcon={<Icon/>} sx={{justifyContent:'flex-start',py:1.4,px:1.6,borderRadius:2.5,textTransform:'none',fontSize:13,fontWeight:700,color:board===id?'#fff':tokens.muted,bgcolor:board===id?appearance.palette.primary+'35':'transparent','&:hover':{bgcolor:appearance.palette.primary+'25'},'& .MuiButton-startIcon':{color:board===id?appearance.palette.primary:tokens.muted}}}>{b.label}</Button>;})}</Box>);
 const colorField=(name:'primary'|'secondary'|'background'|'surface'|'text'|'muted'|'border')=>{const value=appearance.palette[name]??tokens[name as keyof typeof tokens]??'#ffffff';return <Box sx={{display:'flex',alignItems:'center',gap:1,justifyContent:'space-between'}}><Typography sx={{fontSize:12,fontWeight:650,color:tokens.muted,textTransform:'capitalize'}}>{name}</Typography><Box sx={{display:'flex',alignItems:'center',gap:1}}><Typography sx={{fontSize:11,color:tokens.text,fontFamily:'monospace'}}>{value.toUpperCase()}</Typography><Box component="input" type="color" aria-label={`${name} color`} value={value} onChange={e=>setPal({[name]:e.target.value})} sx={{width:40,height:31,background:'none',p:0,border:0,cursor:'pointer'}}/></Box></Box>};
 const appearancePanel=<Box sx={{p:2.3,display:'flex',flexDirection:'column',gap:2.1}}>
   <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><Typography sx={{fontWeight:800,fontSize:14,color:tokens.text}}>Appearance studio</Typography><SettingsOutlined sx={{fontSize:19,color:tokens.muted}}/></Box>
   <Box><Typography sx={{fontSize:10.5,textTransform:'uppercase',letterSpacing:1.15,fontWeight:750,color:tokens.muted,mb:1}}>Widget visual style</Typography><Select fullWidth size="small" value={appearance.themeId} onChange={(e:SelectChangeEvent)=>setAppearance(a=>({...a,themeId:e.target.value as WidgetThemeId}))} sx={{fontSize:13,color:tokens.text,bgcolor:tokens.surface,borderRadius:2,'& .MuiSelect-icon':{color:tokens.muted},'& fieldset':{borderColor:tokens.border}}}>{widgetThemeList.map(theme=><MenuItem key={theme.id} value={theme.id}>{theme.label}</MenuItem>)}</Select></Box>
   <Box><Typography sx={{fontSize:10.5,textTransform:'uppercase',letterSpacing:1.15,fontWeight:750,color:tokens.muted,mb:1}}>Dashboard mode</Typography><Box sx={{display:'flex',gap:.6}}>{(['dark','light']as const).map(mode=><Button key={mode} fullWidth variant={appearance.mode===mode?'contained':'outlined'} onClick={()=>setAppearance(a=>({...a,mode}))} sx={{textTransform:'capitalize',fontSize:12,borderRadius:2,py:1,bgcolor:appearance.mode===mode?appearance.palette.primary:undefined,color:appearance.mode===mode?'#0b1120':tokens.muted,borderColor:tokens.border}}>{mode}</Button>)}</Box></Box>
   <Box><Typography sx={{fontSize:10.5,textTransform:'uppercase',letterSpacing:1.15,fontWeight:750,color:tokens.muted,mb:1}}>Color policy</Typography><Box sx={{display:'flex',gap:.6}}>{(['inherit','original']as const).map(mode=><Button key={mode} fullWidth variant={appearance.colorMode===mode?'contained':'outlined'} onClick={()=>setAppearance(a=>({...a,colorMode:mode}))} sx={{fontSize:11.5,textTransform:'capitalize',borderRadius:2,bgcolor:appearance.colorMode===mode?appearance.palette.primary:undefined,color:appearance.colorMode===mode?'#0b1120':tokens.muted,borderColor:tokens.border}}>{mode}</Button>)}</Box><Typography sx={{fontSize:11,mt:.85,color:tokens.muted}}>Inherit applies dashboard colors to compatible widget elements. Original keeps each theme's own palette.</Typography></Box>
   <Divider sx={{borderColor:tokens.border}}/>
   <Box><Typography sx={{fontSize:10.5,textTransform:'uppercase',letterSpacing:1.15,fontWeight:750,color:tokens.muted,mb:1.3}}>Quick palettes</Typography><Box sx={{display:'flex',gap:1}}>{palettePresets.map(p=><Tooltip key={p.name} title={p.name}><Box component="button" type="button" aria-label={`${p.name} palette`} onClick={()=>setPal({primary:p.primary,secondary:p.secondary})} sx={{p:.45,borderRadius:'50%',border:`2px solid ${appearance.palette.primary===p.primary?p.primary:tokens.border}`,bgcolor:'transparent',cursor:'pointer'}}><Box sx={{width:24,height:24,borderRadius:'50%',background:`linear-gradient(135deg,${p.primary} 50%,${p.secondary} 50%)`}}/></Box></Tooltip>)}</Box></Box>
   {colorField('primary')}{colorField('secondary')}
   <Button size="small" onClick={()=>setAdvancedPalette(x=>!x)} sx={{textTransform:'none',alignSelf:'start',fontSize:11.5,color:appearance.palette.primary,p:0}}>{advancedPalette?'Hide advanced colors':'Advanced palette colors →'}</Button>
   {advancedPalette&&<Box sx={{display:'flex',flexDirection:'column',gap:1.5}}>{colorField('background')}{colorField('surface')}{colorField('text')}{colorField('muted')}{colorField('border')}</Box>}
   <Divider sx={{borderColor:tokens.border}}/>
   <Typography sx={{fontSize:11.5,color:tokens.muted,lineHeight:1.7}}>Right-click any widget to override its theme or display density. Select <b>Edit dashboard</b> to drag cards by the top-left handle and resize them from the bottom-right corner.</Typography>
   <Box sx={{p:1.6,bgcolor:appearance.palette.primary+'17',border:`1px solid ${appearance.palette.primary}40`,borderRadius:2.3}}><Typography sx={{fontSize:12,color:tokens.text,fontWeight:700}}>Demo data</Typography><Typography sx={{fontSize:11,color:tokens.muted,mt:.5}}>All values are simulated. Control changes do not send IoT commands. The fleet map is illustrative, not a connected map service. Expanded metrics show history only when supplied by the dashboard.</Typography></Box>
 </Box>;
 return <WidgetThemeProvider appearance={appearanceResolved}><ThemeProvider theme={muiTheme}><Box sx={{minHeight:'100vh',display:'flex',background:tokens.background,color:tokens.text,transition:'background .2s,color .2s',fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif'}}>
   <Box component="aside" sx={{width:220,flex:'0 0 220px',borderRight:`1px solid ${tokens.border}`,px:1.5,pt:3,position:'sticky',top:0,height:'100vh',display:{xs:'none',lg:'flex'},flexDirection:'column',background:tokens.surface}}>
     <Box sx={{px:1.4,display:'flex',alignItems:'center',gap:1.1,mb:5}}><Box sx={{width:35,height:35,borderRadius:2.1,display:'grid',placeItems:'center',background:`linear-gradient(135deg,${appearance.palette.primary},${appearance.palette.secondary})`}}><LayersRounded sx={{color:'#0b1120'}}/></Box><Box><Typography sx={{fontWeight:850,fontSize:16,letterSpacing:'-.05em',lineHeight:1}}>NEXUS</Typography><Typography sx={{fontSize:10.5,color:tokens.muted,letterSpacing:.5,mt:.4}}>IoT Widget Studio</Typography></Box></Box>
     <Typography sx={{px:1.4,fontSize:10.2,color:tokens.muted,letterSpacing:1.1,fontWeight:800,mb:1.1}}>DEMO PANELS</Typography>{sideNav}
     <Box sx={{mt:4,px:1}}><Button fullWidth startIcon={<WidgetsRounded/>} href="?gallery=1" sx={{color:tokens.muted,justifyContent:'flex-start',fontSize:12,textTransform:'none'}}>All 63 widgets →</Button></Box>
     <Box sx={{mt:'auto',px:1.4,py:2.5,borderTop:`1px solid ${tokens.border}`}}><Box sx={{display:'flex',alignItems:'center',gap:.7}}><CircleRounded sx={{fontSize:10,color:appearance.palette.secondary}}/><Typography sx={{fontSize:12,color:tokens.text}}>Demo workspace</Typography></Box><Typography sx={{fontSize:10.5,color:tokens.muted,mt:.5}}>Local settings · no backend</Typography></Box>
   </Box>
   <Box sx={{minWidth:0,flex:1,display:'flex',flexDirection:'column'}}>
     <Box component="header" sx={{height:72,borderBottom:`1px solid ${tokens.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',px:{xs:2,md:3.5},gap:2,background:tokens.surface}}>
       <Box sx={{display:'flex',alignItems:'center',gap:1.5}}><IconButton sx={{display:{lg:'none'},color:tokens.text}} onClick={()=>setMobileNav(!mobileNav)}><DashboardRounded/></IconButton><Box><Typography sx={{fontWeight:850,letterSpacing:'-.025em',fontSize:16}}>{demoBoards[board].label}</Typography><Typography sx={{fontSize:11,color:tokens.muted}}>IoT workspace / Dashboard</Typography></Box></Box>
       <Box sx={{display:'flex',alignItems:'center',gap:1}}><Chip size="small" label="SIMULATED DATA" sx={{display:{xs:'none',sm:'flex'},height:27,color:appearance.palette.secondary,bgcolor:appearance.palette.secondary+'16',border:`1px solid ${appearance.palette.secondary}42`,fontSize:9.5,fontWeight:800,letterSpacing:.6}}/><Tooltip title="Export layout JSON"><IconButton onClick={saveJson} sx={{color:tokens.muted}}><DownloadRounded/></IconButton></Tooltip><Button variant={edit?'contained':'outlined'} startIcon={edit?<CheckRounded/>:<EditOutlined/>} onClick={()=>{setEdit(x=>!x);setContext(null);}} sx={{bgcolor:edit?appearance.palette.primary:'transparent',borderColor:tokens.border,color:edit?'#10162b':tokens.text,textTransform:'none',fontSize:12,fontWeight:800,borderRadius:2.2,px:1.6,whiteSpace:'nowrap'}}>{edit?'Done editing':'Edit dashboard'}</Button></Box>
     </Box>
     {mobileNav&&<Box sx={{p:2,display:{lg:'none'},bgcolor:tokens.surface,borderBottom:`1px solid ${tokens.border}`}}>{sideNav}<Button onClick={()=>setMobileNav(false)}>Close</Button></Box>}
     <Box sx={{display:'flex',flex:1,minWidth:0}}>
       <Box component="main" sx={{flex:1,minWidth:0,p:{xs:2,md:3.2},maxWidth:'100%'}}>
         <Box sx={{display:'flex',alignItems:'start',justifyContent:'space-between',gap:2,mb:2.8,flexWrap:'wrap'}}><Box><Typography sx={{fontSize:{xs:25,md:29},letterSpacing:'-.045em',fontWeight:820,mb:.5}}>Operations at a glance</Typography><Typography sx={{fontSize:12.5,color:tokens.muted}}>{demoBoards[board].description} · Preview environment</Typography></Box><Box sx={{display:'flex',alignItems:'center',gap:1}}>{edit&&<><Button size="small" startIcon={<AddRounded/>} onClick={()=>setShowCatalog(true)} sx={{textTransform:'none',color:appearance.palette.primary}}>Add widget</Button><Tooltip title="Reset current layout"><IconButton onClick={()=>{setItems(settleDashboard(demoBoards[board].items.map(i=>({...i})),undefined,12,(x,n)=>getWidgetGridMinimum(getWidgetDefinition(x.widgetId),n)));try{localStorage.removeItem('iot-demo-layout-'+board)}catch{/* optional */}}} sx={{color:tokens.muted}}><RestartAltRounded/></IconButton></Tooltip></>}<Typography sx={{fontSize:11,color:tokens.muted}}>{items.length} widgets</Typography></Box></Box>
         {edit&&<Box sx={{mb:2,p:1.5,border:`1px dashed ${appearance.palette.primary}86`,borderRadius:2.5,bgcolor:appearance.palette.primary+'10',color:tokens.muted,fontSize:12}}>Edit mode · Drag the handle at the top-left of a widget to move it; drag the corner at bottom-right to resize. Right-click for visual styles. Changes are stored in your browser.</Box>}
         <DashboardGrid items={items} editable={edit} onChange={setItems} renderWidget={item=>renderWidget(item)} onExpand={setExpanded} onContextItem={(item,event)=>setContext({id:item.id,left:event.clientX,top:event.clientY})}/>
         <Typography sx={{fontSize:10.5,color:tokens.muted,mt:1.5}}>Prototype with fabricated telemetry. Some legacy visuals and map tiles are illustrative.</Typography>
       </Box>
       <Box component="aside" sx={{width:260,flex:'0 0 260px',borderLeft:`1px solid ${tokens.border}`,background:tokens.surface,display:{xs:'none',xl:'block'}}}>{appearancePanel}</Box>
     </Box>
   </Box>
   <Box sx={{position:'fixed',right:15,bottom:15,zIndex:50,display:{xl:'none'}}}><Button onClick={()=>setMobileInspector(x=>!x)} variant="contained" startIcon={<SettingsOutlined/>} sx={{background:appearance.palette.primary,color:'#0b1120',textTransform:'none'}}>Appearance</Button></Box>
   {mobileInspector&&<Box sx={{display:{xl:'none'},position:'fixed',right:12,bottom:66,zIndex:49,width:290,maxHeight:'75vh',overflow:'auto',bgcolor:tokens.surface,color:tokens.text,border:`1px solid ${tokens.border}`,borderRadius:3,boxShadow:'0 18px 55px #0005'}}>{appearancePanel}</Box>}
   <Menu open={Boolean(context)} onClose={()=>setContext(null)} anchorReference="anchorPosition" anchorPosition={context?{left:context.left,top:context.top}:undefined} slotProps={{paper:{sx:{minWidth:210,maxHeight:440}}}}>
     <Typography sx={{px:2,py:1,color:'text.secondary',fontSize:11,fontWeight:850}}>WIDGET STYLE</Typography>
     <MenuItem onClick={()=>{if(context)patch(context.id,{themeId:undefined});setContext(null);}}>Follow dashboard theme</MenuItem>
     {widgetThemeList.map(theme=><MenuItem key={theme.id} onClick={()=>{if(context)patch(context.id,{themeId:theme.id});setContext(null);}}>{theme.label}</MenuItem>)}
     <Divider/><MenuItem onClick={()=>{if(context)patch(context.id,{colorMode:'inherit'});setContext(null);}}>Inherit panel colors</MenuItem><MenuItem onClick={()=>{if(context)patch(context.id,{colorMode:'original'});setContext(null);}}>Use original colors</MenuItem>
     <Divider/><Typography sx={{px:2,py:.7,fontSize:11,color:'text.secondary',fontWeight:800}}>RESPONSIVE CONTENT</Typography>
     {(['auto','compact','standard','detailed'] as const).map(mode=><MenuItem key={mode} onClick={()=>{if(context)patch(context.id,{view:mode});setContext(null);}} sx={{textTransform:'capitalize'}}>{mode==='auto'?'Auto — fit available space':mode}</MenuItem>)}
     {edit&&<><Divider/><MenuItem onClick={()=>{if(context)setItems(curr=>curr.filter(i=>i.id!==context.id));setContext(null);}} sx={{color:'error.main'}}>Remove widget</MenuItem></>}
   </Menu>
   <Dialog open={Boolean(expanded)} onClose={()=>setExpanded(null)} maxWidth={false} PaperProps={{sx:{width:'min(95vw,1500px)',height:'min(90vh,850px)',borderRadius:3,background:tokens.background,color:tokens.text}}}>
     <DialogTitle sx={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${tokens.border}`}}><Typography sx={{fontWeight:850}}>{expanded?getWidgetDefinition(expanded.widgetId)?.titleEn:'Widget'} · Expanded view</Typography><IconButton onClick={()=>setExpanded(null)} sx={{color:tokens.muted}}><CloseRounded/></IconButton></DialogTitle>
     <DialogContent sx={{p:2,height:'100%'}}>{expanded&&<Box sx={{width:'100%',height:'100%',minHeight:0}}>{renderWidget(expanded,true)}</Box>}</DialogContent>
   </Dialog>
   <Dialog open={showCatalog} onClose={()=>setShowCatalog(false)} maxWidth="sm" fullWidth><DialogTitle>Add a widget</DialogTitle><DialogContent><Typography sx={{fontSize:12,color:'text.secondary',mb:2}}>Choose a sample widget. You can reorder and resize it in edit mode.</Typography><Box sx={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:1}}>{['temperature','humidity','battery','pressure','energy','time-series','area-chart','bar-chart','water-level','switch','gauge','map','events','alarms','device-status','signal'].map(id=><Button key={id} variant="outlined" onClick={()=>addWidget(id)} sx={{textTransform:'none',justifyContent:'flex-start',fontSize:12}}>{getWidgetDefinition(id)?.titleEn??id}</Button>)}</Box></DialogContent></Dialog>
 </Box></ThemeProvider></WidgetThemeProvider>;
}
