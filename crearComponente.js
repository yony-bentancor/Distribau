const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/Componente"); // Asegurate que exista ese archivo

// Tu string de conexión a Mongo Atlas

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Conectado a MongoDB");
    crearComponente();
  })
  .catch((err) => console.error("Error de conexión:", err));

async function crearComponente() {
  const component = new Component({
    nombre: "Central Climax",
  });

  await component.save();
  console.log("✅ componente creado correctamente");
  mongoose.disconnect();
}
