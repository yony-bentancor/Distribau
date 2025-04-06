// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String, // En producción, usar bcrypt para guardar encriptado
});

module.exports = mongoose.model("User", userSchema);
