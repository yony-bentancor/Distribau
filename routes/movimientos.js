// routes/movimientos.js
const express = require("express");
const router = express.Router();
const BodegaUsuario = require("../models/BodegaUsuario");
const Componente = require("../models/Componente");
const Movimiento = require("../models/Movimiento");
const User = require("../models/User");

// POST /transferir
router.post("/transferir", async (req, res) => {
  console.log("📥 BODY RECIBIDO:", JSON.stringify(req.body, null, 2));
  try {
    const { origen, destino, componentes, comentario } = req.body;

    if (!origen || !destino || !componentes || !Array.isArray(componentes)) {
      return res.status(400).send("Datos incompletos o inválidos");
    }

    // Determinar si el origen y destino son usuarios o bodega
    const esBodega = (entidad) => entidad.tipo === "bodega";
    const obtenerBodega = async (usuarioId) =>
      await BodegaUsuario.findOne({ usuario: usuarioId });

    // Verificar stock en origen
    if (!esBodega(origen)) {
      const bodegaOrigen = await obtenerBodega(origen.id);
      for (const item of componentes) {
        const registro = bodegaOrigen.componentes.find((c) =>
          c.componente.equals(item.componenteId)
        );
        if (!registro || registro.cantidad < item.cantidad) {
          return res
            .status(400)
            .send(`Stock insuficiente para el componente ${item.componenteId}`);
        }
      }
    }

    // Descontar del origen
    if (!esBodega(origen)) {
      const bodegaOrigen = await obtenerBodega(origen.id);
      for (const item of componentes) {
        const registro = bodegaOrigen.componentes.find((c) =>
          c.componente.equals(item.componenteId)
        );
        if (registro) registro.cantidad -= item.cantidad;
      }
      await bodegaOrigen.save();
    } else {
      // Si el origen es bodega central
      for (const item of componentes) {
        const comp = await Componente.findById(item.componenteId);
        if (comp.stock < item.cantidad)
          return res.status(400).send("Stock central insuficiente");
        comp.stock -= item.cantidad;
        await comp.save();
      }
    }

    // Agregar al destino
    if (!esBodega(destino)) {
      let bodegaDestino = await obtenerBodega(destino.id);
      if (!bodegaDestino) {
        bodegaDestino = new BodegaUsuario({
          usuario: destino.id,
          componentes: [],
        });
      }

      for (const item of componentes) {
        const reg = bodegaDestino.componentes.find((c) =>
          c.componente.equals(item.componenteId)
        );
        if (reg) {
          reg.cantidad += item.cantidad;
        } else {
          bodegaDestino.componentes.push({
            componente: item.componenteId,
            cantidad: item.cantidad,
          });
        }
      }

      await bodegaDestino.save();
    } else {
      for (const item of componentes) {
        const comp = await Componente.findById(item.componenteId);
        comp.stock += item.cantidad;
        await comp.save();
      }
    }

    // Registrar movimiento
    const nuevoMovimiento = new Movimiento({
      origen,
      destino,
      componentes: componentes.map((c) => ({
        componente: c.componenteId,
        cantidad: c.cantidad,
      })),
      comentario,
    });

    await nuevoMovimiento.save();

    res.status(200).send("Transferencia y registro completados ✅");
  } catch (err) {
    console.error("Error al transferir:", err);
    res.status(500).send("Error interno del servidor");
  }
});

module.exports = router;
