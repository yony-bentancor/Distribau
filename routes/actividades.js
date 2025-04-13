// routes/actividades.js
const express = require("express");
const router = express.Router();
const Actividad = require("../models/Actividad");
const BodegaUsuario = require("../models/BodegaUsuario");
const Componente = require("../models/Componente");
const User = require("../models/User");

// POST /actividades - Crear nueva actividad
router.post("/", async (req, res) => {
  try {
    const {
      numero,
      fecha,
      tipo,
      estado,
      componentes,
      comunicarse,
      traslado,
      kilometros,
    } = req.body;

    const userId = req.session.user.id; // usuario logeado

    if (
      !numero ||
      !fecha ||
      !tipo ||
      !estado ||
      !componentes ||
      !Array.isArray(componentes)
    ) {
      return res.status(400).send("Faltan datos obligatorios");
    }

    let puntajeTraslado = traslado ? 1 : 0; // se puede ajustar según tipo
    let puntajeKm = kilometros ? parseFloat(kilometros) * 0.03 : 0;
    let puntajeComponentes = 0;

    // Verificar y descontar stock del técnico
    const bodega = await BodegaUsuario.findOne({ usuario: userId });
    if (!bodega) return res.status(400).send("Bodega de usuario no encontrada");

    for (const item of componentes) {
      const comp = await Componente.findById(item.componenteId);
      if (!comp) return res.status(400).send("Componente inválido");

      const registro = bodega.componentes.find((c) =>
        c.componente.equals(item.componenteId)
      );
      if (!registro || registro.cantidad < item.cantidad) {
        return res
          .status(400)
          .send(`Stock insuficiente del componente ${comp.nombre}`);
      }

      registro.cantidad -= item.cantidad;
      puntajeComponentes +=
        (comp.puntosInstalacion + comp.puntosConexion) * item.cantidad;
    }

    await bodega.save();

    const nuevaActividad = new Actividad({
      usuario: userId,
      numero,
      fecha,
      tipo,
      estado,
      comunicarse: !!comunicarse,
      traslado: !!traslado,
      kilometros: kilometros || 0,
      componentes,
      puntajeComponentes,
      puntajeTraslado,
      puntajeKm,
      puntajeTotal: puntajeComponentes + puntajeTraslado + puntajeKm,
    });

    await nuevaActividad.save();

    res.status(200).send("Actividad registrada correctamente ✅");
  } catch (err) {
    console.error("❌ Error al registrar actividad:", err);
    res.status(500).send("Error interno al guardar actividad");
  }
});

module.exports = router;
