const mongoose = require("mongoose");

const ImageHashSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true }, 
  url: { type: String }, 
});

module.exports = mongoose.model("ImageHash", ImageHashSchema);
