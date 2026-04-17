// models/toestel.js
import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    beginDatum: {
      type: Date,
    },
    eindDatum: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value > this.beginDatum;
        },
        message: "Einddatum moet later zijn dan begindatum.",
      },
    },
    statusType: {
      type: String,
      enum: ["Actief", "Kapot"],
      required: true,
      default: "Actief",
    },
  },
  { _id: false },
);

const toestelSchema = new mongoose.Schema(
  {
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ToestelType",
      required: true,
      index: true,
    },

    Ref: {
      type: String,
      trim: true,
      default: "N/A",
    },
    nrplaat: {
      type: String,
      trim: true,
      uppercase: true,
      required: false,
      default: "N/A",
    },
    chasisnummer: {
      type: String,
      trim: true,
      required: false,
      default: "N/A",
    },
    status: statusSchema,
  },
  { timestamps: true },
);

export const Toestel = mongoose.model("Toestel", toestelSchema, "Toestellen");
