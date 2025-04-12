// GET /bodegas-usuarios - devuelve bodegas de todos los técnicos, creando si no existen
const express = require("express");
const router = express.Router(); // ESTA LÍNEA FALTA O ESTÁ MAL UBICADA

router.get("/bodegas-usuarios", async (req, res) => {
  try {
    const tecnicos = await User.find({ username: { $ne: "admin" } }).select(
      "_id username"
    );
    const bodegas = [];

    for (const tecnico of tecnicos) {
      let bodega = await BodegaUsuario.findOne({
        usuario: tecnico._id,
      }).populate("componentes.componente", "nombre");

      // Si el técnico no tiene bodega, la creamos vacía
      if (!bodega) {
        bodega = await BodegaUsuario.create({
          usuario: tecnico._id,
          componentes: [],
        });
      }

      bodegas.push({
        usuario: tecnico,
        componentes: bodega.componentes,
      });
    }

    res.json(bodegas);
  } catch (err) {
    console.error("Error al obtener bodegas:", err);
    res.status(500).send("Error al obtener bodegas");
  }
});
