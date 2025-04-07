// routes/componentes.js
const express = require("express");
const router = express.Router();
const Componente = require("../models/Componente");

router.post("/componentes", async (req, res) => {
  const { nombre, puntaje } = req.body;

  try {
    const nuevoComponente = new Componente({ nombre, puntaje });
    await nuevoComponente.save();
    res.status(201).send("✅ Componente creado");
  } catch (err) {
    console.error("❌ Error al crear componente:", err);
    res.status(500).send("Error al crear componente");
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
