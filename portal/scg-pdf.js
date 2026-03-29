/**
 * SCG PDF — Branded print-window PDF generator for all portal forms
 * Opens a new window with professional SCG letterhead → user saves as PDF
 */
const SCGPdf = (function () {
  const LOGO = '../1 Logo Shiva Consultancy Group (Rakesh Jha) (1).jpg';

  function fmtDate(v) {
    if (!v) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    try { return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }); } catch (e) { return v; }
  }

  /* ── Shared print CSS ── */
  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;font-size:9.5pt;color:#1a2535;background:#fff}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;position:relative;page-break-after:always}
/* LETTERHEAD */
.lh{background:linear-gradient(135deg,#071220 0%,#0C1C35 60%,#122444 100%);padding:20px 28px 16px;position:relative;overflow:hidden}
.lh::before{content:'';position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(201,168,76,.07)}
.lh-grid{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}
.lh-logo{width:48px;height:48px;object-fit:contain;filter:brightness(0) invert(1)}
.lh-name{font-family:'Cormorant Garamond',serif;font-size:14pt;font-weight:700;color:#fff;letter-spacing:.04em}
.lh-tag{font-size:6.5pt;color:rgba(255,255,255,.55);margin-top:2px;text-transform:uppercase;letter-spacing:.1em}
.lh-contact{font-size:7pt;color:rgba(255,255,255,.45);margin-top:3px}
.lh-dtype{text-align:right}
.lh-dtype-lbl{font-size:6pt;text-transform:uppercase;letter-spacing:.12em;color:rgba(201,168,76,.8)}
.lh-doctitle{font-family:'Cormorant Garamond',serif;font-size:10pt;font-weight:700;color:#C9A84C;margin-top:2px}
.lh-ref{font-size:7pt;color:rgba(255,255,255,.5);margin-top:2px}
.gold-bar{height:3px;background:linear-gradient(90deg,#C9A84C,#E8C96A,#C9A84C)}
/* COVER */
.cover-hero{background:linear-gradient(155deg,#071220 0%,#0C1C35 45%,#1a3a6b 100%);padding:44px 32px;display:grid;grid-template-columns:1fr 1fr;gap:32px;align-content:center;min-height:160mm}
.cover-tag{display:inline-block;background:rgba(59,94,166,.7);color:#fff;font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:3px 10px;border-radius:20px;margin-bottom:10px}
.cover-title{font-family:'Cormorant Garamond',serif;font-size:24pt;font-weight:700;color:#fff;line-height:1.2;margin-bottom:6px}
.cover-sub{font-size:9.5pt;color:rgba(255,255,255,.6);margin-top:4px}
.cover-reftag{display:inline-block;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.5);color:#C9A84C;font-size:7.5pt;font-weight:700;letter-spacing:.08em;padding:4px 12px;border-radius:20px;margin-top:10px}
.cover-detail{border-left:2px solid rgba(201,168,76,.4);padding-left:10px;margin-bottom:10px}
.cover-dl{font-size:6.5pt;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em}
.cover-dv{font-size:9pt;color:#fff;font-weight:600;margin-top:1px}
.cover-foot{background:#0C1C35;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;border-top:2px solid rgba(201,168,76,.3)}
.cover-foot-txt{font-size:7pt;color:rgba(255,255,255,.5)}
.cover-conf{font-size:7pt;font-weight:700;color:#C9A84C;letter-spacing:.12em;text-transform:uppercase}
/* BODY */
.body{padding:20px 28px}
/* SECTION HEAD */
.sh{background:linear-gradient(135deg,#071220,#0C1C35);color:#fff;padding:7px 12px;display:flex;align-items:center;gap:7px;margin:16px 0 9px;border-left:4px solid #C9A84C}
.sh h3{font-family:'Cormorant Garamond',serif;font-size:10pt;font-weight:700;flex:1}
.sh-badge{font-size:5.5pt;background:rgba(201,168,76,.2);border:1px solid rgba(201,168,76,.5);color:#C9A84C;padding:2px 6px;border-radius:10px;text-transform:uppercase;letter-spacing:.05em}
/* INFO GRID */
.ig{display:grid;grid-template-columns:1fr 1fr;border:1px solid #d0d9e8;border-radius:6px;overflow:hidden;margin-bottom:12px}
.ig-cell{padding:6px 10px;border-bottom:1px solid #edf0f7}
.ig-cell:nth-child(odd){border-right:1px solid #d0d9e8;background:#f8f9fc}
.ig-lbl{font-size:6pt;color:#7a8ab0;text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:1px}
.ig-val{font-size:8.5pt;color:#1a2535;font-weight:500}
/* NARRATIVE */
.narr{font-size:9pt;line-height:1.78;color:#2a3548;text-align:justify;margin-bottom:10px}
.narr p{margin-bottom:7px}
/* TABLE */
.dt{width:100%;border-collapse:collapse;font-size:8pt;margin:7px 0 13px}
.dt th{background:#071220;color:#fff;padding:5.5px 7px;text-align:left;font-weight:600;font-size:7.5pt}
.dt th.r,.dt td.r{text-align:right}
.dt td{padding:4.5px 7px;border:1px solid #e0e6f0}
.dt tr:nth-child(even) td{background:#f8f9fc}
.dt tr.sub td{background:#e8f0fe;font-weight:600}
.dt tr.tot td{background:#071220;color:#fff;font-weight:700}
/* SIGNATURE */
.sig{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px;padding-top:12px;border-top:1px solid #d0d9e8}
.sig-line{height:38px;border-bottom:1.5px solid #1a2535;margin-bottom:5px}
.sig-name{font-size:8.5pt;font-weight:700;color:#1a2535}
.sig-sub{font-size:7.5pt;color:#7a8ab0;margin-top:1px}
/* FOOTER */
.pf{background:#071220;color:rgba(255,255,255,.6);font-size:6.5pt;padding:7px 28px;display:flex;justify-content:space-between;align-items:center}
.pf-ref{color:#C9A84C;font-weight:600}
/* WATERMARK */
.wm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:55pt;color:rgba(7,18,32,.04);font-family:'Cormorant Garamond',serif;font-weight:700;pointer-events:none;z-index:0;white-space:nowrap}
/* PRINT TOOLBAR */
.toolbar{background:#071220;padding:10px 18px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100}
.toolbar button{background:#C9A84C;color:#071220;border:none;padding:7px 20px;font-weight:700;font-size:.85rem;border-radius:6px;cursor:pointer}
.toolbar span{color:rgba(255,255,255,.55);font-size:.75rem}
@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .toolbar{display:none!important}
  .page{margin:0;width:100%}
  .wm{display:block}
}
@media screen{body{background:#e8edf5;padding:14px}.page{box-shadow:0 4px 24px rgba(0,0,0,.15);margin-bottom:16px}}`;

  /* ── Builder helpers ── */
  function lh(docTitle, ref) {
    return `<div class="lh"><div class="lh-grid">
<img class="lh-logo" src="${LOGO}" alt="SCG" onerror="this.style.display='none'">
<div><div class="lh-name">SHIVA CONSULTANCY GROUP</div>
<div class="lh-tag">Financial Advisory · Debt Syndication · Management Consultancy</div>
<div class="lh-contact">Ahmedabad, Gujarat, India &nbsp;|&nbsp; +91 99790 21275 &nbsp;|&nbsp; info@shivaconsultancy.in</div></div>
<div class="lh-dtype"><div class="lh-dtype-lbl">Document</div>
<div class="lh-doctitle">${docTitle}</div>${ref ? `<div class="lh-ref">${ref}</div>` : ''}</div>
</div></div><div class="gold-bar"></div>`;
  }

  function cover(opts) {
    const details = (opts.details || []).filter(d => d[1]).map(d =>
      `<div class="cover-detail"><div class="cover-dl">${d[0]}</div><div class="cover-dv">${d[1]}</div></div>`).join('');
    return `<div class="page"><div class="lh"><div class="lh-grid">
<img class="lh-logo" src="${LOGO}" alt="SCG" onerror="this.style.display='none'">
<div><div class="lh-name">SHIVA CONSULTANCY GROUP</div><div class="lh-tag">Financial Advisory · Debt Syndication · Management Consultancy</div></div>
<div class="lh-dtype"><div class="lh-dtype-lbl">Document Type</div><div class="lh-doctitle">${opts.docType || ''}</div></div>
</div></div><div class="gold-bar"></div>
<div class="cover-hero">
<div><div class="cover-tag">${opts.docType || 'CONFIDENTIAL'}</div>
<div class="cover-title">${opts.title || 'Document'}</div>
${opts.subtitle ? `<div class="cover-sub">${opts.subtitle}</div>` : ''}
${opts.refNo ? `<div class="cover-reftag">${opts.refNo}</div>` : ''}</div>
<div>${details}</div>
</div>
<div class="cover-foot"><div class="cover-foot-txt">Shiva Consultancy Group &nbsp;|&nbsp; Ahmedabad, Gujarat, India &nbsp;|&nbsp; ${fmtDate()}</div>
<div class="cover-conf">Strictly Confidential</div></div></div>`;
  }

  function sh(title, badge) {
    return `<div class="sh"><h3>${title}</h3>${badge ? `<span class="sh-badge">${badge}</span>` : ''}</div>`;
  }

  function ig(rows) {
    return '<div class="ig">' + rows.map(r => `<div class="ig-cell"><div class="ig-lbl">${r[0]}</div><div class="ig-val">${r[1] || '—'}</div></div>`).join('') + '</div>';
  }

  function narr(text) {
    if (!text) return '';
    return '<div class="narr">' + text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('') + '</div>';
  }

  function pf(ref, note) {
    return `<div class="pf"><span>Shiva Consultancy Group &nbsp;|&nbsp; Strictly Confidential</span><span class="pf-ref">${ref || ''}</span><span>${note || ''} &nbsp;|&nbsp; ${fmtDate()}</span></div>`;
  }

  function sigBlock(left, right) {
    return `<div class="sig"><div><div class="sig-line"></div><div class="sig-name">${left.name}</div><div class="sig-sub">${left.title}</div><div class="sig-sub">Date: _______________</div></div>
<div><div class="sig-line"></div><div class="sig-name">${right.name}</div><div class="sig-sub">${right.title}</div><div class="sig-sub">Date: _______________</div></div></div>`;
  }

  function openWin(title, html) {
    const w = window.open('', '_blank', 'width=920,height=720');
    if (!w) { alert('Allow popups to download PDF.'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title} — SCG</title><style>${CSS}</style></head>
<body><div class="wm">SCG</div>
<div class="toolbar"><button onclick="window.print()">🖨️ Print / Save as PDF</button><span>In print dialog → select "Save as PDF" as destination</span></div>
${html}
<script>setTimeout(()=>window.print(),900);<\/script></body></html>`);
    w.document.close();
  }

  /* ══════════════════════════════════════════════════
     CLIENT MASTER
  ══════════════════════════════════════════════════ */
  function dlClientMaster(d) {
    const co = d.company || {};
    const pc = d.primaryContact || {};
    const addrs = d.addresses || [];
    const reg = addrs.find(a => a.type === 'registered') || addrs[0] || {};
    const fin = d.financials || {};
    const svcs = d.services || [];

    const html = cover({
      docType: 'CLIENT MASTER RECORD', title: co.name || d.cltName || 'Client Profile',
      subtitle: 'Financial Advisory Engagement Record', refNo: d.ref,
      details: [['Ref No.', d.ref], ['Industry', co.industry || ''], ['Constitution', co.constitution || ''],
                ['Date of Onboarding', fmtDate(d.created)], ['RM Name', (d.origin?.rm?.name) || '']]
    }) + `
<div class="page"><div>${lh('Client Master Record', d.ref)}</div><div class="body">
${sh('Client Identification')}
${ig([['Reference No.', d.ref], ['Company Name', co.name || ''], ['Constitution', co.constitution || ''],
       ['Date of Incorporation', co.dob || ''], ['Industry / Sector', co.industry || ''],
       ['PAN', co.pan || ''], ['GSTIN', co.gst || ''], ['CIN / LLPIN', (co.cin || co.llpin) || ''],
       ['UDYAM No.', co.udyam || ''], ['Company Phone', co.phone || ''],
       ['Email', co.email || ''], ['Website', co.website || '']])}
${sh('Registered Address')}
${ig([['Address Line 1', reg.line1 || ''], ['Address Line 2', reg.line2 || ''],
       ['City / District', reg.city || ''], ['State', reg.state || ''],
       ['PIN Code', reg.pin || ''], ['Country', 'India']])}
${sh('Primary Promoter / Contact')}
${ig([['Name', (pc.sal || '') + ' ' + (pc.name || '')], ['Designation', pc.desig || ''],
       ['Mobile', pc.mobile || ''], ['Email', pc.email || ''],
       ['Promoter PAN', pc.pan || ''], ['DIN', pc.din || ''],
       ['Qualification', pc.qual || ''], ['Experience', pc.exp ? pc.exp + ' yrs' : '']])}
</div>${pf(d.ref, 'Page 1')}</div>

<div class="page"><div>${lh('Client Master Record', d.ref)}</div><div class="body">
${sh('Financial Snapshot (₹ in Lakhs)')}
<table class="dt"><thead><tr><th>Parameter</th><th class="r">Year 1</th><th class="r">Year 2</th><th class="r">Year 3 (Latest)</th></tr></thead>
<tbody>
${[['Net Sales', fin.sales], ['Gross Profit', fin.gp], ['EBITDA', fin.ebitda], ['PAT', fin.pat]].map(([l, arr]) =>
  `<tr><td><strong>${l}</strong></td>${(arr || []).map(v => `<td class="r">${v || '—'}</td>`).join('')}</tr>`).join('')}
</tbody></table>
${ig([['CIBIL Score (Company)', fin.cibil_co || ''], ['CIBIL Score (Promoter)', fin.cibil_pr || ''],
       ['NPA Status', fin.npa || 'Standard'], ['Current Credit', fin.credit_rem || '']])}
${svcs.length ? sh('Services Requested') + `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">${svcs.map(s => `<span style="background:#e8f0fe;border:1px solid #3B5EA6;color:#3B5EA6;border-radius:14px;padding:2px 9px;font-size:7.5pt;font-weight:600">${s}</span>`).join('')}</div>` : ''}
${sigBlock({ name: pc.name || 'Authorized Signatory', title: co.name || 'Client' }, { name: 'Rakesh Jha', title: 'Shiva Consultancy Group, Ahmedabad' })}
</div>${pf(d.ref, 'Page 2')}</div>`;
    openWin('Client Master — ' + d.ref, html);
  }

  /* ══════════════════════════════════════════════════
     SERVICE REQUISITION
  ══════════════════════════════════════════════════ */
  function dlSR(d) {
    const svcs = d.services || [];
    const fin = d.financialData || [];
    const html = cover({
      docType: 'SERVICE REQUISITION & MANDATE', title: 'Engagement Mandate',
      subtitle: d.cltName || '', refNo: d.ref,
      details: [['Client Ref', d.clientMasterRef || ''], ['Client', d.cltName || ''],
                ['Constitution', d.cltConstitution || ''], ['Services', svcs.length + ' services'],
                ['Date', fmtDate(d.created)]]
    }) + `
<div class="page"><div>${lh('Service Requisition & Mandate', d.ref)}</div><div class="body">
${sh('Client Details')}
${ig([['SR Reference', d.ref], ['Client Name', d.cltName || ''], ['Client Ref', d.clientMasterRef || ''],
       ['Constitution', d.cltConstitution || ''], ['Industry', d.cltIndustry || ''],
       ['City', d.cltCity || ''], ['Contact Person', d.cltContact || ''],
       ['Mobile', d.cltMobile || ''], ['PAN', d.kycPan || ''], ['GSTIN', d.kycGst || '']])}
${sh('Services Mandated')}
<table class="dt"><thead><tr><th style="width:40px">#</th><th>Service / Deliverable</th></tr></thead>
<tbody>${svcs.map((s, i) => `<tr><td>${i + 1}</td><td><strong>${s}</strong></td></tr>`).join('')}</tbody></table>
${d.srSpecific ? sh('Specific Requirements') + `<div class="narr"><p>${d.srSpecific}</p></div>` : ''}
${d.situationClient ? sh('Background & Assessment') + `<div class="narr"><p><strong>Client:</strong> ${d.situationClient}</p>${d.situationScg ? `<p style="background:#f4f6fb;padding:7px 10px;border-left:3px solid #3B5EA6;"><strong>SCG Assessment:</strong> ${d.situationScg}</p>` : ''}</div>` : ''}
</div>${pf(d.ref, 'Page 1')}</div>

<div class="page"><div>${lh('Service Requisition & Mandate', d.ref)}</div><div class="body">
${fin.length ? sh('Financial Snapshot (₹ in Lakhs)') + `<table class="dt"><thead><tr><th>Parameter</th><th class="r">Year -2</th><th class="r">Year -1</th><th class="r">Current</th></tr></thead><tbody>${fin.map(r => `<tr><td><strong>${r.param}</strong></td><td class="r">${r.y0 || '—'}</td><td class="r">${r.y1 || '—'}</td><td class="r">${r.y2 || '—'}</td></tr>`).join('')}</tbody></table>` : ''}
${sh('Declaration & Authorization')}
<div style="background:#fffbeb;border:1.5px solid #C9A84C;border-radius:6px;padding:11px 13px;margin-bottom:14px;font-size:8.5pt;line-height:1.8">
I / We hereby authorize <strong>Shiva Consultancy Group (SCG)</strong> to assess, analyze, and represent our financial requirements to relevant financial institutions, lenders, and government bodies on our behalf. I / We confirm that all information provided is true and accurate. I / We understand this requisition is subject to formal engagement through a Service Agreement with SCG.</div>
${sigBlock({ name: d.cltContact || 'Authorized Signatory', title: d.cltName || 'Client' }, { name: 'Rakesh Jha', title: 'Shiva Consultancy Group, Ahmedabad' })}
</div>${pf(d.ref, 'Page 2')}</div>`;
    openWin('Service Requisition — ' + d.ref, html);
  }

  /* ══════════════════════════════════════════════════
     LOAN APPLICATION
  ══════════════════════════════════════════════════ */
  function dlLA(d) {
    const pl = d.plData || {};
    const plRows = [['Net Sales', 'ns'], ['Gross Profit', 'gp'], ['EBITDA', 'eb'],
                    ['Depreciation', 'dep'], ['Interest', 'int'], ['PBT', 'pbt'], ['PAT', 'pat']];
    const html = cover({
      docType: 'LOAN APPLICATION', title: 'Credit Facility Application',
      subtitle: d.appName || '', refNo: d.ref,
      details: [['Applicant', d.appName || ''], ['Total Credit', '₹ ' + (d.totalCredit || '') + ' Lakhs'],
                ['SR Ref', d.srRef || ''], ['CIBIL Score', d.cibilScore || ''],
                ['Application Date', fmtDate(d.signDate || d.created)]]
    }) + `
<div class="page"><div>${lh('Loan Application', d.ref)}</div><div class="body">
${sh('Applicant Details')}
${ig([['Application Ref', d.ref], ['Applicant Name', d.appName || ''], ['Constitution', d.appConstitution || ''],
       ['Date of Incorporation', d.appDOI || ''], ['Industry', d.appIndustry || ''],
       ['PAN', d.appPan || ''], ['GSTIN', d.appGstin || ''], ['CIN', d.appCin || ''],
       ['Contact Person', d.appContact || ''], ['Mobile', d.appMobile || ''],
       ['Email', d.appEmail || ''], ['SR Reference', d.srRef || '']])}
${sh('Credit Requirement')}
${ig([['Total Credit Required', '₹ ' + (d.totalCredit || '') + ' Lakhs'], ['Project Cost', '₹ ' + (d.projectCost || '') + ' Lakhs'],
       ['CIBIL (Company)', d.cibilScore || ''], ['CIBIL (Promoter)', d.cibilPromoter || ''],
       ['Credit Rating', d.creditRating || ''], ['Client Master Ref', d.clientMasterRef || '']])}
</div>${pf(d.ref, 'Page 1')}</div>
<div class="page"><div>${lh('Loan Application', d.ref)}</div><div class="body">
${sh('Financial Summary — P&L (₹ in Lakhs)')}
<table class="dt"><thead><tr><th>Particulars</th><th class="r">Yr 1</th><th class="r">Yr 2</th><th class="r">Yr 3</th><th class="r">Yr 4 (Est.)</th></tr></thead>
<tbody>${plRows.map(([l, k]) => `<tr><td><strong>${l}</strong></td>${([0, 1, 2, 3]).map(i => `<td class="r">${pl[k + '_' + i] || (pl[k] && pl[k][i]) || '—'}</td>`).join('')}</tr>`).join('')}</tbody></table>
${sh('Declaration')}
<div style="background:#fffbeb;border:1.5px solid #C9A84C;border-radius:6px;padding:11px 13px;margin-bottom:14px;font-size:8.5pt;line-height:1.8">
I / We declare that the information provided is true, correct, and complete. I / We authorize the lender to obtain credit information and verify the details herein.</div>
${sigBlock({ name: d.appContact || 'Authorized Signatory', title: d.appName || '' }, { name: 'For Shiva Consultancy Group', title: 'Prepared & Submitted by SCG, Ahmedabad' })}
</div>${pf(d.ref, 'Page 2')}</div>`;
    openWin('Loan Application — ' + d.ref, html);
  }

  /* ══════════════════════════════════════════════════
     SERVICE AGREEMENT
  ══════════════════════════════════════════════════ */
  function dlAgreement(d) {
    const agr = d.agreement || {};
    const cl = d.client || {};
    const fee = d.fee || {};
    const pay = d.payment || {};
    const terms = d.terms || {};
    const ai = d.aiContent || {};
    const ref = d.ref || d.agrRef || '';

    const html = cover({
      docType: 'PROFESSIONAL SERVICES AGREEMENT', title: 'Engagement Agreement',
      subtitle: 'Under Indian Contract Act, 1872', refNo: ref,
      details: [['Agreement Date', fmtDate(agr.date)], ['Client', cl.name || d.cl_name || ''],
                ['SR Reference', d.srRef || ''], ['Period', agr.period || ''],
                ['Governing Law', 'Laws of ' + (agr.state || 'Gujarat') + ', India']]
    }) + `
<div class="page"><div>${lh('Professional Services Agreement', ref)}</div><div class="body">
${sh('Agreement Parties')}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
<div style="border:1.5px solid #d0d9e8;border-radius:8px;padding:11px;background:#f8f9fc">
<div style="font-size:6.5pt;font-weight:700;color:#7a8ab0;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">PARTY A — SERVICE PROVIDER</div>
<div style="font-size:9.5pt;font-weight:700">Shiva Consultancy Group</div>
<div style="font-size:7.5pt;color:#5a6a82;margin-top:3px">Financial Advisory & Management Consultancy</div>
<div style="font-size:7.5pt;margin-top:3px">Ahmedabad, Gujarat &nbsp;|&nbsp; +91 99790 21275</div>
<div style="font-size:7.5pt;font-weight:600;color:#4A9A3C;margin-top:3px">Signatory: Rakesh Jha</div></div>
<div style="border:1.5px solid #d0d9e8;border-radius:8px;padding:11px;background:#f8f9fc">
<div style="font-size:6.5pt;font-weight:700;color:#7a8ab0;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">PARTY B — CLIENT</div>
<div style="font-size:9.5pt;font-weight:700">${cl.name || d.cl_name || ''}</div>
<div style="font-size:7.5pt;color:#5a6a82;margin-top:3px">${cl.const_ || d.cl_const || ''}</div>
<div style="font-size:7.5pt;margin-top:3px">PAN: ${cl.pan || d.cl_pan || '—'} &nbsp;|&nbsp; GST: ${cl.gst || d.cl_gst || '—'}</div>
<div style="font-size:7.5pt;margin-top:3px">Signatory: ${cl.signatory || d.cl_signatory || '—'}</div></div></div>
${sh('Agreement Details')}
${ig([['Agreement Ref', ref], ['Date of Agreement', fmtDate(agr.date)],
       ['Agreement Type', agr.type || ''], ['SR Reference', d.srRef || ''],
       ['Validity Period', agr.period || ''], ['Jurisdiction', (agr.state || 'Gujarat') + ', India']])}
${ai.scope || terms.scope ? sh('Scope of Services') + narr(ai.scope || terms.scope) : ''}
</div>${pf(ref, 'Page 1')}</div>
<div class="page"><div>${lh('Professional Services Agreement', ref)}</div><div class="body">
${sh('Fee & Payment Terms')}
${ig([['Fee Structure', fee.basis || ''], ['Total Fee', '₹ ' + (fee.totalFee || '') + (fee.pct ? ' (' + fee.pct + '%)' : '')],
       ['Payment Bank', pay.bankName || ''], ['Account No.', pay.acNo || ''],
       ['IFSC Code', pay.ifsc || ''], ['UPI ID', pay.upi || '']])}
${ai.terms || terms.client ? sh('Terms & Conditions') + narr(ai.terms || terms.client) : ''}
${ai.disclaimer || terms.conf ? sh('Confidentiality & Disclaimer') + narr(ai.disclaimer || terms.conf) : ''}
${sh('Execution')}
<div style="background:#fffbeb;border:1px solid #C9A84C;border-radius:6px;padding:9px 11px;margin-bottom:12px;font-size:8pt">IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</div>
${sigBlock({ name: cl.signatory || d.cl_signatory || 'Authorized Signatory', title: cl.name || d.cl_name || 'Party B' }, { name: 'Rakesh Jha', title: 'Shiva Consultancy Group, Ahmedabad' })}
</div>${pf(ref, 'Page 2')}</div>`;
    openWin('Service Agreement — ' + ref, html);
  }

  /* ══════════════════════════════════════════════════
     DPR
  ══════════════════════════════════════════════════ */
  function dlDPR(d) {
    const ai = d.aiContent || {};
    const projKeys = ['cu','ns','cp','gp','se','eb','dep','int','pbt','pat','ds'];
    const projLabels = ['Capacity Utilization %','Net Sales (₹L)','Cost of Production','Gross Profit',
                        'Selling Expenses','EBITDA','Depreciation','Interest','PBT','PAT','Debt Service'];
    const projData = d.projData || {};

    const aiPages = Object.entries({
      executive_summary: 'Executive Summary',
      promoter_profile: 'Promoter Background & Profile',
      project_description: 'Project Description',
      market_analysis: 'Market Analysis',
      financial_analysis: 'Financial Analysis & Viability',
      risk_mitigation: 'Risk Assessment & Mitigation',
      implementation_schedule: 'Implementation Schedule',
    }).filter(([k]) => ai[k]).map(([k, title]) => `
<div class="page"><div>${lh('Detailed Project Report', d.ref)}</div><div class="body">
${sh(title)}${narr(ai[k])}</div>${pf(d.ref, title)}</div>`).join('');

    const html = cover({
      docType: 'DETAILED PROJECT REPORT', title: d.projectName || 'Project Report',
      subtitle: d.promoterName || '', refNo: d.ref,
      details: [['Promoter', d.promoterName || ''], ['Location', (d.projLocation || '') + (d.projState ? ', ' + d.projState : '')],
                ['Total Cost', '₹ ' + (d.totalProjCost || '') + ' Lakhs'], ['Term Loan', '₹ ' + (d.loanAmount || '') + ' Lakhs'],
                ['Client Ref', d.clientMasterRef || ''], ['IRR', d.irr ? d.irr + '%' : '']]
    }) + `
<div class="page"><div>${lh('Detailed Project Report', d.ref)}</div><div class="body">
${sh('Project Overview')}
${ig([['DPR Reference', d.ref], ['Project Name', d.projectName || ''], ['Project Type', d.projectType || ''],
       ['Industry', d.projIndustry || ''], ['Location', d.projLocation || ''], ['State', d.projState || ''],
       ['Land Area', d.landArea || ''], ['Land Ownership', d.landOwnership || ''],
       ['Total Project Cost', '₹ ' + (d.totalProjCost || '') + ' Lakhs'], ['Term Loan', '₹ ' + (d.loanAmount || '') + ' Lakhs'],
       ['Promoter Equity', '₹ ' + (d.promoterEquity || '') + ' Lakhs'], ['D/E Ratio', d.deRatio || ''],
       ['Expected DSCR', d.dscrExpected || ''], ['IRR', d.irr ? d.irr + '%' : ''],
       ['Payback Period', d.payback ? d.payback + ' yrs' : ''], ['Break-Even', d.bep || '']])}
</div>${pf(d.ref, 'Project Overview')}</div>
${aiPages}
<div class="page"><div>${lh('Detailed Project Report', d.ref)}</div><div class="body">
${sh('5-Year Financial Projections (₹ in Lakhs)')}
<table class="dt"><thead><tr><th>Particulars</th><th class="r">Yr 1</th><th class="r">Yr 2</th><th class="r">Yr 3</th><th class="r">Yr 4</th><th class="r">Yr 5</th></tr></thead>
<tbody>${projLabels.map((l, ri) => {
  const k = projKeys[ri];
  const vals = [0,1,2,3,4].map(i => projData[k + '_' + i] || (projData[k] && projData[k][i]) || '—');
  return `<tr><td><strong>${l}</strong></td>${vals.map(v => `<td class="r">${v}</td>`).join('')}</tr>`;
}).join('')}</tbody></table>
${sh('Certification')}
<div style="background:#fffbeb;border:1.5px solid #C9A84C;border-radius:6px;padding:11px;margin-bottom:14px;font-size:8.5pt;line-height:1.8">This Detailed Project Report has been prepared on the basis of information provided by the promoters. Financial projections are based on reasonable assumptions and are subject to market conditions. Shiva Consultancy Group has prepared this report in its professional capacity as financial advisor and does not guarantee actual outcomes.</div>
${sigBlock({ name: d.promFullName || 'Promoter / Director', title: d.promoterName || '' }, { name: 'Rakesh Jha, SCG', title: 'Prepared by: Shiva Consultancy Group, Ahmedabad' })}
</div>${pf(d.ref, 'Projections & Certification')}</div>`;
    openWin('DPR — ' + (d.projectName || d.ref), html);
  }

  /* ══════════════════════════════════════════════════
     BANK PROPOSAL
  ══════════════════════════════════════════════════ */
  function dlBP(d) {
    const ai = d.aiContent || {};
    const fin = d.finData || {};
    const finKeys = ['ns','gp','eb','pat','nw','tb','ds'];
    const finLabels = ['Net Sales / Revenue','Gross Profit','EBITDA','PAT','Net Worth','Total Borrowings','Debt Service'];

    const html = cover({
      docType: 'CREDIT PROPOSAL', title: d.borName || 'Credit Memorandum',
      subtitle: 'Bank Credit Proposal — Shiva Consultancy Group', refNo: d.ref,
      details: [['Proposed Bank', d.targetBank || ''], ['Facility', (d.facilityTypes || '') + ' — ₹' + (d.totalCredit || '') + ' L'],
                ['DPR Ref', d.dprRef || ''], ['CMA Ref', d.cmaRef || ''],
                ['Proposal Date', fmtDate(d.proposalDate)], ['CIBIL', d.cibilScore || '']]
    }) + `
<div class="page"><div>${lh('Credit Proposal', d.ref)}</div><div class="body">
${sh('Proposal Summary')}
${ig([['BP Reference', d.ref], ['Target Bank / Branch', (d.targetBank || '') + (d.targetBranch ? ' — ' + d.targetBranch : '')],
       ['Addressed To', d.addressedTo || ''], ['Proposal Date', fmtDate(d.proposalDate)],
       ['Client Master Ref', d.clientMasterRef || ''], ['DPR Reference', d.dprRef || ''],
       ['CMA Reference', d.cmaRef || ''], ['Total Credit', '₹ ' + (d.totalCredit || '') + ' Lakhs']])}
${sh('Borrower Details')}
${ig([['Borrower Name', d.borName || ''], ['Constitution', d.borConst || ''], ['Industry', d.borIndustry || ''],
       ['Established', d.borYOE || ''], ['PAN', d.borPan || ''], ['GSTIN', d.borGst || ''],
       ['CIN', d.borCin || ''], ['City', d.borCity || ''], ['Contact', d.borContact || ''],
       ['Mobile', d.borMobile || ''], ['CIBIL Score', d.cibilScore || ''], ['Credit Rating', d.creditRating || '']])}
${ai.cover_note ? sh('Cover Note') + narr(ai.cover_note) : ''}
</div>${pf(d.ref, 'Page 1')}</div>
${(ai.borrower_profile || ai.credit_assessment) ? `
<div class="page"><div>${lh('Credit Proposal', d.ref)}</div><div class="body">
${ai.borrower_profile ? sh('Borrower Profile') + narr(ai.borrower_profile) : ''}
${ai.credit_assessment ? sh('Credit Requirement Analysis') + narr(ai.credit_assessment) : ''}
</div>${pf(d.ref, 'Borrower & Credit')}</div>` : ''}
<div class="page"><div>${lh('Credit Proposal', d.ref)}</div><div class="body">
${sh('Financial Summary (₹ in Lakhs)')}
<table class="dt"><thead><tr><th>Particulars</th><th class="r">Y-3</th><th class="r">Y-2</th><th class="r">Y-1</th><th class="r">Current</th><th class="r">Projected</th></tr></thead>
<tbody>${finLabels.map((l, ri) => {
  const k = finKeys[ri];
  return `<tr><td><strong>${l}</strong></td>${[0,1,2,3,4].map(i => `<td class="r">${(fin[k] && fin[k][i]) || '—'}</td>`).join('')}</tr>`;
}).join('')}</tbody></table>
${ai.financial_highlights ? sh('Financial Assessment') + narr(ai.financial_highlights) : ''}
${ai.recommendation ? sh('Recommendation') + `<div style="background:#f0f4ff;border-left:4px solid #3B5EA6;padding:11px 13px;margin-bottom:11px">${narr(ai.recommendation)}</div>` : ''}
${sigBlock({ name: 'Rakesh Jha', title: 'Shiva Consultancy Group, Ahmedabad' }, { name: d.borName || 'Authorized Signatory', title: 'Applicant / Borrower' })}
</div>${pf(d.ref, 'Financial & Recommendation')}</div>`;
    openWin('Bank Proposal — ' + (d.borName || d.ref), html);
  }

  /* ══════════════════════════════════════════════════
     CMA DATA
  ══════════════════════════════════════════════════ */
  function dlCMA(d) {
    const years = d.years || [];
    const pl = d.pl || {};
    const bs = d.bs || {};
    const ai = d.aiContent || {};
    const yrCols = years.length ? years : ['Y1', 'Y2', 'Y3', 'Est.', 'P1', 'P2', 'P3'];

    function cmaTable(rows) {
      return `<table class="dt"><thead><tr><th style="width:38%">Particulars</th>${yrCols.map(y => `<th class="r">${y}</th>`).join('')}</tr></thead><tbody>
${rows.map(([l, k, obj]) => {
  const vals = yrCols.map((_, i) => obj[k + '_' + i] || (obj[k] && obj[k][i]) || '');
  return `<tr><td><strong>${l}</strong></td>${vals.map(v => `<td class="r">${v || '—'}</td>`).join('')}</tr>`;
}).join('')}</tbody></table>`;
    }

    const plRows = [['Net Sales / Turnover', 'ns', pl], ['Other Income', 'oi', pl], ['Total Income', 'ti', pl],
                    ['Cost of Goods Sold', 'cogs', pl], ['Gross Profit', 'gp', pl],
                    ['Selling & Admin Expenses', 'sae', pl], ['EBITDA', 'eb', pl],
                    ['Depreciation', 'dep', pl], ['EBIT', 'ebit', pl],
                    ['Interest Expenses', 'int', pl], ['PBT', 'pbt', pl], ['PAT', 'pat', pl]];
    const bsRows = [['Share Capital / Capital', 'cap', bs], ['Reserves & Surplus', 'res', bs],
                    ['Net Worth (Tangible)', 'nw', bs], ['Term Loan (LT)', 'tl', bs],
                    ['Working Capital Borrowing', 'wc', bs], ['Current Liabilities', 'cl', bs],
                    ['Total Liabilities', 'toliab', bs], ['Fixed Assets (Net)', 'fa', bs],
                    ['Inventory / Stock', 'stk', bs], ['Trade Debtors', 'deb', bs],
                    ['Cash & Bank', 'cash', bs], ['Total Assets', 'ta', bs]];

    const html = cover({
      docType: 'CMA DATA', title: 'Credit Monitoring Arrangement Data',
      subtitle: d.appName || '', refNo: d.ref,
      details: [['Borrower', d.appName || ''], ['Constitution', d.appConst || ''],
                ['Industry', d.appIndustry || ''], ['Bank / FI', d.bankName || ''],
                ['PAN', d.appPan || ''], ['Prepared On', fmtDate(d.cmaDate || d.created)]]
    }) + `
<div class="page"><div>${lh('CMA Data', d.ref)}</div><div class="body">
${sh('Entity Details')}
${ig([['CMA Reference', d.ref], ['Borrower Name', d.appName || ''], ['Constitution', d.appConst || ''],
       ['Industry / Sector', d.appIndustry || ''], ['Company PAN', d.appPan || ''],
       ['Bank / FI', d.bankName || ''], ['Loan Reference', d.loanRef || ''],
       ['Prepared By', d.preparedBy || 'Shiva Consultancy Group'],
       ['CMA Date', fmtDate(d.cmaDate)], ['Client Master Ref', d.clientMasterRef || '']])}
${ai.narrative ? sh('CMA Analytical Narrative') + narr(ai.narrative) : ''}
</div>${pf(d.ref, 'Entity Details')}</div>
<div class="page"><div>${lh('CMA Data — P&L Statement', d.ref)}</div><div class="body">
${sh('Form II — Profit & Loss Statement (₹ in Lakhs)')}
${cmaTable(plRows)}
</div>${pf(d.ref, 'P&L Statement')}</div>
<div class="page"><div>${lh('CMA Data — Balance Sheet', d.ref)}</div><div class="body">
${sh('Form VI — Balance Sheet (₹ in Lakhs)')}
${cmaTable(bsRows)}
${sh('Certification')}
<div style="background:#fffbeb;border:1px solid #C9A84C;border-radius:6px;padding:9px 11px;margin-bottom:12px;font-size:8pt;line-height:1.8">This CMA Data has been prepared on the basis of audited financial statements and information provided by the borrower. The projected figures are based on management estimates and reasonable assumptions.</div>
${sigBlock({ name: d.preparedBy || 'Shiva Consultancy Group', title: 'Prepared by: SCG Financial Advisory, Ahmedabad' }, { name: d.appName || 'Borrower', title: 'Authorized Signatory' })}
</div>${pf(d.ref, 'Balance Sheet')}</div>`;
    openWin('CMA Data — ' + (d.appName || d.ref), html);
  }

  /* ── Dispatcher ── */
  function download(formType, data) {
    const map = {
      client_master: dlClientMaster, service_requisition: dlSR,
      loan_application: dlLA, service_agreement: dlAgreement,
      dpr: dlDPR, bank_proposal: dlBP, cma: dlCMA
    };
    const fn = map[formType];
    if (!fn) return alert('Unknown form type: ' + formType);
    fn(data);
  }

  return { download };
})();
