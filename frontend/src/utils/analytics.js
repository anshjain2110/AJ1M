// Advanced Analytics & Attribution Utility for The Local Jewel
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const isBrowser = typeof window !== 'undefined';

// ── ID Management ───────────────────────────────────────────

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getAnonymousId() {
  if (!isBrowser) return null;
  let id = localStorage.getItem('tlj_anonymous_id');
  if (!id) {
    id = generateId('anon');
    localStorage.setItem('tlj_anonymous_id', id);
  }
  return id;
}

export function getSessionId() {
  if (!isBrowser) return null;
  let id = sessionStorage.getItem('tlj_session_id');
  if (!id) {
    id = generateId('sess');
    sessionStorage.setItem('tlj_session_id', id);
  }
  return id;
}

// ── Visit Counting (new vs returning) ───────────────────────

export function getVisitCount() {
  if (!isBrowser) return 0;
  const count = parseInt(localStorage.getItem('tlj_visit_count') || '0', 10);
  return count;
}

export function incrementVisitCount() {
  if (!isBrowser) return 0;
  const current = getVisitCount();
  const next = current + 1;
  localStorage.setItem('tlj_visit_count', String(next));
  return next;
}

export function getVisitorType() {
  const count = getVisitCount();
  return count <= 1 ? 'new' : 'returning';
}

// ── Attribution Capture ─────────────────────────────────────

export function captureAttribution() {
  if (!isBrowser) return {};
  const params = new URLSearchParams(window.location.search);
  const attribution = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
    fbclid: params.get('fbclid') || '',
    gclid: params.get('gclid') || '',
    ttclid: params.get('ttclid') || '',
    referrer_url: document.referrer || '',
    landing_url: window.location.href,
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 
                 /Tablet|iPad/i.test(navigator.userAgent) ? 'tablet' : 'desktop',
    browser: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    browser_language: navigator.language,
  };
  // Meta cookies
  const cookies = document.cookie.split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=');
    if (k) acc[k] = v;
    return acc;
  }, {});
  attribution.fbp_cookie = cookies['_fbp'] || '';
  attribution.fbc_cookie = cookies['_fbc'] || '';
  
  // Persist attribution for the session
  const existing = sessionStorage.getItem('tlj_attribution');
  if (!existing) {
    sessionStorage.setItem('tlj_attribution', JSON.stringify(attribution));
  }
  return attribution;
}

export function getStoredAttribution() {
  if (!isBrowser) return {};
  try {
    const stored = sessionStorage.getItem('tlj_attribution');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ── Step Timing ─────────────────────────────────────────────

const stepTimers = {};

export function startStepTimer(stepId) {
  stepTimers[stepId] = Date.now();
}

export function getStepElapsed(stepId) {
  if (!stepTimers[stepId]) return 0;
  return Date.now() - stepTimers[stepId];
}

export function clearStepTimer(stepId) {
  delete stepTimers[stepId];
}

// ── Enhanced Event Tracking ─────────────────────────────────

export async function trackEvent(eventName, eventData = {}, ids = {}) {
  const payload = {
    event_name: eventName,
    event_data: eventData,
    anonymous_id: ids.anonymous_id || getAnonymousId(),
    session_id: ids.session_id || getSessionId(),
    lead_id: ids.lead_id || null,
    // Enhanced fields
    client_ts: new Date().toISOString(),
    page_url: window.location.href,
    page_path: window.location.pathname,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    wizard_step: eventData.step_id || eventData.wizard_step || '',
    field_name: eventData.field_name || '',
    error_code: eventData.error_code || '',
    step_time_ms: eventData.step_time_ms || null,
    visitor_type: getVisitorType(),
    visit_count: getVisitCount(),
    attribution: getStoredAttribution(),
  };
  
  // Fire and forget
  try {
    fetch(`${BACKEND_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Silent fail for analytics
  }
}

// ── Session Start (call once per session) ───────────────────

let sessionStarted = false;

export function initSession() {
  if (!isBrowser) return;
  if (sessionStarted) return;
  sessionStarted = true;
  
  const visitCount = incrementVisitCount();
  const attribution = captureAttribution();
  
  trackEvent('tlj_session_start', {
    visit_count: visitCount,
    visitor_type: visitCount <= 1 ? 'new' : 'returning',
    landing_url: window.location.href,
    referrer: document.referrer,
  });
}

// ── Abandon Tracking ────────────────────────────────────────

let currentWizardStep = null;
let abandonFired = false;

export function setCurrentWizardStep(stepId) {
  currentWizardStep = stepId;
  abandonFired = false;
}

export function clearCurrentWizardStep() {
  currentWizardStep = null;
}

function handleAbandon(reason) {
  if (!currentWizardStep || abandonFired) return;
  if (currentWizardStep === 'landing' || currentWizardStep === 'thank_you') return;
  abandonFired = true;
  
  const elapsed = getStepElapsed(currentWizardStep);
  trackEvent('tlj_step_abandon', {
    step_id: currentWizardStep,
    wizard_step: currentWizardStep,
    step_time_ms: elapsed,
    reason: reason,
  });
}

// Set up global abandon listeners
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handleAbandon('visibility_hidden');
    }
  });
  
  window.addEventListener('beforeunload', () => {
    handleAbandon('beforeunload');
  });
}
