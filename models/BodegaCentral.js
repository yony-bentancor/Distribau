// models/BodegaCentral.js
const mongoose = require("mongoose");

const bodegaCentralSchema = new mongoose.Schema({
  componentes: [
    {
      componente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Componente",
        required: true,
      },
      cantidad: { type: Number, default: 0 },
    },
  ],
});

module.exports = mongoose.model("BodegaCentral", bodegaCentralSchema);
