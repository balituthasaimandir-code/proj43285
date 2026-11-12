const GDACS_FEED = "https://www.gdacs.org/contentdata/xml/gdacs_app_feed.json";
const USGS_QUERY = "https://earthquake.usgs.gov/fdsnws/event/1/query";
export const revalidate = 60;

function distanceKm(lat1, lon1, lat2, lon2) {
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function withinRange(feature, center, radiusKm) {
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const distance = distanceKm(center.latitude, center.longitude, latitude, longitude);
  return distance <= radiusKm ? { latitude, longitude, distanceKm: Math.round(distance) } : null;
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lon"));
  const radiusKm = Number(params.get("radius"));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || ![100, 250, 500].includes(radiusKm)) {
    return Response.json({ error: "Choose a valid location and a radius of 100, 250 or 500 km." }, { status: 400 });
  }

  const now = new Date();
  now.setSeconds(0, 0);
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const usgsUrl = new URL(USGS_QUERY);
  usgsUrl.search = new URLSearchParams({
    format: "geojson",
    latitude: String(latitude),
    longitude: String(longitude),
    maxradiuskm: String(radiusKm),
    starttime: start.toISOString(),
    endtime: now.toISOString(),
    minmagnitude: "2.5",
    orderby: "time",
    limit: "200",
  }).toString();

  const [gdacsResult, usgsResult] = await Promise.allSettled([
    fetch(GDACS_FEED, { next: { revalidate: 60 } }).then((response) => {
      if (!response.ok) throw new Error("GDACS feed unavailable");
      return response.json();
    }),
    fetch(usgsUrl, { next: { revalidate: 60 } }).then((response) => {
      if (!response.ok) throw new Error("USGS feed unavailable");
      return response.json();
    }),
  ]);

  const center = { latitude, longitude };
  const events = [];
  if (gdacsResult.status === "fulfilled") {
    for (const feature of gdacsResult.value.features || []) {
      const nearby = withinRange(feature, center, radiusKm);
      const properties = feature.properties || {};
      if (!nearby || properties.iscurrent === "false" || properties.iscurrent === false) continue;
      const links = properties.url || {};
      events.push({
        id: `gdacs-${properties.eventtype}-${properties.eventid}-${properties.episodeid}`,
        type: properties.eventtype || "Hazard",
        name: properties.name || properties.description || "Reported disaster event",
        detail: properties.alertlevel ? `${properties.alertlevel} alert` : "Active event report",
        alertLevel: properties.alertlevel || "",
        time: properties.datemodified || properties.fromdate || null,
        distanceKm: nearby.distanceKm,
        latitude: nearby.latitude,
        longitude: nearby.longitude,
        source: "GDACS",
        url: links.report || links.details || "https://www.gdacs.org/",
      });
    }
  }

  if (usgsResult.status === "fulfilled") {
    for (const feature of usgsResult.value.features || []) {
      const nearby = withinRange(feature, center, radiusKm);
      if (!nearby) continue;
      const properties = feature.properties || {};
      const duplicate = events.some((event) => event.type === "EQ" && Math.abs(Date.parse(event.time || 0) - (properties.time || 0)) < 3 * 60 * 60 * 1000 && distanceKm(event.latitude, event.longitude, nearby.latitude, nearby.longitude) < 25);
      if (duplicate) continue;
      const magnitude = Number(properties.mag);
      events.push({
        id: `usgs-${feature.id}`,
        type: "EQ",
        name: properties.place || "Earthquake",
        detail: Number.isFinite(magnitude) ? `Magnitude ${magnitude.toFixed(1)}` : "Magnitude not reported",
        alertLevel: "",
        time: properties.time ? new Date(properties.time).toISOString() : null,
        distanceKm: nearby.distanceKm,
        latitude: nearby.latitude,
        longitude: nearby.longitude,
        source: "USGS",
        url: properties.url || "https://earthquake.usgs.gov/earthquakes/map/",
      });
    }
  }

  events.sort((a, b) => a.distanceKm - b.distanceKm);
  return Response.json({
    events,
    radiusKm,
    updatedAt: new Date().toISOString(),
    sources: { gdacs: gdacsResult.status === "fulfilled", usgs: usgsResult.status === "fulfilled" },
  }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}
