const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const sgMail = require("@sendgrid/mail");
const User = require("../../models/user");
const { v4: uuidv4 } = require("uuid");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Signup route
router.post(
  "/signup",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(409).json({ message: "Email in use" });
      }

      const avatarURL = gravatar.url(email, {
        s: "250",
        r: "pg",
        d: "identicon",
      });
      const verificationToken = uuidv4();

      user = new User({ email, password, avatarURL, verificationToken });
      await user.save();

      // Send verification email
      const verificationLink = `${req.protocol}://${req.get(
        "host"
      )}/api/users/verify/${verificationToken}`;
      const msg = {
        to: email,
        from: process.env.SENDGRID_SENDER_EMAIL,
        subject: "Email Verification",
        html: `<p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>`,
      };
      await sgMail.send(msg);

      res.status(201).json({
        user: {
          email: user.email,
          subscription: user.subscription,
          avatarURL: user.avatarURL,
        },
        message: "Registration successful, verification email sent",
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Email verification route
router.get("/verify/:verificationToken", async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user || !user.verify) {
        return res
          .status(401)
          .json({ message: "Email not verified or wrong credentials" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Email or password is wrong" });
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
      user.token = token;
      await user.save();

      return res.status(200).json({
        token,
        user: {
          email: user.email,
          subscription: user.subscription,
          avatarURL: user.avatarURL,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Resend verification email route
router.post("/verify", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/api/users/verify/${user.verificationToken}`;
    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER_EMAIL,
      subject: "Email Verification",
      html: `<p>Please verify your email by clicking the following link: <a href="${verificationLink}">Verify Email</a></p>`,
    };
    await sgMail.send(msg);

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
