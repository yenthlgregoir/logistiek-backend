import mongoose from "mongoose";

const hoogteWerkerSchema = new mongoose.Schema({
  nummer: { type: String, required: true, unique: true, index: true },
  Type: { type: mongoose.Schema.ObjectId, ref: "MachineType", required: true },
  serienummer: { type: String },
  bouwjaar: { type: Number },
  platformhoogte: { type: Number, required: true },
  werkhoogte: { type: Number, required: true }, 
  keuringDatum: { type: Date },
  status: { type: String, enum: ["Vrij", "Bezet", "Kapot", "Ongekeurd"] },
  comment: {type: String, required: false},
}, { timestamps: true });

export const Hoogtewerker = mongoose.model("Hoogtewerker", hoogteWerkerSchema, "hoogtewerkers");