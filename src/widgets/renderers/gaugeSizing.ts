import type { ResolvedWidgetView } from '../../library/adaptive';

/** Measured body dimensions, not the widget's nominal grid span. */
export interface GaugeArea { width:number; height:number }
export interface GaugeLayout {
  horizontal:boolean;
  detailed:boolean;
  showTrace:boolean;
  diameter:number;
  traceHeight:number;
}

/**
 * Choose a guaranteed-to-fit circular dial. Explicit pixels avoid the browser's
 * intrinsic SVG aspect ratio enlarging a CSS 100%-height dial inside a grid.
 * When history is shown, reserve that space *before* measuring the dial.
 */
export function measureGaugeLayout(
  bounds:GaugeArea | undefined,
  view:ResolvedWidgetView,
  historyCount=0,
):GaugeLayout {
  const width=Math.max(1,Math.floor(bounds?.width ?? 220));
  const height=Math.max(1,Math.floor(bounds?.height ?? 130));
  const horizontal=view!=='compact' && width>=410 && height>=140;
  const detailed=view==='detailed' && width>=350 && height>=255;
  const showTrace=detailed && historyCount>=2 && height>=340;
  const traceHeight=showTrace?Math.max(72,Math.floor(height*.24)):0;
  const mainHeight=Math.max(1,height-traceHeight-(showTrace?10:0));
  const dialWidth=horizontal?Math.max(1,Math.floor((width-12)/2)):width;
  const diameter=Math.max(1,Math.floor(Math.min(dialWidth,mainHeight,view==='compact'?220:340)));
  return {horizontal,detailed,showTrace,diameter,traceHeight};
}
