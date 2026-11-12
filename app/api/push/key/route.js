import { pushConfigured } from "../../../lib/pushStore";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!pushConfigured()) return Response.json({ configured: false }, { status: 503 });
  return Response.json({ configured: true, publicKey: process.env.VAPID_PUBLIC_KEY });
}
