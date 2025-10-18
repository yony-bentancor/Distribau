const express = require("express");
const router = express.Router();
const Componente = require("../models/Componente");
const BodegaCentral = require("../models/BodegaCentral");
const Movimiento = require("../models/Movimiento");
const Almacen = require("../models/Almacen");
const ExcelJS = require("exceljs");

router.get("/", async (req, res) => {
  try {
    // Traer solo los campos que la vista usa y como objetos planos:
    const crudos = await Componente.find(
      {},
      { nombre: 1, modelo: 1, puntosInstalacion: 1, puntosConexion: 1 }
    ).lean();

    // Normalizar: quitar nulos y completar defaults seguros
    const componentes = (crudos || []).filter(Boolean).map((c) => {
      const nombre =
        typeof c?.nombre === "string" && c.nombre.trim()
          ? c.nombre.trim()
          : "—";
      const modelo =
        typeof c?.modelo === "string" && c.modelo.trim()
          ? c.modelo.trim()
          : "Sin modelo";
      return {
        _id: c?._id?.toString?.() || "",
        nombre,
        nombreLower: nombre === "—" ? "" : nombre.toLowerCase(),
        modelo,
        puntosInstalacion: Number.isFinite(c?.puntosInstalacion)
          ? c.puntosInstalacion
          : 0,
        puntosConexion: Number.isFinite(c?.puntosConexion)
          ? c.puntosConexion
          : 0,
      };
    });

    // Agrupar por modelo para que la vista itere agrupados[modelo]
    const agrupados = componentes.reduce((acc, item) => {
      (acc[item.modelo] ||= []).push(item);
      return acc;
    }, {});

    // Lista ordenada de modelos para iterar ordenado
    const modelos = Object.keys(agrupados).sort((a, b) => a.localeCompare(b));

    // HISTORIAL (tal como lo tenías, pero blindando campos)
    const movs = await Movimiento.find({ "origen.tipo": "almacen" })
      .sort({ fecha: -1 })
      .limit(20)
      .populate("componentes.componente", "nombre modelo")
      .lean();

    const historial = (movs || []).map((mov) => ({
      fecha: new Date(mov.fecha).toLocaleDateString("es-UY"),
      componentes: (mov.componentes || []).map((c) => ({
        nombre: c?.componente?.nombre || "Sin nombre",
        modelo: c?.componente?.modelo || "Sin modelo",
        cantidad: Number.isFinite(c?.cantidad) ? c.cantidad : 0,
      })),
    }));

    // Enviar a la vista lo que realmente usa
    res.render("almacen", { modelos, agrupados, historial });
  } catch (err) {
    console.error("❌ Error al cargar /almacen:", err);
    res.status(500).send("Error al mostrar el formulario de almacén");
  }
});

// POST: procesar ingreso desde almacén a bodega central
router.post("/", async (req, res) => {
  try {
    const entradas = req.body;

    const fecha = req.body.fechaIngreso
      ? new Date(req.body.fechaIngreso)
      : new Date();
    console.log(fecha);
    console.log("🧾 Body completo:", req.body);
    console.log("📆 Fecha de ingreso cruda:", req.body.fechaIngreso);
    console.log("📆 Fecha parseada:", fecha);

    delete entradas.fechaIngreso; // eliminamos del objeto para que no lo procese como componente

    let almacen = await Almacen.findOne();
    if (!almacen) almacen = new Almacen({ componentes: [] });

    let bodega = await BodegaCentral.findOne();
    if (!bodega) bodega = new BodegaCentral();

    const movimientos = [];

    // Limpieza de posibles entradas corruptas en almacen o bodega
    almacen.componentes = almacen.componentes.filter((c) => c.componente);
    bodega.componentes = bodega.componentes.filter((c) => c.componente);

    for (let id in entradas) {
      const cantidad = parseInt(entradas[id]);
      if (!isNaN(cantidad) && cantidad > 0) {
        // Almacen
        const enAlmacen = almacen.componentes.find(
          (c) => c.componente && c.componente.toString() === id
        );
        if (enAlmacen) {
          enAlmacen.cantidad -= cantidad;
        }

        // Bodega Central
        const enBodega = bodega.componentes.find(
          (c) => c.componente && c.componente.toString() === id
        );
        if (enBodega) {
          enBodega.cantidad += cantidad;
        } else {
          bodega.componentes.push({ componente: id, cantidad });
        }

        movimientos.push({ componente: id, cantidad });
      }
    }

    await almacen.save();
    await bodega.save();

    const nuevoMovimiento = new Movimiento({
      fecha,
      origen: { tipo: "almacen", id: almacen._id },
      destino: { tipo: "bodega", id: null },
      componentes: movimientos,
      comentario: "Ingreso desde almacén",
    });

    await nuevoMovimiento.save();

    res.redirect(
      "/almacen?fechaIngreso=" + encodeURIComponent(req.body.fechaIngreso)
    );
  } catch (err) {
    console.error("❌ Error al guardar stock desde almacén:", err);
    res.status(500).send("Error interno");
  }
});

// API: obtener historial de ingresos desde almacén (formato JSON)
router.get("/api/historial-almacen", async (req, res) => {
  try {
    const movimientos = await Movimiento.find({ "origen.tipo": "almacen" })
      .sort({ fecha: -1 })
      .limit(20)
      .populate("componentes.componente")
      .lean();

    const historial = movimientos.map((mov) => ({
      fecha: new Date(mov.createdAt || mov.fecha).toLocaleDateString("es-UY"),
      componentes: mov.componentes.map((c) => ({
        nombre: c.componente?.nombre || "Sin nombre",
        cantidad: c.cantidad,
      })),
    }));

    res.json(historial);
  } catch (err) {
    console.error("❌ Error al obtener historial:", err);
    res.status(500).send("Error al obtener historial");
  }
});

router.get("/exportar-excel/:fecha", async (req, res) => {
  const fechaFiltro = req.params.fecha;

  try {
    const movimientos = await Movimiento.find({ "origen.tipo": "almacen" })
      .sort({ fecha: -1 })
      .populate("componentes.componente", "nombre modelo")
      .lean();

    // Filtrar movimientos por fecha
    const movimientosFiltrados = movimientos.filter((mov) => {
      const fechaMov = new Date(mov.fecha).toLocaleDateString("es-UY");
      return fechaMov === fechaFiltro;
    });

    if (movimientosFiltrados.length === 0) {
      return res
        .status(404)
        .send("No se encontraron movimientos para esa fecha");
    }

    // Crear Excel
    const workbook = new ExcelJS.Workbook();

    // 🛡️ Reemplazar caracteres inválidos para el nombre de la hoja
    const hojaNombre = "Ingreso_" + fechaFiltro.replace(/[\/:*?[\]]/g, "-");
    const sheet = workbook.addWorksheet(hojaNombre);

    sheet.columns = [
      { header: "Fecha", key: "fecha", width: 20 },
      { header: "Modelo", key: "modelo", width: 20 },
      { header: "Componente", key: "nombre", width: 30 },
      { header: "Cantidad", key: "cantidad", width: 10 },
    ];

    movimientosFiltrados.forEach((mov) => {
      const fecha = new Date(mov.fecha).toLocaleDateString("es-UY");
      mov.componentes.forEach((c) => {
        if (!c.componente) return;
        sheet.addRow({
          fecha,
          modelo: c.componente.modelo || "Sin modelo",
          nombre: c.componente.nombre,
          cantidad: c.cantidad,
        });
      });
    });

    // 🗂️ Nombre del archivo sin caracteres inválidos
    const filename = `ingreso_${fechaFiltro.replace(/[\/:*?[\]]/g, "-")}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Error exportando ingreso:", err);
    res.status(500).send("Error al generar Excel");
  }
});

module.exports = router;
