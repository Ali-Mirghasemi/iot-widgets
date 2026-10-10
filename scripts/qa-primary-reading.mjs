/** DOM geometry check for newly added themes. Serializable for page.evaluate(). */
export function inspectThemeReadings() {
  const issues=[];
  let readings=0;
  const tracked=new Set(['industrial','tactile']);
  const primary=new Set(['metric','battery','signal','tank','alarm-indicator']);
  for(const card of document.querySelectorAll('[data-iot-widget]')) {
    if(!tracked.has(card.getAttribute('data-widget-theme')))continue;
    const visual=card.getAttribute('data-widget-visual');
    const itemId=card.getAttribute('data-widget-id');
    if(!primary.has(visual))continue;
    const reading=card.querySelector('[data-iot-reading]');
    const body=card.querySelector('[data-responsive-widget-body]');
    if(!reading||!body) {
      issues.push({id:itemId,issue:'missing metric reading or visual body'});
      continue;
    }
    readings++;
    const r=reading.getBoundingClientRect(), b=body.getBoundingClientRect();
    if(b.width<2||b.height<2||r.width<2||r.height<2||r.left>b.right-2||r.right<b.left+2||r.top>b.bottom-2||r.bottom<b.top+2)
      issues.push({id:itemId,issue:'unrendered reading',bodyHeight:Math.round(b.height),readingHeight:Math.round(r.height)});
    else if(r.left<b.left-10||r.right>b.right+10||r.top<b.top-10||r.bottom>b.bottom+10)
      issues.push({id:itemId,issue:'reading clipped beyond body bounds',bodyHeight:Math.round(b.height)});
    if(!reading.textContent?.trim())issues.push({id:itemId,issue:'empty reading'});
    const style=getComputedStyle(reading);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)issues.push({id:itemId,issue:'hidden reading'});
  }
  return {themeReadings:readings,themeReadingIssues:issues};
}
