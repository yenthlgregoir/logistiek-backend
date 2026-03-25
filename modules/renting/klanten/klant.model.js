// models/klant.js
import mongoose from "mongoose";
const adresSchema = new mongoose.Schema(
  {
    naam: { type: String },
    straat: { type: String },
    huisnummer: { type: String },
    postcode: { type: String },
    gemeente: { type: String },
  },
  { _id: true },
);

const klantSchema = new mongoose.Schema({
  naam: { type: String, required: true },
  klantNummer: { type: String, required: true },
  telefoonnummer: { type: String, index: true },
  mailadres: { type: String, index: true },
  factuurAdres: adresSchema,
  leverAdressen: [adresSchema],
  BTWnummer: { type: String, index: true },
});

klantSchema.index({ naam: "text" });

export const Klant = mongoose.model("Klant", klantSchema, "Klanten");
