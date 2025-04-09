// routes/movimientos.js
const express = require("express");
const router = express.Router();
const BodegaUsuario = require("../models/BodegaUsuario");
const Componente = require("../models/Componente");
const Movimiento = require("../models/Movimiento");
const User = require("../models/User");
const ExcelJS = require("exceljs");

// POST /transferir
router.post("/transferir", async (req, res) => {
  console.log("📥 BODY RECIBIDO:", JSON.stringify(req.body, null, 2));
  try {
    const { origen, destino, componentes, comentario } = req.body;

    if (!origen || !destino || !componentes || !Array.isArray(componentes)) {
      return res.status(400).send("Datos incompletos o inválidos");
    }

    router.get("/historial", async (req, res) => {
      const { tecnico, componente, desde, hasta } = req.query;

      const filtro = {};

      if (desde || hasta) {
        filtro.fecha = {};
        if (desde) filtro.fecha.$gte = new Date(desde);
        if (hasta) filtro.fecha.$lte = new Date(hasta + "T23:59:59");
      }

      if (tecnico) {
        filtro.$or = [{ "origen.id": tecnico }, { "destino.id": tecnico }];
      }

      if (componente) {
        filtro["componentes.componente"] = componente;
      }

      const movimientos = await Movimiento.find(filtro)
        .sort({ fecha: -1 })
        .populate("componentes.componente")
        .populate("origen.id")
        .populate("destino.id");

      const parseados = movimientos.map((m) => ({
        ...m.toObject(),
        origenNombre:
          m.origen.tipo === "usuario"
            ? m.origen.id?.username
            : "Bodega Central",
        destinoNombre:
          m.destino.tipo === "usuario"
            ? m.destino.id?.username
            : "Bodega Central",
      }));

      const tecnicos = await User.find();
      const componentes = await Componente.find();

      res.render("movimientos", {
        movimientos: parseados,
        tecnicos,
        componentes,
        tecnicoSeleccionado: tecnico,
        componenteSeleccionado: componente,
        desde,
        hasta,
      });
    });

    router.get("/exportar-excel", async (req, res) => {
      const { tecnico, componente, desde, hasta } = req.query;

      const filtro = {};

      if (desde || hasta) {
        filtro.fecha = {};
        if (desde) filtro.fecha.$gte = new Date(desde);
        if (hasta) filtro.fecha.$lte = new Date(hasta + "T23:59:59");
      }

      if (tecnico) {
        filtro.$or = [{ "origen.id": tecnico }, { "destino.id": tecnico }];
      }

      if (componente) {
        filtro["componentes.componente"] = componente;
      }

      const movimientos = await Movimiento.find(filtro)
        .sort({ fecha: -1 })
        .populate("componentes.componente")
        .populate("origen.id")
        .populate("destino.id");

      // Crear archivo Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Historial de movimientos");

      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 22 },
        { header: "Origen", key: "origen", width: 20 },
        { header: "Destino", key: "destino", width: 20 },
        { header: "Componentes", key: "componentes", width: 40 },
        { header: "Comentario", key: "comentario", width: 30 },
      ];

      movimientos.forEach((m) => {
        worksheet.addRow({
          fecha: new Date(m.fecha).toLocaleString(),
          origen:
            m.origen.tipo === "bodega"
              ? "Bodega Central"
              : m.origen.id?.username,
          destino:
            m.destino.tipo === "bodega"
              ? "Bodega Central"
              : m.destino.id?.username,
          componentes: m.componentes
            .map((c) => `${c.componente?.nombre} (x${c.cantidad})`)
            .join(", "),
          comentario: m.comentario || "",
        });
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=historial_movimientos.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      await workbook.xlsx.write(res);
      res.end();
    });

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
