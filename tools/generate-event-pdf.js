#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function fileOrUrlToDataUrl(src) {
  if (!src) return '';
  try {
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) throw new Error('Failed to fetch image');
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') || 'image/jpeg';
      return `data:${ct};base64,${buf.toString('base64')}`;
    }

    // treat as local file
    const full = path.isAbsolute(src) ? src : path.join(process.cwd(), src);
    if (!fs.existsSync(full)) return '';
    const buf = fs.readFileSync(full);
    // guess content type from extension
    const ext = path.extname(full).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (e) {
    console.warn('Could not load image', src, e.message || e);
    return '';
  }
}

function defaultEvent() {
  return {
    title: 'Catholic Student Movement Inauguration',
    place: 'Kanjirapally',
    date: '2026-02-22',
    description: 'കാസറലിക്ക് സ്റ്റുഡൻസ് മുവ്മെന്റിന്റെ ഉദ്ഘാടനം ജോസ് പൂലിക്കല്‍ വിരാമ് നിരവഹിച്ചു',
    image: ''
  };
}

async function main() {
  const args = process.argv.slice(2);
  const eventPath = args[0] || path.join(__dirname, 'sample-event.json');
  const outPath = args[1] || path.join(process.cwd(), 'event-output.pdf');

  let event = defaultEvent();
  try {
    if (fs.existsSync(eventPath)) {
      const raw = fs.readFileSync(eventPath, 'utf8');
      event = Object.assign(event, JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to read event JSON, using defaults', e.message || e);
  }

  const imageData = await fileOrUrlToDataUrl(event.image || '');

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=800" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+Malayalam:wght@400;700&display=swap" rel="stylesheet">
      <style>
        html,body{margin:0;padding:0;background:white}
        body{font-family: 'Noto Sans Malayalam', Inter, Arial, sans-serif; color:#000}
        .container{width:800px;padding:28px}
        .header{display:flex;align-items:center}
        .logo{width:72px;height:72px;object-fit:contain}
        .title-col{flex:1;text-align:center}
        .suvara{font-size:28px;font-weight:700;margin:0}
        .subline{font-size:11px;margin-top:6px}
        .malayalam{font-size:18px;font-weight:700;margin-top:8px}
        .divider{border-top:2px solid #000;margin:14px 0}
        .info-table td{padding:6px 0}
        .label{font-weight:700;width:130px}
        .section-title{font-size:16px;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #000;padding-bottom:6px}
        .desc-box{border:1px solid #e0e0e0;padding:10px;min-height:28px}
        img.event{max-width:100%;border:1px solid #ddd}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAA..." class="logo" alt="logo" onerror="this.style.display='none'" />
          <div class="title-col">
            <h1 class="suvara">SUVARA</h1>
            <div class="subline">CENTRE FOR CATECHESIS, EPARCHY OF KANJIRAPALLY</div>
            <div class="malayalam">വിശ്വാസജീവിത പരിശീലനം</div>
          </div>
        </div>
        <div class="divider"></div>
        <table class="info-table" style="width:100%;border-collapse:collapse">
          <tbody>
            <tr><td class="label">Venue:</td><td>${event.place || ''}</td></tr>
            <tr><td class="label">Date:</td><td>${event.date || ''}</td></tr>
          </tbody>
        </table>
        <div>
          <div class="section-title">Event Description</div>
          <div class="desc-box" style="margin-bottom:18px"><div style="white-space:pre-wrap;line-height:1.6">${event.description || ''}</div></div>
        </div>
        ${imageData ? `<div style="text-align:center;margin-top:8px"><img src="${imageData}" class="event" /></div>` : ''}
      </div>
    </body>
  </html>`;

  console.log('Launching headless Chromium to render PDF...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // give fonts a short extra moment
    await page.waitForTimeout(300);
    const pdfOptions = { path: outPath, format: 'A4', printBackground: true, margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' } };
    await page.pdf(pdfOptions);
    console.log('PDF written to', outPath);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
