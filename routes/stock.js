// routes/stock.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Componente = require("../models/Componente");
const BodegaUsuario = require("../models/BodegaUsuario");

// GET /usuarios-tecnicos - listar usuarios que no son admin
router.get("/usuarios-tecnicos", async (req, res) => {
  try {
    const tecnicos = await User.find({ username: { $ne: "admin" } }).select(
      "_id username"
    );
    res.json(tecnicos);
  } catch (err) {
    console.error("Error al listar técnicos:", err);
    res.status(500).send("Error al obtener técnicos");
  }
});

// GET /bodegas-usuarios - devuelve todas las bodegas de técnicos
router.get("/bodegas-usuarios", async (req, res) => {
  try {
    const bodegas = await BodegaUsuario.find()
      .populate("usuario", "username")
      .populate("componentes.componente", "nombre");
    res.json(bodegas);
  } catch (err) {
    console.error("Error al obtener bodegas:", err);
    res.status(500).send("Error al obtener bodegas");
  }
});

// POST /transferir-stock
router.post("/transferir-stock", async (req, res) => {
  const { userId, componenteId, cantidad } = req.body;

  try {
    const componente = await Componente.findById(componenteId);
    if (!componente || componente.stock < cantidad) {
      return res.status(400).send("Stock insuficiente en bodega central");
    }

    // Descontar del central
    componente.stock -= cantidad;
    await componente.save();

    // Agregar a bodega del usuario
    let bodega = await BodegaUsuario.findOne({ usuario: userId });
    if (!bodega) {
      bodega = new BodegaUsuario({ usuario: userId, componentes: [] });
    }

    const index = bodega.componentes.findIndex((c) =>
      c.componente.equals(componenteId)
    );
    if (index >= 0) {
      bodega.componentes[index].cantidad += cantidad;
    } else {
      bodega.componentes.push({ componente: componenteId, cantidad });
    }

    await bodega.save();
    res.send("Transferencia exitosa");
  } catch (err) {
    console.error("Error al transferir stock:", err);
    res.status(500).send("Error interno al transferir");
  }
});

// PUT /actualizar-stock-central/:id
router.put("/actualizar-stock-central/:id", async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  try {
    const componente = await Componente.findById(id);
    if (!componente) return res.status(404).send("Componente no encontrado");

    componente.stock = stock;
    await componente.save();
    res.send("Stock actualizado");
  } catch (err) {
    console.error("Error al actualizar stock central:", err);
    res.status(500).send("Error interno al actualizar stock");
  }
});

module.exports = router;
