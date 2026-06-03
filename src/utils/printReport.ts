export const printReport = (title: string, contentId: string) => {
  const source = document.getElementById(contentId);
  if (!source) return;

  const printContent = source.cloneNode(true) as HTMLElement;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const styles = `
    <style>
      @page { size: A4 portrait; margin: 10mm 12mm; }
      *, *::before, *::after { box-sizing: border-box; }
      html, body { width: 100%; margin: 0; padding: 0; background: #fff; color: #0f172a; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.6; }
      body * { visibility: visible !important; }
      #printable-area, #printable-area * { visibility: visible !important; }
      #printable-area { width: 165mm; max-width: 100%; margin: 0 auto; padding: 0; }
      .print-wrapper { width: 165mm; max-width: 100%; margin: 0 auto; padding: 0; }
      .print-letterhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 10px; margin-bottom: 16px; border-bottom: 1px solid rgba(15,23,42,0.12); }
      .print-letterhead-title p { margin: 0; letter-spacing: 0.35em; font-size: 9px; color: #0284c7; text-transform: uppercase; }
      .print-letterhead-title h3 { margin: 8px 0 0; font-size: 34px; line-height: 1.02; text-transform: uppercase; letter-spacing: 0.03em; }
      .print-letterhead-logo img { width: 72px; height: auto; }
      .print-meta-block { display: grid; gap: 18px; margin-bottom: 18px; }
      .print-meta-card { border-radius: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 22px; }
      .print-meta-card p { margin: 0; }
      .meta-label { display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.18em; font-size: 13px; color: #475569; }
      .meta-value { margin: 0; font-size: 14px; color: #0f172a; font-weight: 600; }
      .print-meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
      .print-fields { display: flex; flex-direction: column; gap: 14px; }
      .print-field-row { border-bottom: 1px solid rgba(15,23,42,0.12); padding: 14px 0; }
      .print-field-row:last-child { border-bottom: none; }
      .print-field-label { margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px; color: #475569; }
      .print-field-value { margin: 0; font-size: 13px; color: #0f172a; }
      .print-image { margin-top: 8px; width: 100%; max-height: 250mm; object-fit: contain; border-radius: 12px; }
      .no-print, button, nav, footer, .hidden { display: none !important; }
      * { -webkit-print-color-adjust: exact; }
      @media print { html, body { width: 100%; } }
    </style>
  `;

  // Build a static, exact template from the values inside the modal DOM
  const getText = (el: Element | null) => (el && el.textContent) ? el.textContent.trim() : '';

  // Extract letterhead title if present, else use provided title
  const titleFromDom = getText(printContent.querySelector('.print-letterhead-title h3')) || title;

  // Extract meta values by label -> value pairs
  const metaMap: Record<string, string> = {};
  printContent.querySelectorAll('.meta-label').forEach((lbl) => {
    const key = getText(lbl);
    let valEl = lbl.nextElementSibling as Element | null;
    if (!valEl || !valEl.classList.contains('meta-value')) {
      // try find value inside parent
      valEl = lbl.parentElement?.querySelector('.meta-value') || lbl.parentElement?.querySelector('p:nth-of-type(2)') || null;
    }
    metaMap[key] = getText(valEl);
  });

  // Extract dynamic report fields
  const fields: Array<{ label: string; value?: string; img?: string }> = [];
  printContent.querySelectorAll('.print-field-row').forEach((row) => {
    const label = getText(row.querySelector('.print-field-label')) || getText(row.querySelector('.text-xs'));
    const value = getText(row.querySelector('.print-field-value'));
    const imgEl = row.querySelector('img');
    fields.push({ label, value, img: imgEl ? (imgEl.getAttribute('src') || '') : undefined });
  });

  const escapeHtml = (str?: string) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Build the exact HTML structure used in screenshot
  const metaCardLeft = `
    <div class="print-meta-card">
      <p class="meta-label">Match</p>
      <p class="meta-value">${escapeHtml(metaMap['Match'] || metaMap['MATCH'] || '')}</p>
      <div class="print-meta-grid">
        <div>
          <p class="meta-label">Tournament</p>
          <p class="meta-value">${escapeHtml(metaMap['Tournament'] || metaMap['TOURNAMENT'] || '')}</p>
        </div>
        <div>
          <p class="meta-label">League</p>
          <p class="meta-value">${escapeHtml(metaMap['League'] || metaMap['LEAGUE'] || '')}</p>
        </div>
        <div>
          <p class="meta-label">Stadium</p>
          <p class="meta-value">${escapeHtml(metaMap['Stadium'] || metaMap['STADIUM'] || '')}</p>
        </div>
        <div>
          <p class="meta-label">Venue</p>
          <p class="meta-value">${escapeHtml(metaMap['Venue'] || metaMap['VENUE'] || '')}</p>
        </div>
      </div>
    </div>
  `;

  const metaCardRight = `
    <div class="print-meta-card">
      <div class="print-meta-grid">
        <div>
          <p class="meta-label">Date</p>
          <p class="meta-value">${escapeHtml(metaMap['Date'] || metaMap['DATE'] || '')}</p>
        </div>
        <div>
          <p class="meta-label">Officer</p>
          <p class="meta-value">${escapeHtml(metaMap['Officer'] || metaMap['OFFICER'] || '')}</p>
        </div>
      </div>
    </div>
  `;

  const fieldsHtml = fields.map(f => {
    if (f.img) return `
      <div class="print-field-row">
        <p class="print-field-label">${escapeHtml(f.label)}</p>
        <img class="print-image" src="${escapeHtml(f.img)}" />
      </div>`;
    return `
      <div class="print-field-row">
        <p class="print-field-label">${escapeHtml(f.label)}</p>
        <p class="print-field-value">${escapeHtml(f.value)}</p>
      </div>`;
  }).join('\n');

  const contentHtml = `
    <div id="printable-area">
      <div class="print-letterhead">
        <div class="print-letterhead-title">
          <p>EFA Safety & Security</p>
          <h3>${escapeHtml(titleFromDom)}</h3>
        </div>
        <div class="print-letterhead-logo"><img src="/efa_logo.png" alt="EFA"/></div>
      </div>
      <div class="print-meta-block">
        ${metaCardLeft}
        ${metaCardRight}
      </div>
      <div class="print-fields">
        ${fieldsHtml}
      </div>
    </div>
  `;

  const doc = `
    <!doctype html>
    <html>
      <head>
        <base href="${window.location.origin}">
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        <div class="print-wrapper" id="print-wrapper">${contentHtml}</div>
        <script>
          (function(){
            function afterPrint() { try{ window.close(); }catch(e){} }
            window.onload = function(){ setTimeout(function(){ window.focus(); window.print(); }, 50); };
            if(window.matchMedia){
              window.matchMedia('print').addListener(function(m){ if(!m.matches) afterPrint(); });
            }
            window.onafterprint = afterPrint;
          })();
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(doc);
  printWindow.document.close();
};
