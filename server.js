const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const requireAuth = require("./middlewares/auth");

app.get("/admin", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

dotenv.config();

const app = express();

// Conexión a MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error de conexión a MongoDB:", err));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({ secret: "secreto123", resave: false, saveUninitialized: false })
);
app.use(express.static(path.join(__dirname, "public")));

// Ruta raíz (index)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rutas
app.use("/", authRoutes);

app.get("/admin", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

// Rutas protegidas
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "views/user.html"));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
