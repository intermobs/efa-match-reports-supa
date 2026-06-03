export const printReport = (title: string, contentId: string) => {
  const source = document.getElementById(contentId);
  if (!source) return;

  // 1. A hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // 2. Prepare the content
  const content = source.innerHTML;

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${title}</title>
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
          .print-letterhead-title p { margin: 0; letter-spacing: 0.35em; font-size: 10px; color: #0284c7; text-transform: uppercase; }
          .print-letterhead-title h3 { margin: 8px 0 0; font-size: 34px; line-height: 1.02; text-transform: uppercase; letter-spacing: 0.03em; }
          .print-letterhead-logo img { width: 72px; height: auto; }
          .print-meta-block { display: grid; gap: 18px; margin-bottom: 18px; }
          .print-meta-card { border-radius: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 22px; }
          .print-meta-card p { margin: 0; }
          .meta-label { display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.18em; font-size: 13px; font-weight: 500; color: #475569; }
          .meta-value { margin: 0; font-size: 14px; color: #0f172a; font-weight: 600; }
          .print-meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
          .print-fields { display: flex; flex-direction: column; gap: 14px; }
          .print-field-row { border-bottom: 1px solid rgba(15,23,42,0.12); padding: 14px 0; }
          .print-field-row:last-child { border-bottom: none; }
          .print-field-label { margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.14em; font-size: 13px; font-weight: 600; color: #475569; }
          .print-field-value { margin: 0; font-size: 14px; color: #0f172a; }
          .print-image { margin-top: 8px; width: 100%; max-height: 250mm; object-fit: contain; border-radius: 12px; }
          .no-print, button, nav, footer, .hidden { display: none !important; }
          * { -webkit-print-color-adjust: exact; }
          @media print { html, body { width: 100%; } }
        </style>
      </head>
      <body>
        <div id="printable-area">${content}</div>
        <script>
          window.onload = function() {
            window.print();
            // Cleanup after print finishes
            setTimeout(() => {
              document.body.removeChild(window.frameElement);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
};
