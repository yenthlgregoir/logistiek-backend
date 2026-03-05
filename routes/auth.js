// routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {User} from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }


  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "4h" }
  );

  res.json({ token });
});

export default router;