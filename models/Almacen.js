const mongoose = require("mongoose");

const almacenSchema = new mongoose.Schema({
  componentes: [
    {
      componente: { type: mongoose.Schema.Types.ObjectId, ref: "Componente" },
      cantidad: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model("Almacen", almacenSchema);
