/* ============================================================
   SCG DPR / TEV Automation Platform — Section Content Templates
   ------------------------------------------------------------
   Module: dpr-templates.js
   Generates professional DPR content for all 21 sections.
   Each generator takes the full project context and returns a
   rich HTML string suitable for the report viewer and for
   conversion to DOCX / PDF.
   ============================================================ */
(function (root) {
  "use strict";

  const E = root.SCG_ENGINE;
  if (!E) { console.error("SCG_ENGINE missing. Load dpr-engine.js first."); return; }

  const esc = (s) => (s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const obs = (title, body) =>
    `<div class="scg-obs"><div class="scg-obs-h">SCG Observation — ${esc(title)}</div><div class="scg-obs-b">${body}</div></div>`;

  /* Helpers */
  const ind = (p) => E.INDUSTRY_BENCHMARKS[p.industry] || E.INDUSTRY_BENCHMARKS.manufacturing;

  /* ---------- 01. EXECUTIVE SUMMARY ---------- */
  function s01_execSummary(p, proj, score) {
    const b = ind(p);
    const capex = E.INR(p.capexTotal);
    const loan = E.INR(p.termLoan);
    const promoter = E.INR(p.promoterContrib);
    const irr = proj.ratios.projectIRR ? (proj.ratios.projectIRR * 100).toFixed(1) + "%" : "—";
    const dscr = proj.ratios.avgDSCR ? proj.ratios.avgDSCR.toFixed(2) + "x" : "—";
    return `
      <h3>1. Executive Summary</h3>
      <p>This Detailed Project Report (DPR) has been prepared by <b>Shiva Consultancy Group (SCG)</b> on behalf of <b>${esc(p.promoterName || "the promoter(s)")}</b> for the proposed <b>${esc(p.projectName || "the project")}</b> in the <b>${esc(b.label)}</b> sector, to be established at <b>${esc(p.location || "the project site")}</b>.</p>
      <table class="scg-kv">
        <tr><td>Project Name</td><td>${esc(p.projectName || "—")}</td></tr>
        <tr><td>Promoter / Entity</td><td>${esc(p.promoterName || "—")} (${esc(p.entityType || "—")})</td></tr>
        <tr><td>Location</td><td>${esc(p.location || "—")}</td></tr>
        <tr><td>Sector</td><td>${esc(b.label)}</td></tr>
        <tr><td>Installed Capacity (Yr 1)</td><td>${esc(p.capacityYr1 || "—")} ${esc(b.capacityUnit)}</td></tr>
        <tr><td>Total Project Cost</td><td><b>${capex}</b></td></tr>
        <tr><td>Means of Finance</td><td>Term Loan ${loan} · Promoter ${promoter}</td></tr>
        <tr><td>Project IRR / Avg DSCR</td><td><b>${irr} · ${dscr}</b></td></tr>
        <tr><td>Payback Period</td><td>${(proj.ratios.paybackYears || 0).toFixed(1)} years</td></tr>
        <tr><td>SCG Bankability Score</td><td><b>${score.score}/100 — ${esc(score.recommendation)}</b></td></tr>
      </table>
      ${obs("Exec Summary",
        `The project demonstrates <b>${dscr}</b> average DSCR and <b>${irr}</b> project IRR against an industry benchmark EBITDA margin of ${b.ebitdaMargin}%. SCG considers the project <b>${esc(score.recommendation)}</b> for bank finance, subject to the risk mitigations listed in Section 20.`)}
    `;
  }

  /* ---------- 02. PROMOTER ANALYSIS ---------- */
  function s02_promoter(p) {
    return `
      <h3>2. Promoter Background & Analysis</h3>
      <p>The promoter(s) of ${esc(p.projectName || "this venture")} are detailed below. SCG has verified the promoter profile based on KYC documents, prior financials (where available) and credit history as furnished.</p>
      <table class="scg-kv">
        <tr><td>Name / Entity</td><td>${esc(p.promoterName || "—")}</td></tr>
        <tr><td>Constitution</td><td>${esc(p.entityType || "Proprietorship / Partnership / LLP / Pvt Ltd")}</td></tr>
        <tr><td>Promoter Experience</td><td>${esc(p.promoterExperience || "—")} years in ${esc(ind(p).label)}</td></tr>
        <tr><td>Educational Background</td><td>${esc(p.promoterEducation || "As per Annexure")}</td></tr>
        <tr><td>Existing Business / Revenue</td><td>${esc(p.promoterExistingRevenue || "—")}</td></tr>
        <tr><td>Net Worth (latest)</td><td>${esc(p.promoterNetWorth || "As per CA-certified statement")}</td></tr>
        <tr><td>CIBIL / Credit History</td><td>${esc(p.promoterCibil || "≥ 750 expected")}</td></tr>
      </table>
      <p><b>Credibility assessment:</b> ${esc(p.promoterName || "The promoter")} brings <b>${esc(p.promoterExperience || "adequate")}</b> years of domain experience and demonstrates commitment through personal equity contribution of <b>${E.INR(p.promoterContrib)}</b> (${((+p.promoterContrib||0)/Math.max(1,+p.capexTotal||1)*100).toFixed(0)}% of project cost). The promoter's operational know-how in ${esc(ind(p).label)} is a key risk-mitigating factor.</p>
      ${obs("Promoter",
        `${+p.promoterExperience >= 5 ? "Promoter experience is <b>adequate</b>." : "Promoter experience is <b>limited</b>; SCG recommends onboarding of experienced CXOs or a technical director."} Collateral coverage of <b>${((+p.collateralValue||0)/Math.max(1,+p.termLoan||1)*100).toFixed(0)}%</b> supports the credit proposal.`)}
    `;
  }

  /* ---------- 03. CONCEPT & PURPOSE ---------- */
  function s03_concept(p) {
    return `
      <h3>3. Project Concept & Purpose</h3>
      <p><b>Project:</b> ${esc(p.projectName || "—")} proposes to set up a ${esc(ind(p).label)} facility at ${esc(p.location || "the project site")} with an installed capacity of <b>${esc(p.capacityYr1 || "—")} ${esc(ind(p).capacityUnit)}</b>.</p>
      <p><b>Rationale:</b> ${esc(p.projectRationale || "The project addresses growing demand in the sector, leverages promoter expertise, exploits location advantages and creates employment and value-addition in the region.")}</p>
      <p><b>Strategic fit:</b> The initiative aligns with India's <i>Make-in-India</i> and <i>Atmanirbhar Bharat</i> objectives, sectoral missions of the Government of India, and state-level industrial promotion schemes applicable to ${esc(p.location || "the location")}.</p>
      <p><b>Key objectives:</b></p>
      <ul>
        <li>Establish a ${esc(ind(p).label)} facility with modern technology and proven OEM equipment</li>
        <li>Achieve installed capacity utilization of ≥ 85% by Year 3 of operations</li>
        <li>Generate direct employment for ${esc(p.directJobs || "the project employment plan")} persons</li>
        <li>Achieve EBITDA margin in line with industry benchmark of ${ind(p).ebitdaMargin}%</li>
        <li>Deliver consistent debt service coverage for lender comfort</li>
      </ul>
    `;
  }

  /* ---------- 04. PRODUCT / SERVICE ---------- */
  function s04_product(p) {
    return `
      <h3>4. Product / Service Details</h3>
      <p><b>Primary product / service:</b> ${esc(p.productName || "As per project scope")}</p>
      <p><b>Specifications:</b> ${esc(p.productSpecs || "Industry-standard specifications; final spec sheet as per Annexure-A.")}</p>
      <p><b>End-use / application:</b> ${esc(p.productEnduse || "Industrial / consumer / export markets in domestic and international geographies.")}</p>
      <p><b>Unit of sale:</b> ${esc(ind(p).capacityUnit)}</p>
      <p><b>Target selling price (Yr 1):</b> ₹ ${esc((+p.sellingPrice||0).toLocaleString("en-IN"))} per unit</p>
      <p><b>Product differentiation:</b> ${esc(p.productDiff || "Quality consistency, competitive pricing, timely delivery and post-sales support form the pillars of differentiation.")}</p>
    `;
  }

  /* ---------- 05. MARKET ANALYSIS ---------- */
  function s05_market(p) {
    const b = ind(p);
    return `
      <h3>5. Market Analysis</h3>
      <p><b>Industry size & growth:</b> The Indian ${esc(b.label)} market is growing at an estimated CAGR of <b>${b.typicalCAGR}%</b>, driven by domestic consumption, government capex, export opportunity, and favourable policy initiatives.</p>
      <h4>5.1 Local Market</h4>
      <p>${esc(p.marketLocal || "In the catchment region, the product enjoys stable demand from local MSMEs, institutional buyers and intermediaries. Logistic cost advantage and proximity to raw material sources strengthen the local value proposition.")}</p>
      <h4>5.2 National Market</h4>
      <p>${esc(p.marketNational || `India's ${b.label} demand is expanding across western, southern and northern industrial clusters. The unit will target a balanced mix of direct B2B sales and distributor network coverage.`)}</p>
      <h4>5.3 Global Opportunity</h4>
      <p>${esc(p.marketGlobal || "Export potential exists for surplus capacity, subject to FTA benefits, RoDTEP/RoSCTL incentives, and buyer compliance (REACH, FDA, BIS as applicable).")}</p>
      <h4>5.4 Demand–Supply Gap</h4>
      <p>${esc(p.marketGap || "Industry reports indicate a widening supply-demand gap in the sector, which the proposed facility aims to partially bridge. SCG estimates captive demand absorption at 60–75% of installed capacity.")}</p>
      ${obs("Market",
        `Sector CAGR of <b>${b.typicalCAGR}%</b> and proximity to demand clusters make the market outlook <b>favourable</b>. Key downside — commodity price volatility — has been addressed in the Risk Matrix (Section 20).`)}
    `;
  }

  /* ---------- 06. TECHNICAL FEASIBILITY ---------- */
  function s06_technical(p) {
    return `
      <h3>6. Technical Feasibility</h3>
      <p><b>Land & Building:</b> ${esc(p.landArea || "—")} sqm / sq ft — ${esc(p.landStatus || "owned / leasehold / allotted by industrial authority")}.</p>
      <p><b>Plant Layout:</b> ${esc(p.plantLayout || "Layout has been designed for efficient material flow, minimum handling, and compliance with factory / fire / pollution norms.")}</p>
      <p><b>Utilities & Infrastructure:</b> Power connection of ${esc(p.powerKVA || "—")} kVA; water, effluent, approach road and telecom available / to be arranged.</p>
      <p><b>Technology / Process Route:</b> ${esc(p.techRoute || "Proven commercial technology from reputed OEMs / domestic manufacturers.")}</p>
      <p><b>Capacity:</b> ${esc(p.capacityYr1 || "—")} ${esc(ind(p).capacityUnit)} installed; capacity utilization ramp 55% → 70% → 85% → 95% in Years 1-4.</p>
      <p><b>Implementation agency:</b> ${esc(p.implementationAgency || "Promoter / EPC contractor / PMC")}</p>
      <p>The technology chosen is well-established, with multiple reference installations in India, adequate OEM support and spares availability.</p>
    `;
  }

  /* ---------- 07. PROJECT COMPONENTS: Employment / Environment / Social / National Importance ---------- */
  function s07_components(p) {
    return `
      <h3>7. Project Components — Employment, Environment, Social & National Importance</h3>
      <h4>7.1 Employment Generation</h4>
      <p>Direct employment: <b>${esc(p.directJobs || "—")}</b> persons (skilled / semi-skilled / unskilled). Indirect employment through supply chain, logistics and ancillary services is estimated at <b>${esc(p.indirectJobs || "—")}</b> additional persons.</p>
      <h4>7.2 Environmental Impact</h4>
      <p>${esc(p.envImpact || "The project will comply with applicable CPCB / SPCB norms. Consent to Establish (CTE) and Consent to Operate (CTO) will be obtained. Where relevant, ETP, STP, air pollution control and solid/hazardous waste management systems have been provisioned.")}</p>
      <h4>7.3 Social Impact</h4>
      <p>${esc(p.socialImpact || "The unit will create gainful local livelihoods, encourage skill development and support local MSME vendors. Community outreach and CSR activities will be undertaken under Section 135 of the Companies Act (where applicable).")}</p>
      <h4>7.4 National Importance</h4>
      <p>${esc(p.nationalImportance || "The project supports India's self-reliance (Atmanirbhar Bharat), contributes to GDP, creates export earnings / import substitution, and aligns with the Government of India's sectoral missions.")}</p>
    `;
  }

  /* ---------- 08. RAW MATERIAL & SUPPLY CHAIN ---------- */
  function s08_rawMaterial(p) {
    return `
      <h3>8. Raw Material & Supply Chain</h3>
      <p><b>Principal raw materials:</b> ${esc(p.rawMaterials || "As per BOM — primary inputs, consumables, packaging and utilities.")}</p>
      <p><b>Sources:</b> ${esc(p.rawMaterialSources || "Local / regional / national suppliers; backup suppliers identified to mitigate concentration risk.")}</p>
      <p><b>Supply chain risk:</b> ${esc(p.supplyChainRisk || "Multi-source strategy, safety stock, long-term supply agreements and price-escalation clauses are recommended.")}</p>
      <p><b>Inbound logistics:</b> Road-based with strategic buffer inventory of ${esc(p.inventoryDays || "30")} days.</p>
    `;
  }

  /* ---------- 09. MACHINERY & TECHNOLOGY ---------- */
  function s09_machinery(p) {
    const rows = (p.machineryList || []).map((m, i) => `<tr><td>${i + 1}</td><td>${esc(m.name)}</td><td>${esc(m.make || "—")}</td><td>${esc(m.qty || "—")}</td><td>${E.INR(m.cost)}</td></tr>`).join("");
    return `
      <h3>9. Machinery, Equipment & Technology</h3>
      <p>The plant & machinery cost has been estimated based on budgetary quotations from reputed OEMs. The detailed list is provided below; vendor quotations are attached in Annexure-B.</p>
      <table class="scg-tbl">
        <thead><tr><th>#</th><th>Item</th><th>Make / OEM</th><th>Qty</th><th>Cost</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#888">Machinery list to be attached (see Annexure-B)</td></tr>`}</tbody>
      </table>
      <p><b>Technology partner:</b> ${esc(p.techPartner || "To be finalised among shortlisted OEMs.")}</p>
      <p><b>Commissioning & warranty:</b> Standard OEM warranty (12–24 months), backed by AMC / service contract post-commissioning.</p>
    `;
  }

  /* ---------- 10. PROCESS FLOW ---------- */
  function s10_process(p) {
    return `
      <h3>10. Manufacturing / Service Process Flow</h3>
      <p>The typical process flow for the proposed unit is outlined below:</p>
      <div class="scg-flow">
        <div class="scg-flow-step">Raw Material Receipt &amp; QC</div>
        <div class="scg-flow-arrow">→</div>
        <div class="scg-flow-step">Pre-processing / Preparation</div>
        <div class="scg-flow-arrow">→</div>
        <div class="scg-flow-step">Primary Processing</div>
        <div class="scg-flow-arrow">→</div>
        <div class="scg-flow-step">Quality Check</div>
        <div class="scg-flow-arrow">→</div>
        <div class="scg-flow-step">Finishing / Packing</div>
        <div class="scg-flow-arrow">→</div>
        <div class="scg-flow-step">Dispatch / Warehouse</div>
      </div>
      <p>${esc(p.processNotes || "Process parameters, cycle times and material balances are detailed in Annexure-C. The process has been optimised for minimum wastage, energy efficiency and product consistency.")}</p>
    `;
  }

  /* ---------- 11. MARKETING STRATEGY ---------- */
  function s11_marketing(p) {
    return `
      <h3>11. Marketing & Distribution Strategy</h3>
      <p><b>Target segments:</b> ${esc(p.targetSegments || "B2B industrial buyers, institutional customers, channel partners and, selectively, export markets.")}</p>
      <p><b>Go-to-market approach:</b> ${esc(p.gtm || "Direct sales for key accounts; distributor / dealer network for geographic coverage; digital / e-commerce for brand-building (where applicable).")}</p>
      <p><b>Pricing strategy:</b> Competitive pricing benchmarked to the ${ind(p).label} sector, with volume-based discounts and credit terms in line with industry norms.</p>
      <p><b>Branding:</b> ${esc(p.branding || "Professional brand identity, BIS / ISI / FSSAI / ISO certifications as applicable, participation in industry expos and trade bodies.")}</p>
    `;
  }

  /* ---------- 12. REGULATORY & COMPLIANCE ---------- */
  function s12_regulatory(p) {
    return `
      <h3>12. Regulatory, Licensing & Compliance</h3>
      <table class="scg-tbl">
        <thead><tr><th>Approval</th><th>Authority</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>GST Registration</td><td>GST Dept.</td><td>${esc(p.regGST || "Obtained / In-process")}</td></tr>
          <tr><td>Udyam / MSME</td><td>MoMSME</td><td>${esc(p.regUdyam || "Obtained / In-process")}</td></tr>
          <tr><td>Factory Licence</td><td>DISH / Factory Inspectorate</td><td>${esc(p.regFactory || "To be obtained pre-commissioning")}</td></tr>
          <tr><td>Pollution — CTE / CTO</td><td>SPCB</td><td>${esc(p.regPollution || "CTE obtained / CTO on commissioning")}</td></tr>
          <tr><td>Building / Plan Approval</td><td>Local Authority</td><td>${esc(p.regBuilding || "Approved / In-process")}</td></tr>
          <tr><td>Fire NOC</td><td>Fire Department</td><td>${esc(p.regFire || "To be obtained pre-commissioning")}</td></tr>
          <tr><td>Sector-specific (FSSAI / BIS / Drug / AERB)</td><td>Relevant regulator</td><td>${esc(p.regSector || "As per product scope")}</td></tr>
        </tbody>
      </table>
      <p>SCG will support the promoter with a complete compliance calendar and handholding through approvals.</p>
    `;
  }

  /* ---------- 13. PROJECT COST & MEANS OF FINANCE ---------- */
  function s13_costFinance(p) {
    const rows = [
      ["Land & Site Development", p.costLand],
      ["Building & Civil Works", p.costBuilding],
      ["Plant & Machinery", p.costMachinery],
      ["Misc. Fixed Assets", p.costMiscAssets],
      ["Pre-operative & Preliminary Exp.", p.costPreop],
      ["Contingency", p.costContingency],
      ["Margin for Working Capital", p.costWCMargin],
    ];
    const tbody = rows.map((r) => `<tr><td>${esc(r[0])}</td><td class="r">${E.INR(r[1])}</td></tr>`).join("");
    const total = rows.reduce((s, r) => s + (+r[1] || 0), 0) || +p.capexTotal || 0;
    const promoterPct = ((+p.promoterContrib||0)/total*100).toFixed(0);
    const loanPct = ((+p.termLoan||0)/total*100).toFixed(0);
    return `
      <h3>13. Project Cost &amp; Means of Finance</h3>
      <h4>13.1 Project Cost</h4>
      <table class="scg-tbl">
        <thead><tr><th>Component</th><th class="r">Amount</th></tr></thead>
        <tbody>${tbody}
          <tr class="total"><td><b>Total Project Cost</b></td><td class="r"><b>${E.INR(total)}</b></td></tr>
        </tbody>
      </table>
      <h4>13.2 Means of Finance</h4>
      <table class="scg-tbl">
        <thead><tr><th>Source</th><th class="r">Amount</th><th class="r">%</th></tr></thead>
        <tbody>
          <tr><td>Promoter's Contribution</td><td class="r">${E.INR(p.promoterContrib)}</td><td class="r">${promoterPct}%</td></tr>
          <tr><td>Term Loan from Bank / FI</td><td class="r">${E.INR(p.termLoan)}</td><td class="r">${loanPct}%</td></tr>
          <tr><td>Unsecured Loans / Internal Accruals</td><td class="r">${E.INR(p.otherSources)}</td><td class="r">—</td></tr>
          <tr class="total"><td><b>Total Means of Finance</b></td><td class="r"><b>${E.INR(total)}</b></td><td class="r">100%</td></tr>
        </tbody>
      </table>
      <p><b>Debt–Equity Ratio:</b> ${((+p.termLoan||0) / Math.max(1, (+p.promoterContrib||1))).toFixed(2)} : 1</p>
    `;
  }

  /* ---------- 14. FINANCIAL PROJECTIONS ---------- */
  function s14_projections(p, proj) {
    const header = `<tr><th>Year</th><th class="r">Utilisation</th><th class="r">Revenue</th><th class="r">EBITDA</th><th class="r">Depreciation</th><th class="r">Interest</th><th class="r">PAT</th><th class="r">Cash Accrual</th><th class="r">DSCR</th></tr>`;
    const body = proj.rows.map((r) => `
      <tr>
        <td>Yr ${r.year}</td>
        <td class="r">${(r.utilization * 100).toFixed(0)}%</td>
        <td class="r">${E.INR(r.revenue)}</td>
        <td class="r">${E.INR(r.ebitda)}</td>
        <td class="r">${E.INR(r.depreciation)}</td>
        <td class="r">${E.INR(r.interest)}</td>
        <td class="r">${E.INR(r.pat)}</td>
        <td class="r">${E.INR(r.cashAccrual)}</td>
        <td class="r">${r.dscr ? r.dscr.toFixed(2) + "x" : "—"}</td>
      </tr>`).join("");
    return `
      <h3>14. Financial Projections</h3>
      <p>Financial projections have been prepared over a horizon of ${proj.rows.length} years, based on conservative assumptions aligned with ${ind(p).label} industry benchmarks.</p>
      <table class="scg-tbl small">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  /* ---------- 15. CMA ---------- */
  function s15_cma(p, proj) {
    return `
      <h3>15. CMA Data (Bank Format Summary)</h3>
      <p>Credit Monitoring Arrangement (CMA) data has been prepared in the standard 6-form bank format and is provided in the accompanying Excel model. A summary of key CMA parameters is below:</p>
      <table class="scg-kv">
        <tr><td>Current Ratio (Year 3)</td><td>≥ 1.33:1 (target)</td></tr>
        <tr><td>Debt-Equity Ratio</td><td>${((+p.termLoan||0)/Math.max(1,+p.promoterContrib||1)).toFixed(2)}:1</td></tr>
        <tr><td>TOL / TNW (Year 3)</td><td>≤ 3:1 (target)</td></tr>
        <tr><td>Inventory Holding (days)</td><td>${esc(p.inventoryDays || 30)}</td></tr>
        <tr><td>Debtors (days)</td><td>${esc(p.debtorDays || 45)}</td></tr>
        <tr><td>Creditors (days)</td><td>${esc(p.creditorDays || 30)}</td></tr>
        <tr><td>Working Capital Requirement</td><td>${E.INR(p.workingCapital)}</td></tr>
        <tr><td>Max Permissible Bank Finance (MPBF — 2nd method)</td><td>~ 75% of WC gap</td></tr>
      </table>
    `;
  }

  /* ---------- 16. FINANCIAL RATIOS ---------- */
  function s16_ratios(p, proj) {
    const r = proj.ratios;
    return `
      <h3>16. Key Financial Ratios</h3>
      <table class="scg-kv">
        <tr><td>Project IRR</td><td><b>${r.projectIRR ? (r.projectIRR * 100).toFixed(2) + "%" : "—"}</b></td></tr>
        <tr><td>Equity IRR</td><td><b>${r.equityIRR ? (r.equityIRR * 100).toFixed(2) + "%" : "—"}</b></td></tr>
        <tr><td>Project NPV @ 12%</td><td>${E.INR(r.projectNPV)}</td></tr>
        <tr><td>Equity NPV @ 15%</td><td>${E.INR(r.equityNPV)}</td></tr>
        <tr><td>Average DSCR</td><td><b>${r.avgDSCR ? r.avgDSCR.toFixed(2) + "x" : "—"}</b></td></tr>
        <tr><td>Minimum DSCR (any year)</td><td>${r.minDSCR ? r.minDSCR.toFixed(2) + "x" : "—"}</td></tr>
        <tr><td>Payback Period</td><td>${r.paybackYears ? r.paybackYears.toFixed(1) + " years" : "—"}</td></tr>
        <tr><td>Break-Even (% of sales, Yr 3)</td><td>${r.bepPct ? r.bepPct.toFixed(0) + "%" : "—"}</td></tr>
      </table>
      ${obs("Financial Ratios",
        `${(r.avgDSCR || 0) >= 1.5 ? "DSCR <b>meets</b> conventional banker benchmarks (≥1.5x)." : "DSCR is <b>below</b> 1.5x — recommend tenor extension or promoter equity top-up."} ${((r.projectIRR || 0) * 100) >= 15 ? "Project IRR is <b>healthy</b>." : "Project IRR is <b>modest</b>; sensitivity must be tightly monitored."}`)}
    `;
  }

  /* ---------- 17. SENSITIVITY ---------- */
  function s17_sensitivity(p, sens) {
    const body = sens.map((s) => `
      <tr>
        <td>${esc(s.variable)}</td>
        <td class="r">${(s.dscrBase || 0).toFixed(2)}x</td>
        <td class="r">${(s.dscrUp || 0).toFixed(2)}x</td>
        <td class="r">${(s.dscrDn || 0).toFixed(2)}x</td>
        <td class="r">${((s.irrBase || 0) * 100).toFixed(1)}%</td>
        <td class="r">${((s.irrUp || 0) * 100).toFixed(1)}%</td>
        <td class="r">${((s.irrDn || 0) * 100).toFixed(1)}%</td>
      </tr>`).join("");
    return `
      <h3>17. Sensitivity Analysis (±10% on key drivers)</h3>
      <table class="scg-tbl small">
        <thead>
          <tr><th>Variable</th><th class="r">DSCR Base</th><th class="r">DSCR +10%</th><th class="r">DSCR −10%</th><th class="r">IRR Base</th><th class="r">IRR +10%</th><th class="r">IRR −10%</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
      <p>${(sens.some((s) => Math.min(s.dscrUp, s.dscrDn) < 1.2)) ? "<b>Caution:</b> Under adverse ±10% movement of at least one driver, DSCR falls below 1.2x. Stress scenarios should be mitigated through working capital buffer / tenor extension." : "The project is reasonably resilient to ±10% variation in the key value drivers."}</p>
    `;
  }

  /* ---------- 18. SUBSIDY / SCHEMES ---------- */
  function s18_schemes(p) {
    const schemes = E.matchingSchemes(p);
    const body = schemes.map((s) => `
      <tr>
        <td><b>${esc(s.code)}</b></td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.ministry)}</td>
        <td>${esc(s.subsidy)}</td>
        <td>${esc(s.ceiling)}</td>
      </tr>`).join("");
    return `
      <h3>18. Applicable Government Schemes &amp; Subsidy Mapping</h3>
      <p>SCG has mapped applicable central and state government schemes based on the sector (${esc(ind(p).label)}) and project parameters:</p>
      <table class="scg-tbl small">
        <thead><tr><th>Code</th><th>Scheme</th><th>Ministry / Agency</th><th>Benefit</th><th>Ceiling</th></tr></thead>
        <tbody>${body || `<tr><td colspan="5">No specific central scheme mapped; state incentives to be explored.</td></tr>`}</tbody>
      </table>
      ${obs("Schemes",
        `SCG recommends pursuing ${schemes.length ? "<b>" + schemes.slice(0, 2).map((s) => s.code).join(", ") + "</b>" : "state-level"} schemes alongside term-loan sanction for maximum capital efficiency.`)}
    `;
  }

  /* ---------- 19. IMPLEMENTATION SCHEDULE ---------- */
  function s19_schedule(p) {
    return `
      <h3>19. Implementation Schedule</h3>
      <table class="scg-tbl">
        <thead><tr><th>Milestone</th><th>Month</th></tr></thead>
        <tbody>
          <tr><td>Land / site finalisation &amp; legal clearance</td><td>M-0</td></tr>
          <tr><td>Project sanction &amp; disbursement — Tranche 1</td><td>M-1 to M-2</td></tr>
          <tr><td>Civil works commencement</td><td>M-2</td></tr>
          <tr><td>Machinery ordering (advance)</td><td>M-3</td></tr>
          <tr><td>Civil works completion</td><td>M-6</td></tr>
          <tr><td>Machinery erection &amp; commissioning</td><td>M-7 to M-9</td></tr>
          <tr><td>Trial runs &amp; statutory clearances</td><td>M-10</td></tr>
          <tr><td>Commercial operations date (COD)</td><td><b>M-11 to M-12</b></td></tr>
        </tbody>
      </table>
      <p>Construction / implementation risk is moderate. SCG recommends a PMC / EPC arrangement with milestone-linked payments and LD clauses.</p>
    `;
  }

  /* ---------- 20. RISK / DEBILITY MATRIX ---------- */
  function s20_risk(p, risks) {
    const body = risks.map((r) => `
      <tr class="lvl-${r.level.toLowerCase()}">
        <td>${esc(r.cat)}</td>
        <td>${esc(r.desc)}</td>
        <td class="r">${r.likelihood}</td>
        <td class="r">${r.impact}</td>
        <td class="r"><b>${r.severity}</b></td>
        <td><span class="pill p-${r.level.toLowerCase()}">${r.level}</span></td>
        <td>${esc(r.mitigation)}</td>
      </tr>`).join("");
    return `
      <h3>20. Risk &amp; Debility Matrix</h3>
      <p>The following matrix classifies risks by likelihood (1-5) and impact (1-5); severity = L × I. SCG-recommended mitigation for each risk is specified.</p>
      <table class="scg-tbl small risk-tbl">
        <thead><tr><th>Category</th><th>Risk</th><th class="r">L</th><th class="r">I</th><th class="r">Sev</th><th>Level</th><th>Mitigation</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  /* ---------- 21. FINAL RECOMMENDATION ---------- */
  function s21_final(p, proj, score, priceQ) {
    const r = proj.ratios;
    return `
      <h3>21. SCG Final Recommendation &amp; Opinion</h3>
      <p>Based on the foregoing techno-economic analysis, financial projections, sensitivity and risk assessment, Shiva Consultancy Group tenders the following opinion on ${esc(p.projectName || "the proposed project")}:</p>
      <table class="scg-kv">
        <tr><td>Bankability Score</td><td><b>${score.score}/100</b></td></tr>
        <tr><td>Recommendation</td><td><b>${esc(score.recommendation)}</b></td></tr>
        <tr><td>Project IRR</td><td>${r.projectIRR ? (r.projectIRR*100).toFixed(2)+"%" : "—"}</td></tr>
        <tr><td>Avg / Min DSCR</td><td>${r.avgDSCR ? r.avgDSCR.toFixed(2) : "—"}x / ${r.minDSCR ? r.minDSCR.toFixed(2) : "—"}x</td></tr>
      </table>
      <p><b>Certification:</b> This DPR has been prepared by SCG using verified inputs supplied by the promoter, industry benchmarks, and prudent financial assumptions. The projections are reasonable and achievable under normal business conditions, subject to the risks and mitigants listed in Section 20.</p>
      <p style="margin-top:1rem"><b>For Shiva Consultancy Group</b><br>
      Rakesh Jha — Managing Partner<br>
      Ahmedabad | PAN India Advisory<br>
      rakesh@shivagroup.org.in · +91 9979021275</p>
      <div class="scg-seal">SCG CERTIFIED — DPR &amp; TEV REPORT</div>
    `;
  }

  /* ---------- SECTION REGISTRY ---------- */
  const SECTIONS = [
    { id: 1, key: "exec", title: "Executive Summary", render: s01_execSummary },
    { id: 2, key: "promoter", title: "Promoter Analysis", render: s02_promoter },
    { id: 3, key: "concept", title: "Project Concept & Purpose", render: s03_concept },
    { id: 4, key: "product", title: "Product / Service Details", render: s04_product },
    { id: 5, key: "market", title: "Market Analysis", render: s05_market },
    { id: 6, key: "technical", title: "Technical Feasibility", render: s06_technical },
    { id: 7, key: "components", title: "Employment / Environment / Social / National Importance", render: s07_components },
    { id: 8, key: "raw", title: "Raw Material & Supply Chain", render: s08_rawMaterial },
    { id: 9, key: "machinery", title: "Machinery & Technology", render: s09_machinery },
    { id: 10, key: "process", title: "Process Flow", render: s10_process },
    { id: 11, key: "marketing", title: "Marketing Strategy", render: s11_marketing },
    { id: 12, key: "regulatory", title: "Regulatory & Compliance", render: s12_regulatory },
    { id: 13, key: "cost", title: "Project Cost & Means of Finance", render: s13_costFinance },
    { id: 14, key: "proj", title: "Financial Projections", render: s14_projections },
    { id: 15, key: "cma", title: "CMA Data Summary", render: s15_cma },
    { id: 16, key: "ratios", title: "Key Financial Ratios", render: s16_ratios },
    { id: 17, key: "sensitivity", title: "Sensitivity Analysis", render: s17_sensitivity },
    { id: 18, key: "schemes", title: "Government Subsidy Mapping", render: s18_schemes },
    { id: 19, key: "schedule", title: "Implementation Schedule", render: s19_schedule },
    { id: 20, key: "risk", title: "Risk & Debility Matrix", render: s20_risk },
    { id: 21, key: "final", title: "SCG Final Recommendation", render: s21_final },
  ];

  function renderAll(p, proj, score, sens, risks, priceQ) {
    const html = SECTIONS.map((s) => {
      switch (s.id) {
        case 1: return s.render(p, proj, score);
        case 14: return s.render(p, proj);
        case 15: return s.render(p, proj);
        case 16: return s.render(p, proj);
        case 17: return s.render(p, sens);
        case 18: return s.render(p);
        case 20: return s.render(p, risks);
        case 21: return s.render(p, proj, score, priceQ);
        default: return s.render(p);
      }
    }).join("<hr class='scg-hr'/>");
    return html;
  }

  root.SCG_TEMPLATES = { SECTIONS, renderAll, esc };
})(typeof window !== "undefined" ? window : this);
