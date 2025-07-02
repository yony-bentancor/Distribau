// routes/actividad.js
const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth");
const Actividad = require("../models/Actividad");
const Componente = require("../models/Componente");
const BodegaUsuario = require("../models/BodegaUsuario");

// POST /actividades - Registrar nueva actividad (técnico)
router.post("/actividades", async (req, res) => {
  try {
    const {
      numero,
      fecha,
      tipo,
      componentesUsados,
      estado,
      comunicarse,
      km,
      comentario,
    } = req.body;

    const tecnicoId = req.session.user.id;

    const bodega = await BodegaUsuario.findOne({ usuario: tecnicoId });
    if (!bodega)
      return res.status(400).send("No se encontró la bodega del técnico");

    let puntajeTotal = 0;
    const componentesValidados = [];

    for (const item of componentesUsados) {
      const { componenteId, cantidad } = item;
      const componente = await Componente.findById(componenteId);
      if (!componente) return res.status(400).send("Componente no encontrado");

      const stockTecnico = bodega.componentes.find((c) =>
        c.componente.equals(componenteId)
      );
      if (!stockTecnico || stockTecnico.cantidad < cantidad) {
        return res
          .status(400)
          .send(`Stock insuficiente de ${componente.nombre}`);
      }

      puntajeTotal += cantidad * componente.puntosInstalacion;
      componentesValidados.push({ componente: componenteId, cantidad });

      stockTecnico.cantidad -= cantidad;
    }

    await bodega.save();

    if (km && !isNaN(km)) {
      puntajeTotal += km * 0.03;
    }

    const nuevaActividad = new Actividad({
      numero,
      fecha,
      tipo,
      tecnico: tecnicoId,
      componentesUsados: componentesValidados,
      estado,
      comunicarse,
      km,
      comentario,
      puntajeTotal,
    });

    await nuevaActividad.save();
    res.status(201).send("✅ Actividad registrada correctamente");
  } catch (err) {
    console.error("❌ Error al guardar actividad:", err);
    res.status(500).send("Error interno del servidor");
  }
});

// GET /actividades/resumen?periodo=dia|semana|mes (solo para técnicos)
router.get("/actividades/resumen", requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { periodo } = req.query;

  const inicio = new Date();
  const fin = new Date();

  if (periodo === "semana") {
    const dia = inicio.getDay();
    inicio.setDate(inicio.getDate() - dia);
    inicio.setHours(0, 0, 0, 0);
    fin.setDate(inicio.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
  } else if (periodo === "mes") {
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    fin.setMonth(inicio.getMonth() + 1, 0);
    fin.setHours(23, 59, 59, 999);
  } else {
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
  }

  try {
    const actividades = await Actividad.find({
      tecnico: userId,
      fecha: { $gte: inicio, $lte: fin },
    }).populate("componentesUsados.componente");

    const formateadas = actividades.map((a) => ({
      numero: a.numero,
      tipo: a.tipo,
      puntajeTotal: a.puntajeTotal,
      detalle: {
        componentes: a.componentesUsados.map(
          (c) => `${c.componente?.nombre} x${c.cantidad}`
        ),
        km: a.km,
        puntosKm: parseFloat((a.km * 0.03).toFixed(2)),
      },
    }));

    res.json(formateadas);
  } catch (err) {
    console.error("❌ Error al cargar resumen:", err);
    res.status(500).json([]);
  }
});

module.exports = router;
