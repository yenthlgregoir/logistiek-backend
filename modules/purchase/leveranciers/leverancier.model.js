// models/klant.js
import mongoose from "mongoose";
const adresSchema = new mongoose.Schema(
  {
    straat: { type: String },
    huisnummer: { type: String },
    postcode: { type: String },
    gemeente: { type: String },
  },
  { _id: true },
);
const contactPersoonSchema = new mongoose.Schema({
  naam: { type: String },
  mailadres: { type: String },
  telefoonnummer: { type: String },
});

const leverancierSchema = new mongoose.Schema({
  naam: { type: String, required: true },
  telefoonnummer: { type: String, index: true },
  mailadres: { type: String, index: true },
  Adres: adresSchema,
  BTWnummer: { type: String, index: true },
  contactpersonen: [contactPersoonSchema],
});

leverancierSchema.index({ naam: "text" });

export const Leverancier = mongoose.model(
  "Leverancier",
  leverancierSchema,
  "Leveranciers",
);
