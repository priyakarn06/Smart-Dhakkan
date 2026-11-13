import { useEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import { CircleLetterM } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function GoogleMap({
  manholes = [],
  selectedManhole,
  onSelectManhole,
}) {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const onSelectManholeRef = useRef(onSelectManhole);

  useEffect(() => {
    onSelectManholeRef.current = onSelectManhole;
  }, [onSelectManhole]);

  useEffect(() => {
    if (!manholes || manholes.length === 0) return;

    const centerLat = manholes[0]?.location?.lat ?? 28.6139;
    const centerLng = manholes[0]?.location?.lng ?? 77.209;

    if (!mapRef.current) {
      const map = L.map("map-element", {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([centerLat, centerLng], 14);

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
    }

    const map = mapRef.current;

    // Clear old markers before updating
    Object.values(markersRef.current).forEach(marker => marker.remove());
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
        const icon = L.divIcon({
          html: renderToString(
            <CircleLetterM size={32} color="#35495e" fill={markerColor} />,
          ),
          className: "custom-manhole-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindTooltip(node.manhole_id, {
          className: "manhole-id-tooltip",
          direction: "top",
          offset: [0, -12],
        });

        marker.on('click', () => {
          onSelectManholeRef.current?.(node);
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
        markersRef.current = {};
      }
    };
  }, [manholes]);

  useEffect(() => {
    const map = mapRef.current;
    const location =
      selectedManhole?.location ||
      manholes.find((node) => node.manhole_id === selectedManhole?.manhole_id)
        ?.location;

    if (!map || location?.lat == null || location?.lng == null) return;

    map.setView([location.lat, location.lng], 17, { animate: true });
  }, [manholes, selectedManhole]);

  return (
    <div
      id="map-element"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}