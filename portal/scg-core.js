/**
 * SCG Core — Unified data layer for SCG Financial Advisory Portal
 * IndexedDB + localStorage, cross-form auto-fill, bidirectional sync
 */
const SCGCore = (function () {
  const DB_NAME = 'SCG_Portal_DB', DB_VER = 3;
  const STORES = ['enquiries','client_masters','loan_applications','service_requests',
                  'service_agreements','dpr_reports','bank_proposals','cma_data'];
  let _db = null;

  /* ── IndexedDB ── */
  async function openDB() {
    if (_db) return _db;
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = e => {
        STORES.forEach(s => {
          if (!e.target.result.objectStoreNames.contains(s))
            e.target.result.createObjectStore(s, { keyPath: 'ref' });
        });
      };
      r.onsuccess = e => { _db = e.target.result; res(_db); };
      r.onerror = e => rej(e.target.error);
    });
  }

  async function get(store, ref) {
    if (!ref) return null;
    const db = await openDB();
    return new Promise(res => {
      const r = db.transaction(store, 'readonly').objectStore(store).get(ref.trim().toUpperCase());
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
  }

  async function save(store, data) {
    const db = await openDB();
    data._saved = new Date().toISOString();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(data);
      tx.oncomplete = () => res(data);
      tx.onerror = e => rej(e.target.error);
    });
  }

  async function getAll(store) {
    const db = await openDB();
    return new Promise(res => {
      const r = db.transaction(store, 'readonly').objectStore(store).getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => res([]);
    });
  }

  /* ── Data Normalizers ── */
  function normalizeClient(raw) {
    if (!raw) return null;
    const co = raw.company || {};
    const pc = raw.primaryContact || {};
    const addrs = raw.addresses || [];
    const reg = addrs.find(a => a.type === 'registered') || addrs[0] || {};
    return {
      ref: raw.ref || '',
      clientName: co.name || raw.clientName || raw.mainCompanyName || raw.cltName || raw.appName || raw.borName || '',
      constitution: co.constitution || raw.constitution || raw.cltConstitution || raw.appConstitution || raw.borConst || '',
      industry: co.industry || raw.industry || raw.cltIndustry || raw.appIndustry || raw.borIndustry || '',
      pan: co.pan || raw.pan || raw.kycPan || raw.appPan || raw.borPan || pc.pan || '',
      gst: co.gst || raw.gst || raw.kycGst || raw.appGstin || raw.borGst || '',
      cin: co.cin || raw.cin || raw.kycCin || raw.appCin || raw.borCin || '',
      udyam: co.udyam || raw.udyam || '',
      tan: co.tan || raw.tan || '',
      phone: co.phone || raw.phone || '',
      email: co.email || raw.email || raw.cltEmail || raw.appEmail || '',
      website: co.website || raw.website || '',
      desc: co.desc || raw.desc || raw.businessDesc || raw.bizDesc || '',
      contactName: pc.name || raw.contactName || raw.cltContact || raw.appContact || raw.borContact || '',
      contactDesig: pc.desig || raw.contactDesig || '',
      mobile: pc.mobile || raw.mobile || raw.cltMobile || raw.appMobile || raw.borMobile || '',
      contactPan: pc.pan || '',
      city: reg.city || raw.city || raw.cltCity || raw.appCity || raw.borCity || '',
      state: reg.state || raw.state || '',
      pincode: reg.pin || raw.pincode || '',
      address: reg.line1 ? [reg.line1, reg.line2].filter(Boolean).join(', ') : (raw.address || ''),
      financials: raw.financials || {},
      services: raw.services || [],
      rmName: (raw.origin && raw.origin.rm && raw.origin.rm.name) || raw.rmName || '',
    };
  }

  function normalizeSR(raw) {
    if (!raw) return null;
    return {
      ref: raw.ref || '',
      clientRef: raw.clientMasterRef || raw.clientRef || '',
      clientName: raw.cltName || raw.clientName || '',
      services: raw.services || [],
      urgency: raw.srUrgency || raw.urgency || '',
      specific: raw.srSpecific || '',
      financialData: raw.financialData || [],
      mandateDate: raw.mandateDate || raw.created || '',
    };
  }

  function normalizeDPR(raw) {
    if (!raw) return null;
    return {
      ref: raw.ref || '',
      clientRef: raw.clientMasterRef || '',
      projectName: raw.projectName || raw.projName || '',
      promoterName: raw.promoterName || '',
      promoterConst: raw.promoterConst || '',
      promFullName: raw.promFullName || '',
      location: raw.projLocation || raw.location || '',
      state: raw.projState || '',
      projectCost: raw.totalProjCost || raw.projectCost || '',
      loanAmount: raw.loanAmount || '',
      equity: raw.promoterEquity || raw.equity || '',
      deRatio: raw.deRatio || '',
      irr: raw.irr || '',
      dscr: raw.dscrExpected || raw.dscr || '',
      payback: raw.payback || '',
      bep: raw.bep || '',
    };
  }

  function normalizeCMA(raw) {
    if (!raw) return null;
    return {
      ref: raw.ref || '',
      clientRef: raw.clientMasterRef || '',
      clientName: raw.appName || raw.clientName || '',
      constitution: raw.appConst || raw.constitution || '',
      industry: raw.appIndustry || raw.industry || '',
      pan: raw.appPan || raw.pan || '',
      bankName: raw.bankName || '',
      years: raw.years || [],
      pl: raw.pl || {},
      bs: raw.bs || {},
    };
  }

  /* ── Field Filler ── */
  function fillFields(data, fieldMap) {
    if (!data || !fieldMap) return;
    Object.entries(fieldMap).forEach(([dataKey, elId]) => {
      const val = data[dataKey];
      if (val === undefined || val === null || val === '') return;
      const el = document.getElementById(elId);
      if (!el) return;
      if (el.tagName === 'SELECT') {
        const opts = Array.from(el.options);
        const match = opts.find(o => o.value === val || o.text === val) ||
                      opts.find(o => o.value.toLowerCase() === String(val).toLowerCase() ||
                                    o.text.toLowerCase() === String(val).toLowerCase());
        if (match) el.value = match.value;
      } else {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  /* ── Lookups (IDB + localStorage) ── */
  function _lsSearch(draftKey, archiveKey, ref) {
    const norm = ref.toUpperCase();
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (draft && draft.ref && draft.ref.toUpperCase() === norm) return draft;
    } catch (e) {}
    try {
      const arch = JSON.parse(localStorage.getItem(archiveKey) || '[]');
      const found = arch.find(a => a.ref && a.ref.toUpperCase() === norm);
      if (found) return found;
    } catch (e) {}
    return null;
  }

  async function lookupClient(ref) {
    if (!ref) return null;
    const r = ref.trim().toUpperCase();
    const idb = await get('client_masters', r);
    if (idb) return normalizeClient(idb);
    const ls = _lsSearch('scg_cm_draft', 'scg_cm_archive', r);
    return ls ? normalizeClient(ls) : null;
  }

  async function lookupSR(ref) {
    if (!ref) return null;
    const r = ref.trim().toUpperCase();
    const idb = await get('service_requests', r);
    if (idb) return normalizeSR(idb);
    const ls = _lsSearch('scg_sr_draft', 'scg_sr_archive', r);
    return ls ? normalizeSR(ls) : null;
  }

  async function lookupDPR(ref) {
    if (!ref) return null;
    const r = ref.trim().toUpperCase();
    const idb = await get('dpr_reports', r);
    if (idb) return normalizeDPR(idb);
    const ls = _lsSearch('scg_dpr_draft', 'scg_dpr_archive', r);
    return ls ? normalizeDPR(ls) : null;
  }

  async function lookupCMA(ref) {
    if (!ref) return null;
    const r = ref.trim().toUpperCase();
    const idb = await get('cma_data', r);
    if (idb) return normalizeCMA(idb);
    const ls = _lsSearch('scg_cma_draft', 'scg_cma_archive', r);
    return ls ? normalizeCMA(ls) : null;
  }

  /* ── Sync Save (IDB + localStorage archive) ── */
  async function syncSave(store, data, lsKey) {
    try { await save(store, data); } catch (e) { console.warn('IDB save failed', e); }
    if (lsKey) {
      try {
        const arch = JSON.parse(localStorage.getItem(lsKey) || '[]');
        const idx = arch.findIndex(a => a.ref === data.ref);
        if (idx >= 0) arch[idx] = data; else arch.unshift(data);
        localStorage.setItem(lsKey, JSON.stringify(arch.slice(0, 200)));
      } catch (e) {}
    }
  }

  /* ── Write-back: propagate changes back to client master ── */
  async function writeBackClient(clientRef, changedFields) {
    if (!clientRef) return;
    const raw = await get('client_masters', clientRef);
    if (!raw) return;
    const co = raw.company || {};
    const pc = raw.primaryContact || {};
    if (changedFields.clientName) co.name = changedFields.clientName;
    if (changedFields.pan)         co.pan = changedFields.pan;
    if (changedFields.gst)         co.gst = changedFields.gst;
    if (changedFields.phone)       co.phone = changedFields.phone;
    if (changedFields.email)       co.email = changedFields.email;
    if (changedFields.mobile)      pc.mobile = changedFields.mobile;
    if (changedFields.contactName) pc.name = changedFields.contactName;
    raw.company = co;
    raw.primaryContact = pc;
    await syncSave('client_masters', raw, 'scg_cm_archive');
  }

  /* ── Show success/info toast (works if page has showAlert, else console) ── */
  function toast(msg, type) {
    if (typeof showAlert === 'function') showAlert(type || 'success', msg);
    else console.log('[SCG]', msg);
  }

  return {
    get, save, getAll, syncSave, writeBackClient,
    lookupClient, lookupSR, lookupDPR, lookupCMA,
    normalizeClient, normalizeSR, normalizeDPR, normalizeCMA,
    fillFields, toast
  };
})();
