const express = require("express");
const router = express.Router();
const BodegaUsuario = require("../models/BodegaUsuario");
const Componente = require("../models/Componente");
const User = require("../models/User");

router.get("/:id/bodega", async (req, res) => {
  const userId = req.params.id;

  try {
    // Buscar bodega del técnico
    const bodega = await BodegaUsuario.findOne({ usuario: userId }).populate(
      "componentes.componente"
    );

    if (!bodega) {
      return res.status(404).send("Bodega no encontrada para este usuario.");
    }

    // Renderizar la vista con los datos de la bodega
    res.render("bodegaTecnico", {
      tecnicoId: userId,
      componentes: bodega.componentes,
    });
  } catch (err) {
    console.error("Error al obtener bodega del técnico:", err);
    res.status(500).send("Error interno del servidor");
  }
});

module.exports = router;
