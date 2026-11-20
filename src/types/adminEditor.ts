export interface AdminLocation {
  id: string;
  name: string;
  exactName: string;
  category: string;
  subcategory?: string;
  latitude: number;
  longitude: number;
  description?: string;
  notes?: string;
  verificationStatus: string;
  geographicalArea?: string;
  nearbyLandmarks?: string[];
  isInsideCampus: boolean;
  updatedAt?: string;
}

export type EntranceType = 'main' | 'side' | 'service' | 'accessible' | 'emergency';

export interface BuildingEntrance {
  id: string;
  buildingId: string;
  name: string;
  entranceType: EntranceType;
  latitude: number;
  longitude: number;
  isPreferred: boolean;
  isRestricted: boolean;
  isAvailable: boolean;
  description?: string;
  updatedAt?: string;
}

export type GateAccessType = 'both' | 'pedestrian' | 'vehicle';
export type GateDirectionType = 'entry_exit' | 'entry_only' | 'exit_only';

export interface CampusGateItem {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  coordinates: [number, number]; // [lon, lat]
  gateType: GateDirectionType;
  accessType: GateAccessType;
  description?: string;
  updatedAt?: string;
}

export interface BuildingGateRelationship {
  id: string;
  buildingId: string;
  preferredGateId: string;
  preferredEntranceId?: string;
  approachNotes?: string;
  updatedAt?: string;
}

export interface EventLocation {
  id: string;
  eventName: string;
  locationName: string;
  name?: string;
  category: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  description?: string;
  status?: 'active' | 'expired' | 'archived';
  isActive?: boolean;
  isExpired?: boolean;
  createdAt?: string;
  updatedAt?: string;
  editorName?: string;
}

export interface AuditLogEntry {
  id: number;
  action_type: string;
  entity_id: string;
  entity_type: string;
  previous_data: string | null;
  new_data: string | null;
  editor_name: string;
  timestamp: string;
  undone: number;
}

export type EditorTool = 'select' | 'move' | 'add_location' | 'add_entrance' | 'manage_gates';

export interface AdminSession {
  isAuthenticated: boolean;
  token: string | null;
  editorName: string;
  role: string;
}

export const CAMPUS_CATEGORIES = [
  'Academic Blocks',
  'Boys Hostels',
  'Girls Hostels',
  'Boys Studios',
  'Girls Studios',
  'Student Apartments',
  'Staff Apartments',
  'Parks & Gardens',
  'Food Courts & Dining',
  'Restaurant / Cafeteria',
  'Medical Facilities',
  'Library',
  'Sports & Arenas',
  'Sports Facility',
  'Auditorium',
  'Administrative Building',
  'Commercial & Retail',
  'Campus Gates',
  'Campus-Adjacent Commercial',
  'Campus-Adjacent Dining',
  'Campus-Adjacent Housing',
  'Other Landmark',
] as const;
