// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  ref: { type: String, required: true },
  aanvrager: { type: String, required: true, index: true },
  leverancier: { type: String, required: true, index: true },
  categorie: { type: String, required: true, index: true },
  status: { type: String, required: true, index: true },

  producten: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      aantal: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
});

orderSchema.index({ ref: "text" });

export const LiveOrder = mongoose.model(
  "LiveOrder",
  orderSchema,
  "live_orders",
);
export const ArchiveOrder = mongoose.model(
  "ArchiveOrder",
  orderSchema,
  "archive_orders",
);
