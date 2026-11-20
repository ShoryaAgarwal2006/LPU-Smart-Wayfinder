# LPU SMART WAYFINDER — RECONCILED CAMPUS DATA AUDIT & LOCATION INVENTORY

**Project:** LPU Smart Wayfinder  
**Audit Version:** Phase 4.2 Reconciled  
**Audited Datasets:** `lpu_outdoor.geojson` (366 features), `buildings.json` (43 buildings), `indoor_buildings.json` (43 buildings), `src/data/locationNameOverrides.json` (67 provenance overrides).

---

## 1. Summary Metrics & Provenance Breakdown

- **Total Mapped Spatial Features:** 366 features in `lpu_outdoor.geojson`.
- **Total Campus Buildings Audited:** 43 buildings in `buildings.json`.
  - **Direct Mapped Polygon Footprints:** 28 buildings with explicit `osm_way_id`.
  - **Representative Campus Grid Points:** 15 buildings (`osm_way_id: null`) representing continuous spinal megastructures or unsegmented facilities.
- **Location Override Registry Entries:** 67 entries in `src/data/locationNameOverrides.json`.
  - **Institutionally Verified (`institution_verified`):** 49 entries (supported by LPU statutory acts, official directories, administrative manuals, and hospital/residential records).
  - **OSM Tag Verified (`osm_verified`):** 16 entries (presence physically confirmed via OpenStreetMap tags like `sport=*`, `amenity=*`, `aeroway=*`, or auxiliary boundary access points).
  - **Descriptive Only (`descriptive_only`):** 2 entries (unnamed restaurant polygon `way/1550425052` and unverified retail plaza `way/422820536`).
- **Duplicate Features Identified for Display Suppression:** 2 instances (`way/422437886`, `way/482133790`) suppressed from display layer to prevent SVG artifacting while keeping raw GeoJSON intact.

---

## 2. Reconciled Food & Commercial Facilities

| Feature ID | Raw OSM Tags | Reconciled Display Name | Category | Provenance Status | Architectural Footprint | Entrance Status | Verification Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `way/1550425052` | `amenity=restaurant`, `building=yes` | **Unverified Food Facility (OSM Restaurant Building)** | Indoor Restaurant | `descriptive_only` | Mapped Footprint (`way/1550425052`) | Perimeter Walkway Snap (~15m) | OSM physically tags the building as a restaurant. No official university dining hall name or vendor operator is recorded in institutional gazetteers. Descriptive label applied; not claimed as institutionally verified. |
| `way/422820536` | `landuse=retail` | **Unverified Retail Plaza / Commercial Kiosks (Near Uni-Mall)** | Commercial & Utility Plaza | `descriptive_only` | Amenity Area (`way/422820536`) | Perimeter Walkway Snap (~20m) | Open-air commercial space adjacent to Uni-Mall. OSM tag is strictly `landuse=retail` with no name or food amenity tags. Previous speculative "food plaza" label replaced with honest descriptive retail plaza. |
| `way/422437885` | `building=yes`, `levels=10` | **Block 15 (Uni-Mall Commercial Complex)** | Commercial & Utility | `institution_verified` | Mapped Footprint (`way/422437885`) | Perimeter Walkway Snap (~18m) | Central commercial hub verified in university directory; houses licensed banks, departmental stores, brand food courts, and post office. |
| `BLOCK_02` | *None in OSM* | **Block 2 (Campus Café & Student Hub)** | Café & Student Hub | `institution_verified` | Representative Grid Coordinate | Approximate (~22m snap) | Institutional records confirm Block 2 houses student dining, canteens, and activity halls. Represented as a grid reference because its continuous physical structure is not segmented in OpenStreetMap. |

---

## 3. Separation of OSM-Verified vs. Institutionally-Verified Facilities

Features identified solely from OpenStreetMap physical tags are strictly designated as `osm_verified` with descriptive naming, and are never presented as institutionally verified:

| Feature ID | OSM Tag Specification | Standardized Display Name | Provenance Status | Confidence | Cartographic & Wayfinding Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `way/422577269` | `leisure=pitch`, `sport=cricket` | **Cricket Ground & Pitch (Sports Ground)** | `osm_verified` | High | Cricket pitch presence verified via OSM survey. Official ground nomenclature unrecorded in public directory. |
| `way/422551912` | `leisure=pitch`, `sport=basketball` | **Outdoor Basketball Court 1** | `osm_verified` | High | Court presence verified via OSM. Index "1" is a descriptive spatial identifier based on relative position. |
| `way/422551913` | `leisure=pitch`, `sport=basketball` | **Outdoor Basketball Court 2** | `osm_verified` | High | Court presence verified via OSM. Index "2" is a descriptive spatial identifier. |
| `way/422551914` | `leisure=pitch`, `sport=basketball` | **Outdoor Basketball Court 3** | `osm_verified` | High | Court presence verified via OSM. Index "3" is a descriptive spatial identifier. |
| `way/422820541` | `leisure=pitch`, `sport=basketball` | **Outdoor Basketball Court 4** | `osm_verified` | High | Court presence verified via OSM. Index "4" is a descriptive spatial identifier. |
| `way/422551915` | `leisure=pitch`, `sport=beachvolleyball` | **Beach Volleyball Court 1** | `osm_verified` | High | Court presence verified via OSM. Index "1" is a descriptive spatial identifier. |
| `way/422551916` | `leisure=pitch`, `sport=beachvolleyball` | **Beach Volleyball Court 2** | `osm_verified` | High | Court presence verified via OSM. Index "2" is a descriptive spatial identifier. |
| `way/422551917` | `leisure=pitch`, `sport=volleyball`, `name=voll` | **Outdoor Volleyball Court** | `osm_verified` | High | Obvious typo tag `name=voll` corrected to standardized descriptive name. |
| `way/422551918` | `leisure=pitch`, `sport=tennis` | **Outdoor Tennis Court 1** | `osm_verified` | High | Court presence verified via OSM. Index "1" is a descriptive spatial identifier. |
| `way/422551919` | `leisure=pitch`, `sport=tennis` | **Outdoor Tennis Court 2** | `osm_verified` | High | Court presence verified via OSM. Index "2" is a descriptive spatial identifier. |
| `way/422551920` | `leisure=pitch`, `sport=tennis` | **Outdoor Tennis Court 3** | `osm_verified` | High | Court presence verified via OSM. Index "3" is a descriptive spatial identifier. |
| `way/422551922` | `leisure=pitch`, `sport=tennis` | **Outdoor Tennis Court 4** | `osm_verified` | High | Court presence verified via OSM. Index "4" is a descriptive spatial identifier. |
| `way/422738886` | `leisure=pitch` | **Outdoor Sports Field A** | `osm_verified` | Medium | Unspecified sports pitch in OSM. Letter "A" is a descriptive identifier. |
| `way/422738887` | `leisure=pitch` | **Outdoor Sports Field B** | `osm_verified` | Medium | Unspecified sports pitch in OSM. Letter "B" is a descriptive identifier. |
| `way/1550425053` | `aeroway=helipad` | **Campus Helipad (VVIP Aviation Landing)** | `osm_verified` | High | Tarmac helipad confirmed in OSM. Descriptive title applied for aerial transit. |
| `poi/green_valley_gate` | *Perimeter Access Path* | **Green Valley Gate (Southwest Boundary)** | `osm_verified` | High | Unnumbered auxiliary boundary gate documented in OpenStreetMap survey. |

---

## 4. Discrete Documentation of All 14 Student Hostels

Every hostel has an individual building ID, an assigned official hostel number, a verified storey count, and an independent physical polygon footprint in OpenStreetMap (`osm_way_id`):

| Hostel ID | Block / Code | Official Hostel Name | Assigned OSM Way ID | Storeys | Physical Wings | Sector / Zone | Provenance Source | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BH_01` | `BH-1` | **Boys Hostel 1 (BH-1)** | `way/422437894` | 10 Floors | Single Residential Tower | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `BH_02` | `BH-2` | **Boys Hostel 2 (BH-2)** | `way/422437895` | 10 Floors | Single Residential Tower | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `BH_03` | `BH-3` | **Boys Hostel 3 (BH-3, Wings A, B, C, D)** | `way/422437896` | 10 Floors | Wings A, B, C, D | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `BH_04` | `BH-4` | **Boys Hostel 4 (BH-4, Wings A, B, C, D, E)** | `way/422437897` | 10 Floors | Wings A, B, C, D, E | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `BH_05` | `BH-5` | **Boys Hostel 5 (BH-5, Wings A, B, C)** | `way/422547444` | 10 Floors | Wings A, B, C | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `BH_06` | `BH-6` | **Boys Hostel 6 (BH-6, Wings A, B, C)** | `way/422547445` | 10 Floors | Wings A, B, C | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `BH_07` | `BH-7` | **Boys Hostel 7 (BH-7)** | `way/422547446` | 10 Floors | Single Residential Tower | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `BH_08` | `BH-8` | **Boys Hostel 8 (BH-8)** | `way/422547447` | 10 Floors | Single Residential Tower | Western Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `GH_01` | `GH-1` | **Girls Hostel 1 (GH-1)** | `way/422437887` | 11 Floors | High-Rise Residence | Central-Eastern Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `GH_02` | `GH-2` | **Girls Hostel 2 (GH-2)** | `way/422437888` | 10 Floors | High-Rise Residence | Central-Eastern Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `GH_03` | `GH-3` | **Girls Hostel 3 (GH-3)** | `way/422547448` | 9 Floors | High-Rise Residence | Eastern Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `GH_04` | `GH-4` | **Girls Hostel 4 (GH-4)** | `way/422547449` | 9 Floors | High-Rise Residence | Eastern Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `GH_05` | `GH-5` | **Girls Hostel 5 (GH-5)** | `way/422547450` | 9 Floors | High-Rise Residence | Eastern Residential Sector | LPU Residential Services Manual | `institution_verified` |
| `GH_06` | `GH-6` | **Girls Hostel 6 (GH-6)** | `way/422547451` | 9 Floors | High-Rise Residence | Eastern Residential Sector | LPU Residential Services Manual | `institution_verified` |

---

## 5. Explicit Distinction: 28 Mapped Footprints vs. 15 Grid Locations

To prevent misrepresenting representative reference coordinates as exact surveyed buildings or doorway entrances, the dataset strictly separates direct OSM polygon footprints from continuous spine grid nodes:

### 5.1 The 15 Representative Campus Grid Buildings (`osm_way_id: null`)

These 15 structures exist physically in institutional directories and timetables, but OpenStreetMap only digitized the shared outer envelope or continuous spinal megastructure without isolating individual block polygons. Representative centroid grid coordinates are assigned to enable wayfinding without fabricating fictitious geometries:

| Building ID | Block No. | Official Name | Representative Coordinates | Storeys | Snapping Offset to Walkway | Status & Geometry Nature |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BLOCK_02` | `2` | **Block 2 (Campus Café & Student Hub)** | `31.258000, 75.706500` | 4 Floors | ~24m snap offset | Representative Grid Reference &bull; Continuous Academic Spine |
| `BLOCK_04` | `4` | **Block 4 (Academic Lecture Block)** | `31.257000, 75.707500` | 4 Floors | ~18m snap offset | Representative Grid Reference &bull; Continuous Academic Spine |
| `BLOCK_13` | `13` | **Block 13 (Division of Student Welfare - DSW)** | `31.256000, 75.705500` | 5 Floors | ~21m snap offset | Representative Grid Reference &bull; Administration Wing |
| `BLOCK_14` | `14` | **Block 14 (Student Activity Centre)** | `31.255500, 75.705200` | 4 Floors | ~19m snap offset | Representative Grid Reference &bull; Student Facilities Wing |
| `BLOCK_19` | `19` | **Block 19 (Lecture Hall & Science Block - LHSB)** | `31.256200, 75.706200` | 6 Floors | ~22m snap offset | Representative Grid Reference &bull; Interconnected Lecture Spine |
| `BLOCK_26` | `26` | **Block 26 (Academic Block)** | `31.256800, 75.705000` | 8 Floors | ~20m snap offset | Representative Grid Reference &bull; Continuous Academic Spine |
| `BLOCK_27` | `27` | **Block 27 (Academic Block - Humanities & Languages)** | `31.256700, 75.704800` | 8 Floors | ~19m snap offset | Representative Grid Reference &bull; Continuous Academic Spine |
| `BLOCK_28` | `28` | **Block 28 (Academic Block)** | `31.256600, 75.704600` | 8 Floors | ~23m snap offset | Representative Grid Reference &bull; Continuous Academic Spine |
| `BLOCK_31` | `31` | **Block 31 (Academic Block & Seminar Complex)** | `31.257200, 75.705200` | 10 Floors | ~17m snap offset | Representative Grid Reference &bull; Continuous Academic Spine |
| `BLOCK_37` | `37` | **Block 37 (Central Library)** | `31.257500, 75.706800` | 6 Floors | ~26m snap offset | Representative Grid Reference &bull; Central Multi-Storey Library |
| `BLOCK_56` | `56` | **Block 56 (School of Civil Engineering)** | `31.256800, 75.708200` | 6 Floors | ~28m snap offset | Representative Grid Reference &bull; Engineering Complex Spine |
| `BLOCK_57` | `57` | **Block 57 (Lovely Polytechnic & Vocational Wing)** | `31.256500, 75.708400` | 5 Floors | ~25m snap offset | Representative Grid Reference &bull; Polytechnic Section |
| `BLOCK_58` | `58` | **Block 58 (School of Agriculture & Bio-Sciences)** | `31.256200, 75.708600` | 5 Floors | ~31m snap offset | Representative Grid Reference &bull; Agriculture Block & Farms |
| `UNIPOLIS` | `Unipolis` | **Baldev Raj Mittal Unipolis Arena** | `31.254000, 75.704000` | 2 Floors | ~34m snap offset | Representative Grid Reference &bull; Covered Mega-Amphitheatre |
| `SPORTS_COMPLEX`| `Sports` | **Shri Baldev Raj Mittal Indoor Sports Complex** | `31.253000, 75.705000` | 3 Floors | ~38m snap offset | Representative Grid Reference &bull; Indoor Stadium & Pool |

### 5.2 The 28 Directly Mapped Physical Footprints (`osm_way_id` present)

1. `BLOCK_01` (Admin & Founding Block) &bull; `way/354743583`
2. `BLOCK_03` (Health Care Centre & Pharmacy) &bull; `way/354830243`
3. `BLOCK_15` (Uni-Mall Commercial Complex) &bull; `way/422437885`
4. `BLOCK_25` (Academic Block) &bull; `way/422437899`
5. `BLOCK_29` (Examination Division & Student Services) &bull; `way/422437901`
6. `BLOCK_30` (Academic Block) &bull; `way/422437900`
7. `BLOCK_32` (Mittal School of Business - MSB) &bull; `way/422437904`
8. `BLOCK_33` (Computer Science IT Labs) &bull; `way/422437908`
9. `BLOCK_34` (School of Computer Science & Engineering - CSE) &bull; `way/422437906`
10. `BLOCK_35` (Shanti Devi Mittal Auditorium) &bull; `way/422437902`
11. `BLOCK_36` (School of Electronics & Electrical Engineering - SEEE) &bull; `way/354755644`
12. `BLOCK_38` (Computer Applications & AI Hub) &bull; `way/422437898`
13. `BLOCK_55` (School of Mechanical & Aerospace Engineering) &bull; `way/422437890`
14. `BLOCK_DESIGN` (School of Design & Fashion Technology) &bull; `way/425717552`
15. `BH_01` (Boys Hostel 1) &bull; `way/422437894`
16. `BH_02` (Boys Hostel 2) &bull; `way/422437895`
17. `BH_03` (Boys Hostel 3) &bull; `way/422437896`
18. `BH_04` (Boys Hostel 4) &bull; `way/422437897`
19. `BH_05` (Boys Hostel 5) &bull; `way/422547444`
20. `BH_06` (Boys Hostel 6) &bull; `way/422547445`
21. `BH_07` (Boys Hostel 7) &bull; `way/422547446`
22. `BH_08` (Boys Hostel 8) &bull; `way/422547447`
23. `GH_01` (Girls Hostel 1) &bull; `way/422437887`
24. `GH_02` (Girls Hostel 2) &bull; `way/422437888`
25. `GH_03` (Girls Hostel 3) &bull; `way/422547448`
26. `GH_04` (Girls Hostel 4) &bull; `way/422547449`
27. `GH_05` (Girls Hostel 5) &bull; `way/422547450`
28. `GH_06` (Girls Hostel 6) &bull; `way/422547451`

---

## 6. Route Endpoint Snapping & Entrance Verification Protocol

Wayfinding routes calculate pedestrian traversal across the verified campus walkway graph. To guarantee zero geographic misrepresentation:

1. **Verified Gate Entrances (`entranceType: 'verified_gate'`):**
   - Applies to: Gate 1, Gate 2, Gate 3, Gate 4, and Law Gate.
   - Walkway Snap Distance: $\le 6\,\text{meters}$.
   - Turn-by-Turn Instruction: *"Arrive at [Gate Name] (Verified Campus Gate Entrance)"*.
   - UI Indicator: Green `✓ Verified Gate Entrance` badge.

2. **Perimeter Walkway Access Points (`entranceType: 'mapped_footprint_perimeter'`):**
   - Applies to: The 28 buildings with mapped OSM polygon footprints.
   - Walkway Snap Distance: $15 - 35\,\text{meters}$ from polygon centroid to perimeter walkway.
   - Turn-by-Turn Instruction: *"Arrive at perimeter walkway access for [Building Name] (Approximate Entrance • ~Xm from building centroid)"*.
   - UI Indicator: Blue `📍 Perimeter Walkway Snap (~Xm)` badge.
   - Explanatory Note: Warns users that the arrival node connects to the building perimeter walkway; exact door thresholds await on-site architectural survey.

3. **Approximate Grid Snaps (`entranceType: 'representative_grid'`):**
   - Applies to: The 15 grid-based buildings (`osm_way_id: null`).
   - Walkway Snap Distance: $17 - 38\,\text{meters}$ from representative centroid grid point.
   - Turn-by-Turn Instruction: *"Arrive at nearest walkway access for [Building Name] (Approximate Entrance • ~Xm from building reference point)"*.
   - UI Indicator: Amber `⚠ Approximate Walkway Snap (~Xm)` badge.
   - Explanatory Note: Alerts users that the location is a representative coordinate along the continuous campus spine, and exact doorway entrances have not yet been segmented.

---

## 7. Data Preservation & Academic Compliance Certification

- **Original Research Datasets Preserved:** `lpu_outdoor.geojson`, `buildings.json`, `indoor_buildings.json`, `source_references.md`, and `missing_data_report.md` remain strictly intact.
- **Zero-Fabrication Indoor Policy:** All 43 buildings retain the mandatory status:
  `"INDOOR FLOOR MAPPING AWAITED: Verified floor-plan data has not yet been added. Ground-truth CAD drawings are restricted by university administration."`
- **Zero Fictional Geometry:** No invented room layouts, corridors, stairs, or fabricated entrance doorways have been introduced.
