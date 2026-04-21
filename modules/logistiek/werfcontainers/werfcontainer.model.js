import mongoose from "mongoose";

const werfContainerSchema = new mongoose.Schema({
  nummer: { type: String, required: true, unique: true },
  Type: { type: mongoose.Schema.ObjectId, ref: "MachineType", required: true },
  entiteit: { type: mongoose.Schema.Types.ObjectId, ref: "Entiteit", required: true },
  verantwoordelijke: {type: String , required: false , unique: false},
  status: { type: String, enum: ["Vrij", "Kapot"] },
  comment: {type: String, required: false},
}, { timestamps: true });

export const WerfContainer = mongoose.model("WerfContainer", werfContainerSchema, "WerfContainers");