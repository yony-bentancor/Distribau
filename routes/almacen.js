const express = require("express");
const router = express.Router();
const Componente = require("../models/Componente");
const BodegaCentral = require("../models/BodegaCentral");
const Movimiento = require("../models/Movimiento");

// GET: mostrar formulario de carga de stock
router.get("/", async (req, res) => {
  try {
    const componentes = await Componente.find();
    res.render("almacen", { componentes }); // renderizar vista
  } catch (err) {
    console.error("Error al cargar componentes:", err);
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
      origen: { tipo: "almacen" },
      destino: { tipo: "bodega" },
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

module.exports = router;
