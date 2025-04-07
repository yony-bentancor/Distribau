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
const tecnicoRoutes = require("./routes/user");
const session = require("express-session");
const path = require("path");
const userRoutes = require("./routes/user");

dotenv.config(); // Cargar variables de entorno

const app = express(); // Declarar app al principio

// Conexión a MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error de conexión a MongoDB:", err));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({ secret: "secreto123", resave: false, saveUninitialized: false })
);
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "clave-secreta",
    resave: false,
    saveUninitialized: false,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/", userRoutes);

// Ruta raíz (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Rutas públicas y de login
app.use("/", authRoutes);
app.use("/", stockRoutes);

// Rutas protegidas
app.get("/admin", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.get("/user", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "views/user.html"));
});
app.use("/", componentesRoutes);
app.use("/tecnico", tecnicoRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor en puerto ${PORT}`));
