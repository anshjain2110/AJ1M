// Analytics & Attribution Utility for The Local Jewel
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Generate unique IDs
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create persistent anonymous_id
export function getAnonymousId() {
  let id = localStorage.getItem('tlj_anonymous_id');
  if (!id) {
    id = generateId('anon');
    localStorage.setItem('tlj_anonymous_id', id);
  }
  return id;
}

// Get or create session_id (per browser session)
export function getSessionId() {
  let id = sessionStorage.getItem('tlj_session_id');
  if (!id) {
    id = generateId('sess');
    sessionStorage.setItem('tlj_session_id', id);
  }
  return id;
}

// Capture UTM params + click IDs from URL
export function captureAttribution() {
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
  // Try to get Meta cookies
  const cookies = document.cookie.split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=');
    if (k) acc[k] = v;
    return acc;
  }, {});
  attribution.fbp_cookie = cookies['_fbp'] || '';
  attribution.fbc_cookie = cookies['_fbc'] || '';
  return attribution;
}

// Fire analytics event
export async function trackEvent(eventName, eventData = {}, ids = {}) {
  const payload = {
    event_name: eventName,
    event_data: eventData,
    anonymous_id: ids.anonymous_id || getAnonymousId(),
    session_id: ids.session_id || getSessionId(),
    lead_id: ids.lead_id || null,
    timestamp: new Date().toISOString(),
  };
  
  // Fire and forget to backend
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
