const express = require("express");
const router = express.Router();
const Venta = require("../models/Ventas");

// Render de la vista principal
router.get("/", async (req, res) => {
  const { estadoSeleccionado } = req.query;

  // Traer todas las ventas
  let ventas = await Venta.find().sort({ fechaCarga: -1 }); // o por fecha, como prefieras

  // Si hay un estado seleccionado, ordenamos manualmente
  if (estadoSeleccionado) {
    ventas = ventas.sort((a, b) => {
      const esASeleccionado = a.instalacion === estadoSeleccionado;
      const esBSeleccionado = b.instalacion === estadoSeleccionado;

      if (esASeleccionado && !esBSeleccionado) return -1;
      if (!esASeleccionado && esBSeleccionado) return 1;
      return 0;
    });
  }

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
