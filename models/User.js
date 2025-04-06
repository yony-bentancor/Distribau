const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String, // admin o user
});

module.exports = mongoose.model("User", userSchema);
