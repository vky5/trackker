/**
 * Trackker - Client-side tracking script
 *
 * Usage:
 *   <script>
 *     window.__TRACKER_ID = "trk_yourwebsite_xyz123";
 *     // optional — defaults to http://localhost:3000/api/events
 *     window.__TRACKER_ENDPOINT = "https://your-api.example.com/api/events";
 *   </script>
 *   <script src="https://cdn.jsdelivr.net/gh/vky5/trackker@main/tracker.js"></script>
 */

(function () {
  'use strict';

  const ENDPOINT =
    window.__TRACKER_ENDPOINT ||
    window.TRACKER_ENDPOINT ||
    'http://localhost:3000/api/events';

  // Get trackingId from global (set by the website owner)
  function getTrackingId() {
    return window.__TRACKER_ID || window.TRACKER_ID || 'unknown';
  }

  function getSessionId() {
    const key = 'trackker_session_' + getTrackingId();
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(key, sid);
    }
    return sid;
  }

  function sendEvent(eventType, extraData = {}) {
    // Ignore events generated inside the preview iframe to avoid duplicate/test tracking
    if (window.parent !== window) {
      console.log('[Trackker] Running inside iframe (preview mode). Database write skipped.');
      return;
    }
    const payload = {
      trackingId: getTrackingId(),
      session_id: getSessionId(),
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      ...extraData,
    };

    console.log('[Trackker] Sending event:', payload);

    // Send to backend
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Fail silently - tracking should never break the site
    });
  }

  let lastTrackedUrl = null;

  // Notify parent window of scroll offset changes
  function sendScroll() {
    if (window.parent !== window) {
      const rect = document.body ? document.body.getBoundingClientRect() : { left: 0, top: 0 };
      const scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      window.parent.postMessage({
        type: 'trackker_iframe_scroll',
        scrollTop: scrollY,
        scrollLeft: scrollX,
        bodyLeft: Math.round(rect.left + scrollX),
        bodyTop: Math.round(rect.top + scrollY),
        url: window.location.href
      }, '*');
    }
  }

  // Track page view
  function trackPageView() {
    const currentUrl = window.location.href;
    if (lastTrackedUrl === currentUrl) return;
    lastTrackedUrl = currentUrl;

    sendEvent('page_view');

    // Notify parent window (dashboard) if we are inside an iframe
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'trackker_page_view',
        url: currentUrl,
        trackingId: getTrackingId()
      }, '*');
    }
  }

  // SPA Route tracking setup
  function initHistoryTracking() {
    if (typeof window === 'undefined' || !window.history) return;

    const originalPushState = window.history.pushState;
    if (originalPushState && !originalPushState.__trackker_patched) {
      window.history.pushState = function (...args) {
        const result = originalPushState.apply(this, args);
        setTimeout(trackPageView, 50);
        return result;
      };
      window.history.pushState.__trackker_patched = true;
    }

    const originalReplaceState = window.history.replaceState;
    if (originalReplaceState && !originalReplaceState.__trackker_patched) {
      window.history.replaceState = function (...args) {
        const result = originalReplaceState.apply(this, args);
        setTimeout(trackPageView, 50);
        return result;
      };
      window.history.replaceState.__trackker_patched = true;
    }

    window.addEventListener('popstate', () => {
      setTimeout(trackPageView, 50);
    });

    window.addEventListener('hashchange', () => {
      setTimeout(trackPageView, 50);
    });
  }

  // Generate a unique CSS selector for an element
  function getCssSelector(el) {
    if (!(el instanceof Element)) return '';
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break; // ID is unique, no need to go further up
      } else {
        if (el.className && typeof el.className === 'string') {
          const classes = el.className.trim().split(/\s+/).filter(Boolean);
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        let sib = el, sibIndex = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() === el.nodeName.toLowerCase()) {
            sibIndex++;
          }
        }
        let hasSiblings = false;
        let next = el;
        while (next = next.nextElementSibling) {
          if (next.nodeName.toLowerCase() === el.nodeName.toLowerCase()) {
            hasSiblings = true;
            break;
          }
        }
        if (sibIndex > 1 || hasSiblings) {
          selector += `:nth-of-type(${sibIndex})`;
        }
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  // Track clicks with coordinates relative to the body content (handles centering & scroll)
  function trackClick(e) {
    const rect = document.body.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Get element info
    const el = e.target;
    let elementInfo = null;
    if (el) {
      let className = '';
      if (typeof el.className === 'string') {
        className = el.className;
      } else if (el.className && typeof el.className.baseVal === 'string') {
        className = el.className.baseVal;
      }
      elementInfo = {
        tagName: el.tagName || '',
        id: el.id || null,
        className: className || null,
        text: el.textContent ? el.textContent.trim().substring(0, 100) : null,
        selector: getCssSelector(el)
      };
    }

    sendEvent('click', { x, y, element: elementInfo });

    // Notify parent window (dashboard) if we are inside an iframe for real-time painting
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'trackker_click',
        x,
        y,
        element: elementInfo,
        session_id: getSessionId(),
        trackingId: getTrackingId(),
        url: window.location.href
      }, '*');
    }
  }

  // Simple debounce helper
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Track scroll position in database (debounced to avoid spamming the server)
  const trackScrollEvent = debounce(function () {
    const scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    sendEvent('scroll', {
      x: Math.round(scrollX),
      y: Math.round(scrollY)
    });
  }, 1000);

  function init() {
    // Clean up legacy/unscoped tracking keys from local storage
    try {
      localStorage.removeItem('trackker_session');
      localStorage.removeItem('trackker_session_unknown');
    } catch (e) {}

    // Send page view
    setTimeout(trackPageView, 0);

    // Initialize SPA route/history tracking
    initHistoryTracking();

    // Listen for scroll events to sync heatmap overlay position in parent dashboard
    window.addEventListener('scroll', sendScroll, { passive: true });
    window.addEventListener('resize', sendScroll, { passive: true });
    setTimeout(sendScroll, 50);

    // Listen for scroll events to save scroll position to database
    window.addEventListener('scroll', trackScrollEvent, { passive: true });

    // Listen for clicks
    document.addEventListener('click', trackClick, true);

    // Listen for scroll commands from parent dashboard
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'trackker_command_scroll') {
        window.scrollTo({
          top: e.data.scrollTop || 0,
          left: e.data.scrollLeft || 0,
          behavior: 'smooth'
        });
      }
    });

    console.log('[Trackker] Initialized with trackingId:', getTrackingId());
  }

  // Auto init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual testing
  window.Trackker = { sendEvent };
})();
