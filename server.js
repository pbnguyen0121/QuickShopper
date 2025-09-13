const dotenv = require("dotenv");
dotenv.config({ path: "./config/.env" }); 

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const session = require("express-session");
const fileUpload = require("express-fileupload"); // <-- Added

const app = express();

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("views", path.join(__dirname, "/views"));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Use express-fileupload middleware
app.use(fileUpload());

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user; 
  next();
});

const generalController = require("./controllers/generalController");
const inventoryController = require("./controllers/inventoryController");
const usersController = require("./controllers/usersController");
const loadDataController = require("./controllers/loadDataController");

app.use("/load-data", loadDataController);
app.use("/", generalController); 
app.use("/inventory", inventoryController);
app.use("/", usersController);  

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const HTTP_PORT = process.env.PORT || 8080;
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

mongoose.connect(process.env.MONGOOES_DB_KEY)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err.message);
  });
