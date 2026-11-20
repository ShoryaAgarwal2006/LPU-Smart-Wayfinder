# LPU SMART WAYFINDER — MISSING DATA REPORT & INDOOR ARCHITECTURAL AUDIT

**Project:** LPU Smart Wayfinder  
**Institution:** Lovely Professional University, Phagwara, Punjab, India  
**Date of Audit:** November 2026  
**Document Status:** Complete Pre-Development Data Audit (Phase 3 Deliverable)

---

## 1. Executive Summary

This report provides an exhaustive, forensic assessment of geospatial and architectural data availability for the **LPU Smart Wayfinder** project. 

### Key Findings:
1. **Outdoor Geospatial Coverage (Strong):** 
   * High-confidence outer perimeter boundary (`Relation 21599790`).
   * 136 building footprints digitized in OpenStreetMap.
   * 133 pedestrian walkway and road network segments digitized.
   * Key campus gates (Gate 1, Gate 2, Gate 3, Gate 4, Law Gate) verified with coordinates.
2. **Outdoor Semantic Attribution (Moderate Gap):**
   * While 136 building physical footprints exist in OSM, only 3 have explicit historical university department names tagged directly in OSM tags (`Lovely Institute Of Management`, `Lovely Institute of Technology`, `Lovely Institute of Pharmacy`, plus `School of Design`). 
   * 133 building polygons lack direct block number tags in the raw OSM database and had to be cross-referenced with campus guides.
3. **Indoor Architectural Layouts (Critical Gap — 100% Publicly Unavailable):**
   * **Zero verified CAD blueprints or high-fidelity architectural floor plans are publicly available** for any of the 43 identified campus blocks.
   * University architectural drawings are classified as restricted institutional assets by the LPU Division of Campus Development and Fire Safety for student safety, building security, and regulatory compliance.
   * **Strict Compliance Rule:** In accordance with academic integrity requirements, **zero fictional layouts have been invented**. Every single building and floor is explicitly cataloged as requiring manual on-site mapping or official administrative acquisition.

---

## 2. Comprehensive Building & Floor Missing Data Audit

The table below catalogs every identified building across Lovely Professional University, detailing the total floors, the specific floors lacking accurate layouts, the current mapping status, and priority tier for on-site data acquisition.

| Building ID | Block Number | Building Name / School | Floors | Floors Missing Accurate Layouts | Indoor Data Status | Priority |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **BLOCK_01** | Block 1 | Administrative & Founding Block | 5 | Ground, Floor 1, Floor 2, Floor 3, Floor 4 | Requires Manual Mapping | **Critical** |
| **BLOCK_02** | Block 2 | Campus Café & Student Hub | 5 | Ground, Floor 1, Floor 2, Floor 3, Floor 4 | Requires Manual Mapping | Standard |
| **BLOCK_03** | Block 3 | University Health Care Centre & Pharmacy | 5 | Ground, Floor 1, Floor 2, Floor 3, Floor 4 | Requires Manual Mapping | **High** |
| **BLOCK_04** | Block 4 | Academic Lecture Block | 5 | Ground, Floor 1, Floor 2, Floor 3, Floor 4 | Requires Manual Mapping | Standard |
| **BLOCK_13** | Block 13 | Division of Student Welfare (DSW) | 6 | Ground, Floor 1, Floor 2, Floor 3, Floor 4, Floor 5 | Requires Manual Mapping | **Critical** |
| **BLOCK_14** | Block 14 | Student Activity Centre | 6 | Ground, Floor 1, Floor 2, Floor 3, Floor 4, Floor 5 | Requires Manual Mapping | Standard |
| **BLOCK_15** | Block 15 | Uni-Mall (Shopping & Banking Complex) | 4 | Ground, Floor 1, Floor 2, Floor 3 | Requires Manual Mapping | **Critical** |
| **BLOCK_19** | Block 19 | Lecture Hall & Science Block (LHSB) | 6 | Ground, Floor 1, Floor 2, Floor 3, Floor 4, Floor 5 | Requires Manual Mapping | Standard |
| **BLOCK_25** | Block 25 | Academic Block | 8 | Ground, Floor 1 to Floor 7 | Requires Manual Mapping | Standard |
| **BLOCK_26** | Block 26 | Academic Block | 8 | Ground, Floor 1 to Floor 7 | Requires Manual Mapping | Standard |
| **BLOCK_27** | Block 27 | Academic Block (Humanities & Languages) | 8 | Ground, Floor 1 to Floor 7 | Requires Manual Mapping | Standard |
| **BLOCK_28** | Block 28 | Academic Block | 8 | Ground, Floor 1 to Floor 7 | Requires Manual Mapping | Standard |
| **BLOCK_29** | Block 29 | Examination & Records Division | 8 | Ground, Floor 1 to Floor 7 | Requires Manual Mapping | **Critical** |
| **BLOCK_30** | Block 30 | Academic & Administrative Block | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | Standard |
| **BLOCK_31** | Block 31 | Academic Block & Seminar Complex | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | Standard |
| **BLOCK_32** | Block 32 | Mittal School of Business (MSB) | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **Critical** |
| **BLOCK_33** | Block 33 | Computer Science IT Labs | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | Standard |
| **BLOCK_34** | Block 34 | School of Computer Science & Engineering | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **Critical** |
| **BLOCK_35** | Block 35 | Shanti Devi Mittal Auditorium | 4 | Ground, Mezzanine, Balcony, Stage Wing | Requires Manual Mapping | **High** |
| **BLOCK_36** | Block 36 | School of Electronics & Electrical Eng. | 7 | Ground, Floor 1 to Floor 6 | Requires Manual Mapping | **High** |
| **BLOCK_37** | Block 37 | Central Library | 6 | Ground, Floor 1 to Floor 5 | Requires Manual Mapping | **Critical** |
| **BLOCK_38** | Block 38 | Computer Applications & Innovation Hub | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **Critical** |
| **BLOCK_55** | Block 55 | School of Mechanical & Aerospace Eng. | 6 | Ground, Floor 1 to Floor 5 | Requires Manual Mapping | **High** |
| **BLOCK_56** | Block 56 | School of Civil Engineering | 6 | Ground, Floor 1 to Floor 5 | Requires Manual Mapping | **High** |
| **BLOCK_57** | Block 57 | Lovely Polytechnic & Vocational Wing | 5 | Ground, Floor 1 to Floor 4 | Requires Manual Mapping | Standard |
| **BLOCK_58** | Block 58 | School of Agriculture & Bio-Sciences | 6 | Ground, Floor 1 to Floor 5 | Requires Manual Mapping | Standard |
| **BLOCK_DESIGN** | Design | School of Design & Fashion Technology | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **High** |
| **UNIPOLIS** | Unipolis | Baldev Raj Mittal Unipolis Arena | 2 | Ground Arena Floor, Upper Concourse | Requires Manual Mapping | **High** |
| **SPORTS_COMPLEX**| Sports | Indoor Sports Complex & Swimming Pool | 3 | Pool Level, Arena Level, Gym Gallery | Requires Manual Mapping | **High** |
| **BH_01** | BH-1 | Boys Hostel 1 | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **High** |
| **BH_02** | BH-2 | Boys Hostel 2 | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **High** |
| **BH_03** | BH-3 | Boys Hostel 3 (Wings A, B, C, D) | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **High** |
| **BH_04** | BH-4 | Boys Hostel 4 (Wings A, B, C, D, E) | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **High** |
| **BH_05** | BH-5 | Boys Hostel 5 (Wings A, B, C) | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | Standard |
| **BH_06** | BH-6 | Boys Hostel 6 (Wings A, B, C) | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | Standard |
| **BH_07** | BH-7 | Boys Hostel 7 | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | Standard |
| **BH_08** | BH-8 | Boys Hostel 8 | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | Standard |
| **GH_01** | GH-1 | Girls Hostel 1 | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **High** |
| **GH_02** | GH-2 | Girls Hostel 2 | 10 | Ground, Floor 1 to Floor 9 | Requires Manual Mapping | **High** |
| **GH_03** | GH-3 | Girls Hostel 3 | 9 | Ground, Floor 1 to Floor 8 | Requires Manual Mapping | Standard |
| **GH_04** | GH-4 | Girls Hostel 4 | 9 | Ground, Floor 1 to Floor 8 | Requires Manual Mapping | Standard |
| **GH_05** | GH-5 | Girls Hostel 5 | 9 | Ground, Floor 1 to Floor 8 | Requires Manual Mapping | Standard |
| **GH_06** | GH-6 | Girls Hostel 6 | 9 | Ground, Floor 1 to Floor 8 | Requires Manual Mapping | Standard |

---

## 3. Specific Indoor Data Elements Completely Missing

To create a functional indoor wayfinding engine, the navigation graph requires granular geometric features that are currently absent from all public sources:

```
[Missing Indoor Data Layers]
 ├── 1. Physical Boundaries
 │    ├── Room Polygons (Classrooms, Tutorial Halls, Labs)
 │    ├── Faculty Cabins & Administrative Desks
 │    └── Restrooms & Utility Closets
 ├── 2. Indoor Routing Graph
 │    ├── Walkable Corridor Centerlines & Widths
 │    ├── Door Entry Nodes (Coordinates & Clearances)
 │    └── Skywalk Connectors between adjacent blocks
 ├── 3. Vertical Circulation (Multi-Level Transitions)
 │    ├── Staircase Landings, Riser counts, & Flight direction
 │    ├── Elevator Bank coordinates & door thresholds
 │    └── Universal Accessibility Ramps (Slope angles & landings)
 ├── 4. Life Safety & Emergency Points
 │    ├── Emergency Fire Exits & Egress Discharge Doors
 │    ├── Fire Extinguisher & Hose Reel locations
 │    └── First Aid & Assembly Points
 └── 5. Indoor Localization Signals
      ├── Wi-Fi AP BSSID Signal Fingerprint Maps
      └── BLE Beacon Deployment Coordinates
```

---

## 4. Outdoor Data Gaps & Ambiguities

While outdoor OpenStreetMap data is substantial, the following specific outdoor gaps require on-site ground-truthing:

1. **Building Footprint Tag Attribution:**
   * OSM contains 136 building polygons inside the LPU boundary, but only 3 are tagged with institutional names. The remaining 133 polygons possess only geometric boundaries and `building:levels` tags. Precise matching of OSM polygon IDs to university block numbers (e.g. confirming whether polygon `422437906` is exactly Block 34 vs 33) requires physical on-site sign verification.
2. **Elevated Skywalk Connectors:**
   * LPU has several elevated enclosed skywalk corridors connecting adjacent academic blocks (e.g., between Blocks 32, 33, 34, 38). These elevated links are not fully represented in 2D OSM polylines and need explicit multi-level connectivity modeling.
3. **Turnstiles and Sub-Gates:**
   * Internal security turnstiles separating the boys' hostel zones, girls' hostel zones, and academic areas require exact gate coordinates and access-hour restrictions.
4. **Recent Infrastructure Developments:**
   * Due to rapid campus expansion, newer structures (such as newly paved walkways, electric shuttle charging docks, and temporary pavilion setups) may not be mirrored in the latest OpenStreetMap base tile.

---

## 5. Information Required From Lovely Professional University

To transition from Phase 1/2 research to an operational navigation application without fabricating data, the following institutional assets must be formally requested from Lovely Professional University:

### 5.1 Primary Assets (From Division of Campus Development / Civil Engineering)
1. **Architectural CAD Floor Plans:**
   * 2D vector CAD drawings (`.dwg`, `.dxf`) or BIM models (`.ifc`, Revit) for the 8 **Critical Tier** blocks:
     * Block 34 (School of CSE)
     * Block 37 (Central Library)
     * Block 32 (Mittal School of Business)
     * Block 38 (Computer Applications & Incubation)
     * Block 15 (Uni-Mall)
     * Block 1 (Administration)
     * Block 13 (Division of Student Welfare)
     * Block 29 (Examination Division)
2. **Fire Evacuation Vector Maps:**
   * Official emergency egress and fire escape diagrams indicating confirmed exit doors, staircase designations, and assembly zones.
3. **Master Campus Masterplan DXF:**
   * Up-to-date georeferenced CAD master layout showing exact block boundaries, road centerlines, and gate classifications.

### 5.2 Secondary Assets (From Division of Information Technology / UMS Team)
1. **Official Room & Venue Directory:**
   * Authoritative tabular mapping of `Room Number -> Block Number -> Floor -> Facility Type -> Department / Occupant`.
2. **Wi-Fi AP Infrastructure Database:**
   * List of campus Wi-Fi Access Point MAC addresses (BSSID) with corresponding floor and block locations, enabling 802.11-based indoor triangulation and Positioning Services (IPS).
3. **Accessibility Audit Data:**
   * Verified directory of operational elevators, wheelchair ramps, accessible restrooms, and tactile paving paths for Divyangjan / differently-abled students.

---

## 6. Recommended Interim Methodology for Project Progression

Since obtaining university-wide CAD clearance can be subject to administrative delays, the project should proceed through a phased pilot approach:

* **Step 1 — Outdoor Baseline (Completed):** Use `lpu_outdoor.geojson` and `buildings.json` for all outdoor navigation, perimeter routing, gate-to-gate directions, and outdoor POI searches.
* **Step 2 — Pilot Indoor Block Mapping (Targeted Ground-Truth):** Select **Block 34 (School of CSE)** or **Block 37 (Central Library)** as a single pilot building. Carry out a physical on-site survey using mobile LiDAR/SLAM or manual distance measurement to produce an authentic, georeferenced pilot floor plan.
* **Step 3 — Formal LPU Administrative Partnership:** Present the working prototype of the outdoor engine and Block 34 pilot to university authorities to request access to official digital CAD drawings for remaining blocks.
