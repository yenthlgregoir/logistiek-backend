import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String,
    enum: ["admin", "purchase", "renting"],
    default: "user" 
  }
});

export const User =  mongoose.model("User", userSchema);
