const config = require('./config');

async function sendAlert(event) {
  if (!config.alertWebhookUrl) return false;
  try {
    const res = await fetch(config.alertWebhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        service: 'teamvault',
        timestamp: new Date().toISOString(),
        ...event,
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`alert webhook status ${res.status}`);
    return true;
  } catch (err) {
    console.error(JSON.stringify({ type: 'alert_delivery_failed', message: err.message }));
    return false;
  }
}

module.exports = { sendAlert };
