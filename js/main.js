const map = L.map("map", {
  center: [-17.964, -67.1],
  zoom: 15,
  minZoom: 14,
  maxZoom: 18,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let currentRoutes = [];
let polylines = [];
let markers = [];
let allLoadedRoutes = [];

const faculties = [
  {
    name: "Facultad Nacional de Ingeniería Sud",
    lat: -17.99007952745332,
    lng: -67.13522576093614,
    color: "#8b5cf6",
  },
  {
    name: "Facultad Nacional de Ingeniería Centro",
    lat: -17.974860148876175,
    lng: -67.1116825583938,
    color: "#8b5cf6",
  },
  {
    name: "Facultad Ciencias Económicas Financieras y Adminitrativas Centro",
    lat: -17.967532838264944,
    lng: -67.11128955546228,
    color: "#8b5cf6",
  },
  {
    name: "Facultad de Arquitectura y Urbanismo",
    lat: -17.96812110516869,
    lng: -67.11149611787678,
    color: "#8b5cf6",
  },
  {
    name: "Facultad de Derecho Ciencias Politicas y Sociales",
    lat: -17.965161039656483,
    lng: -67.10724403317757,
    color: "#8b5cf6",
  },
  {
    name: "Facultad Técnica",
    lat: -17.95393190433168,
    lng: -67.10719139049252,
    color: "#8b5cf6",
  },
  {
    name: "Facultad Ciencias Económicas Financieras y Adminitrativas Centro",
    lat: -17.955992039171235,
    lng: -67.112109936515,
    color: "#8b5cf6",
  },
  {
    name: "Facultad Ciencias de la Salud",
    lat: -17.957466419055937,
    lng: -67.12148593042657,
    color: "#8b5cf6",
  },
  {
    name: "Facultad de Ciencias Agrarias y Naturales",
    lat: -17.994066,
    lng: -67.135465,
    color: "#8b5cf6",
  },
];

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("active");
});

// Cerrar menú al hacer clic fuera
document.addEventListener("click", (e) => {
  const menu = document.getElementById("mobileMenu");
  const toggle = document.getElementById("menuToggle");
  if (menu.classList.contains("active") && !menu.contains(e.target) && e.target !== toggle) {
    menu.classList.remove("active");
  }
});

document.getElementById("searchStreet").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    closeAutocomplete();
    searchStreet();
  }
});

// Autocompletado
const searchInput = document.getElementById("searchStreet");
const autocompleteList = document.getElementById("autocompleteList");
let highlightedIndex = -1;

searchInput.addEventListener("input", () => {
  const val = searchInput.value.trim().toLowerCase();
  highlightedIndex = -1;
  if (!val || allLoadedRoutes.length === 0) { closeAutocomplete(); return; }

  const allStreets = [...new Set(
    allLoadedRoutes.flatMap((r) => r.streets || [])
  )];
  const matches = allStreets.filter((s) => s.toLowerCase().includes(val)).slice(0, 8);

  if (matches.length === 0) { closeAutocomplete(); return; }

  autocompleteList.innerHTML = "";
  matches.forEach((street) => {
    const div = document.createElement("div");
    div.textContent = street;
    div.addEventListener("mousedown", () => {
      searchInput.value = street;
      closeAutocomplete();
      searchStreet();
    });
    autocompleteList.appendChild(div);
  });
  autocompleteList.style.display = "block";
});

searchInput.addEventListener("keydown", (e) => {
  const items = autocompleteList.querySelectorAll("div");
  if (e.key === "ArrowDown") {
    highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedIndex));
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    highlightedIndex = Math.max(highlightedIndex - 1, 0);
    items.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedIndex));
    e.preventDefault();
  } else if (e.key === "Escape") {
    closeAutocomplete();
  }
});

searchInput.addEventListener("blur", () => setTimeout(closeAutocomplete, 150));

function closeAutocomplete() {
  autocompleteList.style.display = "none";
  autocompleteList.innerHTML = "";
  highlightedIndex = -1;
}

function resetMap() {
  const hour = new Date().getHours();
  const defaultPeriod = hour < 11 ? "morning" : hour < 15 ? "midday" : "evening";
  showRoutes(defaultPeriod, "both");
  searchInput.value = "";
  closeAutocomplete();
}

async function loadAllRoutes() {
  const periods = ["morning", "midday", "evening"];
  allLoadedRoutes = [];

  for (const period of periods) {
    try {
      const response = await fetch(`data/routes/${period}.json`);
      if (response.ok) {
        const routesData = await response.json();

        if (routesData.route1) {
          routesData.route1.forEach((r) => (r.period = period));
          allLoadedRoutes.push(...routesData.route1);
        }
        if (routesData.route2) {
          routesData.route2.forEach((r) => (r.period = period));
          allLoadedRoutes.push(...routesData.route2);
        }
        if (routesData.route3) {
          routesData.route3.forEach((r) => (r.period = period));
          allLoadedRoutes.push(...routesData.route3);
        }
      }
    } catch (err) {
      console.error(`Error al cargar rutas de ${period}:`, err);
    }
  }
}

loadAllRoutes().then(() => {
  // Mostrar ambas rutas del turno actual por defecto
  const hour = new Date().getHours();
  const defaultPeriod = hour < 11 ? "morning" : hour < 15 ? "midday" : "evening";
  showRoutes(defaultPeriod, "both");
  setActiveButton(defaultPeriod, "both");
});

async function showRoutes(period, routeType) {
  clearMap();

  let routesData;
  try {
    const response = await fetch(`data/routes/${period}.json`);
    if (!response.ok) throw new Error(`Archivo no encontrado: ${period}.json`);
    routesData = await response.json();
  } catch (err) {
    console.error("Error al cargar las rutas:", err);
    showMessage("❌ Error al cargar las rutas. Verifica los archivos JSON.");
    return;
  }

  let routesToShow = [];

  if (routeType === "route1") {
    routesToShow = routesData.route1 || [];
  } else if (routeType === "route2") {
    routesToShow = routesData.route2 || [];
  } else if (routeType === "route3") {
    routesToShow = routesData.route3 || [];
  } else if (routeType === "both") {
    routesToShow = [
      ...(routesData.route1 || []),
      ...(routesData.route2 || []),
      ...(routesData.route3 || []),
    ];
  }

  if (routesToShow.length === 0) {
    showMessage("⚠️ No hay rutas definidas para esta selección.");
    return;
  }

  currentRoutes = routesToShow;
  routesToShow.forEach((route) => drawRoute(route));

  if (routesToShow.length > 0 && routesToShow[0]?.points) {
    const allPoints = routesToShow.flatMap((r) => r.points || []);
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  updateLegend(routesToShow);
  document.getElementById("mobileMenu").classList.remove("active");
  setActiveButton(period, routeType);

  const periodNames = {
    morning: "Mañana",
    midday: "Mediodía",
    evening: "Tarde",
  };
  const routeNames =
    routeType === "route1"
      ? "Ruta 1"
      : routeType === "route2"
      ? "Ruta 2"
      : "Ambas Rutas";
  showMessage(`✅ Mostrando ${routeNames} - ${periodNames[period]}`);
}

function makeEndpointIcon(emoji, color) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function drawRoute(route) {
  const points = route.points || [];
  if (points.length === 0) return;
  const polyline = L.polyline(points, {
    color: route.color || "#3b82f6",
    weight: 6,
    opacity: 0.8,
  }).addTo(map);

  polyline.bindPopup(`
        <div style="font-family: 'Segoe UI', sans-serif;">
            <strong style="font-size: 15px;">${
              route.name || "Ruta"
            }</strong><br>
            <span style="font-size: 12px; color: #64748b;">
                ${route.direction || "Sin dirección"}<br>
                ${route.schedule || "Sin horario"}<br>
                <strong>Salida:</strong> ${route.start || "N/A"}<br>
                <strong>Llegada:</strong> ${route.end || "N/A"}
            </span>
        </div>
    `);

  polylines.push(polyline);

  // Marcador de inicio (🚏) y fin (🏁)
  const color = route.color || "#3b82f6";
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  const startMarker = L.marker(firstPoint, { icon: makeEndpointIcon("🚏", color) })
    .addTo(map)
    .bindPopup(`<b>${route.name}</b><br>🚏 Salida: ${route.start || "N/A"}`);
  const endMarker = L.marker(lastPoint, { icon: makeEndpointIcon("🏁", color) })
    .addTo(map)
    .bindPopup(`<b>${route.name}</b><br>🏁 Llegada: ${route.end || "N/A"}`);

  markers.push(startMarker, endMarker);

  const arrowInterval = Math.max(1, Math.floor(points.length / 8)); // Aproximadamente 8 flechas por ruta

  for (let i = arrowInterval; i < points.length; i += arrowInterval) {
    const point1 = points[i - 1];
    const point2 = points[i];

    const angle =
      (Math.atan2(point2[0] - point1[0], point2[1] - point1[1]) * 180) /
      Math.PI;
    const arrowIcon = L.divIcon({
      className: "arrow-icon",
      html: `
                <div style="
                    transform: rotate(${angle}deg);
                    color: ${route.color || "#3b82f6"};
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
                ">
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <path d="M10 2 L16 10 L10 9 L4 10 Z" fill="currentColor" stroke="white" stroke-width="1"/>
                    </svg>
                </div>
            `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const arrowMarker = L.marker([point2[0], point2[1]], {
      icon: arrowIcon,
      interactive: false,
    }).addTo(map);

    markers.push(arrowMarker);
  }
}

function updateLegend(routes) {
  const legendContent = document.getElementById("legendContent");
  legendContent.innerHTML = "";

  routes.forEach((route) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.style.borderLeftColor = route.color || "#3b82f6";

    item.innerHTML = `
      <div class="legend-item-header">
        <div class="legend-color" style="background-color:${route.color || "#3b82f6"};"></div>
        <div class="legend-name">${route.name || "Ruta"}</div>
      </div>
      <div class="legend-details">
        <div class="legend-row">🚏 <strong>Salida:</strong> ${route.start || "N/A"}</div>
        <div class="legend-row">🏁 <strong>Llegada:</strong> ${route.end || "N/A"}</div>
        <div class="legend-row">${route.direction === "Ida" ? "➡️" : route.direction === "Vuelta" ? "⬅️" : "🔄"} <strong>Dirección:</strong> ${route.direction || "N/A"}</div>
        <div class="legend-row">⏰ <strong>Horario:</strong> ${route.schedule || "N/A"}</div>
      </div>
    `;
    legendContent.appendChild(item);
  });

  document.getElementById("legendPanel").classList.add("visible");
}

function searchStreet() {
  const searchTerm = document
    .getElementById("searchStreet")
    .value.trim()
    .toLowerCase();
  if (!searchTerm) {
    showMessage("⚠️ Por favor ingresa una calle para buscar.");
    return;
  }
  let foundRoutes = [];
  allLoadedRoutes.forEach((route) => {
    if (
      route.streets?.some((street) => street.toLowerCase().includes(searchTerm))
    ) {
      foundRoutes.push(route);
    }
  });

  if (foundRoutes.length === 0) {
    showMessage(`❌ La calle "${searchTerm}" no se encontró en ninguna ruta.`);
    return;
  }
  clearMap();
  currentRoutes = foundRoutes;
  foundRoutes.forEach((route) => drawRoute(route));
  const allPoints = foundRoutes.flatMap((r) => r.points || []);
  if (allPoints.length > 0) {
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  updateLegend(foundRoutes);

  const routeNames = foundRoutes.map((r) => r.name).join(", ");
  showMessage(
    `✅ "${searchTerm}" encontrada en ${foundRoutes.length} ruta(s): ${routeNames}`
  );
}

function setActiveButton(period, routeType) {
  document.querySelectorAll(".btn").forEach((b) => b.classList.remove("active-btn"));
  const typeIndex = { route1: 0, route2: 1, route3: 2, both: 3 };
  const sections = document.querySelectorAll(".menu-section");
  const periodIndex = { morning: 0, midday: 1, evening: 2 };
  const section = sections[periodIndex[period]];
  if (section) {
    const btns = section.querySelectorAll(".btn");
    if (btns[typeIndex[routeType]]) btns[typeIndex[routeType]].classList.add("active-btn");
  }
}

function showMessage(text) {
  const el = document.getElementById("searchMessage");
  el.textContent = text;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 5000);
}

function clearMap() {
  polylines.forEach((p) => map.removeLayer(p));
  markers.forEach((m) => map.removeLayer(m));
  polylines = [];
  markers = [];
  document.getElementById("legendPanel").classList.remove("visible");
}
faculties.forEach((fac) => {
  const marker = L.marker([fac.lat, fac.lng], {
    icon: L.divIcon({
      className: "custom-marker facultad-marker",
      html: `<div style="background:#033f86;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(3,63,134,0.45);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L2 9l10 6 10-6-10-6z" fill="white"/>
          <path d="M2 9v6M22 9v6M6 11v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    }),
  }).addTo(map);
  marker.bindPopup(`<b style="color:#033f86">🎓 ${fac.name}</b>`);
});
