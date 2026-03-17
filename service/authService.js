// service/authService.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { User } from "../models/User.js";
import { sendInviteEmail } from "./mailService.js";

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "4h" }
  );

  return token;
};

export const createUser = async (email, role) => {
  const token = randomBytes(32).toString("hex");
  const tempPassword = randomBytes(6).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = new User({
    email,
    role,
    password: hashedPassword,
    resetToken: token,
    resetTokenExpiry: Date.now() + 3600000, // 1 uur
  });

  await user.save();

  const link = `${process.env.FRONTEND_URL}/password-reset/${token}`;
  await sendInviteEmail(email, link);

  return { message: "User created and mail sent" };
};

export const setPassword = async (token, password) => {
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) throw new Error("Invalid token");

  const hashed = await bcrypt.hash(password, 10);
  user.password = hashed;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  return { message: "Password set successfully" };
};