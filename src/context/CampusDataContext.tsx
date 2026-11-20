import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AdminLocation,
  BuildingEntrance,
  CampusGateItem,
  BuildingGateRelationship,
  AuditLogEntry,
  EditorTool,
  EventLocation,
} from '../types/adminEditor';
import { Building, CampusGate, CampusPlace } from '../types';
import * as api from '../services/adminApiService';
import initialLocationsRaw from '../data/lpuVerifiedGoogleMapsLocations.json';
import { campusGates as initialGatesRaw } from '../data/campusData';

interface CampusDataContextType {
  locations: AdminLocation[];
  entrances: BuildingEntrance[];
  gates: CampusGateItem[];
  relationships: BuildingGateRelationship[];
  selectedLocation: AdminLocation | null;
  isEditMode: boolean;
  currentTool: EditorTool;
  history: AuditLogEntry[];
  isLoading: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveErrorMessage: string | null;

  // Actions
  setIsEditMode: (mode: boolean) => void;
  setCurrentTool: (tool: EditorTool) => void;
  setSelectedLocation: (loc: AdminLocation | null) => void;
  updateLocationPosition: (id: string, lat: number, lon: number) => void;
  saveLocationRecord: (loc: Partial<AdminLocation>) => Promise<AdminLocation>;
  deleteLocationRecord: (id: string) => Promise<boolean>;
  saveEntranceRecord: (ent: Partial<BuildingEntrance>) => Promise<BuildingEntrance>;
  deleteEntranceRecord: (id: string) => Promise<boolean>;
  saveGateRecord: (gate: Partial<CampusGateItem>) => Promise<CampusGateItem>;
  deleteGateRecord: (id: string) => Promise<boolean>;
  saveRelationshipRecord: (rel: Partial<BuildingGateRelationship>) => Promise<any>;
  undoAction: () => Promise<boolean>;
  redoAction: () => Promise<boolean>;
  refreshAllData: () => Promise<void>;

  // Helpers
  getEntrancesForBuilding: (buildingId: string) => BuildingEntrance[];
  getPreferredEntranceForBuilding: (buildingId: string) => BuildingEntrance | null;
  getPreferredGateForBuilding: (buildingId: string) => CampusGateItem | null;

  // Temporary Event Locations & History
  activeEvents: EventLocation[];
  allEvents: EventLocation[];
  eventHistory: EventLocation[];
  saveEventRecord: (evt: Partial<EventLocation>) => Promise<EventLocation>;
  deleteEventRecord: (id: string) => Promise<boolean>;
  restoreEventRecord: (id: string, newEndTime?: string) => Promise<EventLocation | null>;
  refreshEvents: () => Promise<void>;

  // Bridge for standard UI components (Buildings list, Search, Directory)
  buildings: Building[];
  campusGates: CampusGate[];
  campusMasterInventory: CampusPlace[];
}

const CampusDataContext = createContext<CampusDataContextType | undefined>(undefined);

export const CampusDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<AdminLocation[]>(initialLocationsRaw as any[]);
  const [entrances, setEntrances] = useState<BuildingEntrance[]>([]);
  const [gates, setGates] = useState<CampusGateItem[]>(() =>
    initialGatesRaw.map((g) => ({
      id: g.id,
      name: g.name,
      category: 'Campus Gate',
      latitude: g.coordinates[1],
      longitude: g.coordinates[0],
      coordinates: g.coordinates,
      gateType: 'entry_exit',
      accessType: 'both',
      description: g.description,
    }))
  );
  const [relationships, setRelationships] = useState<BuildingGateRelationship[]>([]);
  const [selectedLocation, setSelectedLocationState] = useState<AdminLocation | null>(null);
  const [isEditMode, setIsEditModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('lpu_wayfinder_edit_mode') === 'true';
      return savedMode && api.isAuthenticated();
    }
    return false;
  });

  const setIsEditMode = useCallback((mode: boolean) => {
    if (mode && !api.isAuthenticated()) {
      setIsEditModeState(false);
      try {
        localStorage.setItem('lpu_wayfinder_edit_mode', 'false');
      } catch (e) {}
      return;
    }
    setIsEditModeState(mode);
    try {
      localStorage.setItem('lpu_wayfinder_edit_mode', mode ? 'true' : 'false');
      if (mode && typeof window !== 'undefined') {
        localStorage.setItem('lpu_wayfinder_active_page', 'map');
        window.history.replaceState(null, '', '#map');
      }
    } catch (e) {}
  }, []);

  const setSelectedLocation = useCallback((loc: AdminLocation | null) => {
    setSelectedLocationState(loc);
    try {
      if (loc) {
        sessionStorage.setItem('lpu_wayfinder_selected_location_id', loc.id);
      } else {
        sessionStorage.removeItem('lpu_wayfinder_selected_location_id');
      }
    } catch (e) {}
  }, []);

  const [currentTool, setCurrentTool] = useState<EditorTool>('select');
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Temporary Event Locations & History state
  const [activeEvents, setActiveEvents] = useState<EventLocation[]>([]);
  const [allEvents, setAllEvents] = useState<EventLocation[]>([]);
  const [eventHistory, setEventHistory] = useState<EventLocation[]>([]);

  // Restore selected location if page reloads during edit
  useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      try {
        const savedId = sessionStorage.getItem('lpu_wayfinder_selected_location_id');
        if (savedId) {
          const match = locations.find((l) => l.id === savedId);
          if (match) {
            setSelectedLocationState(match);
          }
        }
      } catch (e) {}
    }
  }, [locations, selectedLocation]);

  // Refresh Temporary Event Locations & History
  const refreshEvents = useCallback(async () => {
    try {
      const active = await api.fetchActiveEvents();
      if (active) setActiveEvents(active);

      if (api.isAuthenticated()) {
        const [all, hist] = await Promise.all([
          api.fetchAllEvents(),
          api.fetchEventHistory(),
        ]);
        if (all) setAllEvents(all);
        if (hist) setEventHistory(hist);
      }
    } catch (e) {
      console.warn('[CampusDataContext] Error loading events:', e);
    }
  }, []);

  // Load all data from SQLite database on mount
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [locs, ents, gts, rels, hist] = await Promise.all([
        api.fetchLocations(),
        api.fetchEntrances(),
        api.fetchGates(),
        api.fetchRelationships(),
        api.fetchHistory(),
        refreshEvents(),
      ]);

      if (locs && locs.length > 0) setLocations(locs);
      if (ents) setEntrances(ents);
      if (gts && gts.length > 0) setGates(gts);
      if (rels) setRelationships(rels);
      if (hist) setHistory(hist);
    } catch (err) {
      console.warn('[CampusDataContext] Load error, keeping current memory state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshEvents]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Periodic automatic event expiration check (runs every 30 seconds)
  // Ensures events that pass their end_time are cleanly removed from active map and moved to history
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hasExpired = activeEvents.some((e) => new Date(e.endTime) <= now);
      if (hasExpired) {
        refreshEvents();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [activeEvents, refreshEvents]);

  // When edit mode changes or user logs in, refresh full event datasets
  useEffect(() => {
    if (isEditMode) {
      refreshEvents();
    }
  }, [isEditMode, refreshEvents]);

  // Update position locally during drag
  const updateLocationPosition = useCallback((id: string, lat: number, lon: number) => {
    const roundedLat = Number(lat.toFixed(6));
    const roundedLon = Number(lon.toFixed(6));

    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id === id) {
          return {
            ...loc,
            latitude: roundedLat,
            longitude: roundedLon,
          };
        }
        return loc;
      })
    );

    setGates((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            latitude: roundedLat,
            longitude: roundedLon,
            coordinates: [roundedLon, roundedLat],
          };
        }
        return g;
      })
    );

    setSelectedLocation((prev) => {
      if (prev && prev.id === id) {
        return {
          ...prev,
          latitude: roundedLat,
          longitude: roundedLon,
        };
      }
      return prev;
    });
  }, []);

  // Save location to SQLite and sync state
  const saveLocationRecord = useCallback(async (locData: Partial<AdminLocation>): Promise<AdminLocation> => {
    setSaveStatus('saving');
    setSaveErrorMessage(null);
    try {
      const saved = await api.saveLocation(locData);
      setLocations((prev) => {
        const idx = prev.findIndex((l) => l.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [...prev, saved];
      });
      setSelectedLocation(saved);

      // If location is also a gate, keep campus_gates synced
      if (saved.id.startsWith('GATE_') || saved.category === 'Campus Gates' || saved.category === 'gate') {
        try {
          const savedGate = await api.saveGate({
            id: saved.id,
            name: saved.name,
            latitude: saved.latitude,
            longitude: saved.longitude,
            coordinates: [saved.longitude, saved.latitude],
          });
          setGates((prev) => {
            const idx = prev.findIndex((g) => g.id === savedGate.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedGate;
              return copy;
            }
            return [...prev, savedGate];
          });
        } catch (gateErr) {
          console.warn('Could not sync gate from location save:', gateErr);
        }
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);

      // Refresh history in background
      api.fetchHistory().then(setHistory).catch(console.warn);
      return saved;
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage(err.message || 'Error saving location.');
      throw err;
    }
  }, []);

  // Delete location from SQLite
  const deleteLocationRecord = useCallback(async (id: string): Promise<boolean> => {
    setSaveStatus('saving');
    try {
      const success = await api.deleteLocation(id);
      if (success) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
        setEntrances((prev) => prev.filter((e) => e.buildingId !== id));
        setRelationships((prev) => prev.filter((r) => r.buildingId !== id));
        if (selectedLocation?.id === id) {
          setSelectedLocation(null);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
        api.fetchHistory().then(setHistory).catch(console.warn);
      }
      return success;
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage(err.message || 'Error deleting location.');
      throw err;
    }
  }, [selectedLocation]);

  // Entrance actions
  const saveEntranceRecord = useCallback(async (entData: Partial<BuildingEntrance>): Promise<BuildingEntrance> => {
    setSaveStatus('saving');
    try {
      const saved = await api.saveEntrance(entData);
      setEntrances((prev) => {
        let updated = prev.filter((e) => e.id !== saved.id);
        if (saved.isPreferred) {
          updated = updated.map((e) =>
            e.buildingId === saved.buildingId ? { ...e, isPreferred: false } : e
          );
        }
        return [...updated, saved];
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
      api.fetchHistory().then(setHistory).catch(console.warn);
      return saved;
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage(err.message || 'Error saving entrance.');
      throw err;
    }
  }, []);

  const deleteEntranceRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await api.deleteEntrance(id);
      if (success) {
        setEntrances((prev) => prev.filter((e) => e.id !== id));
        api.fetchHistory().then(setHistory).catch(console.warn);
      }
      return success;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  }, []);

  // Gate actions
  const saveGateRecord = useCallback(async (gateData: Partial<CampusGateItem>): Promise<CampusGateItem> => {
    setSaveStatus('saving');
    try {
      const saved = await api.saveGate(gateData);
      setGates((prev) => {
        const idx = prev.findIndex((g) => g.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [...prev, saved];
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
      api.fetchHistory().then(setHistory).catch(console.warn);
      return saved;
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage(err.message || 'Error saving gate.');
      throw err;
    }
  }, []);

  const deleteGateRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await api.deleteGate(id);
      if (success) {
        setGates((prev) => prev.filter((g) => g.id !== id));
        api.fetchHistory().then(setHistory).catch(console.warn);
      }
      return success;
    } catch (err) {
      return false;
    }
  }, []);

  // Relationship actions
  const saveRelationshipRecord = useCallback(async (relData: Partial<BuildingGateRelationship>): Promise<any> => {
    try {
      const saved = await api.saveRelationship(relData);
      if (saved) {
        setRelationships((prev) => {
          const filtered = prev.filter((r) => r.buildingId !== saved.building_id);
          return [
            ...filtered,
            {
              id: saved.id,
              buildingId: saved.building_id,
              preferredGateId: saved.preferred_gate_id,
              preferredEntranceId: saved.preferred_entrance_id,
              approachNotes: saved.approach_notes,
              updatedAt: saved.updated_at,
            },
          ];
        });
      }
      return saved;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  // Undo / Redo
  const undoAction = useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.undoLastAction();
      if (res.success) {
        await refreshAllData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [refreshAllData]);

  const redoAction = useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.redoLastAction();
      if (res.success) {
        await refreshAllData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [refreshAllData]);

  // Helpers
  const getEntrancesForBuilding = useCallback(
    (buildingId: string) => entrances.filter((e) => e.buildingId === buildingId),
    [entrances]
  );

  const getPreferredEntranceForBuilding = useCallback(
    (buildingId: string) => entrances.find((e) => e.buildingId === buildingId && e.isPreferred) || null,
    [entrances]
  );

  const getPreferredGateForBuilding = useCallback(
    (buildingId: string) => {
      const rel = relationships.find((r) => r.buildingId === buildingId);
      if (rel) {
        return gates.find((g) => g.id === rel.preferredGateId) || null;
      }
      return null;
    },
    [relationships, gates]
  );

  // Temporary Event Location Operations
  const saveEventRecord = useCallback(
    async (evtData: Partial<EventLocation>): Promise<EventLocation> => {
      setSaveStatus('saving');
      setSaveErrorMessage(null);
      try {
        const saved = await api.saveEventLocation(evtData);
        await refreshEvents();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return saved;
      } catch (e: any) {
        setSaveStatus('error');
        setSaveErrorMessage(e.message || 'Failed to save event location');
        throw e;
      }
    },
    [refreshEvents]
  );

  const deleteEventRecord = useCallback(
    async (id: string): Promise<boolean> => {
      setSaveStatus('saving');
      setSaveErrorMessage(null);
      try {
        const ok = await api.deleteEventLocation(id);
        await refreshEvents();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return ok;
      } catch (e: any) {
        setSaveStatus('error');
        setSaveErrorMessage(e.message || 'Failed to delete event location');
        return false;
      }
    },
    [refreshEvents]
  );

  const restoreEventRecord = useCallback(
    async (id: string, newEndTime?: string): Promise<EventLocation | null> => {
      setSaveStatus('saving');
      setSaveErrorMessage(null);
      try {
        const restored = await api.restoreEventLocation(id, newEndTime);
        await refreshEvents();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return restored;
      } catch (e: any) {
        setSaveStatus('error');
        setSaveErrorMessage(e.message || 'Failed to restore event');
        return null;
      }
    },
    [refreshEvents]
  );

  // Bridges for standard non-admin UI components (BuildingDirectory, SearchModal, RoutePanel, etc.)
  const buildings: Building[] = useMemo(() => {
    const regularBuildings = locations.map((loc) => {
      const blockNum = loc.id
        .replace('BLOCK_', '')
        .replace('BH_', '')
        .replace('GH_', '')
        .replace('BS_', '')
        .replace('GS_', '');
      return {
        id: loc.id,
        name: loc.exactName || loc.name,
        block_number: blockNum,
        category: loc.category,
        subcategory: loc.subcategory,
        description: loc.description || loc.notes || `${loc.name} at Lovely Professional University.`,
        floors: 4,
        osm_way_id: null,
        coordinates: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
        campus_zone: loc.geographicalArea || 'LPU Campus',
        primary_occupants: [loc.subcategory || loc.category || loc.name],
        indoor_mapping_status: 'requires_manual_mapping',
        source: 'Google Maps & Admin Map Editor Ground Truth',
        verificationStatus: (loc.verificationStatus as any) || 'GOOGLE_MAPS_VERIFIED',
      };
    });

    const eventBuildings: Building[] = activeEvents.map((evt) => ({
      id: evt.id,
      name: `${evt.eventName} (${evt.locationName})`,
      block_number: 'Event',
      category: 'Campus Event',
      subcategory: evt.eventName,
      description: `🎉 ${evt.eventName} at ${evt.locationName}. Active from ${new Date(evt.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} until ${new Date(evt.endTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. ${evt.description || ''}`,
      floors: 1,
      osm_way_id: null,
      coordinates: {
        latitude: evt.latitude,
        longitude: evt.longitude,
      },
      campus_zone: 'LPU Campus (Event Venue)',
      primary_occupants: [evt.eventName],
      indoor_mapping_status: 'requires_manual_mapping',
      source: 'Admin Live Campus Event',
      verificationStatus: 'ADMIN_VERIFIED',
    }));

    return [...eventBuildings, ...regularBuildings];
  }, [locations, activeEvents]);

  const campusGatesList: CampusGate[] = useMemo(() => {
    return gates.map((g) => ({
      id: g.id,
      name: g.name,
      coordinates: [g.longitude, g.latitude],
      type: g.gateType || 'entrance_gate',
      description: g.description || `${g.name} entrance into Lovely Professional University.`,
      source: 'Verified Gate Ground Truth',
    }));
  }, [gates]);

  const campusMasterInventory: CampusPlace[] = useMemo(() => {
    const regularPlaces = locations.map((loc) => ({
      id: loc.id,
      name: loc.exactName || loc.name,
      category: loc.category,
      subcategory: loc.subcategory || '',
      googlePlaceId: null,
      latitude: loc.latitude,
      longitude: loc.longitude,
      formattedAddress: `${loc.name}, Lovely Professional University, Phagwara, Punjab 144411, India`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`,
      geometryType: 'point_marker' as const,
      geometrySource: 'Admin Verified Ground Truth',
      verificationStatus: (loc.verificationStatus as any) || 'GOOGLE_MAPS_VERIFIED',
      sourceReferences: ['Admin Map Editor Live Record'],
      notes: loc.description || loc.notes || '',
      blockNumber: loc.id.replace('BLOCK_', ''),
    }));

    const eventPlaces: CampusPlace[] = activeEvents.map((evt) => ({
      id: evt.id,
      name: `${evt.eventName} • ${evt.locationName}`,
      category: 'Campus Event',
      subcategory: evt.eventName,
      googlePlaceId: null,
      latitude: evt.latitude,
      longitude: evt.longitude,
      formattedAddress: `${evt.eventName} at ${evt.locationName}, LPU Campus`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${evt.latitude},${evt.longitude}`,
      geometryType: 'point_marker' as const,
      geometrySource: 'Admin Temporary Event Location',
      verificationStatus: 'ADMIN_VERIFIED',
      sourceReferences: [`Event: ${evt.eventName}`, `Venue: ${evt.locationName}`, `Until: ${evt.endTime}`],
      notes: `🎉 Active Campus Event: ${evt.eventName}. Venue: ${evt.locationName}. Active until ${new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${evt.description || ''}`,
      blockNumber: 'Event',
    }));

    return [...eventPlaces, ...regularPlaces];
  }, [locations, activeEvents]);

  return (
    <CampusDataContext.Provider
      value={{
        locations,
        entrances,
        gates,
        relationships,
        selectedLocation,
        isEditMode,
        currentTool,
        history,
        isLoading,
        saveStatus,
        saveErrorMessage,

        setIsEditMode,
        setCurrentTool,
        setSelectedLocation,
        updateLocationPosition,
        saveLocationRecord,
        deleteLocationRecord,
        saveEntranceRecord,
        deleteEntranceRecord,
        saveGateRecord,
        deleteGateRecord,
        saveRelationshipRecord,
        undoAction,
        redoAction,
        refreshAllData,

        getEntrancesForBuilding,
        getPreferredEntranceForBuilding,
        getPreferredGateForBuilding,

        activeEvents,
        allEvents,
        eventHistory,
        saveEventRecord,
        deleteEventRecord,
        restoreEventRecord,
        refreshEvents,

        buildings,
        campusGates: campusGatesList,
        campusMasterInventory,
      }}
    >
      {children}
    </CampusDataContext.Provider>
  );
};

export function useCampusData() {
  const context = useContext(CampusDataContext);
  if (!context) {
    throw new Error('useCampusData must be used within a CampusDataProvider');
  }
  return context;
}
