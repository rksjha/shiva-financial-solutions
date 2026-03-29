/**
 * SCG AI — Claude API integration for professional Indian finance & legal documents
 */
const SCGAi = (function () {
  const API = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-opus-4-6';

  function getKey() { return localStorage.getItem('scg_api_key') || ''; }
  function setKey(k) { localStorage.setItem('scg_api_key', k.trim()); }
  function hasKey() { return !!getKey(); }

  const BASE_SYS = `You are a senior financial consultant and legal advisor for Shiva Consultancy Group (SCG), Ahmedabad, Gujarat, India. SCG provides advisory, documentation, and debt syndication services to Indian MSMEs, Startups, and Corporates.

Write in professional English for submission to Indian banks, regulatory authorities, and corporate clients:
- Technically precise, factually grounded, formal tone
- Use Indian financial/legal terminology (RBI, SEBI, Companies Act 2013, MSME Act, IBC 2016, Indian Contract Act 1872)
- Follow formats acceptable to Indian scheduled commercial banks and NBFCs
- Write in complete paragraphs — no bullet lists unless specifically for tables/schedules`;

  async function callAPI(system, user, maxTokens) {
    const key = getKey();
    if (!key) throw new Error('NO_KEY');
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL, max_tokens: maxTokens || 1600,
        system, messages: [{ role: 'user', content: user }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }
    return (await res.json()).content[0].text;
  }

  /* ── DPR Prompts ── */
  const DPR = {
    executive_summary: d => `Write a comprehensive Executive Summary (3-4 paragraphs) for a Detailed Project Report for Indian bank submission.
Project: ${d.projectName} | Type: ${d.projectType || 'Manufacturing'} | Industry: ${d.projIndustry || d.industry || ''}
Promoter: ${d.promoterName} | Location: ${d.projLocation}, ${d.projState || 'India'}
Total Cost: ₹${d.totalProjCost} Lakhs | Term Loan: ₹${d.loanAmount} Lakhs | Equity: ₹${d.promoterEquity} Lakhs
Summary: ${d.projSummary || 'As per project description'}
Cover: project overview, market opportunity, financial highlights & viability indicators, strategic rationale.`,

    promoter_profile: d => `Write a Promoter Background section (2-3 paragraphs) for a DPR for Indian bank.
Entity: ${d.promoterName} | Constitution: ${d.promoterConst || 'Company'} | Promoter: ${d.promFullName || 'As per records'}
Education: ${d.promEducation || 'Technical/Management'} | Experience: ${d.promExperience || 'Relevant'} years
Background: ${d.promBackground || 'Industry experience'} | Group: ${d.promGroupBiz || 'No group concerns'}
Cover: educational qualifications, professional experience, prior ventures, technical competency, personal net worth.`,

    project_description: d => `Write a Project Description section (3-4 paragraphs) for a DPR.
Project: ${d.projectName} | Type: ${d.projectType} | Location: ${d.projLocation}, ${d.projState || ''}
Land: ${d.landArea || 'As required'} (${d.landOwnership || 'Owned/Leased'}) | Timeline: ${d.implPeriod || '12-18 months'}
Employment: ${d.employment || 'As per plan'} | Summary: ${d.projSummary || ''}
Cover: nature of business, product/service details, production process, technology, infrastructure, manpower, timeline.`,

    market_analysis: d => `Write a Market Analysis section (3-4 paragraphs) for a DPR — Indian ${d.projIndustry || d.industry || 'business'} project.
Project: ${d.projectName} | Location: ${d.projLocation}, ${d.projState || 'India'}
Target Market: ${d.targetMarket || 'Indian domestic market'} | Competition: ${d.competition || 'Established players'}
Strategy: ${d.marketingStrategy || 'Direct sales and distribution'} | Overview: ${d.industryOverview || ''}
Cover: industry outlook in India, market size and demand drivers, competitive landscape, marketing strategy. Reference Make in India / MSME policies where relevant.`,

    financial_analysis: d => `Write a Financial Analysis & Viability section (3-4 paragraphs) for a DPR for Indian bank.
Total Cost: ₹${d.totalProjCost} Lakhs | Term Loan: ₹${d.loanAmount} Lakhs (${Math.round(((d.loanAmount||0)/(d.totalProjCost||1))*100)}% of cost)
Equity: ₹${d.promoterEquity} Lakhs | D/E: ${d.deRatio || 'As computed'} | DSCR: ${d.dscrExpected || 'As projected'}
BEP: ${d.bep || 'As computed'} | Payback: ${d.payback || 'As projected'} years | IRR: ${d.irr || 'As projected'}%
Cover: project cost & financing, revenue projections rationale, key financial indicators, debt serviceability. Reference RBI norms — DSCR min 1.25x, D/E benchmarks.`,

    risk_mitigation: d => `Write a Risk Analysis & Mitigation section for a ${d.projIndustry || 'MSME'} DPR.
Project: ${d.projectName} | Scale: ₹${d.totalProjCost} Lakhs | Location: ${d.projLocation}
Analyze 5-6 key risks: business/operational, market/demand, financial/interest rate, supply chain, regulatory/compliance, management risk. For each: description, probability (H/M/L), impact, and mitigation strategy. Conclude with overall risk rating. Format as coherent paragraphs, not a list.`,

    implementation_schedule: d => `Write an Implementation Schedule section for a DPR.
Project: ${d.projectName} | Location: ${d.projLocation} | Timeline: ${d.implPeriod || '12-18 months'}
Start: ${d.projStartDate || 'Upon sanction of loan'}
Cover all milestones: land/site preparation, building construction, machinery procurement, utilities, trial run, commercial production, WC tie-up. Describe phases with months from sanction, critical path, and delay risks. Write as 2-3 paragraphs plus milestone description.`
  };

  /* ── Bank Proposal Prompts ── */
  const BP = {
    cover_note: d => `Write a formal 2-paragraph Cover Note for a Bank Credit Proposal for ${d.targetBank || 'a Scheduled Commercial Bank'}.
Applicant: ${d.borName || d.clientName} | Constitution: ${d.borConst || ''} | Industry: ${d.borIndustry || ''}
Facility: ₹${d.totalCredit} Lakhs | Purpose: ${d.creditPurpose || 'Business expansion / Working capital'}
Para 1: Introduce the proposal and client background. Para 2: State facility request, purpose, key highlights supporting sanction.`,

    borrower_profile: d => `Write a Borrower Profile section (2-3 paragraphs) for a bank credit proposal.
Borrower: ${d.borName || d.clientName} | Constitution: ${d.borConst || ''} | Industry: ${d.borIndustry || ''}
Established: ${d.borYOE || 'As mentioned'} | Business: ${d.bizDesc || 'As per records'}
CIBIL: ${d.cibilScore || 'Good standing'} | Banking: ${d.bankingRelation || 'Existing customer'}
Cover: entity overview, business nature, management competency, market position, track record, banking relationship.`,

    credit_assessment: d => `Write a Credit Requirement Analysis section (2-3 paragraphs) for a bank proposal.
Facility: ${d.facilityTypes || 'Working Capital / Term Loan'} | Amount: ₹${d.totalCredit} Lakhs
Purpose: ${d.creditPurpose || 'Business needs'} | Repayment: ${d.repaymentPeriod || 'As per cash flows'}
Security: ${d.primarySecurityDesc || 'Hypothecation of assets'} | Collateral: ${d.collateralDesc || 'Immovable property'}
Cover: credit quantum justification, end-use breakdown, repayment mechanism, security structure. Reference RBI guidelines on MPBF/Turnover method for working capital.`,

    financial_highlights: d => `Write a Financial Assessment section (2-3 paragraphs) for a bank credit proposal.
Net Sales (Latest): ₹${d.latestSales || 'As per CMA'} | PAT: ₹${d.latestPAT || 'As per CMA'} | Net Worth: ₹${d.netWorth || 'As per CMA'}
Current Ratio: ${d.crRatio || 'As computed'} | D/E: ${d.deRatio || 'As computed'} | DSCR: ${d.dscr || 'As computed'}
CIBIL Company: ${d.cibilScore || 'Good'} | CIBIL Promoter: ${d.cibilPromoter || 'Good'}
Cover: revenue trend analysis, balance sheet strength & liquidity, debt serviceability. Compare against RBI/IBA benchmark norms.`,

    recommendation: d => `Write a formal 2-paragraph Recommendation for a bank credit proposal for credit committee.
Client: ${d.borName || d.clientName} | Facility: ₹${d.totalCredit} Lakhs | Security Coverage: ${d.securityCoverage || 'Adequate'}
Credit Rating: ${d.creditRating || 'Standard'} | Risk: ${d.riskCategory || 'Standard'}
Para 1: Key strengths supporting sanction — viability, promoter capability, financial parameters, security. Para 2: Recommended sanction terms — facility type, amount, rate, tenor, security, key covenants. End: "We recommend sanction of the above credit facilities as proposed, subject to standard terms and conditions of the Bank."`
  };

  /* ── CMA Prompt ── */
  function cmaPrompt(d) {
    return `Write an analytical CMA narrative (3-4 paragraphs) for Indian bank submission.
Client: ${d.appName || d.clientName} | Constitution: ${d.appConst || 'Company'} | Industry: ${d.appIndustry || d.industry}
Bank: ${d.bankName || 'Assessment'} | Period: ${(d.years || []).join(', ') || '3 audited + estimated + projected'}
Cover: (1) sales trend & growth drivers, (2) profitability — gross margin, EBITDA, PAT trend, (3) working capital — current ratio, NWC, holding norms, (4) borrowing & DSCR assessment — debt levels, leverage, credit opinion.
Use RBI CMA format terminology (Form I–VI). Conclude with credit assessment summary.`;
  }

  /* ── Agreement Prompts ── */
  const AGR = {
    scope: d => `Draft a "Scope of Services" clause (200-250 words) for a professional services agreement.
Services: ${d.servicesList || (d.scope && d.scope.purpose) || 'Financial advisory and documentation'} | Client: ${d.cl_name || d.clientName}
Type: ${d.agr_type || 'Retainer/Project-based'} | Advisor: Shiva Consultancy Group, Ahmedabad
Include: specific deliverables, methodology, timelines, client cooperation requirements, exclusions, quality standards. Use Indian Contract Act 1872 compliant language with numbered sub-clauses.`,

    terms: d => `Draft "Terms of Engagement" (300-350 words) for a financial advisory retainer agreement.
Fee: ${d.fee_basis || 'As agreed'} — ₹${d.totalFee || ''} | Duration: ${d.agr_period || '12 months'}
Payment: ${d.payment_terms || 'As per schedule'} | Jurisdiction: ${d.agr_state || 'Gujarat'}, India
Cover: fee & payment obligations, milestones, confidentiality, IP ownership, termination (with/without cause), dispute resolution (Arbitration and Conciliation Act 1996), governing law. Standard professional services agreement format under Indian Contract Act.`,

    disclaimer: d => `Draft a "Disclaimer, Limitation of Liability and Indemnity" clause (200-250 words) for a financial advisory agreement under Indian law.
Context: SCG providing advisory services to ${d.cl_name || 'the Client'} in India.
Cover: advisory nature of services (not binding), limitation of liability to fees paid, client's responsibility for decisions, no outcome guarantee, regulatory compliance disclaimer, client indemnification for third-party claims, force majeure. Reference applicable Indian statutes.`
  };

  /* ── Main generate function ── */
  async function generate(docType, section, formData, onProgress) {
    onProgress && onProgress('Calling AI — ' + section.replace(/_/g, ' ') + '…', 20);
    let sys = BASE_SYS, prompt;

    switch (docType) {
      case 'dpr':
        if (!DPR[section]) throw new Error('Unknown DPR section: ' + section);
        prompt = DPR[section](formData);
        sys += '\n\nYou are generating a section for a Detailed Project Report (DPR) for Indian bank submission.';
        break;
      case 'bank_proposal':
        if (!BP[section]) throw new Error('Unknown BP section: ' + section);
        prompt = BP[section](formData);
        sys += '\n\nYou are writing a Bank Credit Proposal/Memorandum for Indian scheduled commercial bank submission.';
        break;
      case 'cma':
        prompt = cmaPrompt(formData);
        sys += '\n\nYou are writing CMA Data analytical narrative per RBI CMA guidelines.';
        break;
      case 'agreement':
        if (!AGR[section]) throw new Error('Unknown agreement section: ' + section);
        prompt = AGR[section](formData);
        sys += '\n\nYou are drafting legal clauses for a professional services agreement under Indian law.';
        break;
      default:
        throw new Error('Unknown docType: ' + docType);
    }

    onProgress && onProgress('Generating content…', 50);
    const result = await callAPI(sys, prompt, 1800);
    onProgress && onProgress('Done', 100);
    return result;
  }

  /* ── Settings Modal ── */
  function showSettings() {
    document.getElementById('scgAiModal')?.remove();
    const m = document.createElement('div');
    m.id = 'scgAiModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(7,18,32,.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
    m.innerHTML = `
<div style="background:#fff;border-radius:14px;padding:2rem;width:500px;max-width:100%;box-shadow:0 24px 80px rgba(0,0,0,.5);">
  <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.2rem;">
    <div style="width:40px;height:40px;background:#071220;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🤖</div>
    <div><h3 style="font-family:'Cormorant Garamond',serif;font-size:1.25rem;color:#071220;margin:0;">AI Configuration</h3>
    <p style="font-size:.75rem;color:#64748b;margin:0;">Claude API for professional content generation</p></div>
  </div>
  <label style="display:block;font-size:.75rem;font-weight:700;color:#1a2535;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem;">Claude API Key</label>
  <input id="scgApiKeyField" type="password" value="${getKey()}" placeholder="sk-ant-api03-…"
    style="width:100%;padding:.6rem .85rem;border:1.5px solid #d0d9e8;border-radius:8px;font-size:.9rem;font-family:'DM Sans',sans-serif;outline:none;box-sizing:border-box;margin-bottom:.45rem;">
  <p style="font-size:.76rem;color:#888;margin:0 0 1rem;">Get your key at <strong>console.anthropic.com</strong> → API Keys. Stored only in your browser localStorage.</p>
  <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:.7rem;margin-bottom:1.2rem;font-size:.78rem;color:#92400e;">
    ⚠️ Your key is stored locally and sent only to Anthropic's API — not to any other server.
  </div>
  <div style="display:flex;gap:.6rem;justify-content:flex-end;">
    <button onclick="document.getElementById('scgAiModal').remove()"
      style="padding:.5rem 1.2rem;border:1.5px solid #d0d9e8;background:#fff;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:.85rem;cursor:pointer;">Cancel</button>
    <button onclick="SCGAi.saveSettings()"
      style="padding:.5rem 1.5rem;background:#3B5EA6;color:#fff;border:none;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;">Save Key</button>
  </div>
</div>`;
    document.body.appendChild(m);
  }

  function saveSettings() {
    const k = document.getElementById('scgApiKeyField')?.value?.trim();
    if (k) {
      setKey(k);
      document.getElementById('scgAiModal')?.remove();
      if (typeof showAlert === 'function') showAlert('success', 'AI API key saved.');
      else alert('API key saved.');
    }
  }

  return { generate, showSettings, saveSettings, hasKey, getKey, setKey };
})();
