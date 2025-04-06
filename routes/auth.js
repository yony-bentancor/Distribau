// routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Asegurate que la ruta esté bien
const bcrypt = require("bcryptjs");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar el usuario en la base
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).send("Usuario no encontrado");
    }

    // Comparar la contraseña
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send("Contraseña incorrecta");
    }

    // Guardar sesión (si estás usando express-session)
    req.session.user = user;

    // Redireccionar a /admin o /user
    if (username === "ADMINISTRADOR") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/user");
    }
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).send("Error interno del servidor");
  }
});

module.exports = router;
