const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  shippingWeight: { type: Number, required: true },
  shippingWidth: { type: Number, required: true },
  shippingLength: { type: Number, required: true },
  shippingHeight: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  featured: { type: Boolean, required: true }
});

module.exports = mongoose.model("Product", productSchema);
