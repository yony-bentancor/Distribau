const mongoose = require("mongoose");

const componenteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  puntosInstalacion: { type: Number, required: true },
  puntosConexion: { type: Number, required: true },
  modelo: { type: String, required: false },
});

module.exports = mongoose.model("Componente", componenteSchema);
