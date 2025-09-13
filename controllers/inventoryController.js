const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const path = require("path");
const fs = require("fs");

// Middleware: Only allow data clerks.
function isClerk(req, res, next) {
  if (!req.session.user || req.session.user.role !== "clerk") {
    res.status(403);
    return res.render("general/error", {
      title: "Unauthorized",
      message: "You are not authorized to view this page."
    });
  }
  next();
}

router.get("/", async (req, res) => {
  if (req.session.user && req.session.user.role === "clerk") {
    return res.status(401).render("general/error", {
      title: "Unauthorized",
      message: "Data clerks are not authorized to view this page."
    });
  }
  
  try {
    const products = await Product.find({});
    const grouped = products.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {});
    const groupedArray = Object.keys(grouped).map(category => ({
      category,
      products: grouped[category]
    }));
    res.render("inventory/inventory", {
      title: "Inventory",
      groupedCategories: groupedArray
    });
  } catch (error) {
    console.error(error);
    res.render("general/error", { title: "Error", message: "Error retrieving products." });
  }
});

router.get("/list", isClerk, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ title: 1 });
    res.render("inventory/list", {
      title: "Inventory Management",
      products,
      message: `Hello, ${req.session.user.firstName}, manage your products here.`
    });
  } catch (error) {
    console.error(error);
    res.render("general/error", { title: "Error", message: "Error retrieving products." });
  }
});


router.get("/add", isClerk, (req, res) => {
  res.render("inventory/add", { title: "Add Product", values: {}, validationMessages: {} });
});

router.post("/add", isClerk, async (req, res) => {
  const {
    title,
    description,
    category,
    price,
    salePrice,
    shippingWeight,
    shippingWidth,
    shippingLength,
    shippingHeight
  } = req.body;
  let featured = req.body.featured ? true : false;
  let validationMessages = {};

  if (!title || title.trim() === "") validationMessages.title = "Title is required.";
  if (!description || description.trim() === "") validationMessages.description = "Description is required.";
  if (!category || category.trim() === "") validationMessages.category = "Category is required.";
  if (!price || isNaN(price) || Number(price) <= 0) validationMessages.price = "Price must be greater than 0.";
  if (salePrice && (isNaN(salePrice) || Number(salePrice) <= 0)) validationMessages.salePrice = "Sale price must be greater than 0.";
  if (!shippingWeight || isNaN(shippingWeight) || Number(shippingWeight) <= 0) validationMessages.shippingWeight = "Shipping weight must be positive.";
  if (!shippingWidth || isNaN(shippingWidth) || Number(shippingWidth) <= 0) validationMessages.shippingWidth = "Shipping width must be positive.";
  if (!shippingLength || isNaN(shippingLength) || Number(shippingLength) <= 0) validationMessages.shippingLength = "Shipping length must be positive.";
  if (!shippingHeight || isNaN(shippingHeight) || Number(shippingHeight) <= 0) validationMessages.shippingHeight = "Shipping height must be positive.";

  if (!req.files || !req.files.imageUrl) {
    validationMessages.imageUrl = "Product image is required.";
  }

  if (Object.keys(validationMessages).length > 0) {
    return res.render("inventory/add", { title: "Add Product", values: req.body, validationMessages });
  }

  const imageFile = req.files.imageUrl;
  const allowedExtensions = /jpg|jpeg|png|gif/;
  const extension = path.extname(imageFile.name).toLowerCase();
  if (!allowedExtensions.test(extension)) {
    validationMessages.imageUrl = "Only image files (jpg, jpeg, png, gif) are allowed.";
    return res.render("inventory/add", { title: "Add Product", values: req.body, validationMessages });
  }

  const uniqueFilename = Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;
  const uploadPath = path.join(__dirname, "../public/images", uniqueFilename);

  imageFile.mv(uploadPath, async err => {
    if (err) {
      console.error(err);
      validationMessages.imageUrl = "Error uploading image.";
      return res.render("inventory/add", { title: "Add Product", values: req.body, validationMessages });
    }


    const newProduct = new Product({
      title,
      description,
      category,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      shippingWeight: Number(shippingWeight),
      shippingWidth: Number(shippingWidth),
      shippingLength: Number(shippingLength),
      shippingHeight: Number(shippingHeight),
      imageUrl: uniqueFilename,
      featured
    });

    try {
      await newProduct.save();
      res.redirect("/inventory/list");
    } catch (error) {
      console.error("Error saving product:", error);
      res.render("general/error", { title: "Error", message: "Error saving product." });
    }
  });
});


router.get("/edit/:id", isClerk, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.render("general/error", { title: "Error", message: "Product not found." });
    res.render("inventory/edit", { title: "Edit Product", product, validationMessages: {} });
  } catch (error) {
    console.error(error);
    res.render("general/error", { title: "Error", message: "Error retrieving product." });
  }
});


router.post("/edit/:id", isClerk, async (req, res) => {
  const {
    title,
    description,
    category,
    price,
    salePrice,
    shippingWeight,
    shippingWidth,
    shippingLength,
    shippingHeight
  } = req.body;
  let featured = req.body.featured ? true : false;
  let validationMessages = {};

  if (!title || title.trim() === "") validationMessages.title = "Title is required.";
  if (!description || description.trim() === "") validationMessages.description = "Description is required.";
  if (!category || category.trim() === "") validationMessages.category = "Category is required.";
  if (!price || isNaN(price) || Number(price) <= 0) validationMessages.price = "Price must be greater than 0.";
  if (salePrice && (isNaN(salePrice) || Number(salePrice) <= 0)) validationMessages.salePrice = "Sale price must be greater than 0.";
  if (!shippingWeight || isNaN(shippingWeight) || Number(shippingWeight) <= 0) validationMessages.shippingWeight = "Shipping weight must be positive.";
  if (!shippingWidth || isNaN(shippingWidth) || Number(shippingWidth) <= 0) validationMessages.shippingWidth = "Shipping width must be positive.";
  if (!shippingLength || isNaN(shippingLength) || Number(shippingLength) <= 0) validationMessages.shippingLength = "Shipping length must be positive.";
  if (!shippingHeight || isNaN(shippingHeight) || Number(shippingHeight) <= 0) validationMessages.shippingHeight = "Shipping height must be positive.";

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.render("general/error", { title: "Error", message: "Product not found." });

    if (req.files && req.files.imageUrl) {
      const imageFile = req.files.imageUrl;
      const allowedExtensions = /jpg|jpeg|png|gif/;
      const extension = path.extname(imageFile.name).toLowerCase();
      if (!allowedExtensions.test(extension)) {
        validationMessages.imageUrl = "Only image files (jpg, jpeg, png, gif) are allowed.";
        return res.render("inventory/edit", { title: "Edit Product", product, validationMessages });
      }
      const uniqueFilename = Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;
      const uploadPath = path.join(__dirname, "../public/images", uniqueFilename);

      await imageFile.mv(uploadPath);

      const oldImagePath = path.join(__dirname, "../public/images", product.imageUrl);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);

      product.imageUrl = uniqueFilename;
    }

    if (Object.keys(validationMessages).length > 0) {
      return res.render("inventory/edit", { title: "Edit Product", product, validationMessages });
    }


    product.title = title;
    product.description = description;
    product.category = category;
    product.price = Number(price);
    product.salePrice = salePrice ? Number(salePrice) : undefined;
    product.shippingWeight = Number(shippingWeight);
    product.shippingWidth = Number(shippingWidth);
    product.shippingLength = Number(shippingLength);
    product.shippingHeight = Number(shippingHeight);
    product.featured = featured;

    await product.save();
    res.redirect("/inventory/list");
  } catch (error) {
    console.error("Error updating product:", error);
    res.render("general/error", { title: "Error", message: "Error updating product." });
  }
});

router.get("/remove/:id", isClerk, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.render("general/error", { title: "Error", message: "Product not found." });
    res.render("inventory/remove", { title: "Remove Product", product });
  } catch (error) {
    console.error(error);
    res.render("general/error", { title: "Error", message: "Error retrieving product." });
  }
});


router.post("/remove/:id", isClerk, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.render("general/error", { title: "Error", message: "Product not found." });
    
    const imagePath = path.join(__dirname, "../public/images", product.imageUrl);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/inventory/list");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.render("general/error", { title: "Error", message: "Error deleting product." });
  }
});

module.exports = router;
