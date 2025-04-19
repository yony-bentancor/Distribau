const express = require("express");
const router = express.Router();
const Componente = require("../models/Componente");
const BodegaCentral = require("../models/BodegaCentral");
const Movimiento = require("../models/Movimiento");
const Almacen = require("../models/Almacen"); // importar nuevo modelo

// GET: mostrar formulario de carga de stock
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

    res.render("almacen", { componentes, historial }); // ✅ solucionado
  } catch (err) {
    console.error("Error al cargar /almacen:", err);
    res.status(500).send("Error al mostrar el formulario de almacén");
  }
});

// POST: procesar ingreso a bodega central
router.post("/", async (req, res) => {
  try {
    const entradas = req.body; // { componenteId: cantidad }

    let bodega = await BodegaCentral.findOne();
    if (!bodega) bodega = new BodegaCentral();

    const movimientos = [];

    for (let id in entradas) {
      const cantidad = parseInt(entradas[id]);
      if (!isNaN(cantidad) && cantidad > 0) {
        const existente = bodega.componentes.find(
          (c) => c.componente.toString() === id
        );
        if (existente) {
          existente.cantidad += cantidad;
        } else {
          bodega.componentes.push({ componente: id, cantidad });
        }

        movimientos.push({ componente: id, cantidad });
      }
    }

    await bodega.save();

    const nuevoMovimiento = new Movimiento({
      origen: { tipo: "usuario", id: null }, // ✅ simulamos "almacén" como un origen sin usuario
      destino: { tipo: "bodega", id: null },
      componentes: movimientos,
      comentario: "Ingreso desde almacén",
    });

    await nuevoMovimiento.save();

    res.redirect("/admin"); // o a donde quieras volver luego del ingreso
  } catch (err) {
    console.error("Error al guardar stock:", err);
    res.status(500).send("Error interno al guardar stock en bodega central");
  }
});

// POST /almacen
router.post("/", async (req, res) => {
  try {
    const entradas = req.body;
    let almacen = await Almacen.findOne();
    if (!almacen) almacen = new Almacen({ componentes: [] });

    let bodega = await BodegaCentral.findOne();
    if (!bodega) bodega = new BodegaCentral();

    const movimientos = [];

    for (let id in entradas) {
      const cantidad = parseInt(entradas[id]);
      if (!isNaN(cantidad) && cantidad > 0) {
        // Almacen
        const enAlmacen = almacen.componentes.find(
          (c) => c.componente.toString() === id
        );
        if (enAlmacen) {
          enAlmacen.cantidad -= cantidad;
        }

        // Bodega Central
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

    const nuevoMovimiento = new Movimiento({
      origen: { tipo: "almacen", id: almacen._id },
      destino: { tipo: "bodega", id: null },
      componentes: movimientos,
      comentario: "Ingreso desde almacén",
    });

    await nuevoMovimiento.save();

    res.redirect("/admin");
  } catch (err) {
    console.error("❌ Error al guardar stock desde almacén:", err);
    res.status(500).send("Error interno");
  }
});

module.exports = router;
