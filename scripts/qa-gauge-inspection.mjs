/** Serializable DOM inspection. Runs inside Playwright with page.evaluate(). */
export function inspectGaugeGeometry() {
  const gauges=Array.from(document.querySelectorAll('[data-adaptive-gauge]'));
  const issues=[];
  const tolerance=2;
  for(const gauge of gauges){
    const parent=gauge.closest('[data-iot-widget]');
    const id=parent?.getAttribute('data-widget-id')??'unknown';
    const face=gauge.querySelector('[data-adaptive-gauge-face]');
    const svg=face?.querySelector('svg');
    if(!face || !svg){issues.push({id,issue:'missing dial or SVG'});continue;}
    const box=gauge.getBoundingClientRect();
    const faceBox=face.getBoundingClientRect();
    const svgBox=svg.getBoundingClientRect();
    const fits=(r)=>r.width>10&&r.height>10 && r.left>=box.left-tolerance && r.top>=box.top-tolerance &&
      r.right<=box.right+tolerance && r.bottom<=box.bottom+tolerance;
    if(!fits(faceBox))issues.push({id,issue:'dial clipped by gauge body',
      body:{w:Math.round(box.width),h:Math.round(box.height)},
      dial:{w:Math.round(faceBox.width),h:Math.round(faceBox.height)}});
    if(!fits(svgBox))issues.push({id,issue:'SVG clipped by gauge body'});
  }
  return {gauges:gauges.length,gaugeIssues:issues};
}
