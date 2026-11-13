import { jsPDF } from "jspdf";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return String(value);
};

const getSewageDistance = (manhole) => {
  const distance = manhole.sewage_sensor?.distance_mm;
  return distance == null ? "Out of range" : `${distance} mm`;
};

const addManholeReportPage = (document, manhole) => {
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 18;
  let cursorY = 20;

  const addText = (text, options = {}) => {
    const fontSize = options.fontSize || 10;
    const lineHeight = fontSize * 0.55;
    const lines = document.splitTextToSize(String(text), contentWidth);

    if (cursorY + lines.length * lineHeight > pageHeight - bottomMargin) {
      document.addPage();
      cursorY = 20;
    }

    document.setFont("helvetica", options.bold ? "bold" : "normal");
    document.setFontSize(fontSize);
    if (options.color) document.setTextColor(...options.color);
    document.text(lines, margin, cursorY);
    cursorY += lines.length * lineHeight + (options.gap ?? 2);
    document.setTextColor(30, 41, 59);
  };

  const addSection = (title) => {
    cursorY += 2;
    addText(title, { bold: true, fontSize: 12, color: [53, 73, 94], gap: 3 });
    document.setDrawColor(226, 232, 240);
    document.line(margin, cursorY - 1, pageWidth - margin, cursorY - 1);
    cursorY += 3;
  };

  const addRow = (label, value) => {
    addText(`${label}: ${formatValue(value)}`);
  };

  const generatedAt = new Date().toLocaleString();
  const gases = Object.entries(manhole.gas_sensor?.estimated_ppm || {});
  const sensors = Object.entries(manhole.sensor_health || {});
  const orientation = manhole.orientation || {};
  const system = manhole.system || {};
  const location = manhole.location || {};

  addText("SMART MANHOLE TELEMETRY REPORT", {
    bold: true,
    fontSize: 18,
    color: [53, 73, 94],
    gap: 4,
  });
  addText(`Manhole ID: ${formatValue(manhole.manhole_id)}`, {
    bold: true,
    fontSize: 13,
  });
  addText(`Generated: ${generatedAt}`, { fontSize: 9, color: [100, 116, 139] });

  addSection("Location and Status");
  addRow("Location", location.name);
  addRow(
    "Coordinates",
    location.lat != null && location.lng != null
      ? `${location.lat}, ${location.lng}`
      : null,
  );
  addRow("Status", manhole.status);

  addSection("Gas Sensor");
  addRow("Model", manhole.gas_sensor?.model);
  addRow("Air reference ratio", manhole.gas_sensor?.ratio);
  if (gases.length) {
    gases.forEach(([gas, value]) => addRow(`${gas} (PPM)`, value));
  } else {
    addRow("Gas readings", "Not available");
  }

  addSection("Flood and Water");
  addRow("Flood sensor raw ADC", manhole.flood_sensor?.raw_adc);
  addRow(
    "Water level above manhole",
    manhole.water_level_above_manhole == null
      ? null
      : `${manhole.water_level_above_manhole} cm`,
  );
  addRow("Sewage distance", getSewageDistance(manhole));
  addRow("Flood pressure", manhole.flood_sensor?.pressure_kpa == null
    ? null
    : `${manhole.flood_sensor.pressure_kpa} kPa`);

  addSection("Cover and Movement");
  addRow(
    "Cover position",
    manhole.cover_position ?? orientation.cover_position,
  );
  addRow("Orientation status", orientation.orient_status);
  addRow("Movement detected", orientation.move_status);

  addSection("Sensor Health");
  if (sensors.length) {
    sensors.forEach(([name, healthy]) =>
      addRow(name.replaceAll("_", " "), healthy ? "Online" : "Faulty"),
    );
  } else {
    addRow("Sensor health", "Not available");
  }

  addSection("System");
  addRow(
    "Uptime",
    system.uptime_ms == null ? null : `${Math.floor(system.uptime_ms / 1000)} seconds`,
  );
  addRow("Wi-Fi status", system.wifi_status);
  addRow("Wi-Fi signal", system.wifi_rssi == null ? null : `${system.wifi_rssi} dBm`);
  addRow("Device IP address", system.ip_address);
};

const saveReports = (manholes, filename) => {
  if (manholes.length === 0) {
    throw new Error("There are no manhole records to include in a report.");
  }

  const document = new jsPDF();
  manholes.forEach((manhole, index) => {
    if (index > 0) document.addPage();
    addManholeReportPage(document, manhole);
  });

  document.save(filename);
};

const getDateSuffix = () => new Date().toISOString().slice(0, 10);

export const downloadManholeReport = (manhole) => {
  if (!manhole?.manhole_id) {
    throw new Error("A valid manhole record is required.");
  }

  saveReports(
    [manhole],
    `manhole-${manhole.manhole_id}-report-${getDateSuffix()}.pdf`,
  );
};

export const downloadAllManholeReports = (manholes) => {
  saveReports(manholes, `manhole-reports-${getDateSuffix()}.pdf`);
};
