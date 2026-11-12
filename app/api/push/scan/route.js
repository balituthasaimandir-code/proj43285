import { sendNotification, setVapidDetails } from "web-push";
import { pushConfigured, redisCommand } from "../../../lib/pushStore";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function nearbyUrl(record) {
  const origin = process.env.APP_BASE_URL || "https://saferouteplus.vercel.app";
  const params = new URLSearchParams({ lat: record.latitude, lon: record.longitude, radius: "500" });
  return `${origin}/api/nearby?${params}`;
}

export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) return Response.json({ error: "Background push is not configured." }, { status: 503 });

  setVapidDetails(process.env.VAPID_SUBJECT || "mailto:saferouteplus@users.noreply.github.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  let ids;
  try { ids = await redisCommand(["SMEMBERS", "saferoute:push:subscriptions"]); }
  catch { return Response.json({ error: "Could not read push subscriptions." }, { status: 503 }); }

  let checked = 0;
  let sent = 0;
  let failed = 0;
  for (const id of ids || []) {
    const key = `saferoute:push:sub:${id}`;
    try {
      const stored = await redisCommand(["GET", key]);
      if (!stored) { await redisCommand(["SREM", "saferoute:push:subscriptions", id]); continue; }
      const record = JSON.parse(stored);
      const response = await fetch(nearbyUrl(record), { cache: "no-store" });
      if (!response.ok) throw new Error("Nearby hazard feed unavailable");
      const data = await response.json();
      checked += 1;
      const events = data.events || [];
      const eventIds = events.map((event) => event.id);

      if (!Array.isArray(record.knownEventIds)) {
        record.knownEventIds = eventIds;
        await redisCommand(["SET", key, JSON.stringify(record)]);
        continue;
      }

      const known = new Set(record.knownEventIds);
      const newEvents = events.filter((event) => !known.has(event.id)).slice(0, 5);
      for (const event of newEvents) {
        const payload = JSON.stringify({
          title: "Nearby hazard report",
          body: `${event.name}: ${event.detail}. About ${event.distanceKm} km from your saved location.`,
          url: "/?notification=hazard",
          tag: event.id,
        });
        try {
          await sendNotification(record.subscription, payload, { TTL: 300 });
          known.add(event.id);
          sent += 1;
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            await redisCommand(["DEL", key]);
            await redisCommand(["SREM", "saferoute:push:subscriptions", id]);
            break;
          }
          failed += 1;
        }
      }
      record.knownEventIds = [...known].slice(-500);
      await redisCommand(["SET", key, JSON.stringify(record)]);
    } catch {
      failed += 1;
    }
  }
  return Response.json({ ok: true, checked, sent, failed, checkedAt: new Date().toISOString() });
}
