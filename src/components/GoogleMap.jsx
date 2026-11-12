import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function GoogleMap({ manholes = [], onSelectManhole }) {
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!manholes || manholes.length === 0) return;

    const centerLat = manholes[0]?.location?.lat || 28.6139;
    const centerLng = manholes[0]?.location?.lng || 77.2090;

    if (!mapRef.current) {
      const map = L.map('map-element', {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([centerLat, centerLng], 14);

      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);
    }

    const map = mapRef.current;

    // Clear old markers before updating
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Direct, highly reliable SVG HTML string for the red map pin
    const redPinSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.3));">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="#ffffff"/>
      </svg>
    `;

    const customPinIcon = L.divIcon({
      html: redPinSvg,
      className: 'custom-red-pin-container',
      iconSize: [40, 40],
      iconAnchor: [20, 40], // Anchors the bottom tip exactly on the coordinates
      popupAnchor: [0, -40]
    });

    // Loop through every manhole and add marker
    manholes.forEach((node) => {
      const lat = node.location?.lat;
      const lng = node.location?.lng;

      if (lat && lng) {
        const marker = L.marker([lat, lng], { icon: customPinIcon }).addTo(map);

        marker.on('click', () => {
          if (onSelectManhole) {
            onSelectManhole(node);
          }
          map.setView([lat, lng], 17, { animate: true });
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
      }
    };
  }, [manholes, onSelectManhole]);

  return (
    <div 
      id="map-element" 
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '12px', 
        overflow: 'hidden' 
      }} 
    />
  );
}