const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // Asegurate que exista ese archivo

// Tu string de conexión a Mongo Atlas
require("dotenv").config(); // Importante para que funcione MONGO_URI

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Conectado a MongoDB");
    crearUsuario();
  })
  .catch((err) => console.error("Error de conexión:", err));

async function crearUsuario() {
  const hash = await bcrypt.hash("GUSTAVO", 10); // Contraseña encriptada
  const user = new User({
    username: "GUSTAVO",
    password: hash,
  });

  await user.save();
  console.log("✅ Usuario creado correctamente");
  mongoose.disconnect();
}
