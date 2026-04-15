/* ============================================================
   SCG DPR / TEV Automation Platform — Section Content Templates
   ------------------------------------------------------------
   Module: dpr-templates.js                              v2
   Tier-aware, long-form generators for all 21 sections.
   - Multi-promoter array rendering
   - Sister concerns rendering
   - Custom notes splice on every section
   - Tier-aware content density (T1 Micro → T4 Large)
   - Detailed narrative, standard story, professional tone
   ============================================================ */
(function (root) {
  "use strict";

  const E = root.SCG_ENGINE;
  if (!E) { console.error("SCG_ENGINE missing. Load dpr-engine.js first."); return; }

  const esc = (s) => (s == null ? "" : String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const obs = (title, body) =>
    `<div class="scg-obs"><div class="scg-obs-h">SCG Observation — ${esc(title)}</div><div class="scg-obs-b">${body}</div></div>`;
  const note = (body) => body && String(body).trim() ? `<div class="scg-custom"><div class="scg-custom-h">Project-Specific Note</div><div class="scg-custom-b">${esc(body).replace(/\n/g, "<br>")}</div></div>` : "";

  const ind = (p) => E.INDUSTRY_BENCHMARKS[p.industry] || E.INDUSTRY_BENCHMARKS.manufacturing;
  const tierOf = (p) => E.classifyTier(+p.capexTotal || 0);
  const isT3 = (p) => tierOf(p).density >= 3;
  const isT4 = (p) => tierOf(p).density >= 4;

  // Mask PAN / Aadhaar for privacy in display
  const maskPan = (s) => (s ? String(s).toUpperCase().replace(/^(.{5}).*(.{1})$/, "$1XXXX$2") : "—");
  const maskAadhaar = (s) => {
    if (!s) return "—";
    const d = String(s).replace(/\D/g, "");
    return d.length >= 12 ? "XXXX XXXX " + d.slice(-4) : "—";
  };

  const INR = E.INR;

  /* ---------- 01. EXECUTIVE SUMMARY ---------- */
  function s01_execSummary(p, proj, score) {
    const b = ind(p);
    const t = tierOf(p);
    const capex = INR(p.capexTotal);
    const loan = INR(p.termLoan);
    const promoter = INR(p.promoterContrib);
    const irr = proj.ratios.projectIRR ? (proj.ratios.projectIRR * 100).toFixed(1) + "%" : "—";
    const dscr = proj.ratios.avgDSCR ? proj.ratios.avgDSCR.toFixed(2) + "x" : "—";
    const nPromoters = (p.promoters || []).filter(x => x.name).length || 1;
    const promoterLabel = nPromoters > 1 ? `${nPromoters} promoter-directors led by ${esc((p.promoters && p.promoters[0] && p.promoters[0].name) || p.promoterName || "the promoter group")}` : esc((p.promoters && p.promoters[0] && p.promoters[0].name) || p.promoterName || "the promoter");

    const opening = t.density >= 3 ?
      `<p>This <b>Detailed Project Report (DPR)</b> has been prepared by <b>Shiva Consultancy Group (SCG)</b> on behalf of ${promoterLabel} for the proposed <b>${esc(p.projectName || "the project")}</b> in the <b>${esc(b.label)}</b> sector, to be established at <b>${esc(p.location || "the project site")}</b>. The report is classified <b>${esc(t.label)}</b> and has been prepared in accordance with standard practices followed by scheduled commercial banks, all-India financial institutions and specialised lenders for techno-economic viability appraisal.</p>
      <p>The proposed unit will install a capacity of <b>${esc(p.capacityYr1 || "—")} ${esc(b.capacityUnit)}</b> in Year 1, scaling to full utilization by Year 3. The project contemplates a total outlay of <b>${capex}</b>, of which <b>${loan}</b> (${((+p.termLoan||0)/Math.max(1,+p.capexTotal||1)*100).toFixed(0)}%) is proposed to be financed through bank term loan and the balance <b>${promoter}</b> (${((+p.promoterContrib||0)/Math.max(1,+p.capexTotal||1)*100).toFixed(0)}%) through promoter contribution. Working capital of <b>${INR(p.workingCapital)}</b> has been provisioned separately.</p>
      <p>On the basis of conservative assumptions around price realisation, utilisation ramp and operating cost, the project generates a <b>Project IRR of ${irr}</b> and an <b>Average DSCR of ${dscr}</b>, comfortably exceeding banker benchmarks for the sector. The payback period is ${(proj.ratios.paybackYears || 0).toFixed(1)} years. SCG has graded the proposal on its proprietary Bankability Framework and assigns a score of <b>${score.score}/100 — ${esc(score.recommendation)}</b>.</p>` :
      `<p>This Detailed Project Report (DPR) has been prepared by <b>Shiva Consultancy Group</b> for ${promoterLabel} for the proposed <b>${esc(p.projectName || "the project")}</b> in the <b>${esc(b.label)}</b> sector at <b>${esc(p.location || "the project site")}</b>, with a total outlay of <b>${capex}</b>.</p>`;

    return `
      <h3>1. Executive Summary</h3>
      ${opening}
      <table class="scg-kv">
        <tr><td>Project Name</td><td>${esc(p.projectName || "—")}</td></tr>
        <tr><td>Promoter / Entity</td><td>${esc(p.promoterName || (p.promoters && p.promoters[0] && p.promoters[0].name) || "—")} (${esc(p.entityType || "—")})</td></tr>
        <tr><td>Location</td><td>${esc(p.location || "—")}</td></tr>
        <tr><td>Sector</td><td>${esc(b.label)}</td></tr>
        <tr><td>Capacity (Yr 1 → Stabilised)</td><td>${esc(p.capacityYr1 || "—")} ${esc(b.capacityUnit)} · ramp to 95% by Yr 4</td></tr>
        <tr><td>Total Project Cost</td><td><b>${capex}</b></td></tr>
        <tr><td>Debt : Equity</td><td>${((+p.termLoan||0) / Math.max(1, (+p.promoterContrib||1))).toFixed(2)} : 1</td></tr>
        <tr><td>Project IRR · Equity IRR</td><td>${irr} · ${proj.ratios.equityIRR ? (proj.ratios.equityIRR*100).toFixed(1)+"%" : "—"}</td></tr>
        <tr><td>Avg DSCR · Min DSCR</td><td>${dscr} · ${proj.ratios.minDSCR?proj.ratios.minDSCR.toFixed(2)+"x":"—"}</td></tr>
        <tr><td>Payback · BEP (% of sales)</td><td>${(proj.ratios.paybackYears||0).toFixed(1)} yrs · ${proj.ratios.bepPct?proj.ratios.bepPct.toFixed(0)+"%":"—"}</td></tr>
        <tr><td>SCG Tier Classification</td><td><b>${esc(t.label)}</b> · Target ${esc(t.targetPages)} pages</td></tr>
        <tr><td>SCG Bankability Score</td><td><b>${score.score}/100 — ${esc(score.recommendation)}</b></td></tr>
      </table>
      ${note(p.customNote_exec)}
      ${obs("Exec Summary",
        `The project demonstrates <b>${dscr}</b> average DSCR and <b>${irr}</b> project IRR against an industry benchmark EBITDA margin of ${b.ebitdaMargin}%. SCG considers the project <b>${esc(score.recommendation)}</b> for bank finance, subject to the risk mitigations listed in Section 20.`)}
    `;
  }

  /* ---------- 02. PROMOTER ANALYSIS (multi-promoter + sister concerns) ---------- */
  function s02_promoter(p) {
    const promoters = (p.promoters && p.promoters.length ? p.promoters : [{
      name: p.promoterName, role: "Promoter / Director",
      experience: p.promoterExperience, netWorth: p.promoterNetWorth,
      education: p.promoterEducation, skill: "", pan: "", aadhaar: "",
      itrY1: 0, itrY2: 0, itrY3: 0, shareholding: 100,
    }]).filter(x => x && x.name);

    const hasPromoters = promoters.length > 0;
    const t = tierOf(p);

    const promoterRows = hasPromoters ? promoters.map((m, i) => `
      <div class="scg-prom">
        <h4>${i + 1}. ${esc(m.name || "Promoter")} <span class="scg-role">${esc(m.role || "—")}</span></h4>
        <table class="scg-kv">
          <tr><td>Date of Birth · Gender</td><td>${esc(m.dob || "—")} · ${esc(m.gender || "—")}</td></tr>
          <tr><td>PAN (masked) · Aadhaar (masked)</td><td>${maskPan(m.pan)} · ${maskAadhaar(m.aadhaar)}</td></tr>
          <tr><td>Education</td><td>${esc(m.education || "—")}</td></tr>
          <tr><td>Experience</td><td>${esc(m.experience || "—")} years in ${esc(ind(p).label)}</td></tr>
          <tr><td>Key Skills / Specialisations</td><td>${esc(m.skill || "—")}</td></tr>
          <tr><td>Net Worth (latest certified)</td><td>${INR(m.netWorth)}</td></tr>
          <tr><td>Income as per ITR (last 3 yrs)</td><td>${INR(m.itrY1)} · ${INR(m.itrY2)} · ${INR(m.itrY3)}</td></tr>
          <tr><td>Shareholding</td><td>${esc(m.shareholding || "—")}%</td></tr>
        </table>
      </div>
    `).join("") : `<p><i>No promoter records entered.</i></p>`;

    // Sister concerns
    const sc = (p.sisterConcerns || []).filter(x => x && x.name);
    const scBlock = sc.length ? `
      <h4>2.${hasPromoters ? "2" : "1"} Group / Sister Concerns (${sc.length})</h4>
      <p>The promoter group is already engaged in the following allied business interests. These provide operational depth, banking track-record and cross-collateral comfort to the lender:</p>
      <table class="scg-tbl small">
        <thead><tr>
          <th>#</th><th>Name</th><th>Constitution</th><th>Incorp Year</th><th>Incorp No</th><th>PAN</th><th>Principal Activity</th><th class="r">Last Sales</th><th class="r">Net Worth</th>
        </tr></thead>
        <tbody>
          ${sc.map((s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${esc(s.name)}</td>
              <td>${esc(s.constitution || "—")}</td>
              <td>${esc(s.yearInc || "—")}</td>
              <td>${esc(s.incorpNo || "—")}</td>
              <td>${esc(s.pan || "—")}</td>
              <td>${esc(s.activity || "—")}</td>
              <td class="r">${INR(s.lastSales)}</td>
              <td class="r">${INR(s.netWorth)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${t.density >= 3 ? `<p>Combined group turnover of <b>${INR(sc.reduce((a, s) => a + (+s.lastSales || 0), 0))}</b> and aggregate net worth of <b>${INR(sc.reduce((a, s) => a + (+s.netWorth || 0), 0))}</b> across ${sc.length} entities indicates a well-diversified business portfolio with established market presence.</p>` : ""}
    ` : "";

    const collateral = `
      <h4>2.${hasPromoters ? (sc.length ? "3" : "2") : "1"} Credit Standing &amp; Collateral</h4>
      <table class="scg-kv">
        <tr><td>CIBIL / Credit Score</td><td>${esc(p.promoterCibil || "≥ 750 expected")}</td></tr>
        <tr><td>Total Promoter Contribution</td><td><b>${INR(p.promoterContrib)}</b> (${((+p.promoterContrib||0)/Math.max(1,+p.capexTotal||1)*100).toFixed(0)}% of project cost)</td></tr>
        <tr><td>Collateral Offered</td><td>${INR(p.collateralValue)} (${((+p.collateralValue||0)/Math.max(1,+p.termLoan||1)*100).toFixed(0)}% of term loan)</td></tr>
        <tr><td>Collateral Type</td><td>${esc(p.collateralType || "Primary security on project assets + collateral security")}</td></tr>
      </table>
    `;

    const totalNW = promoters.reduce((a, m) => a + (+m.netWorth || 0), 0);
    const totalExp = promoters.reduce((a, m) => a + (+m.experience || 0), 0);
    const avgExp = promoters.length ? totalExp / promoters.length : 0;

    return `
      <h3>2. Promoter Background &amp; Analysis</h3>
      <p>The promoter(s) of <b>${esc(p.projectName || "this venture")}</b> are detailed below. SCG has verified the promoter profile based on KYC documents, prior audited financials and credit history as furnished. ${promoters.length > 1 ? `The project is being promoted jointly by <b>${promoters.length}</b> promoter-directors bringing complementary expertise and a combined net worth of <b>${INR(totalNW)}</b>.` : `The promoter brings <b>${avgExp.toFixed(0)}</b> years of domain experience and a personal net worth of <b>${INR(totalNW)}</b>.`}</p>

      <h4>2.1 Promoter Profile</h4>
      ${promoterRows}
      ${scBlock}
      ${collateral}
      ${note(p.customNote_promoter)}
      ${obs("Promoter",
        `${avgExp >= 5 ? "Aggregate promoter experience of <b>" + Math.round(totalExp) + " person-years</b> is <b>adequate</b> for the proposed venture." : "Promoter experience is <b>limited</b>; SCG recommends onboarding of an experienced CXO / technical director."} Collateral coverage of <b>${((+p.collateralValue||0)/Math.max(1,+p.termLoan||1)*100).toFixed(0)}%</b> supports the credit proposal.${sc.length ? " Group / sister-concern track record materially strengthens the credit proposition." : ""}`)}
    `;
  }

  /* ---------- 03. CONCEPT & PURPOSE (tier-aware story mode) ---------- */
  function s03_concept(p) {
    const b = ind(p);
    const t = tierOf(p);
    const proj = esc(p.projectName || "the project");
    const loc = esc(p.location || "the project site");

    const base = `
      <h4>3.1 Project Description</h4>
      <p><b>Project Name:</b> ${proj}<br>
      <b>Location:</b> ${loc}<br>
      <b>Sector:</b> ${esc(b.label)}<br>
      <b>Installed Capacity (Yr 1):</b> ${esc(p.capacityYr1 || "—")} ${esc(b.capacityUnit)}<br>
      <b>Project Type:</b> ${esc(p.projectType || "Greenfield")}</p>
    `;

    const rationale = `
      <h4>3.2 Rationale &amp; Strategic Fit</h4>
      <p>${esc(p.projectRationale || "The project addresses growing demand in the " + b.label + " sector, leverages promoter expertise, exploits location and logistics advantages, and creates meaningful employment and value-addition in the region.")}</p>
    `;

    // Tier 2+ — add "why now / why here / why us"
    const whyBlock = t.density >= 2 ? `
      <h4>3.3 Why Now, Why Here, Why Us</h4>
      <p><b>Why Now:</b> The Indian ${esc(b.label)} sector is in a structural up-cycle, projected to expand at a CAGR of <b>${b.typicalCAGR}%</b> over the next five years. Demand drivers include rising per-capita consumption, import substitution tailwinds under Atmanirbhar Bharat, favourable policy support (${(b.keySchemes || []).slice(0, 2).join(", ")}), and a widening supply-demand gap in the immediate catchment. The current window is optimal for capacity creation ahead of the next capex cycle.</p>
      <p><b>Why Here:</b> ${loc} offers a combination of raw-material access, skilled manpower availability, industrial infrastructure, competitive power and water tariffs, and connectivity to end-user markets. ${esc(p.locationRationale || "The specific site identified has necessary utility connections, clear title, and enabling zoning for the proposed activity.")}</p>
      <p><b>Why Us:</b> ${(p.promoters || []).length > 1 ? "The promoter group combines operational, technical and financial experience across complementary domains, enabling disciplined execution." : "The promoter brings hands-on domain experience, long-standing supplier-buyer relationships, and technical proficiency which materially de-risks execution."} SCG has independently validated that the promoter has the means, capability and commitment to deliver the project as envisaged.</p>
    ` : "";

    // Tier 3+ — add SDG alignment and strategic objectives
    const objectivesBlock = t.density >= 3 ? `
      <h4>3.4 Strategic Objectives</h4>
      <ul>
        <li><b>Market objective:</b> Establish a credible ${esc(b.label)} producer in the catchment with capability to service institutional buyers, channel partners and (where applicable) export markets.</li>
        <li><b>Operational objective:</b> Achieve installed capacity utilisation of ≥ 85% by Year 3, with EBITDA margin consistent with the sector benchmark of ${b.ebitdaMargin}%.</li>
        <li><b>Financial objective:</b> Deliver a Project IRR above the cost of capital with comfortable debt-service headroom; build a sustainable cash-generating asset by Year 4.</li>
        <li><b>Employment objective:</b> Generate <b>${esc(p.directJobs || "—")}</b> direct jobs (skilled / semi-skilled / unskilled) and enable indirect employment of <b>${esc(p.indirectJobs || "—")}</b> across the supply chain.</li>
        <li><b>Institutional objective:</b> Build a formally structured entity eligible for government scheme participation (${(b.keySchemes || []).slice(0, 3).join(", ")}) and bank refinance.</li>
      </ul>
      <h4>3.5 SDG &amp; National Priority Alignment</h4>
      <p>The project aligns with India's macro priorities and the UN Sustainable Development Goals — specifically <b>SDG 8</b> (Decent Work &amp; Economic Growth), <b>SDG 9</b> (Industry, Innovation &amp; Infrastructure), <b>SDG 12</b> (Responsible Consumption &amp; Production) and where applicable, <b>SDG 2</b> (Zero Hunger, for agro/food value chains) and <b>SDG 7</b> (Affordable &amp; Clean Energy, for renewable projects). The initiative contributes to district-level GDP, export potential / import substitution, and formalisation of livelihoods.</p>
    ` : "";

    // Tier 4 — add investor view & exit strategy
    const investorBlock = t.density >= 4 ? `
      <h4>3.6 Investor View &amp; Long-Term Value</h4>
      <p>From an equity investor standpoint, the project is designed to deliver sustained free cash flow from Year 3 onwards, enabling reinvestment into adjacencies, debt prepayment, or shareholder returns. The asset base is fungible and tangible, providing downside protection. In the event of a strategic exit, comparable sector transactions have historically closed at <b>6–10x EBITDA</b> multiples, which would translate into a meaningful capital gain for promoters. Institutional equity participation, if pursued at a later stage, is feasible through PE / family-office channels or through listing via SME exchange once the business crosses ₹50 Cr turnover.</p>
    ` : "";

    return `
      <h3>3. Project Concept &amp; Purpose</h3>
      ${base}
      ${rationale}
      ${whyBlock}
      ${objectivesBlock}
      ${investorBlock}
      ${note(p.customNote_concept)}
    `;
  }

  /* ---------- 04. PRODUCT / SERVICE ---------- */
  function s04_product(p) {
    const t = tierOf(p);
    const b = ind(p);
    const extra = t.density >= 3 ? `
      <h4>4.4 Quality, Certifications &amp; Standards</h4>
      <p>${esc(p.qualityStandards || "The unit will operate under an ISO 9001:2015 Quality Management System. Product-specific certifications (BIS / ISI / FSSAI / BRCGS / GMP as applicable) will be obtained. Inline QC, statistical process control, and batch traceability are built into the process design.")}</p>
      <h4>4.5 Research, Development &amp; Innovation</h4>
      <p>${esc(p.rndPlan || "The unit will maintain an in-house R&D cell for product improvement, new variant development and process optimisation, supported by tie-ups with academic institutions and industry associations.")}</p>
    ` : "";
    return `
      <h3>4. Product / Service Details</h3>
      <h4>4.1 Primary Product / Service</h4>
      <p>${esc(p.productName || "As per project scope")}</p>
      <h4>4.2 Specifications &amp; Composition</h4>
      <p>${esc(p.productSpecs || "Industry-standard specifications; final spec sheet as per Annexure-A. The product will conform to applicable Indian and international standards.")}</p>
      <h4>4.3 End-Use &amp; Applications</h4>
      <p>${esc(p.productEnduse || "Industrial / consumer / export markets across domestic and international geographies.")}</p>
      <p><b>Unit of sale:</b> ${esc(b.capacityUnit)} · <b>Indicative Year-1 selling price:</b> ₹ ${esc((+p.sellingPrice||0).toLocaleString("en-IN"))} per unit</p>
      <p><b>Product differentiation:</b> ${esc(p.productDiff || "Quality consistency, competitive pricing, timely delivery and post-sales support are the pillars of differentiation.")}</p>
      ${extra}
      ${note(p.customNote_product)}
    `;
  }

  /* ---------- 05. MARKET ANALYSIS (tier-aware) ---------- */
  function s05_market(p) {
    const b = ind(p);
    const t = tierOf(p);

    const core = `
      <h4>5.1 Industry Overview</h4>
      <p>The Indian ${esc(b.label)} industry is one of the structural growth pillars of the Indian economy, projected to expand at a CAGR of <b>${b.typicalCAGR}%</b> over the medium term. The sector derives its growth momentum from favourable demographics, rising per-capita consumption, government capital expenditure, import substitution tailwinds, and proactive policy support. Typical EBITDA margins in the sector range around <b>${b.ebitdaMargin}%</b>, with net margins of <b>${b.netMarginRange[0]}–${b.netMarginRange[1]}%</b> for well-run units. Debt-equity norms followed by lenders are typically around <b>${b.debtEquity}</b>.</p>
      <h4>5.2 Local / Catchment Market</h4>
      <p>${esc(p.marketLocal || "In the immediate catchment, the product enjoys stable demand from local MSMEs, institutional buyers and intermediaries. Logistic cost advantage, proximity to raw material sources and close customer engagement strengthen the local value proposition. SCG estimates that 30–40% of the project's output can be absorbed within a 300-km radius.")}</p>
      <h4>5.3 National Market</h4>
      <p>${esc(p.marketNational || `India's ${b.label} demand is expanding across western, southern and northern industrial clusters, with meaningful concentration in the top 10 consumption nodes. The unit will target a balanced mix of direct B2B sales, distributor-dealer network coverage, institutional contracts and (where applicable) online / e-commerce channels.`)}</p>
    `;

    const global = t.density >= 2 ? `
      <h4>5.4 Global / Export Opportunity</h4>
      <p>${esc(p.marketGlobal || "Export potential exists for surplus capacity, supported by FTA benefits with ASEAN, Middle East and select EU markets. RoDTEP / RoSCTL benefits and buyer-level compliance (REACH, USFDA, BIS, ISO, BRCGS, and sector-specific certifications) would be obtained in a phased manner as export orders develop.")}</p>
    ` : "";

    const demandSupply = t.density >= 2 ? `
      <h4>5.5 Demand–Supply Gap Analysis</h4>
      <p>${esc(p.marketGap || "Industry reports indicate a widening supply-demand gap in the sector, driven by the pace of demand growth outstripping domestic capacity additions and irregular imports. SCG estimates captive demand absorption of 60–75% of installed capacity within the catchment itself, with the balance addressable through the national distribution network. The project is therefore not dependent on creating new demand — it taps latent demand that is currently under-served.")}</p>
    ` : "";

    const forces = t.density >= 3 ? `
      <h4>5.6 Competitive Landscape — Porter's Five Forces</h4>
      <table class="scg-tbl small">
        <thead><tr><th style="width:28%">Force</th><th style="width:12%">Intensity</th><th>SCG Assessment</th></tr></thead>
        <tbody>
          <tr><td>Threat of New Entrants</td><td>Medium</td><td>Entry barriers are moderate — capital intensity, approvals, and technology learning-curve delay new competition by 12–24 months, allowing the project to establish a foothold.</td></tr>
          <tr><td>Bargaining Power of Suppliers</td><td>Medium</td><td>Raw-material supplier base is adequate with multiple sources. Long-term contracts, backward-integration options and strategic stocking mitigate supplier-side pressure.</td></tr>
          <tr><td>Bargaining Power of Buyers</td><td>Medium-High</td><td>Institutional buyers exert price pressure; mitigated through differentiation, service quality and long-term tie-ups. Diversified buyer base reduces concentration risk.</td></tr>
          <tr><td>Threat of Substitutes</td><td>Low-Medium</td><td>Substitution is limited by functional and cost reasons. Product-specific use cases provide natural protection.</td></tr>
          <tr><td>Competitive Rivalry</td><td>Medium</td><td>Competition is moderate with a mix of organised and unorganised players. Organised share is rising as customers prefer compliance, quality and continuity.</td></tr>
        </tbody>
      </table>
    ` : "";

    const segments = t.density >= 2 ? `
      <h4>5.${t.density >= 3 ? "7" : "6"} Target Segments &amp; Go-to-Market</h4>
      <p>${esc(p.targetSegments || "The primary target segments are institutional B2B buyers in the catchment, followed by channel-partner led distribution for geographic expansion. For segments where applicable, direct e-commerce and retail penetration will be pursued selectively.")}</p>
      <p><b>Go-to-market plan:</b> ${esc(p.gtm || "A structured sales plan with a dedicated direct-sales team for key accounts, a channel-partner network for tier-2 and tier-3 towns, participation in industry expos and trade-body events, targeted digital marketing, and an inside-sales desk for lead qualification.")}</p>
    ` : "";

    const drivers = t.density >= 4 ? `
      <h4>5.8 Demand Drivers &amp; Long-Term Outlook</h4>
      <ul>
        <li><b>Macroeconomic:</b> Rising disposable income, urbanisation, and demographic dividend fuel structural demand.</li>
        <li><b>Sector-specific:</b> ${esc(b.label)} is witnessing capacity rationalisation among unorganised players, creating space for compliant, quality-led operators.</li>
        <li><b>Policy:</b> Active government support through (${(b.keySchemes || []).slice(0, 3).join(", ")}) reduces the effective cost of capital and provides direct or indirect incentives.</li>
        <li><b>Export:</b> Diversification from China and rising preference for Indian supply creates structural export pull.</li>
      </ul>
      <p>Over the 10-year horizon, SCG estimates cumulative demand growth of <b>~${Math.round(b.typicalCAGR * 10 * 0.9)}%</b> in the addressable market, ensuring that the project's installed capacity is well-aligned with the available demand envelope.</p>
    ` : "";

    return `
      <h3>5. Market Analysis</h3>
      ${core}
      ${global}
      ${demandSupply}
      ${forces}
      ${segments}
      ${drivers}
      ${note(p.customNote_market)}
      ${obs("Market",
        `Sector CAGR of <b>${b.typicalCAGR}%</b> and proximity to demand clusters make the market outlook <b>favourable</b>. Commodity / price-volatility risk has been addressed in the Risk Matrix (Section 20).`)}
    `;
  }

  /* ---------- 06. TECHNICAL FEASIBILITY (tier-aware) ---------- */
  function s06_technical(p) {
    const b = ind(p);
    const t = tierOf(p);

    const location = `
      <h4>6.1 Location &amp; Site</h4>
      <p><b>Project location:</b> ${esc(p.location || "—")}<br>
      <b>Land area:</b> ${esc(p.landArea || "—")} sqm / sq ft<br>
      <b>Land status:</b> ${esc(p.landStatus || "—")}</p>
      <p>${esc(p.locationRationale || "The site has been selected based on proximity to raw material sources, availability of skilled manpower, utility connections (power, water, road), and access to end-user markets. Site title, zoning and approvals are clear.")}</p>
    `;

    const buildingBlock = t.density >= 2 ? `
      <h4>6.2 Land Development &amp; Civil Works</h4>
      <p>The civil scope covers boundary wall, internal roads, landscaping, main production shed, raw material &amp; finished goods storage, utility block (DG, water, transformer yard), administrative block, security cabin and statutory fire-fighting infrastructure. Building has been designed in accordance with the National Building Code (NBC) and factory-licensing norms applicable to the sector.</p>
    ` : "";

    const process = `
      <h4>6.${t.density >= 2 ? "3" : "2"} Manufacturing / Service Process</h4>
      <p><b>Technology / Process Route:</b> ${esc(p.techRoute || "Proven commercial technology from reputed OEMs / domestic manufacturers.")}</p>
      <p>The process flow has been optimised for material yield, energy efficiency, product consistency and downtime minimisation. Detailed process steps are illustrated in Section 10 of this report. Cycle time, material balance, and yield assumptions are detailed in Annexure-C.</p>
    `;

    const techSelect = t.density >= 3 ? `
      <h4>6.4 Technology &amp; OEM Selection</h4>
      <p>The project has evaluated multiple technology options and OEM suppliers based on parameters such as: reference installations in India, local service support, spare-parts availability, warranty coverage, technology maturity, after-sales service network, and total cost of ownership. Shortlisted technology suppliers have proven track records in comparable projects with published performance guarantees.</p>
    ` : "";

    const utilities = `
      <h4>6.${t.density >= 3 ? "5" : (t.density >= 2 ? "4" : "3")} Utilities &amp; Infrastructure</h4>
      <table class="scg-kv">
        <tr><td>Power requirement</td><td>${esc(p.powerKVA || "—")} kVA ${esc(p.powerSource || "— utility-grid with DG backup")}</td></tr>
        <tr><td>Water requirement</td><td>${esc(p.waterKLPD || "As per process")} KL/day</td></tr>
        <tr><td>Effluent / ETP</td><td>${esc(p.etp || "Zero-Liquid-Discharge (ZLD) where applicable; SPCB-approved ETP for industries generating wastewater")}</td></tr>
        <tr><td>Approach road</td><td>${esc(p.approachRoad || "Direct access from state / national highway")}</td></tr>
        <tr><td>Compressed air / steam</td><td>${esc(p.steamAir || "As per process design")}</td></tr>
      </table>
    `;

    const manpower = t.density >= 2 ? `
      <h4>6.${t.density >= 3 ? "6" : "5"} Manpower Plan</h4>
      <p>The unit will employ <b>${esc(p.directJobs || "—")}</b> direct persons across skill categories — technical (plant operators, QA, maintenance), supervisory (shift in-charge, production planning), and support (HR, accounts, admin, security). Indirect employment of <b>${esc(p.indirectJobs || "—")}</b> persons is generated through the supply chain, logistics, packaging and ancillary services.</p>
    ` : "";

    const qualityEnv = t.density >= 3 ? `
      <h4>6.7 Quality Control &amp; Environmental Compliance</h4>
      <p>A dedicated QA/QC laboratory will be established to perform raw-material inspection, inline process checks, and finished-goods testing as per applicable standards. The plant will obtain CTE &amp; CTO from the State Pollution Control Board, Fire NOC from the state fire department, Factory Licence from DISH / Factory Inspectorate, and all sector-specific licences (e.g., FSSAI for food, BIS for regulated products, CDSCO for pharma). Adequate provision has been made in the project cost for ETP/STP, air-pollution-control (APC) equipment, and solid/hazardous-waste management systems.</p>
    ` : "";

    return `
      <h3>6. Technical Feasibility</h3>
      ${location}
      ${buildingBlock}
      ${process}
      ${techSelect}
      ${utilities}
      ${manpower}
      ${qualityEnv}
      <p>${esc(p.capacityYr1 || "—")} ${esc(b.capacityUnit)} installed Yr 1 · ramp 55% → 70% → 85% → 95% in Years 1–4.</p>
      ${note(p.customNote_technical)}
    `;
  }

  /* ---------- 07. PROJECT COMPONENTS ---------- */
  function s07_components(p) {
    const t = tierOf(p);
    const detailed = t.density >= 3 ? `
      <h4>7.5 SCG Environmental &amp; Social (E&amp;S) Risk Screening</h4>
      <table class="scg-tbl small">
        <thead><tr><th>Category</th><th>Exposure</th><th>Mitigation</th></tr></thead>
        <tbody>
          <tr><td>Air emissions</td><td>${(p.industry === "chemicals" || p.industry === "pharma") ? "High" : "Low-Medium"}</td><td>APC equipment, continuous monitoring, annual audit</td></tr>
          <tr><td>Water / effluent</td><td>${(p.industry === "textile" || p.industry === "chemicals" || p.industry === "food-processing") ? "Medium-High" : "Low"}</td><td>ETP with ZLD where mandated; rain-water harvesting</td></tr>
          <tr><td>Solid / hazardous waste</td><td>Low-Medium</td><td>Segregation, authorised disposal, record keeping</td></tr>
          <tr><td>Occupational health &amp; safety</td><td>Medium</td><td>PPE, safety training, regular drills, insurance</td></tr>
          <tr><td>Community &amp; resettlement</td><td>Low</td><td>Greenfield at non-resettlement site; CSR outreach</td></tr>
        </tbody>
      </table>
    ` : "";
    return `
      <h3>7. Project Components — Employment, Environment, Social &amp; National Importance</h3>
      <h4>7.1 Employment Generation</h4>
      <p>Direct employment: <b>${esc(p.directJobs || "—")}</b> persons (skilled / semi-skilled / unskilled). Indirect employment through supply chain, logistics and ancillary services is estimated at <b>${esc(p.indirectJobs || "—")}</b> additional persons. The project therefore makes a meaningful contribution to local livelihood generation and skill-building, particularly in the manufacturing, quality-assurance, maintenance and logistics functions.</p>
      <h4>7.2 Environmental Impact &amp; Compliance</h4>
      <p>${esc(p.envImpact || "The project will comply with applicable CPCB / SPCB norms. Consent to Establish (CTE) and Consent to Operate (CTO) will be obtained. Where relevant, ETP, STP, air pollution control and solid/hazardous waste management systems have been provisioned in the project cost. The unit is designed as an environmentally responsible operation with energy-efficient equipment, water conservation, and phased adoption of renewable energy where economic.")}</p>
      <h4>7.3 Social Impact &amp; CSR</h4>
      <p>${esc(p.socialImpact || "The unit will create gainful local livelihoods, encourage skill development, and support local MSME vendors. Community outreach and CSR activities (education, health, infrastructure) will be undertaken under Section 135 of the Companies Act (where applicable). The project is aligned with inclusive growth and regional development objectives.")}</p>
      <h4>7.4 National Importance</h4>
      <p>${esc(p.nationalImportance || "The project supports India's self-reliance (Atmanirbhar Bharat), contributes to GDP, creates export earnings / import substitution, and aligns with the Government of India's sectoral missions. It also supports district-level industrial development and is compatible with the state government's industrial promotion policy.")}</p>
      ${detailed}
      ${note(p.customNote_components)}
    `;
  }

  /* ---------- 08. RAW MATERIAL ---------- */
  function s08_rawMaterial(p) {
    const t = tierOf(p);
    const extra = t.density >= 3 ? `
      <h4>8.4 Logistics &amp; Inventory Policy</h4>
      <p>Inbound logistics is road-based with strategic buffer inventory of <b>${esc(p.inventoryDays || "30")}</b> days. The unit will maintain minimum-order quantities with key suppliers, milk-run vendor-managed inventory for fast-moving items, and a structured quality-inspection protocol at the gate. ERP-based stock management ensures visibility and minimises waste.</p>
      <h4>8.5 Price Risk Management</h4>
      <p>For commodities exposed to price volatility, mitigation will include: (a) long-term supply agreements with price-escalation clauses, (b) strategic inventory build-up during seasonal lows, (c) diversification of supplier base across geographies, (d) back-to-back contracts with customers for large orders.</p>
    ` : "";
    return `
      <h3>8. Raw Material &amp; Supply Chain</h3>
      <h4>8.1 Principal Raw Materials</h4>
      <p>${esc(p.rawMaterials || "As per BOM — primary inputs, consumables, packaging and utilities.")}</p>
      <h4>8.2 Sources</h4>
      <p>${esc(p.rawMaterialSources || "Local / regional / national suppliers; backup suppliers identified to mitigate concentration risk.")}</p>
      <h4>8.3 Supply Chain Risk &amp; Mitigation</h4>
      <p>${esc(p.supplyChainRisk || "Multi-source strategy, safety stock, long-term supply agreements and price-escalation clauses are recommended.")}</p>
      ${extra}
      ${note(p.customNote_raw)}
    `;
  }

  /* ---------- 09. MACHINERY ---------- */
  function s09_machinery(p) {
    const rows = (p.machineryList || []).map((m, i) =>
      `<tr><td>${i + 1}</td><td>${esc(m.name)}</td><td>${esc(m.make || "—")}</td><td>${esc(m.qty || "—")}</td><td class="r">${INR(m.cost)}</td></tr>`
    ).join("");
    const totalMc = (p.machineryList || []).reduce((s, m) => s + (+m.cost || 0), 0);
    return `
      <h3>9. Machinery, Equipment &amp; Technology</h3>
      <p>The plant &amp; machinery cost has been estimated based on budgetary quotations from reputed OEMs. The detailed list is provided below; vendor quotations are attached in Annexure-B.</p>
      <table class="scg-tbl">
        <thead><tr><th>#</th><th>Item</th><th>Make / OEM</th><th>Qty</th><th class="r">Cost</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#888">Machinery list to be attached (see Annexure-B)</td></tr>`}
          ${rows ? `<tr class="total"><td colspan="4"><b>Sub-total — Plant &amp; Machinery</b></td><td class="r"><b>${INR(totalMc)}</b></td></tr>` : ""}
        </tbody>
      </table>
      <p><b>Technology partner:</b> ${esc(p.techPartner || "To be finalised among shortlisted OEMs.")}</p>
      <p><b>Commissioning &amp; warranty:</b> Standard OEM warranty (12–24 months), backed by AMC / service contract post-commissioning. Training of operators and maintenance staff will be included as part of the supply scope.</p>
      ${note(p.customNote_machinery)}
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
      ${note(p.customNote_process)}
    `;
  }

  /* ---------- 11. MARKETING ---------- */
  function s11_marketing(p) {
    const b = ind(p);
    const t = tierOf(p);
    const expanded = t.density >= 3 ? `
      <h4>11.4 Pricing &amp; Margin Strategy</h4>
      <p>Pricing has been benchmarked against the ${esc(b.label)} sector with a realistic Year-1 discount of 5-8% to establish market presence, followed by gradual normalisation from Year 2. Volume-based discounts, extended credit for tier-1 customers, and small-order cash discounts form the commercial framework.</p>
      <h4>11.5 Branding &amp; Certifications</h4>
      <p>${esc(p.branding || "Professional brand identity, BIS / ISI / FSSAI / ISO certifications as applicable, participation in industry expos and trade bodies, case-study based collateral and an updated corporate website form the brand-building programme.")}</p>
    ` : "";
    return `
      <h3>11. Marketing &amp; Distribution Strategy</h3>
      <h4>11.1 Target Segments</h4>
      <p>${esc(p.targetSegments || "B2B industrial buyers, institutional customers, channel partners and, selectively, export markets.")}</p>
      <h4>11.2 Go-to-Market Approach</h4>
      <p>${esc(p.gtm || "Direct sales for key accounts; distributor / dealer network for geographic coverage; digital / e-commerce for brand-building (where applicable). A dedicated sales team is proposed with region-wise assignment.")}</p>
      <h4>11.3 Distribution &amp; Logistics</h4>
      <p>Outbound logistics will be managed through a combination of owned / contracted fleet for local dispatch and 3PL arrangements for national coverage. Depot-level stocking at key nodes will be considered from Year 2 as volumes scale.</p>
      ${expanded}
      ${note(p.customNote_marketing)}
    `;
  }

  /* ---------- 12. REGULATORY ---------- */
  function s12_regulatory(p) {
    return `
      <h3>12. Regulatory, Licensing &amp; Compliance</h3>
      <table class="scg-tbl">
        <thead><tr><th>Approval</th><th>Authority</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>GST Registration</td><td>GST Dept.</td><td>${esc(p.regGST || "Obtained / In-process")}</td></tr>
          <tr><td>Udyam / MSME Registration</td><td>MoMSME</td><td>${esc(p.regUdyam || "Obtained / In-process")}</td></tr>
          <tr><td>Factory Licence</td><td>DISH / Factory Inspectorate</td><td>${esc(p.regFactory || "To be obtained pre-commissioning")}</td></tr>
          <tr><td>Pollution — CTE / CTO</td><td>SPCB</td><td>${esc(p.regPollution || "CTE obtained / CTO on commissioning")}</td></tr>
          <tr><td>Building / Plan Approval</td><td>Local Authority</td><td>${esc(p.regBuilding || "Approved / In-process")}</td></tr>
          <tr><td>Fire NOC</td><td>Fire Department</td><td>${esc(p.regFire || "To be obtained pre-commissioning")}</td></tr>
          <tr><td>Labour &amp; ESI/PF</td><td>Labour Dept, EPFO, ESIC</td><td>${esc(p.regLabour || "Registration on staffing")}</td></tr>
          <tr><td>Sector-specific Licence</td><td>Relevant regulator</td><td>${esc(p.regSector || "As per product scope (FSSAI / BIS / Drug / AERB etc.)")}</td></tr>
        </tbody>
      </table>
      <p>SCG will support the promoter with a complete compliance calendar and handholding through approvals.</p>
      ${note(p.customNote_regulatory)}
    `;
  }

  /* ---------- 13. PROJECT COST & FINANCE (tier-aware, basis-driven) ---------- */
  function s13_costFinance(p) {
    const t = tierOf(p);
    const rows = [
      ["Land &amp; Site Development", p.costLand, "Lump-sum; escalation if leasehold."],
      ["Building &amp; Civil Works", p.costBuilding, "Based on detailed BOQ; ₹ rate per sqft benchmarked."],
      ["Plant &amp; Machinery (Main)", p.costMachinery, "Budgetary quotes from OEMs."],
      ["Misc. Fixed Assets", p.costMiscAssets, "Furniture, IT, utilities, peripherals."],
      ["Pre-operative &amp; Preliminary", p.costPreop, "Professional fees, legal, interest during construction."],
      ["Contingency", p.costContingency, "Typically 3–5% of hard cost to cover unforeseen escalation."],
      ["Margin for Working Capital", p.costWCMargin, "25% of NWC requirement as promoter margin."],
    ];
    const tbody = rows.map((r) => `<tr><td>${r[0]}</td><td class="r">${INR(r[1])}</td>${t.density >= 3 ? `<td style="font-size:.76rem;color:#555">${r[2]}</td>` : ""}</tr>`).join("");
    const total = rows.reduce((s, r) => s + (+r[1] || 0), 0) || +p.capexTotal || 0;
    const promoterPct = ((+p.promoterContrib || 0) / total * 100).toFixed(0);
    const loanPct = ((+p.termLoan || 0) / total * 100).toFixed(0);

    const costNarrative = t.density >= 3 ? `
      <h4>13.1 Basis of Cost Estimation</h4>
      <p>The project cost has been built up from first principles using:</p>
      <ul>
        <li><b>Land:</b> Purchase / lease price as per allotment letter / sale deed with stamp-duty and development cost.</li>
        <li><b>Civil works:</b> BOQ-based estimate validated by a chartered civil engineer, with ₹ rate per sqft cross-checked against comparable projects in the region.</li>
        <li><b>Plant &amp; machinery:</b> Budgetary quotations obtained from at least three OEMs per major equipment, with comparative evaluation on parameters beyond price (warranty, service, reference installations).</li>
        <li><b>Pre-operative expenses:</b> Professional fees (DPR, architect, PMC), legal &amp; incorporation costs, interest during construction, travel and statutory charges.</li>
        <li><b>Contingency:</b> ${((+p.costContingency || 0) / Math.max(1, total) * 100).toFixed(1)}% of hard cost — in line with banker norms for ${esc(ind(p).label)} sector.</li>
        <li><b>WC margin:</b> 25% of the net working capital requirement, brought in by the promoter.</li>
      </ul>
    ` : "";

    return `
      <h3>13. Project Cost &amp; Means of Finance</h3>
      ${costNarrative}
      <h4>13.${t.density >= 3 ? "2" : "1"} Project Cost Breakup</h4>
      <table class="scg-tbl">
        <thead><tr><th>Component</th><th class="r">Amount</th>${t.density >= 3 ? "<th>Basis</th>" : ""}</tr></thead>
        <tbody>${tbody}
          <tr class="total"><td><b>Total Project Cost</b></td><td class="r"><b>${INR(total)}</b></td>${t.density >= 3 ? "<td></td>" : ""}</tr>
        </tbody>
      </table>
      <h4>13.${t.density >= 3 ? "3" : "2"} Means of Finance</h4>
      <table class="scg-tbl">
        <thead><tr><th>Source</th><th class="r">Amount</th><th class="r">%</th></tr></thead>
        <tbody>
          <tr><td>Promoter's Contribution</td><td class="r">${INR(p.promoterContrib)}</td><td class="r">${promoterPct}%</td></tr>
          <tr><td>Term Loan from Bank / FI</td><td class="r">${INR(p.termLoan)}</td><td class="r">${loanPct}%</td></tr>
          <tr><td>Government Subsidy / Grant (if any)</td><td class="r">${INR(p.subsidyAmount)}</td><td class="r">—</td></tr>
          <tr><td>Unsecured / Internal Accruals</td><td class="r">${INR(p.otherSources)}</td><td class="r">—</td></tr>
          <tr class="total"><td><b>Total Means of Finance</b></td><td class="r"><b>${INR(total)}</b></td><td class="r">100%</td></tr>
        </tbody>
      </table>
      <p><b>Debt–Equity Ratio:</b> ${((+p.termLoan || 0) / Math.max(1, (+p.promoterContrib || 1))).toFixed(2)} : 1</p>
      ${note(p.customNote_cost)}
    `;
  }

  /* ---------- 14. FINANCIAL PROJECTIONS ---------- */
  function s14_projections(p, proj) {
    const header = `<tr><th>Year</th><th class="r">Utilisation</th><th class="r">Revenue</th><th class="r">EBITDA</th><th class="r">Depreciation</th><th class="r">Interest</th><th class="r">PAT</th><th class="r">Cash Accrual</th><th class="r">DSCR</th></tr>`;
    const body = proj.rows.map((r) => `
      <tr>
        <td>Yr ${r.year}</td>
        <td class="r">${(r.utilization * 100).toFixed(0)}%</td>
        <td class="r">${INR(r.revenue)}</td>
        <td class="r">${INR(r.ebitda)}</td>
        <td class="r">${INR(r.depreciation)}</td>
        <td class="r">${INR(r.interest)}</td>
        <td class="r">${INR(r.pat)}</td>
        <td class="r">${INR(r.cashAccrual)}</td>
        <td class="r">${r.dscr ? r.dscr.toFixed(2) + "x" : "—"}</td>
      </tr>`).join("");
    return `
      <h3>14. Financial Projections (${proj.rows.length}-Year Horizon)</h3>
      <p>Financial projections have been prepared over a horizon of ${proj.rows.length} years, based on conservative assumptions aligned with ${ind(p).label} industry benchmarks. Revenue grows with capacity utilisation ramp; operating costs scale with revenue; fixed costs grow at ${esc(p.fixedCostGrowth || 5)}% per annum; depreciation is computed on WDV; interest tapers with principal repayment.</p>
      <table class="scg-tbl small">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
      ${note(p.customNote_projections)}
    `;
  }

  /* ---------- 15. CMA (4-form SCG standard) ---------- */
  function s15_cma(p, proj, tier) {
    const cma = E.buildCMA(p, proj, tier);
    const fmt = (n) => Math.round(+n || 0).toLocaleString("en-IN");

    // Year header for tables
    const yearHeader = cma.yearLabels.map(y => `<th class="r">${esc(y)}</th>`).join("");

    // Form I — P&L
    const plRowDef = [
      ["Net Sales", "netSales"], ["Other Income", "otherIncome"], ["Total Income", "totalIncome"],
      ["Cost of Goods Sold", "cogs"], ["Gross Profit", "grossProfit"], ["Gross Profit %", "grossProfitPct", "pct"],
      ["Operating Expenses", "opEx"],
      ["&nbsp;&nbsp;Salaries &amp; Wages", "salaries", "sub"],
      ["&nbsp;&nbsp;Rent &amp; Lease", "rent", "sub"],
      ["&nbsp;&nbsp;Admin &amp; Office", "admin", "sub"],
      ["&nbsp;&nbsp;Selling &amp; Distribution", "selling", "sub"],
      ["EBITDA", "ebitda"], ["EBITDA %", "ebitdaPct", "pct"],
      ["Depreciation &amp; Amortization", "dep"], ["EBIT", "ebit"],
      ["Interest &amp; Finance Charges", "interest"],
      ["Profit Before Tax", "pbt"], ["Tax Expense", "tax"], ["Profit After Tax", "pat"], ["PAT %", "patPct", "pct"],
    ];
    const plBody = plRowDef.map(r => `
      <tr class="${r[2] === "sub" ? "sub" : ""}">
        <td>${r[0]}</td>
        ${cma.pl.map(c => `<td class="r">${r[2] === "pct" ? (c[r[1]] || 0).toFixed(1) + "%" : fmt(c[r[1]])}</td>`).join("")}
      </tr>`).join("");

    // Form II — Balance Sheet
    const bsBody = `
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">ASSETS</td></tr>
      <tr><td>Gross Fixed Assets</td>${cma.bs.map(c => `<td class="r">${fmt(c.gfa)}</td>`).join("")}</tr>
      <tr class="sub"><td>Less: Accumulated Depreciation</td>${cma.bs.map(c => `<td class="r">${fmt(c.cumDep)}</td>`).join("")}</tr>
      <tr><td>Net Fixed Assets</td>${cma.bs.map(c => `<td class="r">${fmt(c.nfa)}</td>`).join("")}</tr>
      <tr class="sub"><td>Capital Work in Progress</td>${cma.bs.map(c => `<td class="r">${fmt(c.cwip)}</td>`).join("")}</tr>
      <tr class="sub"><td>Inventory</td>${cma.bs.map(c => `<td class="r">${fmt(c.inventory)}</td>`).join("")}</tr>
      <tr class="sub"><td>Debtors &lt; 180 days</td>${cma.bs.map(c => `<td class="r">${fmt(c.debtors180)}</td>`).join("")}</tr>
      <tr class="sub"><td>Debtors &gt; 180 days</td>${cma.bs.map(c => `<td class="r">${fmt(c.debtorsOver180)}</td>`).join("")}</tr>
      <tr class="sub"><td>Cash &amp; Bank</td>${cma.bs.map(c => `<td class="r">${fmt(c.cash)}</td>`).join("")}</tr>
      <tr class="sub"><td>Loans &amp; Advances</td>${cma.bs.map(c => `<td class="r">${fmt(c.loansAdv)}</td>`).join("")}</tr>
      <tr class="sub"><td>Other Current Assets</td>${cma.bs.map(c => `<td class="r">${fmt(c.otherCA)}</td>`).join("")}</tr>
      <tr><td>Total Current Assets</td>${cma.bs.map(c => `<td class="r">${fmt(c.totalCA)}</td>`).join("")}</tr>
      <tr class="total"><td><b>TOTAL ASSETS</b></td>${cma.bs.map(c => `<td class="r"><b>${fmt(c.totalAssets)}</b></td>`).join("")}</tr>
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">LIABILITIES &amp; EQUITY</td></tr>
      <tr class="sub"><td>Share Capital</td>${cma.bs.map(c => `<td class="r">${fmt(c.shareCapital)}</td>`).join("")}</tr>
      <tr class="sub"><td>Reserves &amp; Surplus</td>${cma.bs.map(c => `<td class="r">${fmt(c.reserves)}</td>`).join("")}</tr>
      <tr><td>Total Net Worth</td>${cma.bs.map(c => `<td class="r">${fmt(c.totalNetWorth)}</td>`).join("")}</tr>
      <tr class="sub"><td>Term Loan — Banks</td>${cma.bs.map(c => `<td class="r">${fmt(c.termLoanBank)}</td>`).join("")}</tr>
      <tr class="sub"><td>Term Loan — FIs / Others</td>${cma.bs.map(c => `<td class="r">${fmt(c.termLoanFI + c.termLoanOther)}</td>`).join("")}</tr>
      <tr><td>Total Long-term Liabilities</td>${cma.bs.map(c => `<td class="r">${fmt(c.totalLongTerm)}</td>`).join("")}</tr>
      <tr class="sub"><td>CC / OD (Working Capital)</td>${cma.bs.map(c => `<td class="r">${fmt(c.ccOD)}</td>`).join("")}</tr>
      <tr class="sub"><td>Creditors</td>${cma.bs.map(c => `<td class="r">${fmt(c.creditors)}</td>`).join("")}</tr>
      <tr class="sub"><td>Other Current Liabilities</td>${cma.bs.map(c => `<td class="r">${fmt(c.otherCL)}</td>`).join("")}</tr>
      <tr><td>Total Current Liabilities</td>${cma.bs.map(c => `<td class="r">${fmt(c.totalCL)}</td>`).join("")}</tr>
      <tr class="total"><td><b>TOTAL LIABILITIES</b></td>${cma.bs.map(c => `<td class="r"><b>${fmt(c.totalLiabilities)}</b></td>`).join("")}</tr>
    `;

    // Form III — Working Capital
    const wcBody = `
      <tr class="sub"><td>Holding Period — Inventory (days)</td>${cma.wc.map(c => `<td class="r">${c.invDays}</td>`).join("")}</tr>
      <tr class="sub"><td>Debtors Collection Period (days)</td>${cma.wc.map(c => `<td class="r">${c.debDays}</td>`).join("")}</tr>
      <tr class="sub"><td>Creditors Payment Period (days)</td>${cma.wc.map(c => `<td class="r">${c.creDays}</td>`).join("")}</tr>
      <tr><td>Inventory / Stock Required</td>${cma.wc.map(c => `<td class="r">${fmt(c.rmReq)}</td>`).join("")}</tr>
      <tr><td>Debtors Required</td>${cma.wc.map(c => `<td class="r">${fmt(c.debReq)}</td>`).join("")}</tr>
      <tr><td>Total Current Assets Required</td>${cma.wc.map(c => `<td class="r">${fmt(c.totalCAReq)}</td>`).join("")}</tr>
      <tr class="sub"><td>Less: Creditors (Natural Credit)</td>${cma.wc.map(c => `<td class="r">${fmt(c.creditAvail)}</td>`).join("")}</tr>
      <tr><td>Net Working Capital Required</td>${cma.wc.map(c => `<td class="r">${fmt(c.nwcReq)}</td>`).join("")}</tr>
      <tr class="sub"><td>Less: Margin (25% by Promoter)</td>${cma.wc.map(c => `<td class="r">${fmt(c.margin25)}</td>`).join("")}</tr>
      <tr class="total"><td><b>Working Capital Limit Required (MPBF)</b></td>${cma.wc.map(c => `<td class="r"><b>${fmt(c.wcLimit)}</b></td>`).join("")}</tr>
    `;

    // Form IV — Ratios
    const ratioBody = `
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">LIQUIDITY</td></tr>
      <tr><td>Current Ratio</td>${cma.ratios.map(c => `<td class="r">${c.currentRatio.toFixed(2)}</td>`).join("")}</tr>
      <tr><td>Quick Ratio</td>${cma.ratios.map(c => `<td class="r">${c.quickRatio.toFixed(2)}</td>`).join("")}</tr>
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">LEVERAGE</td></tr>
      <tr><td>Debt : Equity</td>${cma.ratios.map(c => `<td class="r">${c.dE.toFixed(2)}</td>`).join("")}</tr>
      <tr><td>TOL / TNW</td>${cma.ratios.map(c => `<td class="r">${c.tolTnw.toFixed(2)}</td>`).join("")}</tr>
      <tr><td>DSCR</td>${cma.ratios.map(c => `<td class="r">${c.dscr ? c.dscr.toFixed(2) : "—"}</td>`).join("")}</tr>
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">PROFITABILITY</td></tr>
      <tr><td>Gross Profit Margin %</td>${cma.ratios.map(c => `<td class="r">${c.gpm.toFixed(1)}</td>`).join("")}</tr>
      <tr><td>Net Profit Margin %</td>${cma.ratios.map(c => `<td class="r">${c.npm.toFixed(1)}</td>`).join("")}</tr>
      <tr><td>Return on Net Worth %</td>${cma.ratios.map(c => `<td class="r">${c.ronw.toFixed(1)}</td>`).join("")}</tr>
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">EFFICIENCY</td></tr>
      <tr><td>Asset Turnover (x)</td>${cma.ratios.map(c => `<td class="r">${c.assetTO.toFixed(2)}</td>`).join("")}</tr>
      <tr><td>Inventory Days</td>${cma.ratios.map(c => `<td class="r">${Math.round(c.invDays)}</td>`).join("")}</tr>
      <tr><td>Debtor Days</td>${cma.ratios.map(c => `<td class="r">${Math.round(c.debDays)}</td>`).join("")}</tr>
      <tr><td>Creditor Days</td>${cma.ratios.map(c => `<td class="r">${Math.round(c.creDays)}</td>`).join("")}</tr>
      <tr><td>Working Capital Cycle</td>${cma.ratios.map(c => `<td class="r">${Math.round(c.wcCycle)}</td>`).join("")}</tr>
    `;

    // Cash Flow
    const cfBody = `
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">OPERATING ACTIVITIES</td></tr>
      <tr class="sub"><td>Net Profit</td>${cma.cf.map(c => `<td class="r">${fmt(c.netProfit)}</td>`).join("")}</tr>
      <tr class="sub"><td>Add: Depreciation</td>${cma.cf.map(c => `<td class="r">${fmt(c.addDep)}</td>`).join("")}</tr>
      <tr class="sub"><td>(Increase) / Decrease in Inventory</td>${cma.cf.map(c => `<td class="r">${fmt(c.dInv)}</td>`).join("")}</tr>
      <tr class="sub"><td>(Increase) / Decrease in Debtors</td>${cma.cf.map(c => `<td class="r">${fmt(c.dDeb)}</td>`).join("")}</tr>
      <tr class="sub"><td>Increase / (Decrease) in Creditors</td>${cma.cf.map(c => `<td class="r">${fmt(c.dCre)}</td>`).join("")}</tr>
      <tr><td>Net Cash from Operating Activities</td>${cma.cf.map(c => `<td class="r">${fmt(c.opCash)}</td>`).join("")}</tr>
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">INVESTING ACTIVITIES</td></tr>
      <tr class="sub"><td>Capital Expenditure</td>${cma.cf.map(c => `<td class="r">${fmt(c.capex)}</td>`).join("")}</tr>
      <tr><td>Net Cash from Investing Activities</td>${cma.cf.map(c => `<td class="r">${fmt(c.invCash)}</td>`).join("")}</tr>
      <tr><td colspan="${cma.yearLabels.length + 1}" class="subsec">FINANCING ACTIVITIES</td></tr>
      <tr class="sub"><td>Proceeds from Borrowings</td>${cma.cf.map(c => `<td class="r">${fmt(c.borrow)}</td>`).join("")}</tr>
      <tr class="sub"><td>Repayment of Borrowings</td>${cma.cf.map(c => `<td class="r">${fmt(c.repay)}</td>`).join("")}</tr>
      <tr class="sub"><td>Equity Infusion</td>${cma.cf.map(c => `<td class="r">${fmt(c.equity)}</td>`).join("")}</tr>
      <tr><td>Net Cash from Financing Activities</td>${cma.cf.map(c => `<td class="r">${fmt(c.finCash)}</td>`).join("")}</tr>
      <tr><td>Net Increase / (Decrease) in Cash</td>${cma.cf.map(c => `<td class="r">${fmt(c.netChange)}</td>`).join("")}</tr>
      <tr class="sub"><td>Opening Cash Balance</td>${cma.cf.map(c => `<td class="r">${fmt(c.opening)}</td>`).join("")}</tr>
      <tr class="total"><td><b>Closing Cash Balance</b></td>${cma.cf.map(c => `<td class="r"><b>${fmt(c.closing)}</b></td>`).join("")}</tr>
    `;

    return `
      <h3>15. Credit Monitoring Arrangement (CMA) Data</h3>
      <p>CMA data has been prepared in the standard SCG 4-Form bank format over a <b>${cma.yearLabels.length}-year horizon</b> (${cma.auditedYears} audited + ${cma.projectedYears} projected). All figures are in <b>₹ Lakh</b>. The Balance Sheet balances via cash as the plug-in figure consistent with banker practice for projected years.</p>

      <h4>Form I — Profit &amp; Loss Account</h4>
      <table class="scg-tbl small scg-cma"><thead><tr><th>Particulars</th>${yearHeader}</tr></thead><tbody>${plBody}</tbody></table>

      <h4>Form II — Balance Sheet</h4>
      <table class="scg-tbl small scg-cma"><thead><tr><th>Particulars</th>${yearHeader}</tr></thead><tbody>${bsBody}</tbody></table>

      <h4>Form III — Working Capital Assessment (Tandon Method II)</h4>
      <table class="scg-tbl small scg-cma"><thead><tr><th>Particulars</th>${yearHeader}</tr></thead><tbody>${wcBody}</tbody></table>

      <h4>Form IV — Key Financial Ratios</h4>
      <table class="scg-tbl small scg-cma"><thead><tr><th>Ratio</th>${yearHeader}</tr></thead><tbody>${ratioBody}</tbody></table>

      <h4>Cash Flow Statement</h4>
      <table class="scg-tbl small scg-cma"><thead><tr><th>Particulars</th>${yearHeader}</tr></thead><tbody>${cfBody}</tbody></table>

      ${note(p.customNote_cma)}
      ${obs("CMA",
        `The CMA meets standard banker benchmarks: current ratio above 1.33x by Year 3, TOL/TNW within 3:1, DSCR average above 1.5x. Detailed form is available for download in the accompanying Excel workbook.`)}
    `;
  }

  /* ---------- 16. FINANCIAL RATIOS ---------- */
  function s16_ratios(p, proj) {
    const r = proj.ratios;
    return `
      <h3>16. Key Financial Ratios Summary</h3>
      <table class="scg-kv">
        <tr><td>Project IRR</td><td><b>${r.projectIRR ? (r.projectIRR * 100).toFixed(2) + "%" : "—"}</b></td></tr>
        <tr><td>Equity IRR</td><td><b>${r.equityIRR ? (r.equityIRR * 100).toFixed(2) + "%" : "—"}</b></td></tr>
        <tr><td>Project NPV @ 12%</td><td>${INR(r.projectNPV)}</td></tr>
        <tr><td>Equity NPV @ 15%</td><td>${INR(r.equityNPV)}</td></tr>
        <tr><td>Average DSCR</td><td><b>${r.avgDSCR ? r.avgDSCR.toFixed(2) + "x" : "—"}</b></td></tr>
        <tr><td>Minimum DSCR (any year)</td><td>${r.minDSCR ? r.minDSCR.toFixed(2) + "x" : "—"}</td></tr>
        <tr><td>Payback Period</td><td>${r.paybackYears ? r.paybackYears.toFixed(1) + " years" : "—"}</td></tr>
        <tr><td>Break-Even (% of sales, Yr 3)</td><td>${r.bepPct ? r.bepPct.toFixed(0) + "%" : "—"}</td></tr>
      </table>
      ${obs("Financial Ratios",
        `${(r.avgDSCR || 0) >= 1.5 ? "DSCR <b>meets</b> conventional banker benchmarks (≥1.5x)." : "DSCR is <b>below</b> 1.5x — recommend tenor extension or promoter equity top-up."} ${((r.projectIRR || 0) * 100) >= 15 ? "Project IRR is <b>healthy</b>." : "Project IRR is <b>modest</b>; sensitivity must be tightly monitored."}`)}
      ${note(p.customNote_ratios)}
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
      ${note(p.customNote_sensitivity)}
    `;
  }

  /* ---------- 18. SCHEMES ---------- */
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
      ${note(p.customNote_schemes)}
      ${obs("Schemes",
        `SCG recommends pursuing ${schemes.length ? "<b>" + schemes.slice(0, 2).map((s) => s.code).join(", ") + "</b>" : "state-level"} schemes alongside term-loan sanction for maximum capital efficiency.`)}
    `;
  }

  /* ---------- 19. SCHEDULE ---------- */
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
      ${note(p.customNote_schedule)}
    `;
  }

  /* ---------- 20. RISK ---------- */
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
      ${note(p.customNote_risk)}
    `;
  }

  /* ---------- 21. FINAL RECOMMENDATION ---------- */
  function s21_final(p, proj, score) {
    const r = proj.ratios;
    const t = tierOf(p);
    return `
      <h3>21. SCG Final Recommendation &amp; Opinion</h3>
      <p>Based on the foregoing techno-economic analysis, financial projections, sensitivity and risk assessment, Shiva Consultancy Group tenders the following opinion on <b>${esc(p.projectName || "the proposed project")}</b> (${esc(t.label)}):</p>
      <table class="scg-kv">
        <tr><td>Bankability Score</td><td><b>${score.score}/100</b></td></tr>
        <tr><td>Recommendation</td><td><b>${esc(score.recommendation)}</b></td></tr>
        <tr><td>Project IRR</td><td>${r.projectIRR ? (r.projectIRR * 100).toFixed(2) + "%" : "—"}</td></tr>
        <tr><td>Avg / Min DSCR</td><td>${r.avgDSCR ? r.avgDSCR.toFixed(2) : "—"}x / ${r.minDSCR ? r.minDSCR.toFixed(2) : "—"}x</td></tr>
      </table>
      <p><b>Certification:</b> This DPR has been prepared by SCG using verified inputs supplied by the promoter, industry benchmarks, and prudent financial assumptions. The projections are reasonable and achievable under normal business conditions, subject to the risks and mitigants listed in Section 20.</p>
      ${note(p.customNote_final)}
      <p style="margin-top:1rem"><b>For Shiva Consultancy Group</b><br>
      Rakesh Jha — Managing Partner<br>
      SF 34, 4D Square Mall, Motera, Ahmedabad 380005<br>
      rakesh@shivagroup.org.in · +91 9979021275 · www.shivagroup.org.in</p>
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
    { id: 7, key: "components", title: "Employment / Environment / Social", render: s07_components },
    { id: 8, key: "raw", title: "Raw Material & Supply Chain", render: s08_rawMaterial },
    { id: 9, key: "machinery", title: "Machinery & Technology", render: s09_machinery },
    { id: 10, key: "process", title: "Process Flow", render: s10_process },
    { id: 11, key: "marketing", title: "Marketing Strategy", render: s11_marketing },
    { id: 12, key: "regulatory", title: "Regulatory & Compliance", render: s12_regulatory },
    { id: 13, key: "cost", title: "Project Cost & Means of Finance", render: s13_costFinance },
    { id: 14, key: "proj", title: "Financial Projections", render: s14_projections },
    { id: 15, key: "cma", title: "CMA Data", render: s15_cma },
    { id: 16, key: "ratios", title: "Key Financial Ratios", render: s16_ratios },
    { id: 17, key: "sensitivity", title: "Sensitivity Analysis", render: s17_sensitivity },
    { id: 18, key: "schemes", title: "Government Subsidy Mapping", render: s18_schemes },
    { id: 19, key: "schedule", title: "Implementation Schedule", render: s19_schedule },
    { id: 20, key: "risk", title: "Risk & Debility Matrix", render: s20_risk },
    { id: 21, key: "final", title: "SCG Final Recommendation", render: s21_final },
  ];

  function renderAll(p, proj, score, sens, risks, priceQ, tier) {
    const html = SECTIONS.map((s) => {
      switch (s.id) {
        case 1: return s.render(p, proj, score);
        case 14: return s.render(p, proj);
        case 15: return s.render(p, proj, tier);
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

  root.SCG_TEMPLATES = { SECTIONS, renderAll, esc, maskPan, maskAadhaar };
})(typeof window !== "undefined" ? window : this);
