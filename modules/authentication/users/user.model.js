import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  naam:{type: String, required: true},
  password: { type: String, required: true},
  role: {
    type: String,
    enum: ["admin", "purchase", "renting" , "logistics"],
    default: "user",
  },
  resetToken: String,
  resetTokenExpiry: Date,
});

export const User = mongoose.model("User", userSchema);
