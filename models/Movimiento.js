const mongoose = require("mongoose");

const movimientoSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default: Date.now,
  },
  origen: {
    tipo: { type: String, enum: ["usuario", "bodega"], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null si es bodega
  },
  destino: {
    tipo: { type: String, enum: ["usuario", "bodega"], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null si es bodega
  },
  componentes: [
    {
      componente: { type: mongoose.Schema.Types.ObjectId, ref: "Componente" },
      cantidad: Number,
    },
  ],
  comentario: String, // opcional
});

module.exports = mongoose.model("Movimiento", movimientoSchema);
