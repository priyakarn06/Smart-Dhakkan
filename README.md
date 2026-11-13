# Smart Dhakkan

### Smart Manhole Monitoring Dashboard

A React dashboard for viewing manhole locations and sensor telemetry, inspecting individual devices, and downloading PDF reports.

> **Project status:** Frontend prototype. Most manhole records use bundled sample data. Live device data is currently connected for `DL_001`.

---

## Features

- **Dashboard overview** with device counts and status summaries.
- **Interactive maps** with status-colored manhole markers, ID labels on hover, and location search.
- **Manhole details** for gas, water, sewage distance, cover position, sensor health, and system readings.
- **DL_001 live data** from the device endpoint. Its details refresh every three seconds while selected.
- **PDF reports** for an individual manhole or all manholes in one combined PDF.
- **Responsive sidebar** with the DTE4 company logo.

## Technology

| Technology | Use |
| --- | --- |
| React 19 | User interface |
| Vite 8 | Development server and production build |
| Leaflet | Interactive maps |
| OpenStreetMap | Map tiles |
| Lucide React | Interface and map icons |
| jsPDF | PDF report generation |
| ESLint | Code linting |

`@react-google-maps/api` is currently declared as a dependency but is not used by the dashboard; the maps use Leaflet.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- A current desktop browser

No separate global installation of React, Vite, Leaflet, or jsPDF is needed. The project dependencies are installed from the lockfile.

## Getting Started

```bash
git clone https://github.com/priyakarn06/Smart-Dhakkan.git
cd Smart-Dhakkan
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create the production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Data and Connectivity

### Bundled records

The dashboard loads its manhole list and sample telemetry from [`src/data/data.json`](./src/data/data.json). Other manhole IDs currently use these bundled records.

### DL_001 device endpoint

Live readings for `DL_001` are requested from:

```text
http://manhole.local/DL_001/data
```

The endpoint must be reachable from the browser running the dashboard. The device host must resolve correctly on the local network, and its server must allow browser requests from the dashboard origin (CORS). The endpoint is referenced in [`src/App.jsx`](./src/App.jsx).

The details page refreshes this data every three seconds while `DL_001` is selected. If a refresh fails, the last received data remains visible with a warning.

### Maps and location search

Leaflet displays map tiles from OpenStreetMap. Location search uses the Nominatim geocoding service. These features require an internet connection and are subject to the services' availability and usage policies. No map API key is configured by this project.

## PDF Reports

Use the **PDF** button beside a manhole to download its report. Use **All PDF** above the list to download a single combined PDF with a report for each manhole.

Reports include the data available for each record, such as location, status, sensor readings, cover/movement, sensor health, and system information. `DL_001` uses its latest fetched device data when available; other IDs use the bundled records.

## Project Structure

```text
public/
  dtech-logo.png             Sidebar company logo
src/
  components/
    Dashboard.jsx            Overview, manhole list, and dashboard map
    GoogleMap.jsx            Manhole details map (Leaflet)
    ManholeDetails.jsx       Selected manhole telemetry
    Login.jsx                Prototype entry screen
  data/
    data.json                Bundled sample manhole records
  utils/
    manholeReports.js        Individual and combined PDF reports
  App.jsx                    Application state and device data requests
  App.css                    Application styles
package.json                 Scripts and direct dependencies
package-lock.json            Locked dependency versions
```

## Notes

- The login screen is a prototype entry screen, not production authentication.
- This repository contains the dashboard frontend; it does not include ESP32 firmware, an MQTT broker, or a backend service.
- Sensor values and status thresholds should be validated before using this prototype for operational or safety decisions.
