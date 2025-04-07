// models/BodegaUsuario.js
const mongoose = require("mongoose");

const bodegaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  componentes: [
    {
      componente: { type: mongoose.Schema.Types.ObjectId, ref: "Componente" },
      cantidad: { type: Number, default: 0 },
    },
  ],
});

module.exports = mongoose.model("BodegaUsuario", bodegaSchema);
