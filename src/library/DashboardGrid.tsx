import { useRef, type PointerEvent, type ReactNode } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded';
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded';
import type { WidgetInstanceConfig } from './types';
import { settleDashboard } from './layout';
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

type Gesture = {kind:'drag'|'resize';id:string;startX:number;startY:number;item:DashboardItem;items:DashboardItem[];unitX:number;unitY:number};

export function DashboardGrid({items,editable=false,onChange,renderWidget,onExpand,onContextItem,columns=12,rowHeight=98,gap=14}:DashboardGridProps){
  const ref=useRef<HTMLDivElement>(null);
  const gesture=useRef<Gesture|null>(null);
  const maxRow=items.reduce((r,i)=>Math.max(r,i.y+i.h),0);
  const begin=(event:PointerEvent<HTMLElement>,item:DashboardItem,kind:'drag'|'resize')=>{
    if(!editable || event.button!==0)return;
    event.stopPropagation();event.preventDefault();
    const parent=ref.current?.getBoundingClientRect();if(!parent)return;
    const unitX=(parent.width-gap*(columns-1))/columns+gap;
    gesture.current={kind,id:item.id,startX:event.clientX,startY:event.clientY,item:{...item},items:items.map(i=>({...i})),unitX,unitY:rowHeight+gap};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move=(event:PointerEvent<HTMLElement>)=>{
    const g=gesture.current;if(!g)return;
    event.preventDefault();
    const dx=Math.round((event.clientX-g.startX)/g.unitX);
    const dy=Math.round((event.clientY-g.startY)/g.unitY);
    const next=g.items.map(i=>{
      if(i.id!==g.id)return {...i};
      if(g.kind==='drag') return {...i,x:Math.max(0,Math.min(columns-i.w,g.item.x+dx)),y:Math.max(0,g.item.y+dy)};
      const w=Math.max(1,Math.min(columns-i.x,g.item.w+dx));
      return {...i,w,h:Math.max(1,g.item.h+dy)};
    });
    onChange(settleDashboard(next,g.id,columns));
  };
  const end=(event:PointerEvent<HTMLElement>)=>{
    if(!gesture.current)return;
    gesture.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <Box ref={ref} data-dashboard-grid="true" sx={{position:'relative',width:'100%',minHeight:editable?Math.max(400,maxRow*(rowHeight+gap)):Math.max(400,maxRow*(rowHeight+gap)),
    '@media (max-width:850px)':{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gridAutoRows:rowHeight*1.8+'px',gap:2,minHeight:'auto'},
    '@media (max-width:520px)':{gridTemplateColumns:'1fr'},
  }}>
    {items.map(item=><Box key={item.id} data-dashboard-item={item.id} onContextMenu={event=>{event.preventDefault();onContextItem?.(item,event);}} sx={{position:'absolute',left:`calc(${item.x/columns*100}% + ${item.x/columns*gap}px)`,top:item.y*(rowHeight+gap),
      width:`calc(${item.w/columns*100}% - ${gap*(1-item.w/columns)}px)`,height:item.h*rowHeight+(item.h-1)*gap,
      minWidth:0,minHeight:0,zIndex:gesture.current?.id===item.id?3:1,
      '&:hover .dashboard-actions':{opacity:1},
      '@media (max-width:850px)':{position:'relative',left:'auto',top:'auto',width:'auto',height:'auto',gridColumn:'span 1',gridRow:'span 1'},
    }}>
      <Box sx={{height:'100%',width:'100%',pointerEvents:editable?'none':'auto'}}>{renderWidget(item)}</Box>
      {editable && <>
        <Box className="dashboard-actions" sx={{position:'absolute',top:4,left:4,zIndex:6,display:'flex',gap:.4,opacity:1,transition:'opacity .2s'}}>
          <Tooltip title="Drag to reorder"><Box component="button" type="button" aria-label={`Move ${item.widgetId}`} onPointerDown={e=>begin(e,item,'drag')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} sx={{all:'unset',touchAction:'none',cursor:'grab',width:36,height:32,display:'grid',placeItems:'center',bgcolor:'rgba(20,30,48,.90)',border:'1px solid rgba(255,255,255,.23)',borderRadius:1.5,color:'#fff','&:active':{cursor:'grabbing'}}}><DragIndicatorRounded fontSize="small"/></Box></Tooltip>
        </Box>
        <Tooltip title="Drag to resize"><Box component="button" type="button" aria-label={`Resize ${item.widgetId}`} onPointerDown={e=>begin(e,item,'resize')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} sx={{all:'unset',touchAction:'none',position:'absolute',right:0,bottom:0,zIndex:7,cursor:'nwse-resize',width:32,height:32,display:'grid',placeItems:'center',color:'#fff',background:'linear-gradient(135deg,transparent 25%,rgba(28,43,65,.9) 26%)',borderBottomRightRadius:2}}><Box sx={{fontSize:23,fontWeight:900,transform:'rotate(-45deg)',lineHeight:1}}>⌁</Box></Box></Tooltip>
      </>}
      {!editable&&onExpand&&<Box className="dashboard-actions" sx={{position:'absolute',right:9,top:8,zIndex:6,opacity:0,transition:'opacity .2s'}}><Tooltip title="Expand widget"><IconButton aria-label={`Expand ${item.widgetId}`} size="small" onClick={()=>onExpand(item)} sx={{bgcolor:'rgba(22,30,46,.92)',color:'#fff',width:29,height:29,'&:hover':{bgcolor:'rgba(22,30,46,1)'}}}><OpenInFullRounded sx={{fontSize:16}}/></IconButton></Tooltip></Box>}
    </Box>)}
  </Box>;
}
