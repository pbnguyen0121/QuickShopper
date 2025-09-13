const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");

// Hard-coded product data
const productsData = [
  {
    title: "Hendrix Velvet Barrel Chair",
    description: "This seashell-inspired barrel chair adds a touch of texture to your living room.",
    category: "Living Room Furniture",
    price: 549.99,
    salePrice: 319.99,
    shippingWeight: 25,
    shippingWidth: 150,
    shippingLength: 150,
    shippingHeight: 150,
    imageUrl: "chair.png",
    featured: true
  },
  {
    title: "Modern Sofa",
    description: "A comfortable sofa that fits perfectly in any modern living room.",
    category: "Living Room Furniture",
    price: 799.99,
    salePrice: 599.99,
    shippingWeight: 40,
    shippingWidth: 200,
    shippingLength: 90,
    shippingHeight: 85,
    imageUrl: "sofa.png",
    featured: true
  },
  {
    title: "Classic Coffee Table",
    description: "A beautiful coffee table crafted from reclaimed wood.",
    category: "Living Room Furniture",
    price: 299.99,
    salePrice: 199.99,
    shippingWeight: 20,
    shippingWidth: 120,
    shippingLength: 60,
    shippingHeight: 45,
    imageUrl: "coffeetable.png",
    featured: true
  },
  {
    title: "Contemporary TV Stand",
    description: "Sleek TV stand with ample storage.",
    category: "Living Room Furniture",
    price: 399.99,
    salePrice: 279.99,
    shippingWeight: 35,
    shippingWidth: 180,
    shippingLength: 40,
    shippingHeight: 50,
    imageUrl: "tvstand.png",
    featured: false
  },
  {
    title: "Queen Bed Frame",
    description: "Elegant queen bed frame with a minimalist design.",
    category: "Bedroom Furniture",
    price: 499.99,
    salePrice: 349.99,
    shippingWeight: 50,
    shippingWidth: 210,
    shippingLength: 200,
    shippingHeight: 100,
    imageUrl: "bedframe.png",
    featured: true
  },
  {
    title: "Nightstand",
    description: "Compact and stylish nightstand to complement your bed.",
    category: "Bedroom Furniture",
    price: 149.99,
    salePrice: 99.99,
    shippingWeight: 15,
    shippingWidth: 50,
    shippingLength: 40,
    shippingHeight: 45,
    imageUrl: "nightstand.png",
    featured: false
  }
];

router.get("/products", async (req, res) => {
  // Only allow data clerks to load data.
  if (!req.session.user || req.session.user.role !== "clerk") {
    res.status(403);
    return res.render("general/error", {
      title: "Forbidden",
      message: "You are not authorized to add products"
    });
  }

  try {
    let addedCount = 0;

    for (const productData of productsData) {
      const exists = await Product.findOne({ title: productData.title });
      if (!exists) {
        await Product.create(productData);
        addedCount++;
      }
    }

    let message = addedCount > 0
      ? `Added ${addedCount} products to the database`
      : "Products have already been added to the database";

    res.render("loadData/message", { title: "Load Data", message });
  } catch (error) {
    console.error("Error loading data:", error);
    res.status(500).render("general/error", { title: "Error", message: "An error occurred while loading data." });
  }
});

module.exports = router;
