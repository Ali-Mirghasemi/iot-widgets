import type { DashboardItem } from './DashboardGrid';

export type MinimumResolver = (item:DashboardItem, columns:number)=>{w:number;h:number};

function intersects(a:DashboardItem,b:DashboardItem) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

/**
 * Compact the dashboard using first-fit, top-to-bottom packing.
 *
 * The requested (x,y) coordinates determine reading/drag order, not permanent
 * empty rows. After a move, resize, deletion, or load, every item is moved to
 * the earliest available grid cell. Widgets never overlap, and their minimum
 * spans (e.g. 2x2 maps/charts) are respected.
 *
 * Passing priorityId gives the active drag/resize item precedence on a tie,
 * letting a dropped widget take an occupied position and push its peers along.
 * The result keeps the input array's identity order to preserve React keys and
 * callers which associate metadata by index.
 */
export function settleDashboard(
  items:DashboardItem[],
  priorityId?:string,
  columns=12,
  minimumFor?:MinimumResolver,
):DashboardItem[] {
  const count = Math.max(1,Math.floor(Number.isFinite(columns)?columns:12));
  const normalized=items.map((item,index)=>{
    const min=minimumFor?.(item,count)??{w:1,h:1};
    const numeric=(value:number,fallback:number)=>Number.isFinite(value)?Math.round(value):fallback;
    const w=Math.min(count,Math.max(1,numeric(min.w,1),numeric(item.w,1)));
    const h=Math.max(1,numeric(min.h,1),numeric(item.h,1));
    const x=Math.max(0,Math.min(numeric(item.x,0),count-w));
    const y=Math.max(0,numeric(item.y,0));
    return {...item,w,h,x,y,__inputIndex:index};
  });

  // Sorting by the user's intended destination makes drag-and-drop a reorder
  // operation; stable ties keep the existing order unless one is being moved.
  const ordered=[...normalized].sort((a,b)=>
    a.y-b.y || a.x-b.x ||
    (a.id===priorityId?-1:b.id===priorityId?1:0) ||
    a.__inputIndex-b.__inputIndex,
  );
  const placed:DashboardItem[]=[];
  const byId=new Map<string,DashboardItem>();
  for(const raw of ordered){
    const {__inputIndex:_,...item}=raw;
    const maxY=placed.reduce((end,existing)=>Math.max(end,existing.y+existing.h),0);
    let found=false;
    for(let y=0;y<=maxY&&!found;y++){
      for(let x=0;x<=count-item.w;x++){
        const candidate={...item,x,y};
        if(!placed.some(other=>intersects(other,candidate))){
          placed.push(candidate);
          byId.set(item.id,candidate);
          found=true;
          break;
        }
      }
    }
    // The scan is guaranteed to find a cell no lower than maxY: everything
    // already placed ends before that row.
    if(!found) throw new Error(`Cannot place dashboard item ${item.id}`);
  }
  return items.map(item=>byId.get(item.id)!);
}
