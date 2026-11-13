import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToString } from "react-dom/server";
import {
  CircleLetterM,
  HardDrive,
  MapPin,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Info,
  X,
  Check,
  Download,
} from "lucide-react";
const severityLevels = [
  { label: "Extreme", color: "#b00000" },
  { label: "Danger", color: "#ff351c" },
  { label: "Warning", color: "#ff9d2e" },
  { label: "No data", color: "#bdbdbd" },
  { label: "Normal", color: "#45a66b" },
];

const addMapLayer = (map, mapType, baseLayerRef, labelsLayerRef) => {
  if (mapType === "hybrid") {
    baseLayerRef.current = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles © Esri",
      }
    ).addTo(map);

    labelsLayerRef.current = L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Labels © Esri",
      }
    ).addTo(map);
  } else {
    baseLayerRef.current = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }
    ).addTo(map);

    labelsLayerRef.current = null;
  }
};

export default function Dashboard({
  manholes = [],
  deviceManhole = null,
  onSelectManhole,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [reportError, setReportError] = useState("");
  // Location search states
const [searchQuery, setSearchQuery] = useState("");
const [isSearching, setIsSearching] = useState(false);
const [searchError, setSearchError] = useState("");
const [searchResult, setSearchResult] = useState("");

  // NEW: Map view options states
  const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
  const [mapType, setMapType] = useState("map");
  const [activeViewTab, setActiveViewTab] = useState("manhole");
  const [showManholeLayer, setShowManholeLayer] = useState(true);

  const mapRef = useRef(null);
  const markersRef = useRef({});
  const baseLayerRef = useRef(null);
  const labelsLayerRef = useRef(null);
  const searchMarkerRef = useRef(null);

  // Dashboard metrics
  const totalDevices = manholes.length;

  const totalLocations = new Set(
    manholes.map((m) =>
      m.location?.lat != null && m.location?.lng != null
        ? `${m.location.lat},${m.location.lng}`
        : "Delhi"
    )
  ).size;

  const criticalCount = manholes.filter(
    (m) => m.status === "CRITICAL" || m.status === "WARNING"
  ).length;

  const liveCount = totalDevices - criticalCount;

  const maintenancePercentage =
    totalDevices > 0
      ? Math.round((criticalCount / totalDevices) * 100)
      : 0;

  // Initialize Leaflet map and markers
  useEffect(() => {
    if (manholes.length === 0) return;

    const centerLat = manholes[0]?.location?.lat || 28.6139;
    const centerLng = manholes[0]?.location?.lng || 77.209;

    if (!mapRef.current) {
      const map = L.map("dashboard-map-element", {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([centerLat, centerLng], 13);

      mapRef.current = map;

      addMapLayer(
        map,
        mapType,
        baseLayerRef,
        labelsLayerRef
      );
    }

    const map = mapRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });

    markersRef.current = {};

    manholes.forEach((node) => {
      const lat = node.location?.lat;
      const lng = node.location?.lng;

      if (lat != null && lng != null) {
        const markerColor =
          node.status === "CRITICAL"
            ? "#ff351c"
            : node.status === "WARNING"
              ? "#ff9d2e"
              : "#45a66b";

        const customManholeIcon = L.divIcon({
          html: renderToString(
            <CircleLetterM
              size={32}
              color="#35495e"
              fill={markerColor}
            />
          ),
          className: "custom-manhole-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], {
          icon: customManholeIcon,
        });
        marker.bindTooltip(node.manhole_id, {
          className: "manhole-id-tooltip",
          direction: "top",
          offset: [0, -12],
        });

        marker.on("click", () => {
          setSelectedId(node.manhole_id);

          if (onSelectManhole) {
            onSelectManhole(node);
          }
        });

        markersRef.current[node.manhole_id] = marker;
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        baseLayerRef.current = null;
        labelsLayerRef.current = null;
        markersRef.current = {};
      }
    };
  }, [manholes]);

  // Change between Map and Hybrid
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
    }

    addMapLayer(
      map,
      mapType,
      baseLayerRef,
      labelsLayerRef
    );
  }, [mapType]);

// Show/hide all manhole markers
useEffect(() => {
  const map = mapRef.current;

  if (!map) return;

  manholes.forEach((node) => {
    const marker = markersRef.current[node.manhole_id];

    if (!marker) return;

    if (showManholeLayer) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });
}, [manholes, showManholeLayer]);

  // Update map when list collapses
  useEffect(() => {
    if (!mapRef.current) return;

    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [isListCollapsed]);

  // Handle manhole list selection
  const handleItemClick = (node) => {
    setSelectedId(node.manhole_id);

    if (onSelectManhole) {
      onSelectManhole(node);
    }

    const lat = node.location?.lat;
    const lng = node.location?.lng;

    if (lat != null && lng != null && mapRef.current) {
      mapRef.current.setView([lat, lng], 16, {
        animate: true,
      });

      const activeMarker = markersRef.current[node.manhole_id];

      if (activeMarker && mapRef.current.hasLayer(activeMarker)) {
        activeMarker.openPopup?.();
      }
    }
  };

  const getReportData = (node) =>
    deviceManhole?.manhole_id === node.manhole_id ? deviceManhole : node;

  const handleDownloadReport = async (node) => {
    try {
      setReportError("");
      const { downloadManholeReport } = await import("../utils/manholeReports");
      downloadManholeReport(getReportData(node));
    } catch (downloadError) {
      console.error("Failed to generate manhole report:", downloadError);
      setReportError("Could not generate the report. Please try again.");
    }
  };

  const handleDownloadAllReports = async () => {
    try {
      setReportError("");
      const { downloadAllManholeReports } = await import(
        "../utils/manholeReports"
      );
      downloadAllManholeReports(manholes.map(getReportData));
    } catch (downloadError) {
      console.error("Failed to generate manhole reports:", downloadError);
      setReportError("Could not generate the reports. Please try again.");
    }
  };


// Search any location on the map
const handleMapSearch = async (event) => {
  event.preventDefault();

  const query = searchQuery.trim();

  if (!query) {
    setSearchError("Please enter a location.");
    return;
  }

  setIsSearching(true);
  setSearchError("");
  setSearchResult("");

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Location search failed");
    }

    const results = await response.json();

    if (results.length === 0) {
      setSearchError("Location not found. Try another search.");
      return;
    }

    const location = results[0];

    const lat = Number(location.lat);
    const lng = Number(location.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("Invalid location coordinates");
    }

    const map = mapRef.current;

    if (!map) {
      setSearchError("Map is not ready yet.");
      return;
    }

    // Remove previous search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
    }

    // Move map to searched location
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 1.2,
    });

    // Add a blue marker at searched location
    searchMarkerRef.current = L.circleMarker(
      [lat, lng],
      {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
      }
    ).addTo(map);

    setSearchResult(location.display_name);

  } catch (error) {
    console.error("Map search error:", error);
    setSearchError("Unable to search location. Please try again.");

  } finally {
    setIsSearching(false);
  }
};


  return (
    <div className="dashboard-content-container">

      {/* TOP METRIC CARDS */}

      <div className="metrics-grid">

        <div className="metric-card">
          <div className="metric-icon blue">
            <HardDrive size={24} />
          </div>

          <div>
            <p className="metric-label">Total Devices</p>
            <h3 className="metric-value">{totalDevices}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <MapPin size={24} />
          </div>

          <div>
            <p className="metric-label">Total Locations</p>
            <h3 className="metric-value">{totalLocations}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon teal">
            <Activity size={24} />
          </div>

          <div>
            <p className="metric-label">Status (Live / Critical)</p>
            <h3 className="metric-value">
              {liveCount} / {criticalCount}
            </h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orange">
            <AlertTriangle size={24} />
          </div>

          <div className="metric-content-full">
            <div className="metric-header-row">
              <p className="metric-label">Maintenance Needed</p>
              <span className="metric-badge">
                {criticalCount} Units
              </span>
            </div>

            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${maintenancePercentage}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* LOWER SECTION: LIST + MAP */}

      <div
        className={`dashboard-lower-section ${
          isListCollapsed ? "list-collapsed" : ""
        }`}
      >

        {/* MANHOLE LIST */}

        <div className="manhole-list-box">

          <div className="list-title">
            {!isListCollapsed && (
              <span>Manhole Nodes List</span>
            )}

            {!isListCollapsed && (
              <button
                type="button"
                className="report-download-all"
                onClick={handleDownloadAllReports}
                disabled={manholes.length === 0}
                aria-label="Download reports for all manholes as one PDF"
              >
                <Download size={15} />
                <span>All PDF</span>
              </button>
            )}

            <button
              className="list-collapse-btn"
              onClick={() =>
                setIsListCollapsed(!isListCollapsed)
              }
              title={
                isListCollapsed
                  ? "Expand Manhole List"
                  : "Collapse Manhole List"
              }
              aria-label={
                isListCollapsed
                  ? "Expand Manhole List"
                  : "Collapse Manhole List"
              }
              aria-expanded={!isListCollapsed}
            >
              {isListCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>

          {reportError && (
            <div className="report-error" role="alert">
              {reportError}
            </div>
          )}

          {!isListCollapsed && (
            <div className="manholes-scroll-container">

              {manholes.length === 0 ? (
                <p
                  className="no-data-text"
                  style={{ padding: "16px" }}
                >
                  No manhole records found...
                </p>
              ) : (
                manholes.map((node) => {
                  const statusClass =
                    node.status === "CRITICAL"
                      ? "maintenance"
                      : node.status === "WARNING"
                        ? "warning"
                        : "live";

                  return (
                    <div
                      key={node.manhole_id}
                      className={`manhole-list-item ${
                        selectedId === node.manhole_id
                          ? "active-node"
                          : ""
                      }`}
                      onClick={() => handleItemClick(node)}
                    >
                      <div className="item-info">
                        <span className="node-name">
                          {node.manhole_id}
                        </span>

                        <span className="node-loc">
                          {node.location?.name || "Unknown Location"}
                        </span>

                        {node.manhole_id === "DL_001" && (
                          <button
                            type="button"
                            className="node-data-link"
                            aria-label="Open data for DL_001"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleItemClick(node);
                            }}
                          >
                         
                          </button>
                        )}
                      </div>

                      <div className="manhole-item-actions">
                        <span className={`status-pill ${statusClass}`}>
                          {node.status || "ONLINE"}
                        </span>
                        <button
                          type="button"
                          className="node-report-button"
                          aria-label={`Download report for ${node.manhole_id}`}
                          title={`Download ${node.manhole_id} report as PDF`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDownloadReport(node);
                          }}
                        >
                          <Download size={14} />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

            </div>
          )}

        </div>

        {/* MAP BOX */}

        <div className="dashboard-map-box">

          <div
            id="dashboard-map-element"
            style={{
              width: "100%",
              height: "100%",
            }}
          ></div>


{/* LOCATION SEARCH BAR */}

<div className="map-search-container">

  <form
    className="map-search-form"
    onSubmit={handleMapSearch}
  >

    <input
      type="text"
      className="map-search-input"
      placeholder="Search any location..."
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        setSearchError("");
        setSearchResult("");
      }}
    />

    <button
      type="submit"
      className="map-search-button"
      disabled={isSearching}
    >
      {isSearching ? "Searching..." : "Search"}
    </button>

  </form>

  {(searchError || searchResult) && (
    <div
      className={`map-search-message ${
        searchError ? "error" : ""
      }`}
    >
      {searchError || `Found: ${searchResult}`}
    </div>
  )}

</div>


          {/* FLOATING LAYERS BUTTON */}

          {!isViewOptionsOpen && (
            <button
              className="map-layers-button"
              onClick={() => setIsViewOptionsOpen(true)}
              title="View map options"
              aria-label="Open map view options"
              aria-expanded={isViewOptionsOpen}
            >
              <Layers size={25} strokeWidth={2} />
            </button>
          )}

          {/* VIEW OPTIONS PANEL */}

          {isViewOptionsOpen && (
            <div
              className="map-view-options-panel"
              role="dialog"
              aria-label="View options"
            >

              {/* PANEL HEADER */}

              <div className="map-options-header">

                <div className="map-options-heading">
                  <Layers size={22} strokeWidth={2} />

                  <span>View options</span>

                  <Info
                    size={17}
                    className="map-options-info"
                    title="Choose map display options"
                  />
                </div>

                <button
                  className="map-options-close"
                  onClick={() => setIsViewOptionsOpen(false)}
                  aria-label="Close view options"
                  title="Close"
                >
                  <X size={22} />
                </button>

              </div>

              {/* MAP / HYBRID SELECTOR */}

              <div className="map-type-toggle">

                <button
                  className={
                    mapType === "map" ? "map-type-active" : ""
                  }
                  onClick={() => setMapType("map")}
                >
                  {mapType === "map" && (
                    <Check size={18} strokeWidth={2.5} />
                  )}
                  <span>Map</span>
                </button>

                <button
                  className={
                    mapType === "hybrid" ? "map-type-active" : ""
                  }
                  onClick={() => setMapType("hybrid")}
                >
                  {mapType === "hybrid" && (
                    <Check size={18} strokeWidth={2.5} />
                  )}
                  <span>Hybrid</span>
                </button>

              </div>

              {/* PANEL TABS */}

              <div className="map-options-tabs" role="tablist">

                <button
                  className={
                    activeViewTab === "manhole"
                      ? "map-tab-active"
                      : ""
                  }
                  onClick={() => setActiveViewTab("manhole")}
                  role="tab"
                  aria-selected={activeViewTab === "manhole"}
                >
                  Manhole data
                </button>

                <button
                  className={
                    activeViewTab === "coverage"
                      ? "map-tab-active"
                      : ""
                  }
                  onClick={() => setActiveViewTab("coverage")}
                  role="tab"
                  aria-selected={activeViewTab === "coverage"}
                >
                  Coverage map
                </button>

              </div>

              {/* MANHOLE DATA CONTENT */}

              {activeViewTab === "manhole" && (
                <div className="map-options-body">

                  {/* MANHOLE LAYER TOGGLE */}

                  <div className="map-layer-toggle-row">

                    <div className="map-layer-row-title">
                      <MapPin size={19} />
                      <span>Manhole locations</span>
                    </div>

                    <button
                      className={`map-option-switch ${
                        showManholeLayer ? "switch-on" : ""
                      }`}
                      onClick={() =>
                        setShowManholeLayer((current) => !current)
                      }
                      aria-label="Toggle manhole locations"
                      aria-pressed={showManholeLayer}
                    >
                      <span></span>
                    </button>

                  </div>

                  {/* EXPECTED SEVERITY CARD */}

                  <div className="severity-options-card">

                    <div className="severity-card-title">
                      Manhole status
                    </div>

                    <div className="severity-card-subtitle">
                      Expected severity
                    </div>

                    {/* SEVERITY LEGEND */}

                    <div className="severity-options-list">

                      {severityLevels.map((level) => (
                        <div
                          className="severity-option-row"
                          key={level.label}
                        >

                          <span
                            className="severity-color-dot"
                            style={{
                              backgroundColor: level.color,
                            }}
                          ></span>

                          <span className="severity-option-label">
                            {level.label}
                          </span>

                       </div>
                      ))}

                    </div>

                  </div>

                </div>
              )}

              {/* COVERAGE MAP TAB */}

              {activeViewTab === "coverage" && (
                <div className="coverage-map-placeholder">
                  Coverage map options will appear here.
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
