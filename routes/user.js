const express = require("express");
const router = express.Router();
const BodegaUsuario = require("../models/BodegaUsuario");

// Mostrar vista para usuarios (técnicos)
router.get("/user", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const userId = req.session.user.id;
  const username = req.session.user.username;

  // Si es el admin, lo redirigimos
  if (username === "ADMINISTRADOR") {
    return res.redirect("/admin");
  }

  try {
    const bodega = await BodegaUsuario.findOne({ usuario: userId }).populate(
      "componentes.componente"
    );

    if (!bodega) {
      return res.render("user", { componentes: [] });
    }

    res.render("user", {
      componentes: bodega.componentes,
    });
  } catch (err) {
    console.error("❌ Error al cargar bodega:", err);
    res.status(500).send("Error interno del servidor");
  }
});

module.exports = router;
