const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function pushConfigured() {
  return Boolean(REDIS_URL && REDIS_TOKEN && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.CRON_SECRET);
}

export async function redisCommand(command) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error("Push storage is not configured.");
  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || "Push storage request failed.");
  return result.result;
}
