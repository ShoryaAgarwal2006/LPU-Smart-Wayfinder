// @ts-check
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'campus_wayfinder.db');
const db = new DatabaseSync(dbPath);

// Verify tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS campus_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    exact_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    description TEXT,
    verification_status TEXT,
    geographical_area TEXT,
    nearby_landmarks TEXT,
    is_inside_campus INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS building_entrances (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL,
    name TEXT NOT NULL,
    entrance_type TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    is_preferred INTEGER DEFAULT 0,
    is_restricted INTEGER DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    description TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS campus_gates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    gate_type TEXT NOT NULL DEFAULT 'entry_exit',
    access_type TEXT NOT NULL DEFAULT 'both',
    description TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS building_gate_relationships (
    id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL,
    preferred_gate_id TEXT NOT NULL,
    preferred_entrance_id TEXT,
    approach_notes TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS location_change_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    previous_data TEXT,
    new_data TEXT,
    editor_name TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    undone INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS event_locations (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Campus Event',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT,
    updated_at TEXT,
    editor_name TEXT
  );
`);

export function getLocations() {
  const rows = db.prepare('SELECT * FROM campus_locations ORDER BY name ASC').all();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    exactName: r.exact_name,
    category: r.category,
    subcategory: r.subcategory,
    latitude: r.latitude,
    longitude: r.longitude,
    description: r.description,
    notes: r.description,
    verificationStatus: r.verification_status,
    geographicalArea: r.geographical_area,
    nearbyLandmarks: r.nearby_landmarks ? JSON.parse(r.nearby_landmarks) : [],
    isInsideCampus: Boolean(r.is_inside_campus),
    updatedAt: r.updated_at,
  }));
}

export function getLocationById(id) {
  const r = db.prepare('SELECT * FROM campus_locations WHERE id = ?').get(id);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    exactName: r.exact_name,
    category: r.category,
    subcategory: r.subcategory,
    latitude: r.latitude,
    longitude: r.longitude,
    description: r.description,
    notes: r.description,
    verificationStatus: r.verification_status,
    geographicalArea: r.geographical_area,
    nearbyLandmarks: r.nearby_landmarks ? JSON.parse(r.nearby_landmarks) : [],
    isInsideCampus: Boolean(r.is_inside_campus),
    updatedAt: r.updated_at,
  };
}

export function saveLocation(loc, editorName = 'Admin Editor') {
  const existing = getLocationById(loc.id);
  const actionType = existing ? 'UPDATE_LOCATION' : 'ADD_LOCATION';
  const now = new Date().toISOString();

  const id = loc.id || `LOC_${Date.now()}`;
  const name = loc.name || loc.exactName || existing?.name || 'Campus Location';
  const exactName = loc.exactName || loc.name || existing?.exactName || name;
  const category = loc.category || existing?.category || 'Other Landmark';
  const subcategory = loc.subcategory !== undefined ? loc.subcategory : (existing?.subcategory || '');
  const lat = loc.latitude !== undefined && !isNaN(Number(loc.latitude)) ? Number(loc.latitude) : (existing?.latitude || 31.25);
  const lon = loc.longitude !== undefined && !isNaN(Number(loc.longitude)) ? Number(loc.longitude) : (existing?.longitude || 75.70);
  const desc = loc.description !== undefined ? loc.description : (loc.notes !== undefined ? loc.notes : (existing?.description || ''));
  const ver = loc.verificationStatus || existing?.verificationStatus || 'ADMIN_VERIFIED';
  const geo = loc.geographicalArea !== undefined ? loc.geographicalArea : (existing?.geographicalArea || '');
  const landmarks = loc.nearbyLandmarks ? JSON.stringify(loc.nearbyLandmarks) : (existing?.nearbyLandmarks ? JSON.stringify(existing.nearbyLandmarks) : '[]');
  const inside = loc.isInsideCampus !== undefined ? (loc.isInsideCampus ? 1 : 0) : (existing?.isInsideCampus ? 1 : 0);

  if (existing) {
    db.prepare(`
      UPDATE campus_locations SET
        name = ?, exact_name = ?, category = ?, subcategory = ?,
        latitude = ?, longitude = ?, description = ?, verification_status = ?,
        geographical_area = ?, nearby_landmarks = ?, is_inside_campus = ?, updated_at = ?
      WHERE id = ?
    `).run(name, exactName, category, subcategory, lat, lon, desc, ver, geo, landmarks, inside, now, id);
  } else {
    db.prepare(`
      INSERT INTO campus_locations (
        id, name, exact_name, category, subcategory, latitude, longitude,
        description, verification_status, geographical_area, nearby_landmarks,
        is_inside_campus, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, exactName, category, subcategory, lat, lon, desc, ver, geo, landmarks, inside, now, now);
  }

  const updated = getLocationById(id);

  // Log change history
  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES (?, ?, 'location', ?, ?, ?, ?, 0)
  `).run(
    actionType,
    id,
    existing ? JSON.stringify(existing) : null,
    JSON.stringify(updated),
    editorName,
    now
  );

  scheduleDiskSync();
  return updated;
}

export function deleteLocation(id, editorName = 'Admin Editor') {
  const existing = getLocationById(id);
  if (!existing) return false;

  const now = new Date().toISOString();
  db.prepare('DELETE FROM campus_locations WHERE id = ?').run(id);

  // Also remove associated entrances
  db.prepare('DELETE FROM building_entrances WHERE building_id = ?').run(id);
  db.prepare('DELETE FROM building_gate_relationships WHERE building_id = ?').run(id);

  // Log change history
  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES ('DELETE_LOCATION', ?, 'location', ?, null, ?, ?, 0)
  `).run(
    id,
    JSON.stringify(existing),
    editorName,
    now
  );

  scheduleDiskSync();
  return true;
}

export function getEntrances(buildingId = null) {
  let rows;
  if (buildingId) {
    rows = db.prepare('SELECT * FROM building_entrances WHERE building_id = ? ORDER BY is_preferred DESC, name ASC').all(buildingId);
  } else {
    rows = db.prepare('SELECT * FROM building_entrances ORDER BY building_id ASC, is_preferred DESC, name ASC').all();
  }
  return rows.map((r) => ({
    id: r.id,
    buildingId: r.building_id,
    name: r.name,
    entranceType: r.entrance_type,
    latitude: r.latitude,
    longitude: r.longitude,
    isPreferred: Boolean(r.is_preferred),
    isRestricted: Boolean(r.is_restricted),
    isAvailable: Boolean(r.is_available),
    description: r.description,
    updatedAt: r.updated_at,
  }));
}

export function saveEntrance(ent, editorName = 'Admin Editor') {
  const id = ent.id || `ENT_${Date.now()}`;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM building_entrances WHERE id = ?').get(id);

  const buildingId = ent.buildingId || existing?.building_id;
  const name = ent.name || existing?.name || 'Entrance';
  const entranceType = ent.entranceType || existing?.entrance_type || 'main';
  const lat = ent.latitude !== undefined && !isNaN(Number(ent.latitude)) ? Number(ent.latitude) : (existing ? Number(existing.latitude) : 31.25);
  const lon = ent.longitude !== undefined && !isNaN(Number(ent.longitude)) ? Number(ent.longitude) : (existing ? Number(existing.longitude) : 75.70);
  const isPreferred = ent.isPreferred !== undefined ? (ent.isPreferred ? 1 : 0) : (existing ? existing.is_preferred : 0);
  const isRestricted = ent.isRestricted !== undefined ? (ent.isRestricted ? 1 : 0) : (existing ? existing.is_restricted : 0);
  const isAvailable = ent.isAvailable !== undefined ? (ent.isAvailable ? 1 : 0) : (existing ? existing.is_available : 1);
  const description = ent.description !== undefined ? ent.description : (existing?.description || '');

  // If marked preferred, unmark others for the same building
  if (isPreferred && buildingId) {
    db.prepare('UPDATE building_entrances SET is_preferred = 0 WHERE building_id = ?').run(buildingId);
  }

  if (existing) {
    db.prepare(`
      UPDATE building_entrances SET
        building_id = ?, name = ?, entrance_type = ?, latitude = ?, longitude = ?,
        is_preferred = ?, is_restricted = ?, is_available = ?, description = ?, updated_at = ?
      WHERE id = ?
    `).run(
      buildingId, name, entranceType,
      lat, lon,
      isPreferred, isRestricted, isAvailable,
      description, now, id
    );
  } else {
    db.prepare(`
      INSERT INTO building_entrances (
        id, building_id, name, entrance_type, latitude, longitude,
        is_preferred, is_restricted, is_available, description, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, buildingId, name, entranceType,
      lat, lon,
      isPreferred, isRestricted, isAvailable,
      description, now
    );
  }

  const updated = db.prepare('SELECT * FROM building_entrances WHERE id = ?').get(id);

  // Log change history
  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES (?, ?, 'entrance', ?, ?, ?, ?, 0)
  `).run(
    existing ? 'UPDATE_ENTRANCE' : 'ADD_ENTRANCE',
    id,
    existing ? JSON.stringify(existing) : null,
    JSON.stringify(updated),
    editorName,
    now
  );

  return updated;
}

export function deleteEntrance(id, editorName = 'Admin Editor') {
  const existing = db.prepare('SELECT * FROM building_entrances WHERE id = ?').get(id);
  if (!existing) return false;

  const now = new Date().toISOString();
  db.prepare('DELETE FROM building_entrances WHERE id = ?').run(id);

  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES ('DELETE_ENTRANCE', ?, 'entrance', ?, null, ?, ?, 0)
  `).run(
    id,
    JSON.stringify(existing),
    editorName,
    now
  );

  return true;
}

export function getGates() {
  const rows = db.prepare('SELECT * FROM campus_gates ORDER BY name ASC').all();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    latitude: r.latitude,
    longitude: r.longitude,
    coordinates: [r.longitude, r.latitude], // [lon, lat] format for Leaflet compatibility
    gateType: r.gate_type,
    accessType: r.access_type,
    description: r.description,
    updatedAt: r.updated_at,
  }));
}

export function saveGate(gate, editorName = 'Admin Editor') {
  const id = gate.id || `GATE_${Date.now()}`;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM campus_gates WHERE id = ?').get(id);

  const name = gate.name || existing?.name || 'Campus Gate';
  const category = gate.category || existing?.category || 'Campus Gate';
  const lat = gate.latitude !== undefined && !isNaN(Number(gate.latitude))
    ? Number(gate.latitude)
    : (gate.coordinates ? Number(gate.coordinates[1]) : (existing ? Number(existing.latitude) : 31.25));
  const lon = gate.longitude !== undefined && !isNaN(Number(gate.longitude))
    ? Number(gate.longitude)
    : (gate.coordinates ? Number(gate.coordinates[0]) : (existing ? Number(existing.longitude) : 75.70));
  const gateType = gate.gateType || existing?.gate_type || 'entry_exit';
  const accessType = gate.accessType || existing?.access_type || 'both';
  const description = gate.description !== undefined ? gate.description : (existing?.description || '');

  if (existing) {
    db.prepare(`
      UPDATE campus_gates SET
        name = ?, category = ?, latitude = ?, longitude = ?,
        gate_type = ?, access_type = ?, description = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name, category,
      lat, lon, gateType,
      accessType, description, now, id
    );
  } else {
    db.prepare(`
      INSERT INTO campus_gates (id, name, category, latitude, longitude, gate_type, access_type, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, category,
      lat, lon, gateType,
      accessType, description, now
    );
  }

  const updated = db.prepare('SELECT * FROM campus_gates WHERE id = ?').get(id);

  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES (?, ?, 'gate', ?, ?, ?, ?, 0)
  `).run(
    existing ? 'UPDATE_GATE' : 'ADD_GATE',
    id,
    existing ? JSON.stringify(existing) : null,
    JSON.stringify(updated),
    editorName,
    now
  );

  return updated;
}

export function deleteGate(id, editorName = 'Admin Editor') {
  const existing = db.prepare('SELECT * FROM campus_gates WHERE id = ?').get(id);
  if (!existing) return false;

  const now = new Date().toISOString();
  db.prepare('DELETE FROM campus_gates WHERE id = ?').run(id);

  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES ('DELETE_GATE', ?, 'gate', ?, null, ?, ?, 0)
  `).run(
    id,
    JSON.stringify(existing),
    editorName,
    now
  );

  return true;
}

export function getRelationships() {
  const rows = db.prepare('SELECT * FROM building_gate_relationships').all();
  return rows.map((r) => ({
    id: r.id,
    buildingId: r.building_id,
    preferredGateId: r.preferred_gate_id,
    preferredEntranceId: r.preferred_entrance_id,
    approachNotes: r.approach_notes,
    updatedAt: r.updated_at,
  }));
}

export function saveRelationship(rel, editorName = 'Admin Editor') {
  const id = rel.id || `REL_${rel.buildingId}`;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM building_gate_relationships WHERE building_id = ?').get(rel.buildingId);

  if (existing) {
    db.prepare(`
      UPDATE building_gate_relationships SET
        preferred_gate_id = ?, preferred_entrance_id = ?, approach_notes = ?, updated_at = ?
      WHERE building_id = ?
    `).run(rel.preferredGateId, rel.preferredEntranceId || null, rel.approachNotes || '', now, rel.buildingId);
  } else {
    db.prepare(`
      INSERT INTO building_gate_relationships (id, building_id, preferred_gate_id, preferred_entrance_id, approach_notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, rel.buildingId, rel.preferredGateId, rel.preferredEntranceId || null, rel.approachNotes || '', now);
  }

  return db.prepare('SELECT * FROM building_gate_relationships WHERE building_id = ?').get(rel.buildingId);
}

// --- TEMPORARY EVENT LOCATIONS & EVENT HISTORY ---

function formatEventRow(r) {
  if (!r) return null;
  const now = new Date();
  const startTime = new Date(r.start_time);
  const endTime = new Date(r.end_time);
  const isExpired = endTime < now || r.status === 'expired' || r.status === 'archived';
  const isActive = r.status === 'active' && startTime <= now && endTime >= now;

  return {
    id: r.id,
    eventName: r.event_name,
    locationName: r.location_name,
    name: `${r.event_name} (${r.location_name})`,
    category: r.category || 'Campus Event',
    latitude: r.latitude,
    longitude: r.longitude,
    startTime: r.start_time,
    endTime: r.end_time,
    description: r.description || '',
    status: isExpired ? (r.status === 'archived' ? 'archived' : 'expired') : r.status,
    isActive,
    isExpired,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    editorName: r.editor_name,
  };
}

export function checkAndExpireEvents() {
  try {
    const nowIso = new Date().toISOString();
    const expiredRows = db.prepare(`
      SELECT * FROM event_locations WHERE status = 'active' AND datetime(end_time) < datetime(?)
    `).all(nowIso);

    for (const exp of expiredRows) {
      db.prepare(`UPDATE event_locations SET status = 'expired', updated_at = ? WHERE id = ?`).run(nowIso, exp.id);
      db.prepare(`
        INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
        VALUES ('AUTO_EXPIRE_EVENT', ?, 'event', ?, '{"status":"expired"}', 'System Auto-Scheduler', ?, 0)
      `).run(exp.id, JSON.stringify(exp), nowIso);
    }
  } catch (e) {
    console.error('[Event Expiry Check Error]', e);
  }
}

export function getActiveEventLocations() {
  checkAndExpireEvents();
  const nowIso = new Date().toISOString();
  const rows = db.prepare(`
    SELECT * FROM event_locations
    WHERE status = 'active' AND datetime(start_time) <= datetime(?) AND datetime(end_time) >= datetime(?)
    ORDER BY start_time ASC
  `).all(nowIso, nowIso);
  return rows.map(formatEventRow);
}

export function getAllEventLocations() {
  checkAndExpireEvents();
  const rows = db.prepare('SELECT * FROM event_locations ORDER BY created_at DESC').all();
  return rows.map(formatEventRow);
}

export function getEventHistory() {
  checkAndExpireEvents();
  const rows = db.prepare(`
    SELECT * FROM event_locations
    WHERE status != 'active' OR datetime(end_time) < datetime('now')
    ORDER BY end_time DESC
  `).all();
  return rows.map(formatEventRow);
}

export function getEventLocationById(id) {
  const r = db.prepare('SELECT * FROM event_locations WHERE id = ?').get(id);
  return formatEventRow(r);
}

export function saveEventLocation(eventData, editorName = 'Shorya (Admin)') {
  const id = eventData.id || `EVENT_${Date.now()}`;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM event_locations WHERE id = ?').get(id);

  const eventName = (eventData.eventName || eventData.name || existing?.event_name || 'Campus Event').trim();
  const locationName = (eventData.locationName || eventData.venueName || existing?.location_name || 'Campus Venue').trim();
  const category = eventData.category || existing?.category || 'Campus Event';
  const lat = Number(eventData.latitude !== undefined && !isNaN(Number(eventData.latitude)) ? eventData.latitude : (existing?.latitude || 31.254));
  const lon = Number(eventData.longitude !== undefined && !isNaN(Number(eventData.longitude)) ? eventData.longitude : (existing?.longitude || 75.704));
  const startTime = eventData.startTime || existing?.start_time || now;
  const endTime = eventData.endTime || existing?.end_time || new Date(Date.now() + 86400000).toISOString();
  const desc = eventData.description || eventData.notes || existing?.description || '';

  const isExpired = new Date(endTime).getTime() <= Date.now();
  const status = isExpired ? 'expired' : (eventData.status === 'archived' ? 'archived' : 'active');

  if (existing) {
    db.prepare(`
      UPDATE event_locations SET
        event_name = ?, location_name = ?, category = ?,
        latitude = ?, longitude = ?, start_time = ?, end_time = ?,
        description = ?, status = ?, updated_at = ?, editor_name = ?
      WHERE id = ?
    `).run(eventName, locationName, category, lat, lon, startTime, endTime, desc, status, now, editorName, id);
  } else {
    db.prepare(`
      INSERT INTO event_locations (
        id, event_name, location_name, category,
        latitude, longitude, start_time, end_time,
        description, status, created_at, updated_at, editor_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, eventName, locationName, category, lat, lon, startTime, endTime, desc, status, now, now, editorName);
  }

  const updated = getEventLocationById(id);

  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES (?, ?, 'event', ?, ?, ?, ?, 0)
  `).run(
    existing ? 'UPDATE_EVENT' : 'ADD_EVENT',
    id,
    existing ? JSON.stringify(existing) : null,
    JSON.stringify(updated),
    editorName,
    now
  );

  scheduleDiskSync();
  return updated;
}

export function deleteEventLocation(id, editorName = 'Shorya (Admin)') {
  const existing = getEventLocationById(id);
  if (!existing) return false;

  const now = new Date().toISOString();
  // Move to archived/history
  db.prepare(`UPDATE event_locations SET status = 'archived', updated_at = ? WHERE id = ?`).run(now, id);

  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES ('ARCHIVE_EVENT', ?, 'event', ?, '{"status":"archived"}', ?, ?, 0)
  `).run(id, JSON.stringify(existing), editorName, now);

  scheduleDiskSync();
  return true;
}

export function restoreEventLocation(id, newEndTime = null, editorName = 'Shorya (Admin)') {
  const existing = getEventLocationById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const end = newEndTime || new Date(Date.now() + 86400000 * 2).toISOString();

  db.prepare(`
    UPDATE event_locations SET status = 'active', start_time = ?, end_time = ?, updated_at = ? WHERE id = ?
  `).run(now, end, now, id);

  db.prepare(`
    INSERT INTO location_change_history (action_type, entity_id, entity_type, previous_data, new_data, editor_name, timestamp, undone)
    VALUES ('RESTORE_EVENT', ?, 'event', ?, '{"status":"active"}', ?, ?, 0)
  `).run(id, JSON.stringify(existing), editorName, now);

  scheduleDiskSync();
  return getEventLocationById(id);
}

export function getHistory(limit = 100) {
  return db.prepare('SELECT * FROM location_change_history ORDER BY id DESC LIMIT ?').all(limit);
}

export function undoLastAction(editorName = 'Admin Editor') {
  const lastAction = db.prepare('SELECT * FROM location_change_history WHERE undone = 0 ORDER BY id DESC LIMIT 1').get();
  if (!lastAction) return { success: false, message: 'Nothing to undo' };

  const now = new Date().toISOString();

  if (lastAction.entity_type === 'location') {
    if (lastAction.action_type === 'ADD_LOCATION') {
      db.prepare('DELETE FROM campus_locations WHERE id = ?').run(lastAction.entity_id);
    } else if (lastAction.action_type === 'UPDATE_LOCATION' || lastAction.action_type === 'MOVE_LOCATION') {
      const prev = JSON.parse(lastAction.previous_data);
      db.prepare(`
        UPDATE campus_locations SET
          name = ?, exact_name = ?, category = ?, subcategory = ?,
          latitude = ?, longitude = ?, description = ?, verification_status = ?,
          geographical_area = ?, nearby_landmarks = ?, is_inside_campus = ?, updated_at = ?
        WHERE id = ?
      `).run(
        prev.name, prev.exact_name || prev.exactName, prev.category, prev.subcategory,
        prev.latitude, prev.longitude, prev.description, prev.verification_status || prev.verificationStatus,
        prev.geographical_area || prev.geographicalArea,
        JSON.stringify(prev.nearby_landmarks || prev.nearbyLandmarks || []),
        prev.is_inside_campus ? 1 : 0, now, lastAction.entity_id
      );
    } else if (lastAction.action_type === 'DELETE_LOCATION') {
      const prev = JSON.parse(lastAction.previous_data);
      db.prepare(`
        INSERT INTO campus_locations (
          id, name, exact_name, category, subcategory, latitude, longitude,
          description, verification_status, geographical_area, nearby_landmarks,
          is_inside_campus, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        prev.id, prev.name, prev.exact_name || prev.exactName, prev.category, prev.subcategory,
        prev.latitude, prev.longitude, prev.description, prev.verification_status || prev.verificationStatus,
        prev.geographical_area || prev.geographicalArea,
        JSON.stringify(prev.nearby_landmarks || prev.nearbyLandmarks || []),
        prev.is_inside_campus ? 1 : 0, now, now
      );
    }
  }

  db.prepare('UPDATE location_change_history SET undone = 1 WHERE id = ?').run(lastAction.id);
  scheduleDiskSync();
  return { success: true, undoneAction: lastAction };
}

export function redoLastAction(editorName = 'Admin Editor') {
  const lastUndone = db.prepare('SELECT * FROM location_change_history WHERE undone = 1 ORDER BY id ASC LIMIT 1').get();
  if (!lastUndone) return { success: false, message: 'Nothing to redo' };

  const now = new Date().toISOString();

  if (lastUndone.entity_type === 'location') {
    if (lastUndone.action_type === 'ADD_LOCATION') {
      const curr = JSON.parse(lastUndone.new_data);
      db.prepare(`
        INSERT INTO campus_locations (
          id, name, exact_name, category, subcategory, latitude, longitude,
          description, verification_status, geographical_area, nearby_landmarks,
          is_inside_campus, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        curr.id, curr.name, curr.exact_name || curr.exactName, curr.category, curr.subcategory,
        curr.latitude, curr.longitude, curr.description, curr.verification_status || curr.verificationStatus,
        curr.geographical_area || curr.geographicalArea,
        JSON.stringify(curr.nearby_landmarks || curr.nearbyLandmarks || []),
        curr.is_inside_campus ? 1 : 0, now, now
      );
    } else if (lastUndone.action_type === 'UPDATE_LOCATION' || lastUndone.action_type === 'MOVE_LOCATION') {
      const curr = JSON.parse(lastUndone.new_data);
      db.prepare(`
        UPDATE campus_locations SET
          name = ?, exact_name = ?, category = ?, subcategory = ?,
          latitude = ?, longitude = ?, description = ?, verification_status = ?,
          geographical_area = ?, nearby_landmarks = ?, is_inside_campus = ?, updated_at = ?
        WHERE id = ?
      `).run(
        curr.name, curr.exact_name || curr.exactName, curr.category, curr.subcategory,
        curr.latitude, curr.longitude, curr.description, curr.verification_status || curr.verificationStatus,
        curr.geographical_area || curr.geographicalArea,
        JSON.stringify(curr.nearby_landmarks || curr.nearbyLandmarks || []),
        curr.is_inside_campus ? 1 : 0, now, lastUndone.entity_id
      );
    } else if (lastUndone.action_type === 'DELETE_LOCATION') {
      db.prepare('DELETE FROM campus_locations WHERE id = ?').run(lastUndone.entity_id);
    }
  }

  db.prepare('UPDATE location_change_history SET undone = 0 WHERE id = ?').run(lastUndone.id);
  scheduleDiskSync();
  return { success: true, redoneAction: lastUndone };
}

// Debounce timer for disk backup synchronization to prevent unnecessary disk I/O and dev server reloads
let diskSyncTimer = null;

export function scheduleDiskSync(delayMs = 10000) {
  if (diskSyncTimer) clearTimeout(diskSyncTimer);
  diskSyncTimer = setTimeout(() => {
    syncDiskFiles();
  }, delayMs);
}

// Write back to project disk files for git safety & static fallback
export function syncDiskFiles() {
  try {
    const locations = getLocations();
    const locFilePath = path.join(process.cwd(), 'src/data/lpuVerifiedGoogleMapsLocations.json');
    fs.writeFileSync(locFilePath, JSON.stringify(locations, null, 2), 'utf8');

    // Also update buildings.json
    const buildingsPath = path.join(process.cwd(), 'buildings.json');
    if (fs.existsSync(buildingsPath)) {
      const bData = JSON.parse(fs.readFileSync(buildingsPath, 'utf8'));
      const bMap = new Map((bData.buildings || []).map((b) => [b.id, b]));
      const updatedBuildings = locations.map((loc) => {
        const old = bMap.get(loc.id) || {};
        return {
          id: loc.id,
          name: loc.exactName || loc.name,
          block_number: loc.id.replace('BLOCK_', '').replace('BH_', '').replace('GH_', '').replace('BS_', '').replace('GS_', ''),
          category: loc.category,
          subcategory: loc.subcategory,
          coordinates: { latitude: loc.latitude, longitude: loc.longitude },
          geographical_area: loc.geographicalArea,
          nearby_landmarks: loc.nearbyLandmarks,
          osm_way_id: old.osm_way_id || null,
          floors: old.floors || 4,
          primary_occupants: old.primary_occupants || [loc.subcategory || loc.category || loc.name],
          indoor_mapping_status: old.indoor_mapping_status || 'requires_manual_mapping',
          source: 'Google Maps & Admin Map Editor Ground Truth',
        };
      });
      fs.writeFileSync(buildingsPath, JSON.stringify({ buildings: updatedBuildings }, null, 2), 'utf8');
    }

    // Also update locationNameOverrides.json
    const overridesPath = path.join(process.cwd(), 'src/data/locationNameOverrides.json');
    if (fs.existsSync(overridesPath)) {
      const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      for (const loc of locations) {
        if (overrides[loc.id]) {
          overrides[loc.id].display_name = loc.exactName || loc.name;
          overrides[loc.id].category = loc.category;
          overrides[loc.id].geographical_area = loc.geographicalArea;
        }
      }
      fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), 'utf8');
    }
    // Also update eventLocations.json
    const events = getAllEventLocations();
    const eventsPath = path.join(process.cwd(), 'src/data/eventLocations.json');
    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf8');

    console.log('[SQLite DB] Successfully synced disk JSON files.');
  } catch (err) {
    console.error('[SQLite DB] Error syncing disk files:', err);
  }
}
