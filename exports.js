/** Portable exports always receive a captured scientific result, never mutable UI drafts. */
                             
                                    
                    
                                     
 
const cell = (value         )         => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[,"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
export function dataCsv(data            )         {
  const metadata = Object.entries(data.metadata).map(([key, value]) =>
    `# ${key}: ${JSON.stringify(value)}`).join('\n');
  return `${metadata}\n${data.columns.map(cell).join(',')}\n${data.rows.map(row => row.map(cell).join(',')).join('\n')}\n`;
}
export function downloadText(name        , content        , mime        )       {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function figureSvg(svg               , title        , caption        , metadata                         )         {
  const ns = 'http://www.w3.org/2000/svg';
  const root = document.createElementNS(ns, 'svg');
  const view = svg.viewBox.baseVal;
  const width = view.width || 620, height = view.height || 310;
  const captionLines = caption.match(/.{1,88}(?:\s|$)|.{1,88}/g) ?? [''];
  const header = 56 + captionLines.length * 16;
  root.setAttribute('xmlns', ns); root.setAttribute('viewBox', `0 0 ${width} ${height + header}`);
  root.setAttribute('width', String(width)); root.setAttribute('height', String(height + header));
  root.setAttribute('role', 'img');
  const desc = document.createElementNS(ns, 'title'); desc.textContent = title; root.append(desc);
  const meta = document.createElementNS(ns, 'metadata'); meta.textContent = JSON.stringify(metadata); root.append(meta);
  const bg = document.createElementNS(ns, 'rect'); bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#fffdf7'); root.append(bg);
  const text = (value        , y        , size        ) => {
    const item = document.createElementNS(ns, 'text');
    item.setAttribute('x', '20'); item.setAttribute('y', String(y)); item.setAttribute('font-family', 'system-ui, sans-serif');
    item.setAttribute('font-size', String(size)); item.setAttribute('fill', '#173e42'); item.textContent = value; root.append(item);
  };
  text(title, 27, 17);
  captionLines.forEach((line, index) => text(line.trim(), 48 + index * 16, 10));
  const clone = svg.cloneNode(true)                 ;
  clone.setAttribute('x', '0'); clone.setAttribute('y', String(header)); clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height));
  root.append(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(root)}\n`;
}
