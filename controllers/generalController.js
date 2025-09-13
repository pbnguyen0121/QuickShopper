const express = require("express");
const router = express.Router();
const FormData = require("form-data");
const Mailgun = require("mailgun.js");
const productUtil = require("../modules/product-util");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");

// GET /log-in
router.get("/log-in", (req, res) => {
  res.render("users/log-in", {
    title: "Log In",
    values: { email: "", password: "" },
    validationMessages: {}
  });
});

// POST /log-in
router.post("/log-in", async (req, res) => {
  const { email, password, role } = req.body;
  let passedValidation = true;
  let validationMessages = {};

  if (!email || email.trim().length === 0) {
    passedValidation = false;
    validationMessages.email = "Please enter your email.";
  }
  if (!password || password.trim().length === 0) {
    passedValidation = false;
    validationMessages.password = "Please enter your password.";
  }

  if (!passedValidation) {
    return res.render("users/log-in", {
      title: "Log In",
      values: { email, password },
      validationMessages
    });
  }

  try {
    const user = await userModel.findOne({ email: email.trim() });
    if (!user) {
      validationMessages.email = "Invalid email or password.";
      return res.status(401).render("users/log-in", {
        title: "Log In",
        values: { email, password, role },
        validationMessages
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      validationMessages.email = "Invalid email or password.";
      return res.status(401).render("users/log-in", {
        title: "Log In",
        values: { email, password, role },
        validationMessages
      });
    }

    req.session.user = {
      _id: user._id,
      firstName: user.firstName,
      role: role || "customer",
      email: user.email
    };

    if (req.session.user.role === "clerk") {
      return res.redirect("/inventory/list");
    } else {
      return res.redirect("/cart");
    }
  } catch (err) {
    console.error("Login error:", err);
    validationMessages.email = "Unexpected error. Please try again.";
    return res.render("users/log-in", {
      title: "Log In",
      values: { email, password, role },
      validationMessages
    });
  }
});

// GET /logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error destroying session:", err);
    }
    res.redirect("/log-in");
  });
});

// GET / - Home page
router.get("/", (req, res) => {
  if (req.session.user && req.session.user.role === "clerk") {
    return res.status(401).render("general/error", {
      title: "Unauthorized",
      message: "Data clerks are not authorized to view the Home page."
    });
  }
  res.render("general/home", {
    title: "Home",
    featuredProducts: productUtil.getFeaturedProducts()
  });
});

// GET /general/welcome
router.get("/general/welcome", (req, res) => {
  res.render("general/welcome", { 
    title: "Welcome"
  });
});

// GET /buy/:id - Add a product to the shopping cart
router.get("/buy/:id", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "customer") {
    return res.status(401).render("general/error", {
      title: "Unauthorized",
      message: "You must be logged in as a customer to buy products."
    });
  }
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.render("general/error", { title: "Error", message: "Product not found." });
    }
    
    // Initialize cart if it does not exist
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    // Check if product already in cart; if so, increment quantity
    let existingItem = req.session.cart.find(item => item.product._id.toString() === product._id.toString());
    if (existingItem) {
      existingItem.qty += 1;
    } else {
      req.session.cart.push({ product: product, qty: 1 });
    }
    res.redirect("/cart");
  } catch (err) {
    console.error("Error in /buy/:id:", err);
    res.render("general/error", { title: "Error", message: "An error occurred while processing your request." });
  }
});

// GET /cart - Display shopping cart
router.get("/cart", (req, res) => {
  if (!req.session.user || req.session.user.role !== "customer") {
    return res.status(401).render("general/error", {
      title: "Unauthorized",
      message: "You must be logged in as a customer to view the cart."
    });
  }
  res.render("general/cart", {
    title: "Shopping Cart",
    cart: req.session.cart,
    message: `Hello, ${req.session.user.firstName}. This is your cart.`
  });
});

// POST /cart/update/:id - Update quantity
router.post("/cart/update/:id", (req, res) => {
  if (!req.session.cart) req.session.cart = [];
  const productId = req.params.id;
  let qty = parseInt(req.body.qty);
  if (isNaN(qty) || qty < 1) qty = 1;
  let cartItem = req.session.cart.find(item => item.product._id.toString() === productId);
  if (cartItem) {
    cartItem.qty = qty;
  }
  res.redirect("/cart");
});

// POST /cart/remove/:id - Remove item from cart
router.post("/cart/remove/:id", (req, res) => {
  if (!req.session.cart) req.session.cart = [];
  const productId = req.params.id;
  req.session.cart = req.session.cart.filter(item => item.product._id.toString() !== productId);
  res.redirect("/cart");
});

// POST /cart/checkout - Place order, send confirmation email, and clear cart
router.post("/cart/checkout", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "customer") {
    return res.status(401).render("general/error", {
      title: "Unauthorized",
      message: "You must be logged in as a customer to place an order."
    });
  }
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect("/cart");
  }
  
  let subtotal = 0;
  req.session.cart.forEach(item => {
    let price = item.product.salePrice ? item.product.salePrice : item.product.price;
    subtotal += price * item.qty;
  });
  let tax = subtotal * 0.10;
  let grandTotal = subtotal + tax;
  
  // Build order summary (without images)
  let orderSummary = "Your Order Details:\n\n";
  req.session.cart.forEach(item => {
    let price = item.product.salePrice ? item.product.salePrice : item.product.price;
    orderSummary += `Title: ${item.product.title}\nQuantity: ${item.qty}\nPrice: $${price.toFixed(2)}\nLine Total: $${(price * item.qty).toFixed(2)}\n\n`;
  });
  orderSummary += `Subtotal: $${subtotal.toFixed(2)}\nTax (10%): $${tax.toFixed(2)}\nGrand Total: $${grandTotal.toFixed(2)}\n`;
  
  // Corrected Mailgun initialization: pass the FormData module directly
  const FormData = require("form-data");
  const Mailgun = require("mailgun.js");
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.API_KEY,
  });
  
  const customerEmail = req.session.user.email;
  
  try {
    await mg.messages.create("sandbox664304deb94c4f0b8958c559e0cad143.mailgun.org", { // Replace with your actual Mailgun domain
      from: "Mailgun Sandbox <postmaster@sandbox664304deb94c4f0b8958c559e0cad143.mailgun.org>",
      to: [customerEmail],
      subject: "Your Order Confirmation",
      text: orderSummary
    });
    
    // Clear the cart but keep the user logged in
    req.session.cart = [];
    res.render("general/message", {
      title: "Order Placed",
      message: "Your order has been placed successfully. A confirmation email has been sent to your email address."
    });
  } catch (error) {
    console.error("Error sending order email:", error);
    res.render("general/error", {
      title: "Checkout Error",
      message: "An error occurred while processing your order. Please try again."
    });
  }
});


module.exports = router;
