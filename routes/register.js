const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.get("/register", (req, res) => {
  res.render("register"); // Debe existir un archivo views/register.ejs o similar
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Faltan datos");
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).send("Nombre de usuario ya existe");
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const newUser = new User({ username, password: hashed });
  await newUser.save();

  res.redirect("/login");
});

module.exports = router;
