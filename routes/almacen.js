const express = require("express");
const router = express.Router();
const Componente = require("../models/Componente");
const BodegaCentral = require("../models/BodegaCentral");
const Movimiento = require("../models/Movimiento");
const Almacen = require("../models/Almacen");

// GET: mostrar formulario de carga de stock + historial
router.get("/", async (req, res) => {
  try {
    const componentes = await Componente.find().lean();

    const movimientos = await Movimiento.find({ "origen.tipo": "almacen" })
      .sort({ fecha: -1 })
      .limit(20)
      .populate("componentes.componente")
      .lean();

    const historial = movimientos.map((mov) => ({
      fecha: new Date(mov.createdAt || mov.fecha).toLocaleDateString("es-UY"),
      componentes: mov.componentes.map((c) => ({
        nombre: c.componente?.nombre || "Sin nombre",
        cantidad: c.cantidad,
      })),
    }));

    res.render("almacen", { componentes, historial });
  } catch (err) {
    console.error("❌ Error al cargar /almacen:", err);
    res.status(500).send("Error al mostrar el formulario de almacén");
  }
});

// POST: procesar ingreso desde almacén a bodega central
router.post("/", async (req, res) => {
  try {
    const entradas = req.body; // { componenteId: cantidad }

    let almacen = await Almacen.findOne();
    if (!almacen) almacen = new Almacen({ componentes: [] });

    let bodega = await BodegaCentral.findOne();
    if (!bodega) bodega = new BodegaCentral();

    const movimientos = [];

    for (let id in entradas) {
      const cantidad = parseInt(entradas[id]);
      if (!isNaN(cantidad) && cantidad > 0) {
        // descontar del almacén (si existiera)
        const enAlmacen = almacen.componentes.find(
          (c) => c.componente.toString() === id
        );
        if (enAlmacen) enAlmacen.cantidad -= cantidad;

        // agregar a bodega central
        const enBodega = bodega.componentes.find(
          (c) => c.componente.toString() === id
        );
        if (enBodega) {
          enBodega.cantidad += cantidad;
        } else {
          bodega.componentes.push({ componente: id, cantidad });
        }

        movimientos.push({ componente: id, cantidad });
      }
    }

    await almacen.save();
    await bodega.save();

    const fechaElegida = req.body.fechaIngreso
      ? new Date(req.body.fechaIngreso)
      : new Date();

    const nuevoMovimiento = new Movimiento({
      fecha: fechaElegida,
      origen: { tipo: "almacen", id: almacen._id },
      destino: { tipo: "bodega", id: null },
      componentes: movimientos,
      comentario: "Ingreso desde almacén",
    });

    await nuevoMovimiento.save();

    res.redirect("/almacen");
  } catch (err) {
    console.error("❌ Error al guardar stock desde almacén:", err);
    res.status(500).send("Error interno");
  }
});
// API: obtener historial de ingresos desde almacén (formato JSON)
router.get("/api/historial-almacen", async (req, res) => {
  try {
    const movimientos = await Movimiento.find({ "origen.tipo": "almacen" })
      .sort({ fecha: -1 })
      .limit(20)
      .populate("componentes.componente")
      .lean();

    const historial = movimientos.map((mov) => ({
      fecha: new Date(mov.createdAt || mov.fecha).toLocaleDateString("es-UY"),
      componentes: mov.componentes.map((c) => ({
        nombre: c.componente?.nombre || "Sin nombre",
        cantidad: c.cantidad,
      })),
    }));

    res.json(historial);
  } catch (err) {
    console.error("❌ Error al obtener historial:", err);
    res.status(500).send("Error al obtener historial");
  }
});

module.exports = router;
