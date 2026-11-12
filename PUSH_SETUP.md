# Closed-app push notification setup

SafeRoutePlus uses Web Push for notifications after the app is closed. Browser permission alone cannot send these: a server must keep each subscription, check hazard feeds, and send encrypted push messages. This project uses Upstash Redis for subscriptions and a GitHub Actions schedule to check every five minutes.

## 1. Create the push keys

Run this in a terminal and keep the private key secret:

```text
npx web-push generate-vapid-keys
```

## 2. Create push storage

Create a Redis database in the Upstash console. Copy its **REST URL** and **REST token**.

## 3. Add Vercel environment variables

In the SafeRoutePlus Vercel project, add these for Production:

| Variable | Value |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `VAPID_PUBLIC_KEY` | Generated VAPID public key |
| `VAPID_PRIVATE_KEY` | Generated VAPID private key |
| `VAPID_SUBJECT` | A contact such as `mailto:you@example.com` |
| `CRON_SECRET` | A long random secret |

Keep the private key, Redis token, and cron secret out of source files and chat. Redeploy after saving the variables.

## 4. Enable the scheduled monitor

In GitHub, open this repository's **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
| --- | --- |
| `PUSH_CRON_SECRET` | The same value as Vercel's `CRON_SECRET` |

Enable GitHub Actions for the repository. The `Nearby hazard push alerts` workflow in `.github/workflows/nearby-hazard-push.yml` checks every five minutes. GitHub can delay scheduled runs during busy periods; public repositories can also have schedules disabled after 60 days without activity.

Once Vercel has redeployed and the workflow is enabled, use the Radar page to allow notifications, locate yourself, and select **Enable automatic alerts**. **Send demo notification** only creates a test notification; it does not report a real hazard.
