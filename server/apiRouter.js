// @ts-check
import {
  getLocations,
  saveLocation,
  deleteLocation,
  getEntrances,
  saveEntrance,
  deleteEntrance,
  getGates,
  saveGate,
  deleteGate,
  getRelationships,
  saveRelationship,
  getActiveEventLocations,
  getAllEventLocations,
  getEventHistory,
  getEventLocationById,
  saveEventLocation,
  deleteEventLocation,
  restoreEventLocation,
  getHistory,
  undoLastAction,
  redoLastAction,
  syncDiskFiles,
} from './dbHandler.js';

const ADMIN_SECRET = 'Shorya@1721';
const VALID_TOKENS = new Set(['lpu-admin-token-shorya-1721']);

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

function verifyAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return VALID_TOKENS.has(token) || token === ADMIN_SECRET;
}

export async function handleApiRequest(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return true;
  }

  // --- AUTH ENDPOINTS ---
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const passkey = (body.passkey || body.password || '').trim();
    if (passkey === ADMIN_SECRET) {
      const token = 'lpu-admin-token-shorya-1721';
      VALID_TOKENS.add(token);
      sendJson(res, 200, { success: true, token, user: 'Shorya (Admin)', role: 'admin' });
    } else {
      sendJson(res, 401, { success: false, message: 'Invalid administrator password. Access denied.' });
    }
    return true;
  }

  if (pathname === '/api/auth/verify' && method === 'GET') {
    const isAuthed = verifyAuth(req);
    sendJson(res, isAuthed ? 200 : 401, { authenticated: isAuthed });
    return true;
  }

  // --- LOCATIONS ENDPOINTS ---
  if (pathname === '/api/locations' && method === 'GET') {
    const locations = getLocations();
    sendJson(res, 200, { success: true, count: locations.length, data: locations });
    return true;
  }

  if (pathname === '/api/locations' && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const body = await parseBody(req);
    const editorName = body.editorName || 'Campus Admin';
    const saved = saveLocation(body.location || body, editorName);
    sendJson(res, 200, { success: true, message: 'Location saved permanently.', data: saved });
    return true;
  }

  if (pathname.startsWith('/api/locations/') && method === 'DELETE') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const id = pathname.replace('/api/locations/', '');
    const success = deleteLocation(id);
    sendJson(res, success ? 200 : 404, { success, message: success ? 'Location deleted.' : 'Location not found.' });
    return true;
  }

  // --- ENTRANCES ENDPOINTS ---
  if (pathname === '/api/entrances' && method === 'GET') {
    const buildingId = urlObj.searchParams.get('buildingId');
    const entrances = getEntrances(buildingId);
    sendJson(res, 200, { success: true, count: entrances.length, data: entrances });
    return true;
  }

  if (pathname === '/api/entrances' && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const body = await parseBody(req);
    const editorName = body.editorName || 'Campus Admin';
    const saved = saveEntrance(body.entrance || body, editorName);
    sendJson(res, 200, { success: true, message: 'Entrance saved permanently.', data: saved });
    return true;
  }

  if (pathname.startsWith('/api/entrances/') && method === 'DELETE') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const id = pathname.replace('/api/entrances/', '');
    const success = deleteEntrance(id);
    sendJson(res, success ? 200 : 404, { success, message: success ? 'Entrance deleted.' : 'Entrance not found.' });
    return true;
  }

  // --- GATES ENDPOINTS ---
  if (pathname === '/api/gates' && method === 'GET') {
    const gates = getGates();
    sendJson(res, 200, { success: true, count: gates.length, data: gates });
    return true;
  }

  if (pathname === '/api/gates' && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const body = await parseBody(req);
    const editorName = body.editorName || 'Campus Admin';
    const saved = saveGate(body.gate || body, editorName);
    sendJson(res, 200, { success: true, message: 'Campus gate saved permanently.', data: saved });
    return true;
  }

  if (pathname.startsWith('/api/gates/') && method === 'DELETE') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const id = pathname.replace('/api/gates/', '');
    const success = deleteGate(id);
    sendJson(res, success ? 200 : 404, { success, message: success ? 'Gate deleted.' : 'Gate not found.' });
    return true;
  }

  // --- RELATIONSHIPS ENDPOINTS ---
  if (pathname === '/api/relationships' && method === 'GET') {
    const rels = getRelationships();
    sendJson(res, 200, { success: true, count: rels.length, data: rels });
    return true;
  }

  if (pathname === '/api/relationships' && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const body = await parseBody(req);
    const editorName = body.editorName || 'Campus Admin';
    const saved = saveRelationship(body.relationship || body, editorName);
    sendJson(res, 200, { success: true, message: 'Building relationship saved.', data: saved });
    return true;
  }

  // --- TEMPORARY EVENT LOCATIONS ENDPOINTS ---
  if (pathname === '/api/events' && method === 'GET') {
    const events = getActiveEventLocations();
    sendJson(res, 200, { success: true, count: events.length, data: events });
    return true;
  }

  if (pathname === '/api/events/all' && method === 'GET') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const events = getAllEventLocations();
    sendJson(res, 200, { success: true, count: events.length, data: events });
    return true;
  }

  if (pathname === '/api/events/history' && method === 'GET') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const history = getEventHistory();
    sendJson(res, 200, { success: true, count: history.length, data: history });
    return true;
  }

  if (pathname === '/api/events' && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const body = await parseBody(req);
    const editorName = body.editorName || 'Shorya (Admin)';
    const saved = saveEventLocation(body.event || body, editorName);
    sendJson(res, 200, { success: true, message: 'Event location saved successfully.', data: saved });
    return true;
  }

  if (pathname.startsWith('/api/events/restore/') && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const id = pathname.replace('/api/events/restore/', '');
    const body = await parseBody(req);
    const editorName = body.editorName || 'Shorya (Admin)';
    const restored = restoreEventLocation(id, body.endTime || null, editorName);
    sendJson(res, restored ? 200 : 404, { success: Boolean(restored), data: restored });
    return true;
  }

  if (pathname.startsWith('/api/events/') && method === 'DELETE') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const id = pathname.replace('/api/events/', '');
    const editorName = 'Shorya (Admin)';
    const success = deleteEventLocation(id, editorName);
    sendJson(res, success ? 200 : 404, {
      success,
      message: success ? 'Event location archived to history.' : 'Event location not found.',
    });
    return true;
  }

  // --- AUDIT HISTORY, UNDO, REDO ---
  if (pathname === '/api/history' && method === 'GET') {
    const history = getHistory();
    sendJson(res, 200, { success: true, count: history.length, data: history });
    return true;
  }

  if (pathname === '/api/history/undo' && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const resUndo = undoLastAction();
    sendJson(res, resUndo.success ? 200 : 400, resUndo);
    return true;
  }

  if (pathname === '/api/history/redo' && method === 'POST') {
    if (!verifyAuth(req)) {
      sendJson(res, 403, { success: false, message: 'Unauthorized. Admin session required.' });
      return true;
    }
    const resRedo = redoLastAction();
    sendJson(res, resRedo.success ? 200 : 400, resRedo);
    return true;
  }

  if (pathname === '/api/sync-disk' && method === 'POST') {
    syncDiskFiles();
    sendJson(res, 200, { success: true, message: 'Synced SQLite database to disk JSON files.' });
    return true;
  }

  return false;
}
