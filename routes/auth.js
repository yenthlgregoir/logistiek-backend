// routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {User} from "../models/User.js";
import auth from "../middelware/auth.js";
import { sendInviteEmail } from "../service/mailService.js";
const {
  randomBytes,
} = await import('node:crypto');

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

router.post("/create-user", auth("admin"), async (req, res) => {

  const { email, role } = req.body;

  const token = randomBytes(32).toString("hex");
  const tempPassword = randomBytes(6).toString("hex"); // 6 bytes = 12 hex tekens
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = new User({
    email,
    role,
    password:hashedPassword,
    resetToken: token,
    resetTokenExpiry: Date.now() + 3600000
  });

  await user.save();

const link = `${process.env.FRONTEND_URL}/password-reset/${token}`;

  await sendInviteEmail(email, link);

  res.json({ message: "User created and mail sent" });

});
router.post("/set-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid token" });
  }
  const hashed = await bcrypt.hash(password, 10);

  user.password = hashed;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  res.json({ message: "Password set successfully" });
});
export default router;