# CivicSnap

**GIS-grounded infographics with AI-assisted presentation**

CivicSnap generates template-based, GIS-backed one-page briefs (infographics/exhibits) from an address or APN. It queries public ArcGIS REST endpoints to fetch authoritative geometry and attributes, renders map extracts, and uses AI to transform raw GIS output into polished, accessible documents.

## Key Insight

AI handles layout and language transformation, but **never invents facts**. All data comes from authoritative GIS sources, and the system maintains clear provenance through the `InfographicSpec` contract.

## Templates

### 1. Address Snapshot (Counter Handout)
The "boring but essential" template every planning counter needs. Includes parcel info, jurisdiction, zoning, districts, hazards, and nearby POIs.

### 2. Plain-Language Property Explainer
The "impossible without AI" template — transforms GIS jargon into human-readable language for homeowners, buyers, and residents.

### 3. Neighbor Notification Exhibit
Automates a tedious planning workflow — generating notification area maps and counts.

## Tech Stack

- **Frontend:** Next.js 16 with React 19
- **Styling:** Tailwind CSS
- **Maps:** MapLibre GL JS
- **GIS:** Direct queries to public ArcGIS REST endpoints
- **Geometry:** Turf.js
- **Export:** html2canvas + jsPDF
- **AI (Phase 2):** FAL AI (Nano Banana Pro)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Environment Variables

Create a `.env.local` file with:

```
FAL_API_KEY=your_fal_api_key
```

## Architecture

```
User Input (address + template + options)
    ↓
Geocode (Census Geocoder)
    ↓
GIS Queries (ArcGIS REST → parcel, zoning, GP, hazards, districts)
    ↓
Build InfographicSpec (structured JSON with all facts + geometries)
    ↓
Render (deterministic HTML/CSS or AI-styled output)
    ↓
Export (PNG / PDF)
```

## Data Sources

- **Solano County / ReGIS:** Parcels, zoning, general plan, boundaries, districts
- **FEMA NFHL:** Flood hazard zones
- **CAL FIRE:** Fire hazard severity zones
- **Census Geocoder:** Address geocoding

## License

MIT
