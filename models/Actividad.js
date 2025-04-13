// models/Actividad.js
const mongoose = require("mongoose");

const actividadSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  tipo: {
    type: String,
    enum: [
      "instalacion",
      "ampliacion",
      "continuacion",
      "reduccion",
      "desinstalacion",
      "reparacion",
    ],
    required: true,
  },
  tecnico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  componentesUsados: [
    {
      componente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Componente",
        required: true,
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
  estado: {
    type: String,
    enum: ["realizado", "cancelado", "pendiente"],
    default: "pendiente",
  },
  comunicarse: {
    type: Boolean,
    default: false,
  },
  traslado: {
    type: Boolean,
    default: false,
  },
  km: {
    type: Number,
    default: 0,
  },
  puntajeManual: {
    type: Number,
    default: 0,
  },
  puntajeTotal: {
    type: Number,
    default: 0,
  },
  comentario: {
    type: String,
  },
  creadoEn: {
    type: Date,
    default: Date.now,
  },
  ultimaEdicion: {
    type: Date,
    default: Date.now,
  },
  editable: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Actividad", actividadSchema);
