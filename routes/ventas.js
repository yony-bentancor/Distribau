const express = require("express");
const router = express.Router();
const Venta = require("../models/Ventas");

// Render de la vista principal
router.get("/", async (req, res) => {
  const { estadoSeleccionado } = req.query;

  const query = estadoSeleccionado ? { instalacion: estadoSeleccionado } : {};
  const ventas = await Venta.find(query).sort({ instalacion: -1 });

  const estados = [
    "SIN LLAMADO",
    "PENDIENTE CLIENTE",
    "NO RESPONDE",
    "AGENDADO",
    "REALIZADO",
    "REALIZADO PENDIENTE",
  ];

  const totalesPorEstado = {};
  for (const estado of estados) {
    totalesPorEstado[estado] = await Venta.countDocuments({
      instalacion: estado,
    });
  }

  res.render("ventas", { ventas, totalesPorEstado, estadoSeleccionado });
});

// Guardar o editar
router.post("/guardar", async (req, res) => {
  const { _id, ...datos } = req.body;
  try {
    if (_id) {
      await Venta.findByIdAndUpdate(_id, datos);
    } else {
      await Venta.create(datos);
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send("Error al guardar");
  }
});

// Eliminar
router.post("/eliminar/:id", async (req, res) => {
  try {
    await Venta.findByIdAndDelete(req.params.id);
    res.redirect("/ventas");
  } catch (err) {
    res.status(500).send("Error al eliminar");
  }
});

module.exports = router;
