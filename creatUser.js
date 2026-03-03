import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {User} from "./models/User.js";

await mongoose.connect("mongodb://127.0.0.1:27017/LogistiekApp");

const hashedPassword = await bcrypt.hash("test123", 12);

await User.create({
  email: "admin@bedrijf.be",
  password: hashedPassword,
  role: "admin"
});

console.log("User created");
process.exit();
