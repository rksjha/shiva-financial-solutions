/* ============================================================
   SCG DPR / TEV Automation Platform — Financial Engine
   (c) Shiva Consultancy Group, Ahmedabad
   ------------------------------------------------------------
   Module: dpr-engine.js
   Responsibilities:
     - Financial math   : NPV, IRR, DSCR, BEP, Payback, Ratios
     - Loan amortization (EMI schedule)
     - Sensitivity analysis (tornado)
     - Bankability score (0-100)
     - Pricing engine    (consulting fee)
     - Industry benchmarks lookup
     - Govt scheme eligibility filter
   ============================================================ */
(function (root) {
  "use strict";

  /* ---------- 1. NUMBER / FMT UTILITIES ---------- */
  const INR = (n) => {
    if (n === null || n === undefined || isNaN(n)) return "—";
    n = Number(n);
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1e7) return sign + "₹" + (abs / 1e7).toFixed(2) + " Cr";
    if (abs >= 1e5) return sign + "₹" + (abs / 1e5).toFixed(2) + " L";
    if (abs >= 1e3) return sign + "₹" + (abs / 1e3).toFixed(1) + " K";
    return sign + "₹" + abs.toFixed(0);
  };
  const num = (v, d = 0) => (v === null || v === undefined || isNaN(+v) ? d : +v);
  const pct = (v) => (v === null || v === undefined || isNaN(+v) ? "—" : (+v).toFixed(2) + "%");
  const round2 = (v) => Math.round((+v + Number.EPSILON) * 100) / 100;

  /* ---------- 2. FINANCIAL MATH ---------- */

  // NPV: cfs = [yr0, yr1, yr2, ...] where yr0 is usually negative (outflow)
  function NPV(rate, cashflows) {
    let npv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + rate, t);
    }
    return npv;
  }

  // IRR via bisection + Newton fallback
  function IRR(cashflows, guess = 0.1) {
    // basic sanity: need at least one negative and one positive CF
    let hasNeg = false, hasPos = false;
    cashflows.forEach((c) => {
      if (c < 0) hasNeg = true;
      if (c > 0) hasPos = true;
    });
    if (!hasNeg || !hasPos) return null;

    // bisection over reasonable rate range
    let lo = -0.99, hi = 5.0;
    let fLo = NPV(lo, cashflows);
    let fHi = NPV(hi, cashflows);
    if (fLo * fHi > 0) {
      // try wider range
      hi = 10;
      fHi = NPV(hi, cashflows);
      if (fLo * fHi > 0) return null;
    }
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const fMid = NPV(mid, cashflows);
      if (Math.abs(fMid) < 1e-6) return mid;
      if (fLo * fMid < 0) {
        hi = mid;
        fHi = fMid;
      } else {
        lo = mid;
        fLo = fMid;
      }
    }
    return (lo + hi) / 2;
  }

  // EMI based amortization schedule
  function amortization(principal, annualRate, years, moratoriumMonths = 0) {
    const r = annualRate / 12 / 100;
    const n = years * 12;
    if (r === 0) {
      const emi = principal / n;
      return { emi, schedule: [], totalInterest: 0 };
    }
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let bal = principal;
    let totalInt = 0;
    const schedule = [];
    // apply moratorium (interest accrues, no EMI)
    for (let m = 0; m < moratoriumMonths; m++) {
      const intM = bal * r;
      bal += intM;
      totalInt += intM;
      schedule.push({ month: m + 1, emi: 0, interest: intM, principal: 0, balance: bal, moratorium: true });
    }
    for (let m = moratoriumMonths; m < moratoriumMonths + n; m++) {
      const intM = bal * r;
      const prM = emi - intM;
      bal -= prM;
      totalInt += intM;
      schedule.push({ month: m + 1, emi, interest: intM, principal: prM, balance: Math.max(bal, 0), moratorium: false });
    }
    return { emi, schedule, totalInterest: totalInt };
  }

  // Break-even (units) given fixed cost, price/unit, variable cost/unit
  function breakEvenUnits(fixedCost, price, varCost) {
    if (price - varCost <= 0) return Infinity;
    return fixedCost / (price - varCost);
  }
  // Break-even (sales value)
  function breakEvenValue(fixedCost, contributionMarginPct) {
    if (contributionMarginPct <= 0) return Infinity;
    return fixedCost / (contributionMarginPct / 100);
  }

  // Payback period from CF array [yr0 outflow, yr1 inflow, ...]
  function paybackPeriod(cashflows) {
    let cum = 0;
    for (let t = 0; t < cashflows.length; t++) {
      cum += cashflows[t];
      if (cum >= 0) {
        if (t === 0) return 0;
        const prev = cum - cashflows[t];
        const frac = -prev / cashflows[t];
        return t - 1 + frac;
      }
    }
    return null; // never recovers
  }

  /* ---------- 3. FINANCIAL PROJECTION BUILDER ---------- */
  /*
    Input: project object with:
      capexTotal, termLoan, promoterContrib, workingCapital,
      interestRate, loanYears, moratoriumMonths,
      capacityYr1, capacityRamp (array of utilizations),
      sellingPrice, variableCostPct, fixedCostYr1, fixedCostGrowth,
      depreciationPct, taxRate, years (5-10)
  */
  function buildProjections(p) {
    const years = Math.min(Math.max(+p.years || 7, 5), 10);
    const amort = amortization(+p.termLoan || 0, +p.interestRate || 11, +p.loanYears || 7, +p.moratoriumMonths || 0);
    const emi = amort.emi;

    // aggregate interest & principal per year (year 1 = first 12 months post moratorium)
    const intPerYear = new Array(years).fill(0);
    const prinPerYear = new Array(years).fill(0);
    amort.schedule.forEach((s, idx) => {
      const yearIdx = Math.floor(idx / 12);
      if (yearIdx < years) {
        intPerYear[yearIdx] += s.interest;
        prinPerYear[yearIdx] += s.principal;
      }
    });

    const ramp = (p.capacityRamp && p.capacityRamp.length) ? p.capacityRamp : [0.55, 0.70, 0.85, 0.95, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
    const rows = [];
    const depreciableBase = (+p.capexTotal || 0) * 0.85; // assume 85% depreciable
    const depRate = (+p.depreciationPct || 12) / 100;
    let wdv = depreciableBase;

    for (let y = 0; y < years; y++) {
      const util = ramp[y] !== undefined ? ramp[y] : 1.0;
      const capacity = (+p.capacityYr1 || 0) * util;
      const revenue = capacity * (+p.sellingPrice || 0);
      const variableCost = revenue * ((+p.variableCostPct || 0) / 100);
      const fixedCost = (+p.fixedCostYr1 || 0) * Math.pow(1 + (+p.fixedCostGrowth || 5) / 100, y);
      const ebitda = revenue - variableCost - fixedCost;
      const dep = wdv * depRate;
      wdv = wdv - dep;
      const interest = intPerYear[y] || 0;
      const ebt = ebitda - dep - interest;
      const tax = ebt > 0 ? ebt * ((+p.taxRate || 25) / 100) : 0;
      const pat = ebt - tax;
      const cashAccrual = pat + dep;
      const principalRepay = prinPerYear[y] || 0;
      const debtService = interest + principalRepay;
      const dscr = debtService > 0 ? (pat + dep + interest) / debtService : null;

      rows.push({
        year: y + 1,
        utilization: util,
        capacity,
        revenue,
        variableCost,
        fixedCost,
        ebitda,
        depreciation: dep,
        interest,
        ebt,
        tax,
        pat,
        cashAccrual,
        principalRepay,
        debtService,
        dscr,
        cumulativePAT: y === 0 ? pat : rows[y - 1].cumulativePAT + pat,
      });
    }

    // Cashflows for IRR (equity IRR)
    const equityOutflow = -(+p.promoterContrib || (+p.capexTotal - +p.termLoan));
    const equityCFs = [equityOutflow];
    for (let y = 0; y < years; y++) {
      equityCFs.push(rows[y].pat + rows[y].depreciation - rows[y].principalRepay);
    }
    // terminal value at end of horizon (10% of capex as residual)
    equityCFs[equityCFs.length - 1] += (+p.capexTotal || 0) * 0.10;

    // Project IRR (pre-financing)
    const projectCFs = [-(+p.capexTotal || 0) - (+p.workingCapital || 0)];
    for (let y = 0; y < years; y++) {
      projectCFs.push(rows[y].ebitda - rows[y].tax);
    }
    projectCFs[projectCFs.length - 1] += (+p.capexTotal || 0) * 0.10 + (+p.workingCapital || 0);

    const projIRR = IRR(projectCFs);
    const eqIRR = IRR(equityCFs);
    const projNPV = NPV(0.12, projectCFs);
    const eqNPV = NPV(0.15, equityCFs);
    const payback = paybackPeriod(projectCFs);

    const avgDSCR =
      rows.filter((r) => r.dscr !== null).reduce((s, r) => s + r.dscr, 0) /
      Math.max(1, rows.filter((r) => r.dscr !== null).length);
    const minDSCR = Math.min(...rows.filter((r) => r.dscr !== null).map((r) => r.dscr));

    // BEP on year 3 (stabilised)
    const stable = rows[Math.min(2, rows.length - 1)];
    const cmPct =
      stable.revenue > 0
        ? ((stable.revenue - stable.variableCost) / stable.revenue) * 100
        : 0;
    const bepValue = breakEvenValue(stable.fixedCost + stable.interest, cmPct);
    const bepPct = stable.revenue > 0 ? (bepValue / stable.revenue) * 100 : null;

    return {
      rows,
      amortization: amort,
      emi,
      ratios: {
        projectIRR: projIRR,
        equityIRR: eqIRR,
        projectNPV: projNPV,
        equityNPV: eqNPV,
        paybackYears: payback,
        avgDSCR,
        minDSCR,
        bepValue,
        bepPct,
      },
      equityCFs,
      projectCFs,
    };
  }

  /* ---------- 4. SENSITIVITY (TORNADO) ---------- */
  function sensitivity(base, project) {
    const vars = [
      { key: "sellingPrice", label: "Selling Price", step: 10 },
      { key: "variableCostPct", label: "Variable Cost %", step: 10 },
      { key: "capacityYr1", label: "Capacity", step: 10 },
      { key: "interestRate", label: "Interest Rate", step: 10 },
      { key: "fixedCostYr1", label: "Fixed Cost", step: 10 },
    ];
    const results = [];
    vars.forEach((v) => {
      const up = { ...project };
      const dn = { ...project };
      up[v.key] = (+project[v.key] || 0) * (1 + v.step / 100);
      dn[v.key] = (+project[v.key] || 0) * (1 - v.step / 100);
      const upR = buildProjections(up);
      const dnR = buildProjections(dn);
      results.push({
        variable: v.label,
        step: v.step + "%",
        dscrBase: base.ratios.avgDSCR,
        dscrUp: upR.ratios.avgDSCR,
        dscrDn: dnR.ratios.avgDSCR,
        irrBase: base.ratios.projectIRR,
        irrUp: upR.ratios.projectIRR,
        irrDn: dnR.ratios.projectIRR,
      });
    });
    return results;
  }

  /* ---------- 5. BANKABILITY SCORE ---------- */
  function bankabilityScore(project, projections) {
    const r = projections.ratios;
    let score = 0;
    const breakup = [];
    // DSCR (30 pts)
    let p1 = 0;
    if (r.avgDSCR >= 2.0) p1 = 30;
    else if (r.avgDSCR >= 1.75) p1 = 26;
    else if (r.avgDSCR >= 1.5) p1 = 22;
    else if (r.avgDSCR >= 1.3) p1 = 16;
    else if (r.avgDSCR >= 1.1) p1 = 10;
    else p1 = 4;
    breakup.push({ k: "Avg DSCR", v: (r.avgDSCR || 0).toFixed(2) + "x", pts: p1, max: 30 });
    score += p1;

    // IRR (20 pts)
    let p2 = 0;
    const irr = r.projectIRR || 0;
    if (irr >= 0.25) p2 = 20;
    else if (irr >= 0.2) p2 = 17;
    else if (irr >= 0.15) p2 = 13;
    else if (irr >= 0.12) p2 = 9;
    else if (irr >= 0.08) p2 = 5;
    else p2 = 2;
    breakup.push({ k: "Project IRR", v: ((irr * 100) || 0).toFixed(1) + "%", pts: p2, max: 20 });
    score += p2;

    // Promoter Contribution (15 pts)
    const dER = (+project.termLoan || 0) / Math.max(1, +project.promoterContrib || 1);
    let p3 = 0;
    if (dER <= 1.0) p3 = 15;
    else if (dER <= 1.5) p3 = 12;
    else if (dER <= 2.0) p3 = 9;
    else if (dER <= 3.0) p3 = 5;
    else p3 = 2;
    breakup.push({ k: "D:E Ratio", v: dER.toFixed(2) + ":1", pts: p3, max: 15 });
    score += p3;

    // Payback (10 pts)
    const pb = r.paybackYears || 99;
    let p4 = 0;
    if (pb <= 3) p4 = 10;
    else if (pb <= 5) p4 = 8;
    else if (pb <= 7) p4 = 5;
    else if (pb <= 10) p4 = 3;
    else p4 = 1;
    breakup.push({ k: "Payback", v: (pb).toFixed(1) + " yrs", pts: p4, max: 10 });
    score += p4;

    // BEP (10 pts)
    const bep = r.bepPct || 100;
    let p5 = 0;
    if (bep <= 40) p5 = 10;
    else if (bep <= 55) p5 = 8;
    else if (bep <= 70) p5 = 5;
    else if (bep <= 85) p5 = 3;
    else p5 = 1;
    breakup.push({ k: "BEP (% of sales)", v: bep.toFixed(0) + "%", pts: p5, max: 10 });
    score += p5;

    // Promoter Experience (10 pts, from project meta)
    const exp = +project.promoterExperience || 0;
    let p6 = 0;
    if (exp >= 10) p6 = 10;
    else if (exp >= 5) p6 = 7;
    else if (exp >= 2) p6 = 4;
    else p6 = 2;
    breakup.push({ k: "Promoter Experience", v: exp + " yrs", pts: p6, max: 10 });
    score += p6;

    // Collateral coverage (5 pts)
    const coll = (+project.collateralValue || 0) / Math.max(1, +project.termLoan || 1);
    let p7 = 0;
    if (coll >= 1.25) p7 = 5;
    else if (coll >= 1.0) p7 = 4;
    else if (coll >= 0.75) p7 = 3;
    else if (coll >= 0.5) p7 = 2;
    else p7 = 1;
    breakup.push({ k: "Collateral Coverage", v: (coll * 100).toFixed(0) + "%", pts: p7, max: 5 });
    score += p7;

    let recommendation = "NOT RECOMMENDED";
    let badge = "danger";
    if (score >= 80) { recommendation = "STRONGLY RECOMMENDED (GO)"; badge = "success"; }
    else if (score >= 65) { recommendation = "RECOMMENDED"; badge = "success"; }
    else if (score >= 50) { recommendation = "RECOMMENDED WITH CONDITIONS"; badge = "warn"; }
    else if (score >= 35) { recommendation = "REVIEW — RESTRUCTURE ADVISED"; badge = "warn"; }

    return { score, breakup, recommendation, badge };
  }

  /* ---------- 6. PRICING ENGINE (SCG fee quotation) ---------- */
  function priceQuote(project) {
    const capex = +project.capexTotal || 0;       // in ₹
    const industryFactor =
      {
        solar: 1.0,
        manufacturing: 1.2,
        agro: 1.0,
        "food-processing": 1.1,
        textile: 1.1,
        infra: 1.35,
        services: 0.9,
        chemicals: 1.3,
        pharma: 1.4,
        hospitality: 1.15,
        warehousing: 1.0,
        education: 0.95,
        healthcare: 1.25,
      }[project.industry] || 1.0;

    const complexity = +project.complexityLevel || 2; // 1..3
    const customization = +project.customizationLevel || 2;
    const urgency = +project.urgencyLevel || 2;

    // base fee slab (₹) based on capex
    let baseFee = 0;
    const cr = capex / 1e7;
    if (cr < 0.5) baseFee = 35000;
    else if (cr < 1) baseFee = 55000;
    else if (cr < 2) baseFee = 85000;
    else if (cr < 5) baseFee = 150000;
    else if (cr < 10) baseFee = 250000;
    else if (cr < 25) baseFee = 400000;
    else if (cr < 50) baseFee = 650000;
    else if (cr < 100) baseFee = 950000;
    else baseFee = Math.min(2500000, 950000 + (cr - 100) * 5000);

    const mult =
      industryFactor *
      (0.85 + 0.12 * complexity) *
      (0.85 + 0.1 * customization) *
      (urgency === 3 ? 1.25 : urgency === 2 ? 1.0 : 0.92);

    const clientQuote = Math.round(baseFee * mult);
    const internalCost = Math.round(clientQuote * 0.42);
    const margin = clientQuote - internalCost;
    const marginPct = (margin / clientQuote) * 100;

    // payment schedule
    const schedule = [
      { milestone: "On engagement (mobilization)", pct: 30, amt: Math.round(clientQuote * 0.3) },
      { milestone: "On draft DPR submission", pct: 40, amt: Math.round(clientQuote * 0.4) },
      { milestone: "On final DPR + bank sanction support", pct: 30, amt: Math.round(clientQuote * 0.3) },
    ];

    return { baseFee, multiplier: mult, clientQuote, internalCost, margin, marginPct, schedule };
  }

  /* ---------- 7. INDUSTRY BENCHMARKS DB ---------- */
  const INDUSTRY_BENCHMARKS = {
    solar: {
      label: "Solar / Renewable Energy",
      typicalCAGR: 22,
      netMarginRange: [12, 22],
      ebitdaMargin: 28,
      debtEquity: "70:30",
      capacityUnit: "MW / kWp",
      keySchemes: ["PM-KUSUM", "MNRE Rooftop Subsidy", "SECI tenders", "State Renewable Energy Policy"],
      risks: [
        "Grid curtailment & PPA counterparty risk",
        "Module price volatility (BCD, GST)",
        "DISCOM payment delays",
        "Transmission evacuation constraints",
      ],
      bankPreference: "SBI, PFC, REC, IREDA, Canara, BoB",
      typicalPayback: 6,
    },
    manufacturing: {
      label: "Manufacturing (General / Engineering)",
      typicalCAGR: 9,
      netMarginRange: [6, 14],
      ebitdaMargin: 15,
      debtEquity: "65:35",
      capacityUnit: "MT / units / annum",
      keySchemes: ["PMEGP", "CGTMSE", "PMMY (MUDRA)", "MSME Credit Guarantee", "CLCSS (15% subsidy)", "State MSME incentives"],
      risks: [
        "Raw material price volatility",
        "Working capital cycle stretch",
        "Competitive pressure on pricing",
        "Obsolescence of machinery",
      ],
      bankPreference: "SBI, BoB, Canara, Union Bank, SIDBI",
      typicalPayback: 5,
    },
    agro: {
      label: "Agro-Processing & Allied",
      typicalCAGR: 11,
      netMarginRange: [8, 16],
      ebitdaMargin: 17,
      debtEquity: "65:35",
      capacityUnit: "MT / annum",
      keySchemes: ["PMFME", "PMKSY (MoFPI)", "AIF (NABARD)", "PM-KMSY", "Krishi Udan", "ODOP", "State agri incentives"],
      risks: [
        "Seasonal raw material availability",
        "Price volatility of agri commodities",
        "Cold-chain / post-harvest losses",
        "Export market regulatory risk",
      ],
      bankPreference: "NABARD, SBI, BoB, Canara Bank, Indian Bank",
      typicalPayback: 5.5,
    },
    "food-processing": {
      label: "Food Processing",
      typicalCAGR: 14,
      netMarginRange: [8, 18],
      ebitdaMargin: 19,
      debtEquity: "65:35",
      capacityUnit: "MT / annum",
      keySchemes: ["PMFME (micro)", "PMKSY — Unit / Mega Food Park / Cold Chain", "ODOP", "APEDA export benefits"],
      risks: [
        "FSSAI compliance overhead",
        "Shelf-life & QC risk",
        "Brand building cost",
        "Distribution margin pressure",
      ],
      bankPreference: "SBI, BoB, Canara, Bank of India, SIDBI",
      typicalPayback: 5,
    },
    textile: {
      label: "Textile & Apparel",
      typicalCAGR: 8,
      netMarginRange: [5, 12],
      ebitdaMargin: 14,
      debtEquity: "70:30",
      capacityUnit: "MT / meters / pcs annum",
      keySchemes: ["ATUFS (TUF)", "PLI Textile", "PM MITRA Parks", "RoDTEP / RoSCTL", "MSME CLCSS"],
      risks: [
        "Cotton / yarn price volatility",
        "Export order volatility",
        "Labour compliance cost",
        "Compliance (ETP) for dyeing / processing",
      ],
      bankPreference: "SBI, BoB, Canara, PNB, SIDBI",
      typicalPayback: 6,
    },
    infra: {
      label: "Infrastructure / Real Estate",
      typicalCAGR: 7,
      netMarginRange: [10, 22],
      ebitdaMargin: 25,
      debtEquity: "75:25",
      capacityUnit: "sqm / units",
      keySchemes: ["PMAY (Urban)", "AMRUT", "Smart Cities", "NIIF support", "State infra schemes"],
      risks: [
        "Approval / RERA timelines",
        "Interest during construction (IDC)",
        "Sales velocity risk",
        "Land title / legal risk",
      ],
      bankPreference: "HDFC, LIC HF, SBI, NHB-refinanced lenders",
      typicalPayback: 7,
    },
    services: {
      label: "Services / IT / Consulting",
      typicalCAGR: 12,
      netMarginRange: [12, 25],
      ebitdaMargin: 22,
      debtEquity: "50:50",
      capacityUnit: "seats / clients",
      keySchemes: ["PMMY", "Stand-Up India", "Startup India (DPIIT)", "MSME CGTMSE"],
      risks: [
        "Client concentration",
        "Talent attrition",
        "Technology obsolescence",
        "Currency risk (for export)",
      ],
      bankPreference: "SBI, HDFC, ICICI, Axis",
      typicalPayback: 4,
    },
    chemicals: {
      label: "Chemicals / Specialty Chemicals",
      typicalCAGR: 10,
      netMarginRange: [10, 20],
      ebitdaMargin: 22,
      debtEquity: "60:40",
      capacityUnit: "MT / annum",
      keySchemes: ["PLI Specialty Chemicals (select)", "CETP support", "State industrial policy"],
      risks: [
        "Environmental clearance / CPCB",
        "Raw material (crude-linked) volatility",
        "Hazardous handling & safety",
        "Export compliance (REACH, etc.)",
      ],
      bankPreference: "SBI, BoB, IDBI, Axis, Exim Bank",
      typicalPayback: 6,
    },
    pharma: {
      label: "Pharmaceuticals & API",
      typicalCAGR: 11,
      netMarginRange: [12, 22],
      ebitdaMargin: 23,
      debtEquity: "60:40",
      capacityUnit: "MT / BU annum",
      keySchemes: ["PLI Pharma", "PLI API / Bulk Drugs", "Bulk Drug Parks", "Medical Devices Park"],
      risks: [
        "USFDA / CDSCO compliance",
        "Patent / IP risk",
        "Regulatory inspections",
        "API import dependency",
      ],
      bankPreference: "SBI, Axis, ICICI, IDBI, Exim Bank",
      typicalPayback: 5.5,
    },
    hospitality: {
      label: "Hospitality / Hotels / Resorts",
      typicalCAGR: 9,
      netMarginRange: [10, 22],
      ebitdaMargin: 28,
      debtEquity: "65:35",
      capacityUnit: "rooms / covers",
      keySchemes: ["SIDBI tourism", "Mudra (small)", "Swadesh Darshan links", "State tourism incentives"],
      risks: [
        "Demand cyclicality",
        "ADR / occupancy sensitivity",
        "Staffing quality",
        "Regulatory (licenses, fire, liquor)",
      ],
      bankPreference: "SBI, BoB, HDFC, Tourism Finance Corp",
      typicalPayback: 7,
    },
    warehousing: {
      label: "Warehousing / Cold-chain / Logistics",
      typicalCAGR: 12,
      netMarginRange: [8, 18],
      ebitdaMargin: 28,
      debtEquity: "70:30",
      capacityUnit: "sqft / MT",
      keySchemes: ["PMKSY Cold Chain", "AIF", "NABARD warehouse infra", "GatiShakti linkages"],
      risks: [
        "Utilization ramp-up",
        "Long-term lease client default",
        "Location / connectivity risk",
        "Tech / WMS obsolescence",
      ],
      bankPreference: "SBI, BoB, NABARD, PFC",
      typicalPayback: 7,
    },
    education: {
      label: "Education / EdTech / Skill",
      typicalCAGR: 10,
      netMarginRange: [10, 22],
      ebitdaMargin: 25,
      debtEquity: "55:45",
      capacityUnit: "seats / students",
      keySchemes: ["PMKVY", "Skill Loan Scheme", "Stand-Up India", "Startup India"],
      risks: [
        "Accreditation (AICTE, UGC)",
        "Fee regulation",
        "Student intake volatility",
        "Faculty retention",
      ],
      bankPreference: "SBI, Canara, BoB, HDFC Credila",
      typicalPayback: 6,
    },
    healthcare: {
      label: "Healthcare / Hospital / Diagnostics",
      typicalCAGR: 13,
      netMarginRange: [10, 20],
      ebitdaMargin: 22,
      debtEquity: "65:35",
      capacityUnit: "beds / tests-day",
      keySchemes: ["Ayushman Bharat empanelment", "PMJAY", "Medical Device PLI", "State health schemes"],
      risks: [
        "NABH / NABL compliance",
        "Doctor / nurse attrition",
        "Equipment obsolescence",
        "Regulatory (PCPNDT, biomed waste)",
      ],
      bankPreference: "SBI, HDFC, ICICI, SIDBI",
      typicalPayback: 6.5,
    },
  };

  /* ---------- 8. GOVERNMENT SCHEMES DB (India) ---------- */
  const GOVT_SCHEMES = [
    { code: "PMEGP", name: "Prime Minister's Employment Generation Programme", ministry: "MoMSME / KVIC", sector: ["manufacturing", "services", "food-processing"], subsidy: "15–35% (margin money)", ceiling: "₹50 L (Mfg) / ₹20 L (Service)", bestFor: "First-gen entrepreneurs, rural/urban MSME" },
    { code: "CGTMSE", name: "Credit Guarantee for Micro & Small Enterprises", ministry: "MoMSME", sector: ["manufacturing", "services", "textile", "food-processing"], subsidy: "Collateral-free guarantee", ceiling: "₹5 Cr", bestFor: "MSME without collateral" },
    { code: "PMMY", name: "Pradhan Mantri MUDRA Yojana", ministry: "MoF / SIDBI", sector: ["services", "manufacturing", "agro"], subsidy: "Credit access", ceiling: "₹10 L (Tarun)", bestFor: "Micro enterprises" },
    { code: "PMFME", name: "PM Formalisation of Micro Food Enterprises", ministry: "MoFPI", sector: ["food-processing", "agro"], subsidy: "35% (max ₹10 L)", ceiling: "₹10 L credit-linked", bestFor: "Micro food processors, ODOP" },
    { code: "PMKSY", name: "Pradhan Mantri Kisan Sampada Yojana", ministry: "MoFPI", sector: ["food-processing", "agro"], subsidy: "Up to 50% (₹5–10 Cr)", ceiling: "Component-wise", bestFor: "Mega food parks, cold chain, infra" },
    { code: "CLCSS", name: "Credit Linked Capital Subsidy Scheme", ministry: "MoMSME", sector: ["manufacturing", "textile", "food-processing", "chemicals"], subsidy: "15% (max ₹15 L)", ceiling: "on ₹1 Cr plant & machinery", bestFor: "Tech upgradation of MSMEs" },
    { code: "ATUFS", name: "Amended TUFS", ministry: "Ministry of Textiles", sector: ["textile"], subsidy: "10–15% CIS + 5% interest", ceiling: "Capped by segment", bestFor: "Textile modernisation" },
    { code: "PLI-Textile", name: "PLI Scheme (MMF & Technical Textile)", ministry: "Ministry of Textiles", sector: ["textile"], subsidy: "Production-linked 7–15%", ceiling: "₹300 Cr min investment", bestFor: "Large textile investments" },
    { code: "AIF", name: "Agri Infrastructure Fund (NABARD)", ministry: "DA&FW", sector: ["agro", "food-processing", "warehousing"], subsidy: "3% interest subvention + CGTMSE", ceiling: "₹2 Cr credit-linked", bestFor: "Post-harvest infra" },
    { code: "MOFPI-ODOP", name: "One District One Product", ministry: "MoFPI", sector: ["food-processing", "agro"], subsidy: "Branding + 35% capital", ceiling: "Product-wise", bestFor: "District-level clusters" },
    { code: "MNRE-Rooftop", name: "MNRE Rooftop Solar Phase-II", ministry: "MNRE", sector: ["solar"], subsidy: "Up to 40% (res) / 20% (inst)", ceiling: "Capacity-linked", bestFor: "Rooftop solar installations" },
    { code: "PM-KUSUM", name: "Pradhan Mantri Kisan Urja Suraksha Evam Utthaan Mahabhiyan", ministry: "MNRE", sector: ["solar", "agro"], subsidy: "30% central + 30% state", ceiling: "Feeder-level component", bestFor: "Solar pumps & feeder solarisation" },
    { code: "PLI-Chemicals", name: "PLI for Specialty Chemicals (select categories)", ministry: "DoC&PC", sector: ["chemicals", "pharma"], subsidy: "4–6% incentive", ceiling: "Sales-linked", bestFor: "Specialty chemicals scale-up" },
    { code: "PLI-Pharma", name: "PLI Pharma / Bulk Drugs", ministry: "DoP", sector: ["pharma"], subsidy: "3–10% incentive", ceiling: "Sales-linked", bestFor: "API / formulations" },
    { code: "Stand-Up-India", name: "Stand-Up India", ministry: "DFS", sector: ["services", "manufacturing", "agro"], subsidy: "Credit ₹10 L–1 Cr", ceiling: "SC/ST/Women", bestFor: "Greenfield units of SC/ST/Women" },
    { code: "Startup-India", name: "Startup India (DPIIT)", ministry: "DPIIT", sector: ["services", "manufacturing"], subsidy: "Tax holiday + SIDBI fund", ceiling: "Eligibility-based", bestFor: "DPIIT-recognised startups" },
    { code: "SIDBI-STHAPANA", name: "SIDBI Sthapana / Make in India", ministry: "SIDBI", sector: ["manufacturing", "food-processing", "chemicals"], subsidy: "Soft loan", ceiling: "₹25 Cr", bestFor: "Mid-segment mfg expansion" },
    { code: "Gujarat-SSIP", name: "Gujarat MSME Industrial Policy 2020", ministry: "GoG — I&MD", sector: ["manufacturing", "textile", "food-processing", "chemicals"], subsidy: "Capital + interest + power", ceiling: "Capex-linked", bestFor: "Gujarat-based units" },
  ];

  function matchingSchemes(project) {
    const ind = project.industry;
    return GOVT_SCHEMES.filter((s) => s.sector.includes(ind));
  }

  /* ---------- 9. RISK / DEBILITY MATRIX ---------- */
  function buildRiskMatrix(project, projections) {
    const r = projections.ratios;
    const ind = INDUSTRY_BENCHMARKS[project.industry] || INDUSTRY_BENCHMARKS.manufacturing;
    const risks = [];

    const addRisk = (cat, desc, likelihood, impact, mitigation) => {
      const severity = likelihood * impact;
      let level = "Low";
      if (severity >= 12) level = "Critical";
      else if (severity >= 8) level = "High";
      else if (severity >= 4) level = "Medium";
      risks.push({ cat, desc, likelihood, impact, severity, level, mitigation });
    };

    // financial
    if (r.avgDSCR < 1.5) addRisk("Financial", "Low average DSCR (<1.5x)", 3, 5, "Restructure repayment tenor / reduce loan quantum / raise tariff");
    if (r.minDSCR < 1.2) addRisk("Financial", "Low minimum DSCR year (<1.2x)", 4, 4, "Frontload moratorium; negotiate step-up EMI");
    if ((+project.termLoan / Math.max(1, +project.promoterContrib)) > 2.5) addRisk("Financial", "High D:E ratio (>2.5:1)", 4, 4, "Increase promoter contribution / bring in equity partner");
    if ((r.paybackYears || 99) > 7) addRisk("Financial", "Long payback (>7 yrs)", 3, 3, "Phased capex / accelerate revenue ramp");
    if ((r.bepPct || 100) > 75) addRisk("Financial", "High break-even (>75%)", 4, 4, "Reduce fixed cost / improve CM / tier up price");

    // market
    addRisk("Market", "Demand / price volatility in " + ind.label, 3, 3, "Long-term supply contracts; diversified client base");
    addRisk("Market", "New entrant / competitive pressure", 3, 3, "Differentiation, branding, long contracts");

    // technical
    addRisk("Technical", "Technology obsolescence", 2, 4, "Choose proven OEM, annual AMC, periodic upgrade capex");
    addRisk("Technical", "Implementation delay", 3, 3, "PMC / EPC with LD clauses; milestone-linked disbursal");

    // regulatory
    addRisk("Regulatory", "Statutory approvals / licensing", 3, 4, "Early engagement, compliance calendar, retainer with consultant");
    if (project.industry === "chemicals" || project.industry === "pharma") addRisk("Regulatory", "Environmental / CPCB compliance", 3, 5, "ETP / ZLD investment; third-party audits");

    // sector-specific from DB
    (ind.risks || []).forEach((rk) => addRisk("Sector", rk, 3, 3, "Sector-specific mitigation framework"));

    // promoter
    if ((+project.promoterExperience || 0) < 3) addRisk("Promoter", "Limited sector experience (<3 yrs)", 3, 4, "Onboard experienced CXOs / technical director");

    return risks.sort((a, b) => b.severity - a.severity);
  }

  /* ---------- 10. EXPORT ---------- */
  root.SCG_ENGINE = {
    INR, num, pct, round2,
    NPV, IRR, amortization, breakEvenUnits, breakEvenValue, paybackPeriod,
    buildProjections, sensitivity, bankabilityScore, priceQuote,
    INDUSTRY_BENCHMARKS, GOVT_SCHEMES, matchingSchemes, buildRiskMatrix,
  };
})(typeof window !== "undefined" ? window : this);
