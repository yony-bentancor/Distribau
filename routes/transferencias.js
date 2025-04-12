const express = require("express");
const router = express.Router();
const BodegaCentral = require("../models/BodegaCentral");
const BodegaUsuario = require("../models/BodegaUsuario");
const Movimiento = require("../models/Movimiento");
const Componente = require("../models/Componente");
const User = require("../models/User");

// ======================================
// 1️⃣ TRANSFERENCIA DE BODEGA CENTRAL A TÉCNICO
// ======================================

router.post("/a-tecnico", async (req, res) => {
  try {
    const { tecnicoId, componentes } = req.body; // componentes: { compId: cantidad }

    const bodegaCentral = await BodegaCentral.findOne();
    let bodegaTecnico = await BodegaUsuario.findOne({ usuario: tecnicoId });
    if (!bodegaTecnico) {
      bodegaTecnico = new BodegaUsuario({
        usuario: tecnicoId,
        componentes: [],
      });
    }

    const movimientos = [];

    for (let compId in componentes) {
      const cantidad = parseInt(componentes[compId]);
      if (cantidad > 0) {
        const enCentral = bodegaCentral.componentes.find(
          (c) => c.componente.toString() === compId
        );
        if (!enCentral || enCentral.cantidad < cantidad) {
          return res
            .status(400)
            .send("Stock insuficiente en bodega central para: " + compId);
        }
        enCentral.cantidad -= cantidad;

        const enTecnico = bodegaTecnico.componentes.find(
          (c) => c.componente.toString() === compId
        );
        if (enTecnico) {
          enTecnico.cantidad += cantidad;
        } else {
          bodegaTecnico.componentes.push({ componente: compId, cantidad });
        }

        movimientos.push({ componente: compId, cantidad });
      }
    }

    await bodegaCentral.save();
    await bodegaTecnico.save();

    await new Movimiento({
      origen: { tipo: "bodega" },
      destino: { tipo: "usuario", id: tecnicoId },
      componentes: movimientos,
      comentario: "Entrega desde bodega central al técnico",
    }).save();

    res.status(200).send("Transferencia a técnico completada ✅");
  } catch (err) {
    console.error("Error en transferencia:", err);
    res.status(500).send("Error al transferir a técnico");
  }
});

// ======================================
// 2️⃣ DEVOLUCIÓN DE TÉCNICO A BODEGA CENTRAL
// ======================================

router.post("/devolucion", async (req, res) => {
  try {
    const { tecnicoId, componentes } = req.body; // { compId: cantidad }

    let bodegaCentral = await BodegaCentral.findOne();
    if (!bodegaCentral) bodegaCentral = new BodegaCentral();

    const bodegaTecnico = await BodegaUsuario.findOne({ usuario: tecnicoId });
    if (!bodegaTecnico)
      return res.status(400).send("Bodega del técnico no encontrada");

    const movimientos = [];

    for (let compId in componentes) {
      const cantidad = parseInt(componentes[compId]);
      if (cantidad > 0) {
        const enTecnico = bodegaTecnico.componentes.find(
          (c) => c.componente.toString() === compId
        );
        if (!enTecnico || enTecnico.cantidad < cantidad) {
          return res
            .status(400)
            .send("Stock insuficiente para devolver: " + compId);
        }

        enTecnico.cantidad -= cantidad;

        const enCentral = bodegaCentral.componentes.find(
          (c) => c.componente.toString() === compId
        );
        if (enCentral) {
          enCentral.cantidad += cantidad;
        } else {
          bodegaCentral.componentes.push({ componente: compId, cantidad });
        }

        movimientos.push({ componente: compId, cantidad });
      }
    }

    await bodegaCentral.save();
    await bodegaTecnico.save();

    await new Movimiento({
      origen: { tipo: "usuario", id: tecnicoId },
      destino: { tipo: "bodega" },
      componentes: movimientos,
      comentario: "Devolución del técnico a bodega central",
    }).save();

    res.status(200).send("Devolución registrada correctamente ✅");
  } catch (err) {
    console.error("Error en devolución:", err);
    res.status(500).send("Error al devolver componentes");
  }
});

// ======================================
// 3️⃣ TRANSFERENCIA ENTRE TÉCNICOS
// ======================================

router.post("/entre-tecnicos", async (req, res) => {
  try {
    const { origenId, destinoId, componentes } = req.body; // { compId: cantidad }

    const bodegaOrigen = await BodegaUsuario.findOne({ usuario: origenId });
    let bodegaDestino = await BodegaUsuario.findOne({ usuario: destinoId });
    if (!bodegaDestino) {
      bodegaDestino = new BodegaUsuario({
        usuario: destinoId,
        componentes: [],
      });
    }

    const movimientos = [];

    for (let compId in componentes) {
      const cantidad = parseInt(componentes[compId]);
      if (cantidad > 0) {
        const enOrigen = bodegaOrigen.componentes.find(
          (c) => c.componente.toString() === compId
        );
        if (!enOrigen || enOrigen.cantidad < cantidad) {
          return res
            .status(400)
            .send("Stock insuficiente en técnico origen para: " + compId);
        }

        enOrigen.cantidad -= cantidad;

        const enDestino = bodegaDestino.componentes.find(
          (c) => c.componente.toString() === compId
        );
        if (enDestino) {
          enDestino.cantidad += cantidad;
        } else {
          bodegaDestino.componentes.push({ componente: compId, cantidad });
        }

        movimientos.push({ componente: compId, cantidad });
      }
    }

    await bodegaOrigen.save();
    await bodegaDestino.save();

    await new Movimiento({
      origen: { tipo: "usuario", id: origenId },
      destino: { tipo: "usuario", id: destinoId },
      componentes: movimientos,
      comentario: "Transferencia entre técnicos",
    }).save();

    res.status(200).send("Transferencia entre técnicos realizada ✅");
  } catch (err) {
    console.error("Error en transferencia entre técnicos:", err);
    res.status(500).send("Error al transferir componentes");
  }
});

module.exports = router;
