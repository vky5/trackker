const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchTrackingIds() {
  const res = await fetch(`${API_URL}/api/tracking-ids`);
  if (!res.ok) throw new Error('Failed to fetch tracking IDs');
  return res.json();
}

export async function fetchSessions(trackingId: string) {
  const res = await fetch(`${API_URL}/api/sessions?trackingId=${trackingId}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function fetchSessionEvents(sessionId: string, trackingId: string) {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}?trackingId=${trackingId}`);
  if (!res.ok) throw new Error('Failed to fetch session events');
  return res.json();
}

export async function fetchClicks(pageUrl: string, trackingId: string) {
  const res = await fetch(`${API_URL}/api/clicks?trackingId=${trackingId}&page_url=${encodeURIComponent(pageUrl)}`);
  if (!res.ok) throw new Error('Failed to fetch click data');
  return res.json();
}

export async function deleteSession(sessionId: string, trackingId: string) {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}?trackingId=${trackingId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    let msg = 'Failed to delete session';
    try {
      const errData = await res.json();
      msg = errData.message || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchTrackedPages(trackingId: string) {
  const res = await fetch(`${API_URL}/api/tracked-pages?trackingId=${trackingId}`);
  if (!res.ok) throw new Error('Failed to fetch tracked pages');
  return res.json();
}
