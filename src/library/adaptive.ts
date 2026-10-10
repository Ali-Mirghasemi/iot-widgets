import type { WidgetDefinition, WidgetSize } from '../widgets/core/types';

/** Adaptive content is independent from the visual theme. */
export type WidgetView = 'auto' | 'compact' | 'standard' | 'detailed';
export type ResolvedWidgetView = Exclude<WidgetView, 'auto'>;

const readSize = (size: WidgetSize) => size.split('x').map(Number) as [number, number];
export const isCanvasWidget = (def: Pick<WidgetDefinition,'visual'|'category'>) =>
  def.visual === 'map' || def.visual === 'route' ||
  (def.category === 'charts' && def.visual !== 'gauge') ||
  def.visual === 'table' || def.visual === 'heatmap';

export function getWidgetMinimumSize(def: WidgetDefinition): { w: number; h: number } {
  if (def.minSize) {
    const [w,h] = readSize(def.minSize);
    return {w,h};
  }
  return isCanvasWidget(def) ? {w:2,h:2} : {w:1,h:1};
}

/** Dashboard grid spans are not widget size labels: 12 columns -> 4-column canvas minimum. */
export function getWidgetGridMinimum(def: WidgetDefinition | undefined, columns: number): { w:number; h:number } {
  if (!def) return {w:1,h:1};
  const min = getWidgetMinimumSize(def);
  if (!isCanvasWidget(def)) return {w:Math.min(columns,min.w),h:min.h};
  return {w: Math.min(columns,Math.max(min.w,Math.ceil(columns/3))),h:Math.max(2,min.h)};
}

/** Never silently turn a too-small graph into a misleading compact chart. */
export function widgetSizeForGrid(def: WidgetDefinition, width: number, height: number, expanded=false): WidgetSize {
  const allowed = def.supportedSizes;
  const aspect = width / Math.max(height,1);
  const targetW = expanded ? 3 : (width <= 2 ? 1 : width <= 4 ? 2 : 3);
  const targetH = expanded ? 3 : (height <= 1 ? 1 : height === 2 ? 2 : 3);
  return [...allowed].sort((a,b)=>{
    const score=(s:WidgetSize)=>{
      const [w,h]=readSize(s);
      return Math.abs(w-targetW)*2 + Math.abs(h-targetH)*1.1 + Math.abs(w/h-aspect)*.3;
    };
    return score(a)-score(b);
  })[0] ?? def.defaultSize;
}

/** Respect actual rendered card dimensions as well as the nominal widget size. */
/** Choose content density from both its *logical* span and measured DOM bounds.
 * A 1x1 remains compact even on a wide monitor and a 2x1 can never grow a
 * detailed chart simply because its width exceeds 400px. */
export function resolveWidgetView(
  size: WidgetSize,
  bounds?: { width:number; height:number },
  requested: WidgetView = 'auto',
  expanded=false,
): ResolvedWidgetView {
  if (expanded) return 'detailed';
  const [w,h] = readSize(size);
  let logical: ResolvedWidgetView = w === 1 && h === 1 ? 'compact'
    : w === 1 || h === 1 ? 'standard'
    : (w*h >= 4 ? 'detailed' : 'standard');
  let physical: ResolvedWidgetView = logical;
  if(bounds && bounds.width>0 && bounds.height>0){
    const {width,height}=bounds;
    physical = width < 220 || height < 160 ? 'compact'
      : width >= 350 && height >= 255 ? 'detailed' : 'standard';
  }
  const rank:Record<ResolvedWidgetView,number>={compact:0,standard:1,detailed:2};
  // Respect a user's explicit request, but never make a too-small card overflow.
  const desired: ResolvedWidgetView = requested === 'auto' ? logical : requested;
  const result = [desired,logical,physical].reduce((lowest,current) => rank[current]<rank[lowest]?current:lowest);
  return result;
}

export function historyValues(data: Record<string,unknown> | undefined): number[] | undefined {
  const source = data?.history ?? data?.values ?? data?.series;
  if (!Array.isArray(source)) return undefined;
  const values = source.map(v => {
    if (typeof v === 'number') return v;
    if (v && typeof v === 'object' && 'value' in v) return Number((v as {value:unknown}).value);
    return NaN;
  }).filter((v):v is number => Number.isFinite(v));
  return values.length >= 2 ? values : undefined;
}
