// routes/actividad.js
const express = require("express");
const router = express.Router();
const Actividad = require("../models/Actividad");
const Componente = require("../models/Componente");
const BodegaUsuario = require("../models/BodegaUsuario");

// POST /actividades - Registrar nueva actividad
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

    // Validar componentes y stock en bodega del técnico
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

      // Calcular puntaje por componente (usamos puntosInstalacion como base)
      puntajeTotal += cantidad * componente.puntosInstalacion;
      componentesValidados.push({ componente: componenteId, cantidad });

      // Descontar del stock
      stockTecnico.cantidad -= cantidad;
    }

    await bodega.save();

    // Calcular puntaje por km (si hay)
    if (km && !isNaN(km)) {
      puntajeTotal += km * 0.03;
    }

    // Guardar actividad
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
// GET /actividades/resumen?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get("/resumen", async (req, res) => {
  if (!req.session.user) return res.status(401).send("No autorizado");

  const userId = req.session.user.id;
  const { desde, hasta } = req.query;

  const filtro = {
    tecnico: userId,
    fecha: {
      ...(desde && { $gte: new Date(desde) }),
      ...(hasta && { $lte: new Date(hasta + "T23:59:59") }),
    },
  };

  try {
    const actividades = await Actividad.find(filtro)
      .populate("componentesUsados.componente")
      .sort({ fecha: -1 });

    const resumen = actividades.map((act) => {
      const puntosComponentes = act.componentesUsados.reduce((total, item) => {
        const puntos =
          (item.componente?.puntosInstalacion || 0) * item.cantidad;
        return total + puntos;
      }, 0);

      const puntosKm = (act.km || 0) * 0.03;

      const puntajeTotal = puntosComponentes + puntosKm;

      return {
        numero: act.numero,
        fecha: act.fecha,
        tipo: act.tipo,
        puntosComponentes,
        puntosKm,
        total: puntajeTotal.toFixed(2),
      };
    });

    res.json(resumen);
  } catch (err) {
    console.error("❌ Error al obtener resumen de actividades:", err);
    res.status(500).send("Error al obtener actividades");
  }
});

module.exports = router;
