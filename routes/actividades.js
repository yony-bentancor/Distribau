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
  const userId = req.session.user?.id;
  const periodo = req.query.periodo || "dia";

  if (!userId) return res.status(401).send("No autorizado");

  const hoy = new Date();
  let inicio;

  if (periodo === "dia") {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  } else if (periodo === "semana") {
    const diaSemana = hoy.getDay();
    inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diaSemana);
  } else if (periodo === "mes") {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else {
    return res.status(400).send("Periodo inválido");
  }

  try {
    const actividades = await Actividad.find({
      tecnico: userId,
      fecha: { $gte: inicio },
    }).populate("componentesUsados.componente");

    const resumen = actividades.map((a) => {
      const puntosComponentes = a.componentesUsados.reduce((total, item) => {
        const pInst = item.componente?.puntosInstalacion || 0;
        const pCon = item.componente?.puntosConexion || 0;
        return total + item.cantidad * (pInst + pCon);
      }, 0);

      const puntosKm = a.km * 0.03;
      const total = puntosComponentes + puntosKm;

      return {
        numero: a.numero,
        tipo: a.tipo,
        puntaje: total.toFixed(2),
      };
    });

    res.json(resumen);
  } catch (err) {
    console.error("❌ Error al obtener resumen de actividades:", err);
    res.status(500).send("Error al obtener resumen");
  }
});

module.exports = router;
