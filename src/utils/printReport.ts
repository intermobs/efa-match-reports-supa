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

  // The exact footer text provided, using <br> for proper multi-line structure within HTML
  const footerText = `Eswatini Football Association<br>
Plot 582, Sigwaca House, Tsekwane Road, Mbabane Industrial Sites. &nbsp; P. O. Box 641, Mbabane, H100. &nbsp; Tel: +268 - 2404 6852/62. &nbsp; Fax: +268 - 2404 6206<br>
EMAIL:info@nfas.org.sz &nbsp; Website:www.nfas.org.sz`;


  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          /* Define A4 page size and standard margins */
          @page { size: A4 portrait; margin: 12mm 12mm 24mm 12mm; @bottom-center { content: element(pe-footer); } }
          
          /* Basic Reset */
          *, *::before, *::after { box-sizing: border-box; }
          
          /* Ensure html and body take up full space to allow footer positioning */
          html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #fff; color: #0f172a; }
          
          /* Base typography */
          body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.6; }
          
          /* Ensure visibility for print */
          body * { visibility: visible !important; }
          #printable-area, #printable-area * { visibility: visible !important; }
          
          /* Main content container styling */
          #printable-area { width: 165mm; max-width: 100%; margin: 0 auto; padding: 0 0 22mm; }
          
          /* Imported styles from original component */
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
          .print-field-row { border-bottom: 1px solid rgba(15,23,42,0.12); padding: 14px 0; page-break-inside: avoid; break-inside: avoid-page; }
          .print-field-row:last-child { border-bottom: none; }
          .print-field-label { margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.14em; font-size: 13px; font-weight: 600; color: #475569; }
          .print-field-value { margin: 0; font-size: 14px; color: #0f172a; }
          .print-image { margin-top: 8px; width: 100%; max-height: 250mm; object-fit: contain; border-radius: 12px; page-break-inside: avoid; break-inside: avoid-page; }
          
          /* Elements to exclude from print */
          .no-print, button, nav, .hidden { display: none !important; }
          
          /* Force colors to print correctly */
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          /* --- Fixed Footer Implementation (CSS-Paged Media approach) --- */
          /* 1. Define a named page area for the footer */
          @page {
            @bottom-center {
              content: element(pe-footer);
              vertical-align: bottom;
            }
          }

          /* 2. Style the element that will be moved into the margin box */
          div.pe-footer {
            display: block;
            position: running(pe-footer);
            width: 100%;
            padding: 6px 0 0;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #0284c7 !important;
            font-size: 9px !important;
            line-height: 1.3;
            background: #fff;
          }

          /* Ensure the body content flows correctly without conflicting with the margin box */
          @media print {
            body {
              margin: 0;
              padding: 0 0 18mm;
            }

            div.pe-footer {
              position: fixed;
              left: 0;
              right: 0;
              bottom: 0;
              width: auto;
              margin: 0;
              padding: 6px 12mm 1px;
            }
          }
        </style>
      </head>
      <body>
        <!-- Main Report Content -->
        <div id="printable-area">${content}</div>
        
        <!-- Footer Element (will be moved to the bottom margin of every page) -->
        <div class="pe-footer">${footerText}</div>

        <script>
          window.onload = function() {
            // Focus the iframe window before printing
            window.focus();
            window.print();
            
            // Cleanup after print finishes
            setTimeout(() => {
              if (window.frameElement) {
                document.body.removeChild(window.frameElement);
              }
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
};
