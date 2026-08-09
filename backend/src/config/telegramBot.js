// Bot de Telegram con long-polling para vinculación de usuarios
// Este archivo se importa en index.js al arrancar el servidor

const fetch = require('node-fetch');
const { Pool } = require('pg');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED === 'true';

if (!TELEGRAM_ENABLED || !TELEGRAM_BOT_TOKEN) {
  console.log('Telegram deshabilitado: no se inicia el bot');
  module.exports = { startBot: () => {}, stopBot: () => {}, pool: null };
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  // Estado de conversación en memoria: chatId -> 'awaiting_email'
  const chatStates = new Map();

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Limpiar códigos expirados cada 5 min (en BD)
  setInterval(async () => {
    try {
      await pool.query('DELETE FROM telegram_pending_links WHERE expira_en < NOW()');
    } catch (err) {
      console.error('Error limpiando códigos expirados:', err);
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

  /**
   * Genera un código de vinculación para el email dado y lo guarda en BD.
   * Devuelve: 'ok' | 'not_found' | 'already_linked' | 'error'
   */
  async function generarCodigo(chatId, email) {
    try {
      const result = await pool.query(
        'SELECT id, nombre, telegram_chat_id FROM usuarios WHERE LOWER(email) = LOWER($1)',
        [email]
      );
      if (result.rows.length === 0) {
        await enviarMensaje(chatId,
          `❌ No existe un usuario con el correo <b>${email}</b>.\n\n` +
          `Verifica que el correo esté bien escrito o contacta al administrador.\n` +
          `Puedes intentar con otro correo o enviar <code>/cancelar</code> para salir.`
        );
        return 'not_found';
      }
      const usuario = result.rows[0];
      if (usuario.telegram_chat_id) {
        await enviarMensaje(chatId, `✅ Este correo ya está vinculado a Telegram.`);
        return 'already_linked';
      }
      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEn = new Date(Date.now() + 10 * 60 * 1000);

      // Guardar en BD (reemplaza el Map en memoria)
      await pool.query(
        'DELETE FROM telegram_pending_links WHERE LOWER(email) = LOWER($1)',
        [email]
      );
      await pool.query(
        'INSERT INTO telegram_pending_links (email, codigo, chat_id, expira_en) VALUES ($1, $2, $3, $4)',
        [email, code, chatId.toString(), expiraEn]
      );

      await enviarMensaje(chatId,
        `✅ Código de vinculación generado para <b>${email}</b>.\n\n` +
        `Tu código es: <b>${code}</b>\n\n` +
        `Ingresa este código en la app (Módulo Usuarios → Vincular Telegram) para completar la vinculación.\n` +
        `El código expira en 10 minutos.`
      );
      return 'ok';
    } catch (err) {
      console.error('Error generando código:', err);
      await enviarMensaje(chatId, '❌ Error interno. Intenta más tarde.');
      return 'error';
    }
  }

  async function handleUpdate(update) {
    const message = update.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();

    // Comando /cancelar: cancela el flujo de vinculación
    if (text === '/cancelar' || text === '/cancel') {
      chatStates.delete(chatId);
      await enviarMensaje(chatId, '❌ Vinculación cancelada. Cuando quieras, vuelve a enviar /start.');
      return;
    }

    // Comando /start
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      if (parts.length >= 2) {
        // /start <email>: flujo rápido sin preguntas (compatible)
        chatStates.delete(chatId);
        const estado = await generarCodigo(chatId, parts[1].toLowerCase().trim());
        if (estado === 'not_found') {
          // Si el correo no existe, pasar al flujo conversacional para reintentar
          chatStates.set(chatId, 'awaiting_email');
        }
      } else {
        // /start sin email: flujo conversacional, pedimos el correo
        chatStates.set(chatId, 'awaiting_email');
        await enviarMensaje(chatId,
          '👋 ¡Bienvenido al bot del Consejo Comunal El Valle!\n\n' +
          'Para vincular tu cuenta, <b>escribe tu correo electrónico</b> aquí:\n' +
          '<code>tu@email.com</code>\n\n' +
          'Te enviaré un código de 6 dígitos para ingresar en la app.\n' +
          'Si te equivocas, envía <code>/cancelar</code> para empezar de nuevo.'
        );
      }
      return;
    }

    // Texto normal: si estamos esperando el correo, lo procesamos
    if (chatStates.get(chatId) === 'awaiting_email' && !text.startsWith('/')) {
      const email = text.toLowerCase().trim();

      if (!EMAIL_REGEX.test(email)) {
        await enviarMensaje(chatId,
          `⚠️ Ese texto no parece un correo válido.\n\n` +
          `Envía tu correo así: <code>tu@email.com</code>\n` +
          `O escribe <code>/cancelar</code> para cancelar.`
        );
        return;
      }

      const estado = await generarCodigo(chatId, email);
      if (estado === 'not_found' || estado === 'error') {
        // Mantener el flujo para que pueda intentar con otro correo
        chatStates.set(chatId, 'awaiting_email');
      } else {
        chatStates.delete(chatId);
      }
      return;
    }

    // Si no es comando ni estamos en flujo, ignorar
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

  module.exports = { startBot, stopBot, pool };
}
