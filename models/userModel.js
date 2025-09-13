const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: "customer",
  },
});

userSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) return next();

  bcrypt
    .genSalt()
    .then((salt) => {
      return bcrypt.hash(user.password, salt);
    })
    .then((hashedPassword) => {
      user.password = hashedPassword;
      next();
    })
    .catch((err) => {
      console.log("Error hashing password:", err);
      next(err);
    });
});

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
