import mongoose from "mongoose";

const schaarliftSchema = new mongoose.Schema(
  {
    nummer: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    Type:{
        type: mongoose.Schema.ObjectId,
        ref: "MachineType",
        required: true, 
    },
    serienummer: {
        type: String, 
        required: false
    },
    bouwjaar: {
        type: Number,
        required: false
    },
    platformhoogte: {
        type: Number, 
        required: true
    },
    werkhoogte: {
        type: Number,
        required: true
    },
    keuringDatum: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        enum: ["Vrij" , "Bezet" , "Kapot" , "Ongekeurd"],
    }
  },
  { timestamps: true },
);

export const Schaarlift = mongoose.model("Schaarlift", schaarliftSchema, "Schaarliften");
