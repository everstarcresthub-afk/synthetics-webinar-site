exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { statusCode: 500, body: 'Not configured' };
  let d;
  try { d = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Bad request' }; }
  if (d.website) return { statusCode: 200, body: '{"ok":true}' };
  if (!d.image || typeof d.image !== 'string' || d.image.length > 4000000) return { statusCode: 400, body: 'Bad image' };
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
    if (!r.ok) return { statusCode: 502, body: 'Telegram error' };
    return { statusCode: 200, body: '{"ok":true}' };
  } catch { return { statusCode: 502, body: 'Network error' }; }
};
