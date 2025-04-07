// models/Componente.js
const mongoose = require("mongoose");

const componenteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  puntaje: { type: Number, required: true },
  stock: { type: Number, default: 0 }, // ✅ stock en bodega central
});

module.exports = mongoose.model("Componente", componenteSchema);
