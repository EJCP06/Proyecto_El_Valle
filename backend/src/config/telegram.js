const fetch = require('node-fetch');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED === 'true';

const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function enviarMensaje(chatId, texto) {
  if (!TELEGRAM_ENABLED || !TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram no está configurado o deshabilitado');
    return { ok: false, error: 'Telegram no configurado' };
  }
  try {
    const res = await fetch(`${apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Error enviando mensaje Telegram:', data);
    }
    return data;
  } catch (err) {
    console.error('Error de red enviando mensaje Telegram:', err);
    return { ok: false, error: err.message };
  }
}

function getBotUsername() {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const payload = TELEGRAM_BOT_TOKEN.split(':')[0];
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  enviarMensaje,
  getBotUsername,
  TELEGRAM_ENABLED,
  TELEGRAM_BOT_TOKEN
};