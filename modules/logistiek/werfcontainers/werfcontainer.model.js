import mongoose from "mongoose";

const werfContainerSchema = new mongoose.Schema({
  nummer: { type: String, required: true, unique: true },
  Type: { type: mongoose.Schema.ObjectId, ref: "MachineType", required: true },
  entiteit: { type: mongoose.Schema.Types.ObjectId, ref: "Entiteit", required: true }
}, { timestamps: true });

export const WerfContainer = mongoose.model("WerfContainer", werfContainerSchema, "WerfContainers");