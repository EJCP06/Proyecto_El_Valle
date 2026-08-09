const configuracionRepo = require('../repositories/configuracion.repository');
const { pool } = require('../config/db');
const { registrarAuditoria } = require('../services/auditoria.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await configuracionRepo.findAll();
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;

    if (valor === undefined) {
      return res.status(400).json({ success: false, message: 'El valor es requerido' });
    }

    const data = await configuracionRepo.update(clave, valor);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Clave de configuración no encontrada' });
    }

    await registrarAuditoria({
      accion: 'MODIFICAR',
      entidad: 'CONFIGURACIÓN',
      detalle: { clave, valor },
      req
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getIpIntentos = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT ip, intentos_fallidos, bloqueada_hasta, creado_en, actualizado_en
       FROM ip_intentos
       ORDER BY actualizado_en DESC`
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    next(error);
  }
};

exports.desbloquearIp = async (req, res, next) => {
  try {
    const { ip } = req.params;
    await pool.query(`DELETE FROM ip_intentos WHERE ip = $1`, [ip]);
    await registrarAuditoria({
      accion: 'DESBLOQUEAR IP',
      entidad: 'CONFIGURACIÓN',
      detalle: { ip },
      req
    });
    return res.json({ success: true, message: 'IP desbloqueada' });
  } catch (error) {
    next(error);
  }
};
