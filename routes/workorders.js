// routes/workorders.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const BodegaUsuario = require("../models/BodegaUsuario");
const Actividad = require("../models/Actividad");

router.get("/", async (req, res) => {
  try {
    const usuarios = await User.find();

    const resultados = await Promise.all(
      usuarios.map(async (usuario) => {
        const bodega = await BodegaUsuario.findOne({
          usuario: usuario._id,
        }).populate("componentes.componente");

        const actividades = await Actividad.find({ tecnico: usuario._id })
          .populate("componentesUsados.componente")
          .sort({ fecha: -1 });

        return {
          usuario,
          bodega: bodega?.componentes || [],
          actividades,
        };
      })
    );

    res.render("workorders", { resultados });
  } catch (error) {
    console.error("Error al cargar órdenes de trabajo:", error);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;
