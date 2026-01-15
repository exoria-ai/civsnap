# GIS Layer Reference

This document describes the GIS layers used by CivicSnap for Solano County property lookups.

## Layer Summary

| Layer | Source | Lookup Method | Purpose |
|-------|--------|---------------|---------|
| Address Points | Solano County | **Attribute** (address string) | Address → APN translation |
| Parcels | Solano County | **Attribute** (APN) | Property details, boundaries |
| Zoning | Solano County | Spatial | Land use regulations |
| General Plan | Solano County | Spatial | Long-term land use designation |
| City Boundaries | Solano County | Spatial | Incorporated/unincorporated status |
| BOS Districts | Solano County | Spatial | Supervisorial district |
| FEMA NFHL | Federal | Spatial | Flood hazard zones |
| CAL FIRE FHSZ | State | Spatial | Fire hazard severity zones |

---

## Solano County Layers

Base URL: `https://services2.arcgis.com/SCn6czzcqKAFwdGU/ArcGIS/rest/services`

### Address Points

**URL:** `{base}/Address_Points/FeatureServer/0`

**Purpose:** Translate street addresses to APNs. Each address point contains the APN of its parcel plus precise lat/long coordinates. Multiple address points can share the same APN (many-to-one).

**Lookup Method:** Attribute query by address string
```
WHERE fulladdress LIKE '675 TEXAS%'
```

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `apn` | String | Assessor's Parcel Number - links to Parcels layer |
| `fulladdress` | String | Complete address (e.g., "675 TEXAS STREET, Fairfield, CA, 94533") |
| `add_number` | Integer | Street number (e.g., 675) |
| `st_name` | String | Street name (e.g., "TEXAS") |
| `st_postyp` | String | Street type (e.g., "ST", "AVE", "DR") |
| `st_predir` | String | Pre-directional (e.g., "N", "S", "E", "W") |
| `lat` | Double | Latitude (WGS84) |
| `long` | Double | Longitude (WGS84) |
| `post_comm` | String | Postal community (city name) |
| `post_code` | String | ZIP code |
| `inc_muni` | String | Incorporated municipality |
| `uninc_comm` | String | Unincorporated community |
| `unit` | String | Unit/suite number |
| `building` | String | Building identifier |

**Sample Query:**
```
/query?where=fulladdress LIKE '675 TEXAS%'&outFields=apn,fulladdress,lat,long&f=json
```

---

### Parcels (Parcels_Public_Aumentum)

**URL:** `{base}/Parcels_Public_Aumentum/FeatureServer/0`

**Purpose:** Property boundaries and detailed assessor data. Contains acreage, use codes, assessed values, building characteristics, and links to tax/property records.

**Lookup Method:** Attribute query by APN (from Address Points)
```
WHERE parcelid = '0030251020'
```

**Key Fields - Identification:**

| Field | Type | Description |
|-------|------|-------------|
| `parcelid` | String | APN (primary key) |
| `asmtnum` | String | Assessment number (usually same as APN) |
| `p_address` | String | Site address (e.g., "601 TEXAS STREET") |
| `sitecity` | String | Site city |
| `sitenum` | Integer | Site street number |
| `siteroad` | String | Site street name |

**Key Fields - Size & Value:**

| Field | Type | Description |
|-------|------|-------------|
| `acres` | Double | Recorded acreage |
| `gis_acre` | Double | GIS-measured acreage |
| `lotsize` | Double | Lot size in square feet |
| `valland` | Double | Land assessed value |
| `valimp` | Double | Improvement assessed value |
| `valtv` | Double | Trees & vines value |
| `valfme` | Double | Fixed machinery & equipment value |
| `rollyear` | Integer | Tax roll year |

**Key Fields - Use & Zoning:**

| Field | Type | Description |
|-------|------|-------------|
| `usecode` | String | Property use code |
| `use_desc` | String | Use code description (e.g., "SINGLE FAMILY RESIDENCE") |
| `zone1` | String | Primary zoning designation |
| `zone2` | String | Secondary zoning (overlay) |
| `zone3` | String | Tertiary zoning (overlay) |
| `qclass` | String | Quality class |

**Key Fields - Building Characteristics:**

| Field | Type | Description |
|-------|------|-------------|
| `yrbuilt` | Integer | Year built |
| `stories` | Double | Number of stories |
| `total_area` | Double | Total building area (sq ft) |
| `firs_floor` | Double | First floor area |
| `sec_floor` | Double | Second floor area |
| `garage` | Double | Garage area |
| `bedroom` | Integer | Number of bedrooms |
| `bathroom` | Double | Number of bathrooms |
| `rooms` | Integer | Total room count |
| `fireplc` | Integer | Number of fireplaces |
| `pool` | String | Has pool (YES/NO) |
| `solar` | String | Has solar (YES/NO) |
| `hvac` | String | HVAC type code |

**Key Fields - Districts:**

| Field | Type | Description |
|-------|------|-------------|
| `tac` | Integer | Tax area code |
| `tac_city` | String | Tax area city name |
| `f_school` | String | School district code |
| `d_school` | String | School district description |
| `fund_fire` | String | Fire district code |
| `desc_fire` | String | Fire district description |
| `fund_water` | String | Water district code |
| `desc_water` | String | Water district description |
| `f_airboard` | String | Air board district code |
| `d_airboard` | String | Air board description |

**Key Fields - Williamson Act:**

| Field | Type | Description |
|-------|------|-------------|
| `wa` | String | Williamson Act status (YES/NO) |
| `wa_status` | String | WA status code |
| `wacontno` | String | WA contract number |
| `wa_prime` | Double | Prime acreage under WA |
| `noprimacre` | Double | Non-prime acreage |

**Key Fields - Links:**

| Field | Type | Description |
|-------|------|-------------|
| `taxmaplink` | String | URL to tax map image |
| `propurl` | String | URL to property characteristics page |
| `taxinfo` | String | URL to tax information page |

**Geometry:** Polygon (parcel boundary)

**Sample Query:**
```
/query?where=parcelid='0030251020'&outFields=parcelid,acres,use_desc,yrbuilt,bedroom,bathroom&f=json
```

---

### Zoning (SolanoCountyZoning_092322)

**URL:** `{base}/SolanoCountyZoning_092322/FeatureServer/4`

**Purpose:** County zoning designations for **unincorporated areas only**. Returns empty for addresses within city limits.

**Lookup Method:** Spatial (point-in-polygon)

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `zone_name` | String | Full zoning name (e.g., "EXCLUSIVE AGRICULTURE") |
| `zone_abrev` | String | Zoning abbreviation (e.g., "A-40") |
| `LU_Category` | String | Land use category |
| `Acres` | Double | Zone polygon acreage |
| `map_number` | String | Zoning map reference |

**Note:** City zoning data must be obtained from individual city GIS portals.

---

### General Plan (SolanoCountyUnincorporated_GeneralPlan2008)

**URL:** `{base}/SolanoCountyUnincorporated_GeneralPlan2008_updated0923/FeatureServer/0`

**Purpose:** General Plan land use designations for **unincorporated areas**. Returns "INC" for incorporated (city) areas.

**Lookup Method:** Spatial (point-in-polygon)

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `gplu` | String | General Plan land use code (e.g., "AG", "RR", "INC") |
| `gp_desc` | String | Full description |
| `name` | String | Area name |
| `LU_Category` | String | Land use category |
| `Acres` | Double | Polygon acreage |

---

### City Boundaries

**URL:** `{base}/CityBoundary/FeatureServer/2`

**Purpose:** Determine if a location is within an incorporated city.

**Lookup Method:** Spatial (point-in-polygon)

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | City name (e.g., "Fairfield", "Vallejo", "Vacaville") |
| `agency` | String | Agency identifier |

**Result Interpretation:**
- Feature returned → Location is within incorporated city limits
- No feature → Location is in unincorporated county area

---

### Board of Supervisors Districts (BOS_District_Boundaries_2021)

**URL:** `{base}/BOS_District_Boundaries_2021/FeatureServer/0`

**Purpose:** Supervisorial district boundaries.

**Lookup Method:** Spatial (point-in-polygon)

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `district` | String | District number (1-5) |
| `name` | String | Supervisor name |
| `ppa_popula` | Double | District population |

---

## State/Federal Layers

### FEMA National Flood Hazard Layer (NFHL)

**URL:** `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28`

**Purpose:** Flood hazard zone determination for insurance and disclosure requirements.

**Lookup Method:** Spatial (point-in-polygon)

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `FLD_ZONE` | String | Flood zone code (A, AE, AH, AO, V, VE, X, etc.) |
| `ZONE_SUBTY` | String | Zone subtype description |
| `SFHA_TF` | String | Special Flood Hazard Area (T/F) |
| `STATIC_BFE` | Double | Base flood elevation |
| `DEPTH` | Double | Flood depth |

**Zone Interpretation:**

| Zone | Risk Level | Description |
|------|------------|-------------|
| A, AE, AH, AO | High | Special Flood Hazard Area (1% annual chance) |
| V, VE | High | Coastal high hazard (waves) |
| X (shaded) | Moderate | 0.2% annual chance |
| X (unshaded) | Low | Minimal flood hazard |

**Note:** No feature returned typically means Zone X (minimal hazard).

---

### CAL FIRE Fire Hazard Severity Zones (FHSZ)

**SRA URL:** `https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/0`
**LRA URL:** `https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer/1`

**Purpose:** Fire hazard severity zone determination. SRA = State Responsibility Area (rural), LRA = Local Responsibility Area (cities).

**Lookup Method:** Spatial (point-in-polygon) - query both layers

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `HAZ_CODE` | Integer | Hazard code (1=Moderate, 2=High, 3=Very High) |
| `HAZ_CLASS` | String | Hazard class description |
| `SRA` | String | State Responsibility Area designation |

**Severity Interpretation:**

| Code | Class | Description |
|------|-------|-------------|
| 1 | Moderate | Moderate fire hazard |
| 2 | High | High fire hazard |
| 3 | Very High | Very high fire hazard |

**Note:** Urban areas typically have no FHSZ designation (no feature returned).

---

## Lookup Strategy

### Recommended Flow

```
User Input: "675 Texas St, Fairfield, CA"
                    │
                    ▼
    ┌───────────────────────────────┐
    │  1. Address Points Layer      │  ← Attribute query
    │     WHERE fulladdress LIKE... │
    │     Returns: APN, lat, long   │
    └───────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │  2. Parcels Layer             │  ← Attribute query (by APN)
    │     WHERE parcelid = 'APN'    │
    │     Returns: all property data│
    └───────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │  3. Spatial Layers (parallel) │  ← Spatial queries (by lat/long)
    │     - Zoning                  │
    │     - General Plan            │
    │     - City Boundaries         │
    │     - BOS Districts           │
    │     - FEMA Flood              │
    │     - CAL FIRE                │
    └───────────────────────────────┘
```

### Why Attribute Queries for Address/Parcel?

1. **Accuracy:** Address Points have pre-linked APNs; no spatial matching errors
2. **Speed:** Attribute queries are faster than spatial queries
3. **Reliability:** Avoids coordinate system conversion issues
4. **Data Quality:** County has already done the work of linking addresses to parcels

### Why Spatial Queries for Other Layers?

These layers don't have APN attributes - the only way to determine which zone/district a parcel falls within is by spatial intersection:

- Zoning polygons don't store which parcels they contain
- Flood zones are drawn based on topography, not parcel lines
- Fire hazard zones follow vegetation and terrain patterns
- District boundaries follow political lines

---

## Query Parameters

All queries require these base parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `f` | `json` | Response format |
| `outFields` | field list or `*` | Fields to return |
| `returnGeometry` | `true/false` | Include geometry |

**For spatial queries, add:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| `geometry` | `{"x": lon, "y": lat}` | Point coordinates |
| `geometryType` | `esriGeometryPoint` | Geometry type |
| `inSR` | `4326` | Input spatial reference (WGS84) |
| `spatialRel` | `esriSpatialRelIntersects` | Spatial relationship |

**For attribute queries, add:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| `where` | SQL clause | Attribute filter |

---

## Sample Parcel Record

For reference, here's what a typical parcel record contains (APN 0030251020 - Solano County Admin Building):

```json
{
  "parcelid": "0030251020",
  "p_address": "601 TEXAS STREET",
  "sitecity": "FAIRFIELD",
  "acres": 5.51,
  "lotsize": 240015,
  "usecode": "9800",
  "use_desc": "GOVERNMENTAL & MISCELLANEOUS",
  "yrbuilt": 0,
  "valland": 0,
  "valimp": 0,
  "zone1": "Public Facilities",
  "tac_city": "FAIRFIELD CITY",
  "d_school": "FS UNIF SCHL DIST M & O",
  "d_airboard": "B A A Q M D",
  "propurl": "https://ca-solano.publicaccessnow.com/Assessor/PropertySearch/Detail.aspx?p=0030251020",
  "taxinfo": "https://ca-solano.publicaccessnow.com/TaxCollector/TaxSearch/Account.aspx?p=0030251020"
}
```

---

## Coordinate Systems

- **WGS84 (EPSG:4326):** Standard lat/long used by GPS and web mapping
- **California State Plane Zone III (EPSG:103004):** Used internally by Solano County

Always specify `inSR: 4326` when querying with WGS84 coordinates to ensure proper conversion.
