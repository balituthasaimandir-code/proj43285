import { createHash } from "node:crypto";
import { pushConfigured, redisCommand } from "../../../lib/pushStore";

export const dynamic = "force-dynamic";

function subscriptionId(endpoint) {
  return createHash("sha256").update(endpoint).digest("hex");
}

export async function POST(request) {
  if (!pushConfigured()) return Response.json({ error: "Background push is not configured yet." }, { status: 503 });
  try {
    const { subscription, latitude, longitude } = await request.json();
    if (!subscription?.endpoint?.startsWith("https://") || !subscription.keys?.p256dh || !subscription.keys?.auth || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return Response.json({ error: "A valid push subscription and location are required." }, { status: 400 });
    }
    const id = subscriptionId(subscription.endpoint);
    let knownEventIds = null;
    try {
      const origin = process.env.APP_BASE_URL || "https://saferouteplus.vercel.app";
      const params = new URLSearchParams({ lat: latitude, lon: longitude, radius: "500" });
      const response = await fetch(`${origin}/api/nearby?${params}`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        knownEventIds = (data.events || []).map((event) => event.id);
      }
    } catch {}
    const record = { subscription, latitude, longitude, radiusKm: 500, knownEventIds, createdAt: new Date().toISOString() };
    await redisCommand(["SET", `saferoute:push:sub:${id}`, JSON.stringify(record)]);
    await redisCommand(["SADD", "saferoute:push:subscriptions", id]);
    return Response.json({ ok: true, radiusKm: 500 });
  } catch {
    return Response.json({ error: "Could not save the notification subscription." }, { status: 503 });
  }
}

export async function DELETE(request) {
  if (!pushConfigured()) return Response.json({ ok: true });
  try {
    const { endpoint } = await request.json();
    if (!endpoint?.startsWith("https://")) return Response.json({ error: "A valid subscription endpoint is required." }, { status: 400 });
    const id = subscriptionId(endpoint);
    await Promise.all([
      redisCommand(["DEL", `saferoute:push:sub:${id}`]),
      redisCommand(["SREM", "saferoute:push:subscriptions", id]),
    ]);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not remove the notification subscription." }, { status: 503 });
  }
}
