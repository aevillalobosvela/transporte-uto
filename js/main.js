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

document.getElementById("searchStreet").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchStreet();
});

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
      }
    } catch (err) {
      console.error(`Error al cargar rutas de ${period}:`, err);
    }
  }
}

loadAllRoutes();

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
  } else if (routeType === "both") {
    if (period === "morning") {
      routesToShow = [
        ...(routesData.route1?.filter(
          (r) => r.name?.includes("1A") || r.name?.includes("1B")
        ) || []),
        ...(routesData.route2?.filter(
          (r) => r.name?.includes("2A") || r.name?.includes("2B")
        ) || []),
      ];
    } else if (period === "midday") {
      routesToShow = [
        ...(routesData.route1?.filter(
          (r) => r.name?.includes("1C") || r.name?.includes("1D")
        ) || []),
        ...(routesData.route2?.filter(
          (r) => r.name?.includes("2C") || r.name?.includes("2D")
        ) || []),
      ];
    } else if (period === "evening") {
      routesToShow = [
        ...(routesData.route1?.filter(
          (r) => r.name?.includes("1E") || r.name?.includes("1F")
        ) || []),
        ...(routesData.route2?.filter(
          (r) => r.name?.includes("2E") || r.name?.includes("2F")
        ) || []),
      ];
    }
    if (routesToShow.length === 0) {
      routesToShow = [
        ...(routesData.route1 || []),
        ...(routesData.route2 || []),
      ];
    }
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
            <div class="legend-header">
                <div class="legend-color" style="background-color: ${
                  route.color || "#3b82f6"
                };"></div>
                <div class="legend-name">${route.name || "Ruta"}</div>
            </div>
            <div class="legend-details">
                <div class="legend-row">
                    <span class="legend-icon">🚏</span>
                    <strong>Salida:</strong> ${route.start || "No especificado"}
                </div>
                <div class="legend-row">
                    <span class="legend-icon">🏁</span>
                    <strong>Llegada:</strong> ${route.end || "No especificado"}
                </div>
                <div class="legend-row">
                    <span class="legend-icon">${
                      route.direction === "Ida"
                        ? "➡️"
                        : route.direction === "Vuelta"
                        ? "⬅️"
                        : "🔄"
                    }</span>
                    <strong>Dirección:</strong> ${
                      route.direction || "No especificado"
                    }
                </div>
                <div class="legend-row">
                    <span class="legend-icon">⏰</span>
                    <strong>Horario:</strong> ${
                      route.schedule || "No especificado"
                    }
                </div>
            </div>
        `;
    legendContent.appendChild(item);
  });

  document.getElementById("legendPanel").style.display = "block";
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
  document.getElementById("legendPanel").style.display = "none";
}
faculties.forEach((fac) => {
  const marker = L.marker([fac.lat, fac.lng], {
    icon: L.divIcon({
      className: "custom-marker facultad-marker",
      html: `<div style="background-color: ${fac.color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); font-size: 14px;">🎓</div>`,
      iconSize: [30, 30],
    }),
  }).addTo(map);
  marker.bindPopup(`<b>🎓 ${fac.name}</b>`);
});
