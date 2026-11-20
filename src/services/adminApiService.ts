import {
  AdminLocation,
  BuildingEntrance,
  CampusGateItem,
  BuildingGateRelationship,
  AuditLogEntry,
  EventLocation,
} from '../types/adminEditor';
import initialLocationsRaw from '../data/lpuVerifiedGoogleMapsLocations.json';

const TOKEN_KEY = 'lpu_admin_token_shorya_v1';
const USER_KEY = 'lpu_admin_user_shorya';
export const ADMIN_AUTH_TOKEN = 'lpu-admin-token-shorya-1721';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getAdminToken();
  if (!token || token !== ADMIN_AUTH_TOKEN) {
    if (token) logoutAdmin();
    return false;
  }
  return true;
}

export function getEditorName(): string {
  return localStorage.getItem(USER_KEY) || 'Shorya (Admin)';
}

export async function loginAdmin(passkey: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, data.user || 'Shorya (Admin)');
      return { success: true };
    }
    return { success: false, message: data.message || 'Invalid administrator password.' };
  } catch (err: any) {
    // Local fallback for offline validation
    if (passkey === 'Shorya@1721') {
      const token = ADMIN_AUTH_TOKEN;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, 'Shorya (Admin)');
      return { success: true };
    }
    return { success: false, message: 'Authentication failed. Please verify credentials.' };
  }
}

export function logoutAdmin(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('lpu_admin_token');
  localStorage.removeItem('lpu_admin_user');
  localStorage.removeItem('lpu_wayfinder_edit_mode');
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// --- LOCATIONS ---
export async function fetchLocations(): Promise<AdminLocation[]> {
  try {
    const res = await fetch('/api/locations');
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem('lpu_cached_locations', JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin API] Falling back to local cache/data for locations:', err);
  }

  const cached = localStorage.getItem('lpu_cached_locations');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return initialLocationsRaw as any[];
}

export async function saveLocation(location: Partial<AdminLocation>): Promise<AdminLocation> {
  const token = getAdminToken();
  const editorName = getEditorName();

  const payload = {
    location,
    editorName,
  };

  try {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    const errData = await res.json();
    throw new Error(errData.message || 'Failed to save location to database.');
  } catch (err: any) {
    console.error('[Admin API] Save location error:', err);
    throw err;
  }
}

export async function deleteLocation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/locations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.success;
    }
    const errData = await res.json();
    throw new Error(errData.message || 'Failed to delete location.');
  } catch (err: any) {
    console.error('[Admin API] Delete location error:', err);
    throw err;
  }
}

// --- ENTRANCES ---
export async function fetchEntrances(buildingId?: string): Promise<BuildingEntrance[]> {
  try {
    const url = buildingId
      ? `/api/entrances?buildingId=${encodeURIComponent(buildingId)}`
      : '/api/entrances';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin API] Fetch entrances error:', err);
  }
  return [];
}

export async function saveEntrance(entrance: Partial<BuildingEntrance>): Promise<BuildingEntrance> {
  const editorName = getEditorName();
  try {
    const res = await fetch('/api/entrances', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ entrance, editorName }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    const errData = await res.json();
    throw new Error(errData.message || 'Failed to save entrance.');
  } catch (err: any) {
    console.error('[Admin API] Save entrance error:', err);
    throw err;
  }
}

export async function deleteEntrance(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/entrances/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.success;
    }
    return false;
  } catch (err: any) {
    console.error('[Admin API] Delete entrance error:', err);
    throw err;
  }
}

// --- GATES ---
export async function fetchGates(): Promise<CampusGateItem[]> {
  try {
    const res = await fetch('/api/gates');
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin API] Fetch gates error:', err);
  }
  return [];
}

export async function saveGate(gate: Partial<CampusGateItem>): Promise<CampusGateItem> {
  const editorName = getEditorName();
  try {
    const res = await fetch('/api/gates', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gate, editorName }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    const errData = await res.json();
    throw new Error(errData.message || 'Failed to save gate.');
  } catch (err: any) {
    console.error('[Admin API] Save gate error:', err);
    throw err;
  }
}

export async function deleteGate(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/gates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.success;
    }
    return false;
  } catch (err: any) {
    console.error('[Admin API] Delete gate error:', err);
    throw err;
  }
}

// --- RELATIONSHIPS ---
export async function fetchRelationships(): Promise<BuildingGateRelationship[]> {
  try {
    const res = await fetch('/api/relationships');
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin API] Fetch relationships error:', err);
  }
  return [];
}

export async function saveRelationship(relationship: Partial<BuildingGateRelationship>): Promise<any> {
  const editorName = getEditorName();
  try {
    const res = await fetch('/api/relationships', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ relationship, editorName }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    return null;
  } catch (err: any) {
    console.error('[Admin API] Save relationship error:', err);
    throw err;
  }
}

// --- HISTORY & UNDO / REDO ---
export async function fetchHistory(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch('/api/history');
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.warn('[Admin API] Fetch history error:', err);
  }
  return [];
}

export async function undoLastAction(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/history/undo', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function redoLastAction(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/history/redo', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// --- TEMPORARY EVENT LOCATIONS & EVENT HISTORY ---

const EVENTS_CACHE_KEY = 'lpu_cached_events_v1';

export async function fetchActiveEvents(): Promise<EventLocation[]> {
  try {
    const res = await fetch('/api/events');
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin API] Fetch active events error:', err);
  }

  // Fallback to cached active events
  const cached = localStorage.getItem(EVENTS_CACHE_KEY);
  if (cached) {
    try {
      const parsed: EventLocation[] = JSON.parse(cached);
      const now = new Date();
      return parsed.filter(
        (e) => e.status === 'active' && new Date(e.startTime) <= now && new Date(e.endTime) >= now
      );
    } catch (e) {}
  }
  return [];
}

export async function fetchAllEvents(): Promise<EventLocation[]> {
  try {
    const res = await fetch('/api/events/all', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.warn('[Admin API] Fetch all events error:', err);
  }
  return fetchActiveEvents();
}

export async function fetchEventHistory(): Promise<EventLocation[]> {
  try {
    const res = await fetch('/api/events/history', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.warn('[Admin API] Fetch event history error:', err);
  }
  return [];
}

export async function saveEventLocation(event: Partial<EventLocation>): Promise<EventLocation> {
  const editorName = getEditorName();
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        event,
        editorName,
      }),
    });
    const json = await res.json();
    if (res.ok && json.data) {
      return json.data;
    }
    throw new Error(json.message || 'Failed to save event location');
  } catch (err: any) {
    console.error('[Admin API] Save event location error:', err);
    throw err;
  }
}

export async function deleteEventLocation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error('[Admin API] Delete event location error:', err);
    return false;
  }
}

export async function restoreEventLocation(id: string, newEndTime?: string): Promise<EventLocation | null> {
  const editorName = getEditorName();
  try {
    const res = await fetch(`/api/events/restore/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        endTime: newEndTime,
        editorName,
      }),
    });
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('[Admin API] Restore event error:', err);
    return null;
  }
}
