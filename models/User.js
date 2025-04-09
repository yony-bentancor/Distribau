// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String, // En producción, usar bcrypt para guardar encriptado
  whatsapp: String,
});

module.exports = mongoose.model("User", userSchema);
