const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // no se repite
      trim: true,
    },
    password: {
      type: String,
      required: true, // En producción usar bcrypt
    },
    cedula: {
      type: String,
      required: true,
      unique: true, // cada usuario con su CI única
      match: /^[0-9]{6,12}$/, // ejemplo validación básica (6-12 dígitos)
    },
    nombreCompleto: {
      type: String,
      required: true,
      trim: true,
    },
    departamento: {
      type: String,
      required: true,
    },
    localidad: {
      type: String,
    },
    direccion: {
      type: String,
      required: true,
    },
    telefono: {
      type: String,
      match: /^[0-9]{6,15}$/, // validación básica
    },
    celular: {
      type: String,
      required: true,
      match: /^[0-9]{6,15}$/, // validación básica
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, // validación email
    },
    whatsapp: {
      type: String,
      match: /^[0-9]{6,15}$/, // opcional, puede coincidir con celular
    },
    puesto: {
      type: String,
      required: true, // ej: técnico, vendedor, administrador
    },
    rol: {
      type: String,
      enum: ["admin", "tecnico", "vendedor", "usuario"],
      default: "usuario",
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);
