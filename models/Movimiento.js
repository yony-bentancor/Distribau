const mongoose = require("mongoose");

const movimientoSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now,
    },
    origen: {
      tipo: {
        type: String,
        enum: ["usuario", "bodega", "almacen"],
        required: true,
      }, // agregué "almacen"
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null si es bodega o almacén
    },
    destino: {
      tipo: { type: String, enum: ["usuario", "bodega"], required: true },
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    componentes: [
      {
        componente: { type: mongoose.Schema.Types.ObjectId, ref: "Componente" },
        cantidad: Number,
      },
    ],
    comentario: String,
  },
  {
    timestamps: true, // 👈 activa createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model("Movimiento", movimientoSchema);
