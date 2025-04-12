const mongoose = require("mongoose");

const componenteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  puntosInstalacion: { type: Number, required: true },
  puntosConexion: { type: Number, required: true },
});

module.exports = mongoose.model("Componente", componenteSchema);
