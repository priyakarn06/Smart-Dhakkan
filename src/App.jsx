import { useState, useEffect, useRef, useCallback } from "react";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import GoogleMap from "./components/GoogleMap";
import ManholeDetails from "./components/ManholeDetails";

import { LayoutDashboard, Activity, Menu, LogOut } from "lucide-react";

import "./App.css";
import manholesDataFile from "./data/data.json";

export default function App() {
  // =====================================
  // STATE MANAGEMENT
  // =====================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [manholesList, setManholesList] = useState([]);

  const [selectedManhole, setSelectedManhole] = useState(null);

  const [deviceManhole, setDeviceManhole] = useState(null);

  const [deviceDetailsLoading, setDeviceDetailsLoading] = useState(false);

  const [deviceDetailsError, setDeviceDetailsError] = useState(null);

  const deviceDetailsRequest = useRef(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  // =====================================
  // LOAD MANHOLE DATA
  // =====================================

  useEffect(() => {
    if (!isLoggedIn) return;

    try {
      setLoading(true);

      const nodes = Array.isArray(manholesDataFile)
        ? manholesDataFile
        : [manholesDataFile];

      setManholesList(nodes);

      // Select the first manhole by default
      if (nodes.length > 0) {
        setSelectedManhole(nodes[0]);
      } else {
        setSelectedManhole(null);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to load manhole data:", err);

      setError("Failed to load local manhole data");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const loadDeviceDetails = useCallback(async () => {
    if (deviceDetailsRequest.current) return;

    const controller = new AbortController();
    deviceDetailsRequest.current = controller;
    setDeviceDetailsLoading(true);
    setDeviceDetailsError(null);

    try {
      const response = await fetch("http://manhole.local/DL_001/data", {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Device data request failed (${response.status})`);
      }

      const data = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        data.manhole_id !== "DL_001"
      ) {
        throw new Error("Device returned invalid data for DL_001");
      }

      setDeviceManhole(data);
    } catch (requestError) {
      if (controller.signal.aborted) return;

      console.error("Failed to load DL_001 device data:", requestError);
      setDeviceDetailsError(
        "Failed to load DL_001 device data. Check that the device is reachable."
      );
    } finally {
      if (deviceDetailsRequest.current === controller) {
        deviceDetailsRequest.current = null;
        setDeviceDetailsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (
      !isLoggedIn ||
      activeTab !== "details" ||
      selectedManhole?.manhole_id !== "DL_001"
    ) {
      return;
    }

    const refreshId = window.setTimeout(loadDeviceDetails, 0);
    const pollId = window.setInterval(loadDeviceDetails, 3000);

    return () => {
      window.clearTimeout(refreshId);
      window.clearInterval(pollId);
      deviceDetailsRequest.current?.abort();
      deviceDetailsRequest.current = null;
    };
  }, [isLoggedIn, activeTab, selectedManhole?.manhole_id, loadDeviceDetails]);

  const handleManholeSelect = (node) => {
    setSelectedManhole(node);

    if (node.manhole_id === "DL_001") {
      if (!deviceManhole && !deviceDetailsLoading) {
        loadDeviceDetails();
      }
      return;
    }

    deviceDetailsRequest.current?.abort();
    deviceDetailsRequest.current = null;
    setDeviceDetailsLoading(false);
    setDeviceDetailsError(null);
  };

  const handleDetailsTabClick = () => {
    setActiveTab("details");

    if (
      selectedManhole?.manhole_id === "DL_001" &&
      !deviceManhole &&
      !deviceDetailsLoading
    ) {
      loadDeviceDetails();
    }
  };

  // =====================================
  // LOGIN SCREEN
  // =====================================

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => {
          setIsLoggedIn(true);
          setActiveTab("dashboard");
          loadDeviceDetails();
        }}
      />
    );
  }

  // =====================================
  // MAIN APPLICATION
  // =====================================

  return (
    <div className="dashboard-layout">
      {/* =================================
          SIDEBAR
      ================================= */}

      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        {/* Sidebar Top */}
        <div className="sidebar-top-section">
          <div className="sidebar-top">
            {!isCollapsed && <div className="sidebar-logo">Smart Manhole</div>}

            <button
              className="toggle-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div className="sidebar-menu">
            {/* Dashboard Button */}
            <button
              className={`sidebar-item ${
                activeTab === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard size={20} />

              {!isCollapsed && <span>Dashboard</span>}
            </button>

            {/* Manhole Details Button */}
            <button
              className={`sidebar-item ${
                activeTab === "details" ? "active" : ""
              }`}
              onClick={handleDetailsTabClick}
            >
              <Activity size={20} />

              {!isCollapsed && <span>Manhole Details</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-brand-box">
              <h4 className="brand-title">D-tech</h4>
            </div>
          )}

          <button className="logout-btn" onClick={() => setIsLoggedIn(false)}>
            <LogOut size={20} />

            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* =================================
          MAIN CONTENT AREA
      ================================= */}

      <main className="content-area">
        {/* DASHBOARD PAGE */}

        {activeTab === "dashboard" ? (
          <Dashboard
            manholes={manholesList}
            deviceManhole={deviceManhole}
            onSelectManhole={(node) => {
              handleManholeSelect(node);
              setActiveTab("details");
            }}
          />
        ) : (
          /* MANHOLE DETAILS PAGE */

          <div className="main-content">
            {/* MAP SECTION */}

            <div className="map-wrapper">
              <div className="map-card">
                <GoogleMap
                  manholes={manholesList}
                  onSelectManhole={(node) => {
                    handleManholeSelect(node);
                  }}
                />
              </div>
            </div>

            {/* DIAGNOSTICS SECTION */}

            <div className="details-wrapper">
              {loading && (
                <div style={{ padding: "20px" }}>Loading data...</div>
              )}

              {error && (
                <div
                  style={{
                    padding: "20px",
                    color: "red",
                  }}
                >
                  {error}
                </div>
              )}

              {!loading &&
                !error &&
                (selectedManhole?.manhole_id === "DL_001" ? (
                  !deviceManhole && deviceDetailsLoading ? (
                    <div className="details-loading-state" role="status">
                      <span className="loading-spinner" aria-hidden="true" />
                      <span>Loading DL_001 device data...</span>
                    </div>
                  ) : !deviceManhole && deviceDetailsError ? (
                    <div
                      role="alert"
                      style={{ padding: "20px", color: "red" }}
                    >
                      {deviceDetailsError}
                    </div>
                  ) : deviceManhole ? (
                    <>
                      {deviceDetailsError && (
                        <div
                          role="alert"
                          style={{ padding: "12px 20px", color: "#b45309" }}
                        >
                          {deviceDetailsError} Showing the last received
                          readings.
                        </div>
                      )}
                      <ManholeDetails manhole={deviceManhole} />
                    </>
                  ) : (
                    <div className="details-loading-state" role="status">
                      <span className="loading-spinner" aria-hidden="true" />
                      <span>Loading DL_001 device data...</span>
                    </div>
                  )
                ) : (
                  <ManholeDetails
                    manhole={selectedManhole || manholesList[0] || null}
                  />
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
