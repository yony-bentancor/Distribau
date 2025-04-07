const express = require("express");
const router = express.Router();
const BodegaUsuario = require("../models/BodegaUsuario");

router.get("/user", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const userId = req.session.user.id;

  try {
    const bodega = await BodegaUsuario.findOne({ usuario: userId }).populate(
      "componentes.componente"
    );

    if (!bodega) {
      return res.render("user", {
        componentes: [], // sin componentes pero sin error
      });
    }

    res.render("user", {
      componentes: bodega.componentes,
    });
  } catch (err) {
    console.error("Error al cargar bodega del usuario:", err);
    res.status(500).send("Error interno del servidor");
  }
});

module.exports = router;
