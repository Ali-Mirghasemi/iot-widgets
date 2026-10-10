import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Box, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded';
import type { WidgetInstanceConfig } from './types';
import { settleDashboard } from './layout';
import { getWidgetDefinition } from './catalog';
import { getWidgetGridMinimum, isCanvasWidget } from './adaptive';
export { settleDashboard } from './layout';

export type DashboardItem = WidgetInstanceConfig & {
  id: string;
  x: number; y: number; w: number; h: number;
  colorMode?: 'inherit' | 'original';
};
export type DashboardGridProps = {
  items: DashboardItem[];
  editable?: boolean;
  onChange: (items: DashboardItem[]) => void;
  renderWidget: (item: DashboardItem) => ReactNode;
  onExpand?: (item: DashboardItem) => void;
  onContextItem?: (item: DashboardItem, event: React.MouseEvent<HTMLDivElement>) => void;
  columns?: number;
  rowHeight?: number;
  gap?: number;
};

type Gesture = {kind:'drag'|'resize';id:string;startX:number;startY:number;item:DashboardItem;items:DashboardItem[];unitX:number;unitY:number;lastDx:number;lastDy:number;lastTarget?:string};

export function DashboardGrid({items,editable=false,onChange,renderWidget,onExpand,onContextItem,columns=12,rowHeight=98,gap=14}:DashboardGridProps){
  const ref=useRef<HTMLDivElement>(null);
  const [availableWidth,setAvailableWidth]=useState(0);
  useEffect(()=>{
    const element=ref.current;
    if(!element || typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(entries=>{
      const width=entries[0]?.contentRect.width??0;
      setAvailableWidth(previous=>Math.abs(previous-width)<1?previous:width);
    });
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  const narrow=useMediaQuery('(max-width:850px)') || (availableWidth>0&&availableWidth<850);
  const phone=useMediaQuery('(max-width:600px)') || (availableWidth>0&&availableWidth<600);
  const minFor=(item:DashboardItem,n:number)=>getWidgetGridMinimum(getWidgetDefinition(item.widgetId),n);
  const gesture=useRef<Gesture|null>(null);
  const layout=settleDashboard(items,undefined,columns,minFor);
  const maxRow=layout.reduce((r,i)=>Math.max(r,i.y+i.h),0);
  const begin=(event:PointerEvent<HTMLElement>,item:DashboardItem,kind:'drag'|'resize')=>{
    if(!editable || event.button!==0)return;
    event.stopPropagation();event.preventDefault();
    const parent=ref.current?.getBoundingClientRect();if(!parent)return;
    const unitX=Math.max(1,(parent.width+gap)/columns);
    gesture.current={kind,id:item.id,startX:event.clientX,startY:event.clientY,item:{...item},items:layout.map(i=>({...i})),unitX,unitY:rowHeight+gap,lastDx:0,lastDy:0};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move=(event:PointerEvent<HTMLElement>)=>{
    const g=gesture.current;if(!g)return;
    event.preventDefault();
    const dx=Math.round((event.clientX-g.startX)/g.unitX);
    const dy=Math.round((event.clientY-g.startY)/g.unitY);
    if(narrow && g.kind==='drag'){
      const candidates=Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-dashboard-item]')??[])
        .filter(el=>el.dataset.dashboardItem!==g.id);
      if(!candidates.length)return;
      const closest=candidates.map(el=>{const r=el.getBoundingClientRect();return {
        id:el.dataset.dashboardItem!,distance:Math.hypot(event.clientX-(r.left+r.right)/2,event.clientY-(r.top+r.bottom)/2)
      };}).sort((a,b)=>a.distance-b.distance)[0];
      if(!closest || closest.id===g.lastTarget)return;
      g.lastTarget=closest.id;
      const order=[...g.items].sort((a,b)=>a.y-b.y||a.x-b.x);
      const from=order.findIndex(i=>i.id===g.id),target=order.findIndex(i=>i.id===closest.id);
      if(from<0||target<0)return;
      const [moved]=order.splice(from,1);order.splice(target,0,moved);
      onChange(settleDashboard(order.map((item,index)=>({...item,x:0,y:index*100})),undefined,columns,minFor));
      return;
    }
    if(dx===g.lastDx&&dy===g.lastDy)return;
    g.lastDx=dx;g.lastDy=dy;
    const next=g.items.map(i=>{
      if(i.id!==g.id)return {...i};
      if(g.kind==='drag') return {...i,x:Math.max(0,Math.min(columns-i.w,g.item.x+dx)),y:Math.max(0,g.item.y+dy)};
      const min=minFor(i,columns);
      const w=narrow?g.item.w:Math.max(min.w,Math.min(columns-i.x,g.item.w+dx));
      return {...i,w,h:Math.max(min.h,g.item.h+dy)};
    });
    onChange(settleDashboard(next,g.id,columns,minFor));
  };
  const end=(event:PointerEvent<HTMLElement>)=>{
    if(!gesture.current)return;
    gesture.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const reorder=(item:DashboardItem,delta:number)=>{
    const order=[...layout].sort((a,b)=>a.y-b.y||a.x-b.x);
    const from=order.findIndex(i=>i.id===item.id);
    const to=Math.max(0,Math.min(order.length-1,from+delta));
    if(from===to)return;
    const [moved]=order.splice(from,1);
    order.splice(to,0,moved);
    onChange(settleDashboard(order.map((i,index)=>({...i,x:0,y:index*100})),undefined,columns,minFor));
  };
  const nudge=(item:DashboardItem,dx:number,dy:number)=>{
    if(narrow){reorder(item,dx<0||dy<0?-1:1);return;}
    const next=layout.map(i=>i.id===item.id?{...i,x:Math.max(0,Math.min(columns-i.w,i.x+dx)),y:Math.max(0,i.y+dy)}:i);
    onChange(settleDashboard(next,item.id,columns,minFor));
  };
  const height=maxRow>0?maxRow*rowHeight+(maxRow-1)*gap:editable?rowHeight:0;
  return <Box ref={ref} data-dashboard-grid="true" data-responsive-mode={phone?'phone':narrow?'tablet':'desktop'}
    sx={{position:'relative',width:'100%',minWidth:0,minHeight:narrow?'auto':height,
      display:narrow?'grid':'block',gridTemplateColumns:narrow?(phone?'1fr':'repeat(2,minmax(0,1fr))'):undefined,
      gridAutoRows:narrow?'auto':undefined,gap:narrow?2:undefined}}>

    {layout.map(item=><Box key={item.id} data-dashboard-item={item.id}
      onContextMenu={event=>{event.preventDefault();onContextItem?.(item,event);}}
      onPointerDown={event=>{if(!editable)return;const target=event.target as HTMLElement;
        const resizing=Boolean(target.closest('[data-dashboard-resize]'));
        if(narrow && !resizing && !target.closest('[data-dashboard-drag]'))return;
        begin(event,item,resizing?'resize':'drag');}}
      onPointerMove={move} onPointerUp={end} onPointerCancel={end}
      sx={{position:narrow?'relative':'absolute',
      left:narrow?'auto':`calc(${item.x/columns*100}% + ${item.x/columns*gap}px)`,
      top:narrow?'auto':item.y*(rowHeight+gap),
      width:narrow?'auto':`calc(${item.w/columns*100}% - ${gap*(1-item.w/columns)}px)`,
      height:narrow?(isCanvasWidget(getWidgetDefinition(item.widgetId)??{visual:'metric' as const,category:'metrics' as const})
        ? Math.max(phone?310:290,Math.min(480,item.h*(rowHeight+gap)-gap))
        :phone?Math.max(190,Math.min(320,item.h*rowHeight+(item.h-1)*gap))
          :Math.max(196,Math.min(310,(item.h*rowHeight+(item.h-1)*gap)*.78)))
        :item.h*rowHeight+(item.h-1)*gap,
      order:narrow?item.y*(columns+1)+item.x:undefined,
      gridColumn:narrow?(phone||isCanvasWidget(getWidgetDefinition(item.widgetId)??{visual:'metric' as const,category:'metrics' as const})?'1 / -1':'span 1'):undefined,
      gridRow:narrow?'span 1':undefined,
      minWidth:0,minHeight:0,zIndex:gesture.current?.id===item.id?3:1,
      cursor:editable&&!narrow?'grab':undefined,touchAction:editable&&!narrow?'none':undefined,userSelect:editable?'none':undefined,
      transition:gesture.current?.id===item.id?'none':'left .16s ease, top .16s ease, width .16s ease, height .16s ease',
      outline:editable?'1px dashed rgba(100,140,185,.42)':undefined,outlineOffset:editable?2:undefined,
      '&:hover .dashboard-actions':{opacity:1},
    }}>
      <Box sx={{height:'100%',width:'100%',pointerEvents:editable?'none':'auto'}}>{renderWidget(item)}</Box>
      {editable && <>
        <Box className="dashboard-actions" sx={{position:'absolute',top:4,left:4,zIndex:6,display:'flex',gap:.4,opacity:1,transition:'opacity .2s'}}>
          <Tooltip title="Drag or use arrow keys to reorder"><Box component="button" data-dashboard-drag="true" type="button" aria-label={`Move ${item.widgetId}`} onKeyDown={event=>{const moves:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const delta=moves[event.key];if(!delta)return;event.preventDefault();nudge(item,...delta);}} sx={{all:'unset',touchAction:'none',cursor:'grab',width:narrow?44:36,height:narrow?44:32,display:'grid',placeItems:'center',bgcolor:'rgba(20,30,48,.90)',border:'1px solid rgba(255,255,255,.23)',borderRadius:1.5,color:'#fff','&:active':{cursor:'grabbing'}}}><DragIndicatorRounded fontSize="small"/></Box></Tooltip>
          {narrow&&<><IconButton size="small" aria-label={`Move ${item.widgetId} earlier`} onClick={e=>{e.stopPropagation();reorder(item,-1);}} sx={{color:'#fff',background:'rgba(20,30,48,.90)',minWidth:38,minHeight:38}}><ArrowUpwardRounded fontSize="small"/></IconButton>
          <IconButton size="small" aria-label={`Move ${item.widgetId} later`} onClick={e=>{e.stopPropagation();reorder(item,1);}} sx={{color:'#fff',background:'rgba(20,30,48,.90)',minWidth:38,minHeight:38}}><ArrowDownwardRounded fontSize="small"/></IconButton></>}
        </Box>
        <Tooltip title="Drag to resize"><Box component="button" data-dashboard-resize="true" type="button" aria-label={`Resize ${item.widgetId}`}  sx={{all:'unset',touchAction:'none',position:'absolute',right:0,bottom:0,zIndex:7,cursor:'nwse-resize',width:narrow?44:32,height:narrow?44:32,display:'grid',placeItems:'center',color:'#fff',background:'linear-gradient(135deg,transparent 25%,rgba(28,43,65,.9) 26%)',borderBottomRightRadius:2}}><Box sx={{fontSize:23,fontWeight:900,transform:'rotate(-45deg)',lineHeight:1}}>⌁</Box></Box></Tooltip>
      </>}
      {!editable&&onExpand&&<Box className="dashboard-actions" sx={{position:'absolute',right:9,top:8,zIndex:6,opacity:{xs:1,md:0},transition:'opacity .2s'}}><Tooltip title="Expand widget"><IconButton aria-label={`Expand ${item.widgetId}`} size="small" onClick={()=>onExpand(item)} sx={{bgcolor:'rgba(22,30,46,.92)',color:'#fff',width:29,height:29,'&:hover':{bgcolor:'rgba(22,30,46,1)'}}}><OpenInFullRounded sx={{fontSize:16}}/></IconButton></Tooltip></Box>}
    </Box>)}
  </Box>;
}
