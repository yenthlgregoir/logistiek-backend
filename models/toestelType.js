// models/toestelType.js
import mongoose from "mongoose";

const toestelTypeSchema = new mongoose.Schema(
  {
    naam: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const ToestelType = mongoose.model(
  "ToestelType",
  toestelTypeSchema,
  "ToestelTypes"
);