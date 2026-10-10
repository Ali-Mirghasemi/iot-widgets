import { widgetRegistry } from '../widgets/registry';
import { getWidgetGridMinimum, isCanvasWidget } from './adaptive';
import { settleDashboard, type DashboardItem } from './DashboardGrid';
import type { WidgetDefinition } from '../widgets/core/types';

/**
 * Create an editable sample dashboard covering every registered widget.
 * New widget definitions are included automatically, and canvas widgets
 * retain a practical minimum size. The dashboard uses built-in mock data;
 * no MQTT or backend is required.
 */
export function createWidgetCatalogDashboard(columns = 12, definitions: readonly WidgetDefinition[] = widgetRegistry): DashboardItem[] {
  const count = Math.max(1, Math.floor(columns));
  let x = 0, y = 0, rowHeight = 0;
  const items:DashboardItem[] = [];
  for (const def of definitions) {
    const canvas = isCanvasWidget(def);
    const min = getWidgetGridMinimum(def, count);
    const requested = canvas ? 6 : 3;
    const width = Math.min(count,Math.max(min.w, requested));
    const height = Math.max(min.h, canvas ? (def.visual === 'map'||def.visual === 'route' ? 4 : 3) : 2);
    if (x + width > count && x > 0) { y += rowHeight; x = 0; rowHeight = 0; }
    items.push({id:`catalog-${def.id}`,widgetId:def.id,x,y,w:width,h:height});
    x += width;
    rowHeight = Math.max(rowHeight, height);
  }
  // Use the exact same packing algorithm as end-user dashboards.
  const lookup = new Map(definitions.map(def=>[def.id,def]));
  return settleDashboard(items,undefined,count,(item,n)=>getWidgetGridMinimum(lookup.get(item.widgetId),n));
}
