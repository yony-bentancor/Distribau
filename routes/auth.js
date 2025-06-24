// routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar usuario en la base
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).send("Usuario no encontrado");
    }
    if (!user.password) {
      console.error("El usuario no tiene una contraseña en la base de datos");
      return res.status(500).send("Usuario sin contraseña registrada");
    }
    console.log("Usuario encontrado:", user);
    console.log("Contraseña guardada:", user.password);

    // Comparar contraseñas
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send("Contraseña incorrecta");
    }

    // Guardar sesión
    req.session.user = {
      id: user._id,
      username: user.username,
    };

    // Redirigir según el usuario
    if (user.username === "ADMINISTRADOR") {
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
