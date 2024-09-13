const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const multer = require("multer");
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const User = require("../../models/user");
const auth = require("../../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "tmp/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

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

      user = new User({ email, password, avatarURL });
      await user.save();

      return res.status(201).json({
        user: {
          email: user.email,
          subscription: user.subscription,
          avatarURL: user.avatarURL,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

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
      if (!user) {
        return res.status(401).json({ message: "Email or password is wrong" });
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
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/logout", auth, async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/current", auth, (req, res) => {
  res.json({
    email: req.user.email,
    subscription: req.user.subscription,
    avatarURL: req.user.avatarURL,
  });
});

router.post("/avatars", auth, upload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { path: tempPath, originalname } = req.file;

  const uniqueFilename = `${req.user._id}-${Date.now()}-${originalname}`;
  const uploadPath = path.join(
    __dirname,
    "../../public/avatars",
    uniqueFilename
  );

  try {
    const image = await Jimp.read(tempPath);
    await image.resize(250, 250).writeAsync(uploadPath);

    const avatarURL = `/avatars/${uniqueFilename}`;
    req.user.avatarURL = avatarURL;
    await req.user.save();

    fs.unlinkSync(tempPath);

    res.json({ avatarURL });
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    res.status(500).json({ message: "Failed to process image" });
  }
});

module.exports = router;
