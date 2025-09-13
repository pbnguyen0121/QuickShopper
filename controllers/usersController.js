const express = require("express");
const router = express.Router();

const FormData = require("form-data");
const Mailgun = require("mailgun.js");
const userModel = require("../models/userModel");

router.get("/sign-up", (req, res) => {

  res.render("users/sign-up", {
    title: "Sign Up",
    values: { firstName: "", lastName: "", email: "", password: "" },
    validationMessages: {}
  });
});

router.post("/sign-up", (req, res) => {
  console.log(req.body);
  const { firstName, lastName, email, password } = req.body;

  let passedValidation = true;
  let validationMessages = {};

  if (!firstName || firstName.trim().length === 0) {
    passedValidation = false;
    validationMessages.firstName = "First name is required.";
  } else if (firstName.trim().length < 2) {
    passedValidation = false;
    validationMessages.firstName = "First name must be at least 2 characters.";
  }

  if (!lastName || lastName.trim().length === 0) {
    passedValidation = false;
    validationMessages.lastName = "Last name is required.";
  }

  if (!email || email.trim().length === 0) {
    passedValidation = false;
    validationMessages.email = "Email is required.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      passedValidation = false;
      validationMessages.email = "Please enter a valid email address.";
    }
  }

  if (!password || password.trim().length === 0) {
    passedValidation = false;
    validationMessages.password = "Password is required.";
  } else {
    // 8-12 chars, at least 1 lowercase, 1 uppercase, 1 number, 1 symbol
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/;
    if (!passwordRegex.test(password)) {
      passedValidation = false;
      validationMessages.password =
        "Password must be 8-12 chars and include lowercase, uppercase, number, symbol.";
    }
  }

  if (!passedValidation) {
    return res.render("users/sign-up", {
      title: "Sign Up",
      values: { firstName, lastName, email, password },
      validationMessages
    });
  }

  const newUser = new userModel({ firstName, lastName, email, password });

  newUser
    .save()
    .then((savedUser) => {
      console.log("User saved:", savedUser);

      const mailgun = new Mailgun(FormData);
      const mg = mailgun.client({
        username: "api",
        key: process.env.API_KEY, 
      });

      mg.messages
        .create("sandbox664304deb94c4f0b8958c559e0cad143.mailgun.org", {
          from: "Mailgun Sandbox <postmaster@sandbox664304deb94c4f0b8958c559e0cad143.mailgun.org>",
          to: [email],
          subject: "Welcome to My Website!",
          html: `
            <h2>Welcome, ${firstName} ${lastName}!</h2>
            <p>We’re excited to have you on board.</p>
            <p>Best regards,</p>
            <p>Phuong Bac, I<3NY</p>
          `
        })
        .then(() => {
          return res.redirect("/general/welcome");
        })
        .catch((error) => {
          console.log("Mailgun Error:", error);
          validationMessages.email =
            "Failed to send welcome email. Please try again.";
          return res.render("users/sign-up", {
            title: "Sign Up",
            values: { firstName, lastName, email, password },
            validationMessages
          });
        });
    })
    .catch((err) => {
      console.log("Error saving user:", err);
      if (err.code === 11000) {
        validationMessages.email =
          "That email is already registered. Please use another.";
      } else {
        validationMessages.email = "Unexpected error. Please try again.";
      }

      return res.render("users/sign-up", {
        title: "Sign Up",
        values: { firstName, lastName, email, password },
        validationMessages
      });
    });
});

module.exports = router;

