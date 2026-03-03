// models/Order.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productcode: { type: String, required: true },
    omschrijving: { type: String, required: true, index: true },
    leverancier: { type: String, required: true, index: true },
    eenheidsprijs: { type: String, required: true, index: true },
    btw: { type: String, required: true, index: true }
  },
);


productSchema.index({
  productcode: "text",
  omschrijving: "text",
  leverancier: "text"
});

export const Product = mongoose.model(
  "Product",
  productSchema,
  "Producten"
);
