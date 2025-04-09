const express = require("express");
const router = express.Router();
const BodegaUsuario = require("../models/BodegaUsuario");
const Componente = require("../models/Componente");

router.get("/user", async (req, res) => {
  if (!req.session.user) {
    console.log("🔒 Usuario no autenticado");
    return res.redirect("/login");
  }

  const userId = req.session.user.id;
  const username = req.session.user.username;

  console.log("🔍 Cargando bodega de:", username, userId);

  if (username === "ADMINISTRADOR") {
    console.log("🔁 Redirigiendo a /admin");
    return res.redirect("/admin");
  }

  try {
    const bodega = await BodegaUsuario.findOne({ usuario: userId }).populate(
      "componentes.componente"
    );
    const stockCentral = await Componente.find(); // trae toda la bodega central

    if (!bodega) {
      console.log("📭 Bodega vacía");
      return res.render("user", {
        componentes: [],
        stockCentral: stockCentral || [],
      });
    }

    console.log("📦 Componentes encontrados:", bodega.componentes.length);

    res.render("user", {
      componentes: bodega.componentes,
      stockCentral: stockCentral || [],
    });
  } catch (err) {
    console.error("❌ Error en /user:", err);
    res.status(500).send("Error interno del servidor");
  }
});

module.exports = router;
