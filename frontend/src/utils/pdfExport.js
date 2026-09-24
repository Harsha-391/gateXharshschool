/**
 * Client-side PDF Generation & Document Printing Utility
 * Generates true PDF 1.4 documents without third-party dependencies,
 * and prints via isolated iframes to prevent popup blockers.
 */

function escapePdfText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ');
}

/**
 * Builds a standard A4 PDF document string
 */
export function buildPdfDocument({
  title = 'Official Document',
  schoolName = 'Academy Portal',
  badgeText = '',
  fields = [],
  description = '',
  tableHeaders = [],
  tableRows = []
}) {
  const streamLines = [];

  // Top header banner (Theme primary orange #f97316)
  streamLines.push(
    '0.98 0.55 0.26 rg',
    '0 802 595.28 40 re f',
    '1 1 1 rg',
    'BT',
    '/F2 12 Tf',
    '40 816 Td',
    '(' + escapePdfText((schoolName || 'ACADEMY PORTAL').toUpperCase()) + '  |  OFFICIAL ACADEMIC NOTIFICATION) Tj',
    'ET'
  );

  // Document Title
  streamLines.push(
    '0.06 0.09 0.16 rg',
    'BT',
    '/F2 20 Tf',
    '40 760 Td',
    '(' + escapePdfText(title) + ') Tj',
    'ET'
  );

  // Category / Type Badge
  if (badgeText) {
    streamLines.push(
      '0.95 0.95 0.98 rg',
      '0.85 0.88 0.94 RG',
      '1 w',
      '40 730 160 20 re B',
      '0.2 0.25 0.4 rg',
      'BT',
      '/F2 9 Tf',
      '48 736 Td',
      '(' + escapePdfText(badgeText.toUpperCase()) + ') Tj',
      'ET'
    );
  }

  // Divider Line
  streamLines.push(
    '0.88 0.90 0.94 RG',
    '1 w',
    '40 715 m 555 715 l S'
  );

  let currentY = 690;

  // Key-Value Details Box
  if (fields && fields.length > 0) {
    const boxHeight = fields.length * 24 + 14;
    const boxY = currentY - boxHeight + 10;
    streamLines.push(
      '0.98 0.98 0.99 rg',
      '0.88 0.90 0.94 RG',
      '1 w',
      `40 ${boxY} 515 ${boxHeight} re B`
    );

    let fieldY = currentY - 14;
    for (const f of fields) {
      streamLines.push(
        '0.38 0.45 0.55 rg',
        'BT',
        '/F2 10 Tf',
        `55 ${fieldY} Td`,
        '(' + escapePdfText(f.label + ':') + ') Tj',
        'ET',
        '0.06 0.09 0.16 rg',
        'BT',
        '/F1 10 Tf',
        `180 ${fieldY} Td`,
        '(' + escapePdfText(f.value || 'N/A') + ') Tj',
        'ET'
      );
      fieldY -= 24;
    }
    currentY = boxY - 25;
  }

  // Description / Content Area
  if (description) {
    streamLines.push(
      '0.06 0.09 0.16 rg',
      'BT',
      '/F2 12 Tf',
      `40 ${currentY} Td`,
      '(Details & Description:) Tj',
      'ET'
    );
    currentY -= 20;

    const words = String(description).split(/\s+/);
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 85) {
        streamLines.push(
          '0.2 0.25 0.35 rg',
          'BT',
          '/F1 10 Tf',
          `40 ${currentY} Td`,
          '(' + escapePdfText(line.trim()) + ') Tj',
          'ET'
        );
        line = w;
        currentY -= 16;
      } else {
        line += ' ' + w;
      }
    }
    if (line.trim()) {
      streamLines.push(
        '0.2 0.25 0.35 rg',
        'BT',
        '/F1 10 Tf',
        `40 ${currentY} Td`,
        '(' + escapePdfText(line.trim()) + ') Tj',
        'ET'
      );
      currentY -= 25;
    }
  }

  // Table (e.g. For Timetables or Schedules)
  if (tableHeaders && tableHeaders.length > 0 && tableRows && tableRows.length > 0) {
    const colWidth = 515 / tableHeaders.length;

    // Header row background
    streamLines.push(
      '0.95 0.95 0.98 rg',
      '0.85 0.88 0.94 RG',
      '1 w',
      `40 ${currentY - 18} 515 22 re B`,
      '0.1 0.15 0.25 rg',
      'BT',
      '/F2 9.5 Tf'
    );
    let colX = 50;
    for (const th of tableHeaders) {
      streamLines.push(
        `${colX} ${currentY - 12} Td`,
        '(' + escapePdfText(th) + ') Tj'
      );
      colX += colWidth;
    }
    streamLines.push('ET');
    currentY -= 24;

    for (const row of tableRows) {
      if (currentY < 90) break;
      streamLines.push(
        '0.88 0.90 0.94 RG',
        '0.5 w',
        `40 ${currentY} m 555 ${currentY} l S`,
        '0.2 0.25 0.35 rg',
        'BT',
        '/F1 9 Tf'
      );
      let rX = 50;
      for (const cell of row) {
        streamLines.push(
          `${rX} ${currentY - 14} Td`,
          '(' + escapePdfText(cell) + ') Tj'
        );
        rX += colWidth;
      }
      streamLines.push('ET');
      currentY -= 20;
    }
  }

  // Footer
  streamLines.push(
    '0.88 0.90 0.94 RG',
    '1 w',
    '40 60 m 555 60 l S',
    '0.5 0.55 0.65 rg',
    'BT',
    '/F1 8.5 Tf',
    '40 45 Td',
    '(' + escapePdfText('Generated electronically on ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '  |  Official School Record') + ') Tj',
    'ET'
  );

  const streamContent = streamLines.join('\n');
  const streamBytes = new TextEncoder().encode(streamContent);
  const streamLength = streamBytes.length;

  const header = '%PDF-1.4\n';
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'
  ];

  let offset = new TextEncoder().encode(header).length;
  const xrefEntries = ['0000000000 65535 f \n'];

  let body = '';
  for (let i = 0; i < objects.length; i++) {
    xrefEntries.push(String(offset).padStart(10, '0') + ' 00000 n \n');
    body += objects[i];
    offset += new TextEncoder().encode(objects[i]).length;
  }

  const startxref = offset;
  const xref = `xref\n0 ${objects.length + 1}\n` + xrefEntries.join('');
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return header + body + xref + trailer;
}

/**
 * Downloads a generated PDF string as a .pdf file
 */
export function downloadPdf(pdfString, filename) {
  const bytes = new TextEncoder().encode(pdfString);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers safe iframe printing without popup blockers
 */
export function printHtmlViaIframe(title, htmlBody) {
  try {
    let iframe = document.getElementById('academic-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'academic-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
              * { box-sizing: border-box; }
              body { font-family: 'Inter', system-ui, sans-serif; padding: 30px; color: #1e293b; background: #fff; margin: 0; }
              .card { border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; max-width: 650px; margin: 0 auto; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
              .header h1 { margin: 0; font-size: 22px; color: #0f172a; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #ffedd5; color: #c2410c; margin-top: 6px; text-transform: uppercase; }
              .desc { margin: 16px 0; font-size: 14px; line-height: 1.6; color: #334155; }
              .details { display: grid; grid-template-columns: 140px 1fr; gap: 8px; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 14px; }
              .details-label { font-weight: bold; color: #64748b; }
              .details-val { font-weight: 600; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
              th { background: #f8fafc; font-weight: bold; }
              @media print {
                body { padding: 10mm; }
                .card { border: none; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            ${htmlBody}
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Print iframe error:', err);
  }
}
