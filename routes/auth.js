const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.send("Usuario no encontrado");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Contraseña incorrecta");

    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    // Redirigir según el rol
    if (user.role === "admin") {
      res.redirect("/admin");
    } else {
      res.redirect("/user");
    }
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;
