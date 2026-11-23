const out = (code, error) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(error ? { error } : { ok: true }) });
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return out(405, 'Method not allowed');
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token) return out(500, 'Setup: TELEGRAM_BOT_TOKEN is missing in Netlify');
  if (!chat) return out(500, 'Setup: TELEGRAM_CHAT_ID is missing in Netlify');
  let d;
  try { d = JSON.parse(event.body || '{}'); } catch { return out(400, 'Bad request'); }
  if (d.website) return out(200);
  if (!d.image || typeof d.image !== 'string' || d.image.length > 4000000) return out(400, 'Screenshot is missing or too large');
  const c = (v, n = 120) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);
  const caption = [
    'NEW WEBINAR REGISTRATION',
    'Name: ' + c(d.name), 'WhatsApp: ' + c(d.phone), 'Email: ' + c(d.email),
    'Experience: ' + c(d.exp), 'Deriv account: ' + c(d.acc),
    'Help needed: ' + (c(d.help, 300) || 'None')
  ].join('\n').slice(0, 1000);
  const form = new FormData();
  form.append('chat_id', chat);
  form.append('caption', caption);
  form.append('photo', new Blob([Buffer.from(d.image, 'base64')], { type: 'image/jpeg' }), 'screenshot.jpg');
  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendPhoto', { method: 'POST', body: form });
    if (!r.ok) {
      let desc = '';
      try { desc = (await r.json()).description || ''; } catch {}
      return out(502, 'Telegram: ' + (desc || r.status));
    }
    return out(200);
  } catch { return out(502, 'Could not reach Telegram'); }
};
