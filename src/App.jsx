import React, { useState, useEffect } from "react";

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

  // =====================================
  // LOGIN SCREEN
  // =====================================

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => {
          setIsLoggedIn(true);
          setActiveTab("dashboard");
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
              onClick={() => setActiveTab("details")}
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
            onSelectManhole={(node) => {
              // Save the clicked manhole
              setSelectedManhole(node);

              // Navigate to Manhole Details page
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
                    setSelectedManhole(node);
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

              {!loading && !error && (
                <ManholeDetails
                  manhole={selectedManhole || manholesList[0] || null}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
