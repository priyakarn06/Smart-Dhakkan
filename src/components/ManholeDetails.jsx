import React from "react";
import {
  Activity,
  Wind,
  Droplets,
  Compass,
  Cpu,
  Wifi,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";

// Gas monitoring thresholds (PPM)
const GAS_THRESHOLDS = {
  CO: {
    warning: 10,
    emergency: 25,
  },
  H2S: {
    warning: 10,
    emergency: 15,
  },
  NH3: {
    warning: 10,
    emergency: 20,
  },
  C2H5OH: {
    warning: 200,
    emergency: 500,
  },
  CH4: {
    warning: 2500,
    emergency: 5000,
  },
};

// Display names for gases
const GAS_LABELS = {
  CO: "CO",
  H2S: "H₂S",
  NH3: "NH₃",
  C2H5OH: "C₂H₅OH",
  CH4: "CH₄",
};

// Determine the alert level for each gas
function getGasLevel(gas, value) {
  const limits = GAS_THRESHOLDS[gas];
  const ppm = Number(value);

  if (
    !limits ||
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(ppm) ||
    ppm < 0
  ) {
    return {
      level: null,
      label: "No threshold set",
      className: "no-data",
    };
  }

  if (ppm >= limits.emergency) {
    return {
      level: 2,
      label: "Emergency",
      className: "emergency",
    };
  }

  if (ppm >= limits.warning) {
    return {
      level: 1,
      label: "Warning",
      className: "warning",
    };
  }

  return {
    level: 0,
    label: "Normal",
    className: "normal",
  };
}

export default function ManholeDetails({ manhole }) {
  if (!manhole) {
    return (
      <div className="details-empty-state">
        <Activity size={48} className="empty-icon" />
        <h3>No Manhole Selected</h3>
        <p>
          Select a manhole from the Dashboard list or click a pin on the map to
          inspect its diagnostics.
        </p>
      </div>
    );
  }

  const isCritical = manhole.status === "CRITICAL";
  const isWarning = manhole.status === "WARNING";

  const getStatusBadgeClass = () => {
    if (isCritical) return "status-badge critical";
    if (isWarning) return "status-badge warning";
    return "status-badge normal";
  };

  // Get gas readings from the selected manhole
  const gasReadings = Object.entries(manhole.gas_sensor?.estimated_ppm || {});

  return (
    <div className="manhole-details-container">
      {/* --- Header Bar --- */}
      <div className="details-header">
        <div className="details-title-group">
          <h2>ManHole ID: {manhole.manhole_id}</h2>

          <span className="location-subtitle">
            <MapPin size={16} /> {manhole.location?.name || "Delhi Region"} (
            {manhole.location?.lat}, {manhole.location?.lng})
          </span>
        </div>

        <div className={getStatusBadgeClass()}>
          {manhole.status || "NORMAL"}
        </div>
      </div>

      {/* --- Main Telemetry 2x2 Grid --- */}
      <div className="telemetry-grid">
        {/* 1. Gas Sensor Card */}
        <div
          className="telemetry-card"
          title="Monitors harmful gas concentrations inside the manhole. Values are displayed in PPM."
        >
          <div className="card-header">
            <div className="card-icon gas">
              <Wind size={20} />
            </div>

            <div>
              <h4>Gas Sensor ({manhole.gas_sensor?.model || "MiCS-5524"})</h4>
            </div>
          </div>

          <div className="metric-row">
            <span>Air Reference Ratio</span>
            <strong>{manhole.gas_sensor?.ratio ?? "N/A"}</strong>
          </div>

          {/* Gas Readings and Alert Levels */}
          <div className="ppm-breakdown">
            <span className="ppm-title">Gas Concentration & Alert Levels</span>

            <div className="ppm-chips">
              {gasReadings.length > 0 ? (
                gasReadings.map(([gas, val]) => {
                  const gasName = gas.toUpperCase();
                  const gasLevel = getGasLevel(gasName, val);

                  return (
                    <div key={gas} className={`ppm-chip ${gasLevel.className}`}>
                      <span className="gas-name">
                        {GAS_LABELS[gasName] || gas}
                      </span>

                      <strong>{val ?? "N/A"} ppm</strong>

                      <small
                        className={`gas-level-badge ${gasLevel.className}`}
                      >
                        {gasLevel.level === null
                          ? gasLevel.label
                          : `LEVEL ${gasLevel.level} - ${gasLevel.label}`}
                      </small>
                    </div>
                  );
                })
              ) : (
                <p className="no-data-text">No gas readings available.</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Flood & Water Level Card */}
        <div
          className="telemetry-card"
          title="Monitors water pressure, water level above the manhole and sewage distance to identify possible flooding."
        >
          <div className="card-header">
            <div className="card-icon water">
              <Droplets size={20} />
            </div>

            <div>
              <h4>Flood & Pressure Sensor</h4>
            </div>
          </div>

          <div className="metric-row">
            <span>Raw Adc</span>
            <strong>{manhole.flood_sensor?.raw_adc ?? "N/A"}</strong>
          </div>

          <div className="metric-row">
            <span>Water Level Above Manhole</span>
            <strong>{manhole.water_level_above_manhole ?? "N/A"} cm</strong>
          </div>

          <div className="metric-row">
            <span>Sewage Distance</span>
            <strong>
              {manhole.sewage_sensor?.distance_mm != null
                ? `${manhole.sewage_sensor.distance_mm} mm`
                : "Out of Range"}
            </strong>
          </div>
        </div>

        {/* 3. Orientation & Motion Card */}
        <div
          className="telemetry-card"
          title="Tracks Roll, Pitch and Yaw to monitor manhole orientation and detect unexpected movement."
        >
          <div className="card-header">
            <div className="card-icon orientation">
              <Compass size={20} />
            </div>

            <div>
              <h4>Cover Position</h4>
            </div>
          </div>

          {/* Cover Position - Open and Close reference only */}
          <div className="axes-grid">
            <div className="axis-box">
              <span>Open</span>
              <span></span>
            </div>

            <div className="axis-box">
              <span>Close</span>
            </div>
          </div>

          <div className="metric-row mt-3">
            <span>Movement Detected</span>

            <strong
              className={
                manhole.orientation?.move_status === "YES"
                  ? "text-danger"
                  : "text-success"
              }
            >
              {manhole.orientation?.move_status || "NO"}
            </strong>
          </div>
        </div>

        {/* 4. Sensor Health & System Diagnostics Card */}
        <div
          className="telemetry-card"
          title="Shows sensor availability, device uptime, Wi-Fi signal strength and system connectivity."
        >
          <div className="card-header">
            <div className="card-icon system">
              <Cpu size={20} />
            </div>

            <div>
              <h4>System & Hardware Health</h4>
            </div>
          </div>

          <div className="sensor-health-list">
            {Object.entries(manhole.sensor_health || {}).map(
              ([sensorName, isHealthy]) => (
                <div key={sensorName} className="health-item">
                  <span className="sensor-name-label">
                    {sensorName.replace("_", " ").toUpperCase()}
                  </span>

                  {isHealthy ? (
                    <span className="health-ok">
                      <CheckCircle2 size={16} /> Online
                    </span>
                  ) : (
                    <span className="health-fail">
                      <XCircle size={16} /> Faulty
                    </span>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="system-footer-stats">
            <div>
              <Clock size={14} /> Uptime:{" "}
              {Math.floor((manhole.system?.uptime_ms || 0) / 1000)}s
            </div>

            <div>
              <Wifi size={14} /> RSSI: {manhole.system?.wifi_rssi ?? "N/A"} dBm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
