// routes/register.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Utilidades de validación simples
const isDigits = (s, min = 6, max = 15) =>
  /^[0-9]+$/.test(s || "") && s.length >= min && s.length <= max;
const isEmail = (s) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(s || "");

// Lista de departamentos para el <select>
const departamentosUy = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres",
];

// GET: render del formulario
router.get("/register", (req, res) => {
  res.render("register", { values: {}, error: null, departamentosUy });
});

// POST: crear usuario
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      cedula,
      nombreCompleto,
      departamento,
      localidad,
      direccion,
      telefono,
      celular,
      email,
      whatsapp,
      puesto,
      rol,
      activo,
    } = req.body;

    // Validaciones mínimas server-side (además de las del schema)
    const missing = [];
    const required = {
      username,
      password,
      cedula,
      nombreCompleto,
      departamento,
      direccion,
      celular,
      email,
      puesto,
    };
    Object.entries(required).forEach(([k, v]) => {
      if (!v || !String(v).trim()) missing.push(k);
    });

    if (missing.length) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: `Faltan campos: ${missing.join(", ")}`,
      });
    }

    if ((password || "").length < 6) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: "La contraseña debe tener al menos 6 caracteres",
      });
    }
    if (!/^[0-9]{6,12}$/.test(String(cedula))) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: "Cédula inválida (solo dígitos, 6 a 12)",
      });
    }
    if (!isDigits(celular, 6, 15)) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: "Celular inválido (solo dígitos, 6 a 15)",
      });
    }
    if (telefono && !isDigits(telefono, 6, 15)) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: "Teléfono inválido (solo dígitos, 6 a 15)",
      });
    }
    if (whatsapp && !isDigits(whatsapp, 6, 15)) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: "WhatsApp inválido (solo dígitos, 6 a 15)",
      });
    }
    if (!isEmail(email)) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: "Email inválido",
      });
    }
    if (!departamentosUy.includes(departamento)) {
      return res.status(400).render("register", {
        departamentosUy,
        values: req.body,
        error: "Departamento inválido",
      });
    }

    // Chequeos de duplicados (username/email/cedula) antes de crear
    const dup = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }, { cedula }],
    }).lean();

    if (dup) {
      let msg = "Dato duplicado.";
      if (dup.username === username) msg = "El nombre de usuario ya existe.";
      else if (dup.email === email.toLowerCase()) msg = "El email ya existe.";
      else if (dup.cedula === cedula) msg = "La cédula ya existe.";
      return res
        .status(409)
        .render("register", { departamentosUy, values: req.body, error: msg });
    }

    // Hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Crear
    await User.create({
      username: username.trim(),
      password: hashed,
      cedula: String(cedula).trim(),
      nombreCompleto: nombreCompleto.trim(),
      departamento,
      localidad: (localidad || "").trim(),
      direccion: direccion.trim(),
      telefono: (telefono || "").trim(),
      celular: String(celular).trim(),
      email: email.toLowerCase().trim(),
      whatsapp: (whatsapp || "").trim(),
      puesto: (puesto || "").trim(),
      rol: rol || "usuario",
      activo: (activo ?? "true") === "true",
    });

    // éxito → a login
    res.redirect("/login.html");
  } catch (err) {
    // Manejo de índices únicos desde Mongo
    if (err?.code === 11000) {
      let msg = "Dato duplicado.";
      if (err.keyPattern?.email) msg = "El email ya existe.";
      if (err.keyPattern?.username) msg = "El nombre de usuario ya existe.";
      if (err.keyPattern?.cedula) msg = "La cédula ya existe.";
      return res
        .status(409)
        .render("register", { departamentosUy, values: req.body, error: msg });
    }
    console.error(err);
    return res.status(500).render("register", {
      departamentosUy,
      values: req.body,
      error: "Error al registrar.",
    });
  }
});

module.exports = router;
