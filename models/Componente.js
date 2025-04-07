// models/Componente.js
const mongoose = require("mongoose");

const componenteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
  },
  puntaje: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Componente", componenteSchema);
