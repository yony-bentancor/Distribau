const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");

const authRoutes = require("./routes/auth");
const requireAuth = require("./middlewares/auth");
const componentesRoutes = require("./routes/componentes");
const stockRoutes = require("./routes/stock");
const userRoutes = require("./routes/user"); // ESTE es el que carga la vista del técnico

dotenv.config();

const app = express();

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión a MongoDB:", err));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "clave-secreta", // Cambiá esto por algo fuerte en producción
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Rutas
app.use("/", authRoutes);
app.use("/", stockRoutes);
app.use("/", userRoutes);
app.use("/", componentesRoutes);

// Ruta pública
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Vista admin protegida
app.get("/admin", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
