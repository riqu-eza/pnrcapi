// /lib/analytics.ts

export async function trackAPICall(
  endpoint: string,
  method: string,
  duration: number,
  status: number
) {
  // Send to analytics service (e.g., Vercel Analytics, Datadog, New Relic)
  await fetch('https://analytics.example.com/api/track', {
    method: 'POST',
    body: JSON.stringify({
      endpoint,
      method,
      duration,
      status,
      timestamp: new Date().toISOString(),
    }),
  });
}