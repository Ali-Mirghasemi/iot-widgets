import type { DashboardItem } from './DashboardGrid';

function overlaps(a:DashboardItem,b:DashboardItem) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
/** Move intersecting cards down to avoid overlap without discarding custom placements. */
export type MinimumResolver = (item:DashboardItem, columns:number)=>{w:number;h:number};
export function settleDashboard(items:DashboardItem[], priorityId?:string, columns=12, minimumFor?:MinimumResolver):DashboardItem[] {
  const ordered=items.map(i=>{
    const min=minimumFor?.(i,columns)??{w:1,h:1};
    const w=Math.min(Math.max(min.w,i.w),columns), h=Math.max(min.h,i.h);
    return {...i,w,h,x:Math.max(0,Math.min(i.x,columns-w)),y:Math.max(0,i.y)};
  });
  ordered.sort((a,b)=>(a.id===priorityId?-1:b.id===priorityId?1:a.y-b.y||a.x-b.x));
  const taken:DashboardItem[]=[];
  for(const item of ordered){
    let count=0;
    while(taken.some(x=>overlaps(x,item)) && count++<500) item.y++;
    taken.push(item);
  }
  return items.map(i=>taken.find(x=>x.id===i.id)!);
}

