const mongoose = require("mongoose");

const ventaSchema = new mongoose.Schema({
  numeroContrato: { type: String, required: true },
  nombreCliente: { type: String, required: true },
  vendedor: { type: String, required: true },
  fechaVenta: { type: Date },
  fechaCarga: { type: Date, default: Date.now },
  comentario: String,
  departamento: String,
  localidad: String,
  instalacion: String,
  diaHora: String,
  tecnico: String,
  usuarioCarga: String,
  promo: String,
  metodoPago: String,
  canalVenta: String,
});

module.exports = mongoose.model("Venta", ventaSchema);
