const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuarioRepo = require('../repositories/usuario.repository');
const env = require('../config/env');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
    }

    const usuario = await usuarioRepo.findByEmail(email);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo' });
    }

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { sub: usuario.id, email: usuario.email, rol: usuario.rol },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          activo: usuario.activo
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    const existing = await usuarioRepo.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUsuario = await usuarioRepo.create({
      nombre,
      email,
      password: passwordHash,
      rol: rol || 'vocero'
    });

    return res.status(201).json({
      success: true,
      data: newUsuario
    });
  } catch (error) {
    next(error);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const usuario = await usuarioRepo.findById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Admin CRUD functions for Users
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const data = await usuarioRepo.findAll(limit, offset);
    const total = await usuarioRepo.count();

    return res.json({
      success: true,
      data,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const usuario = await usuarioRepo.findById(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, rol, activo } = req.body;

    const updated = await usuarioRepo.update(id, { nombre, email, rol, activo });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado o no actualizado' });
    }

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await usuarioRepo.deactivate(id);
    return res.json({
      success: true,
      message: 'Usuario desactivado'
    });
  } catch (error) {
    next(error);
  }
};
