import React from 'react';
 
export default function Login({ onLogin }) {
  return (
    <div className="login-overlay">
      <div className="login-card">
        <h1>Smart Manhole System</h1>
        <p>Click below to enter the live telemetry and monitoring dashboard.</p>
        <button onClick={onLogin} className="login-btn">
          Log In
        </button>
      </div>
    </div>
  );
}