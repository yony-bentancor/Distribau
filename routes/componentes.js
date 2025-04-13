// routes/componentes.js
const express = require("express");
const router = express.Router();
const Componente = require("../models/Componente");

// Crear nuevo componente
router.post("/componentes", async (req, res) => {
  console.log("📥 Body recibido:", req.body);

  try {
    const {
      nombre,
      articuloComercial,
      modelo,
      puntosInstalacion,
      puntosConexion,
    } = req.body;

    // Validación básica
    if (
      !nombre ||
      puntosInstalacion === undefined ||
      puntosConexion === undefined
    ) {
      return res.status(400).send("❌ Faltan datos requeridos");
    }

    const pi = parseFloat(puntosInstalacion);
    const pc = parseFloat(puntosConexion);

    if (isNaN(pi) || isNaN(pc)) {
      return res.status(400).send("❌ Los puntajes deben ser números válidos");
    }

    const nuevo = new Componente({
      nombre,
      articuloComercial,
      modelo,
      puntosInstalacion: pi,
      puntosConexion: pc,
    });

    await nuevo.save();
    res.status(201).send("✅ Componente creado correctamente");
  } catch (err) {
    console.error("❌ Error al crear componente:", err);
    res.status(500).send("❌ Error interno al crear componente");
  }
});

// GET: traer todos los componentes
router.get("/componentes", async (req, res) => {
  try {
    const componentes = await Componente.find();
    res.json(componentes);
  } catch (err) {
    console.error("Error al obtener componentes:", err);
    res.status(500).send("Error al obtener componentes");
  }
});

// PUT: actualizar componente
router.put("/componentes/:id", async (req, res) => {
  try {
    const { nombre, puntaje } = req.body;
    await Componente.findByIdAndUpdate(req.params.id, { nombre, puntaje });
    res.send("Componente actualizado");
  } catch (err) {
    res.status(500).send("Error al actualizar");
  }
});

// DELETE: eliminar componente
router.delete("/componentes/:id", async (req, res) => {
  try {
    await Componente.findByIdAndDelete(req.params.id);
    res.send("Componente eliminado");
  } catch (err) {
    res.status(500).send("Error al eliminar");
  }
});

module.exports = router;
