// Bot de Telegram con long-polling para vinculación de usuarios
// Este archivo se importa en index.js al arrancar el servidor

const fetch = require('node-fetch');
const { Pool } = require('pg');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED === 'true';

if (!TELEGRAM_ENABLED || !TELEGRAM_BOT_TOKEN) {
  console.log('Telegram deshabilitado: no se inicia el bot');
  module.exports = { startBot: () => {}, stopBot: () => {} };
  // Exportar funciones vacías
  module.exports.startBot = () => {};
  module.exports.stopBot = () => {};
} else {
  const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  // En memoria: códigos de vinculación temporales { email: { code, chatId, expires } }
  const pendingLinks = new Map();

  // Limpiar códigos expirados cada 5 min
  setInterval(() => {
    const now = Date.now();
    for (const [email, data] of pendingLinks.entries()) {
      if (data.expires < now) pendingLinks.delete(email);
    }
  }, 5 * 60 * 1000);

  async function enviarMensaje(chatId, texto) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML' })
      });
      return res.json();
    } catch (err) {
      console.error('Error enviando mensaje Telegram:', err);
      return { ok: false };
    }
  }

  async function handleUpdate(update) {
    const message = update.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();
    const userId = message.from?.id;
    const username = message.from?.username;

    // Comando /start <email>
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      if (parts.length >= 2) {
        const email = parts[1].toLowerCase().trim();
        // Buscar usuario por email
        try {
          const result = await pool.query(
            'SELECT id, nombre, telegram_chat_id FROM usuarios WHERE email = $1',
            [email]
          );
          if (result.rows.length === 0) {
            await enviarMensaje(chatId, `❌ No existe un usuario con el correo <b>${email}</b>. Verifica el email o contacta al administrador.`);
            return;
          }
          const usuario = result.rows[0];
          if (usuario.telegram_chat_id) {
            await enviarMensaje(chatId, `✅ Este correo ya está vinculado a Telegram.`);
            return;
          }
          // Generar código de 6 dígitos
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          pendingLinks.set(email, {
            code,
            chatId,
            expires: Date.now() + 10 * 60 * 1000 // 10 min
          });
          await enviarMensaje(chatId,
            `✅ Código de vinculación generado para <b>${email}</b>.\n\n` +
            `Tu código es: <b>${code}</b>\n\n` +
            `Ingresa este código en la app (Módulo Usuarios → Vincular Telegram) para completar la vinculación.\n` +
            `El código expira en 10 minutos.`
          );
        } catch (err) {
          console.error('Error en /start:', err);
          await enviarMensaje(chatId, '❌ Error interno. Intenta más tarde.');
        }
      } else {
        await enviarMensaje(chatId,
          'Bienvenido al bot del Consejo Comunal El Valle.\n\n' +
          'Para vincular tu cuenta, envía:\n' +
          '<code>/start tu@email.com</code>\n\n' +
          'Recibirás un código de 6 dígitos para ingresar en la app.'
        );
      }
      return;
    }

    // Si no es comando, ignorar
  }

  let offset = 0;
  let isRunning = false;

  async function pollUpdates() {
    if (!isRunning) return;
    try {
      const res = await fetch(`${process.env.TELEGRAM_API_URL || `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset, timeout: 30, allowed_updates: ['message'] })
      });
      const data = await res.json();
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (err) {
      console.error('Error polling Telegram:', err);
    }
    if (isRunning) setTimeout(pollUpdates, 100);
  }

  function startBot() {
    if (isRunning) return;
    isRunning = true;
    console.log('Bot de Telegram iniciado (long-polling)');
    pollUpdates();
  }

  function stopBot() {
    isRunning = false;
    console.log('Bot de Telegram detenido');
  }

  module.exports = { startBot, stopBot, pendingLinks, pool };
}