const express = require("express");
const router = express.Router();
const Venta = require("../models/Ventas");

// Render de la vista principal
router.get("/", async (req, res) => {
  const ventas = await Venta.find().sort({ instalacion: -1 });

  const estados = [
    "SIN LLAMADO",
    "PENDIENTE CLIENTE",
    "NO RESPONDE",
    "AGENDADO",
    "REALIZADO",
    "REALIZADO PENDIENTE",
  ];

  const totalesPorEstado = {};
  estados.forEach((estado) => {
    totalesPorEstado[estado] = ventas.filter(
      (v) => v.instalacion === estado
    ).length;
  });

  res.render("ventas", { ventas, totalesPorEstado });
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
