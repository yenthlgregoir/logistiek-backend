import mongoose from "mongoose";

const VerhuurSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },

  // Polymorphic asset
  asset: { type: mongoose.Schema.Types.ObjectId, required: false, refPath: "assetModel" },
  assetModel: { type: String, required: true, enum: ["Hoogtewerker", "WerfContainer"] },
  assetType: {type: String  , required: true},

  werf: { type: mongoose.Schema.Types.ObjectId, ref: "Werf", required: true },
  projectleider: { type: mongoose.Schema.Types.ObjectId, ref: "Projectleider", required: true },

  leverDatum: { type: Date, required: true },
  ophaalDatum: { type: Date },

  status: { type: String, enum: ["Leveren","Geleverd","Opgehaald","Afgewerkt"], default: "Leveren" },
  logistiekeReferentie: { type: String, required: true },

  //optioneel
  werkhoogte: { type: Number },
  entiteit: {type: mongoose.Schema.Types.ObjectId , ref: "Entiteit"}

}, { timestamps: true });

// Validatie: werkhoogte verplicht voor Schaarlift
VerhuurSchema.pre("validate", async function() {
  if ((this.assetModel === "Hoogtewerker") && (this.werkhoogte == null)) {
    throw new Error("Werkhoogte is verplicht voor Hoogtewerker verhuur");
  }
  else if(this.assetModel === "WerfContainer" && this.entiteit == null){
    throw new Error("Entiteit is verplicht voor werfcontainer verhuur")
  }
});

export const Verhuur = mongoose.model("Verhuur", VerhuurSchema, "Verhuringen");