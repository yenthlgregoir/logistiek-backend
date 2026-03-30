import mongoose from "mongoose"

const VerhuurSchema = new mongoose.Schema({
    reference: {
        type: String, 
        required: true,
        index: true,
        unique: true,
    },
    machineType: {
        type: mongoose.Schema.ObjectId,
        ref: "MachineType",
        required: true
    },
    werf:{
        type: mongoose.Schema.ObjectId,
        ref: "Werf",
        required: true
    },
    projectleider:{
        type: mongoose.Schema.ObjectId,
        ref: "Projectleider",
        required: true,
    },
    werkhoogte:{
        type : Number,
        required : true,
    },
    toestel: {
        type: mongoose.Schema.ObjectId,
        ref: "Schaarlift",
        required: false,
    },

    leverDatum: {
      type: Date,
      required: true,
    },
    
    ophaalDatum: {
      type: Date,
      required: false,
      validate: {
    validator: function (value) {
      if (!value) return true; // mag leeg zijn
      return value > this.leverDatum;
    },
    message: "Einddatum moet later zijn dan begindatum.",
  },
    },
    status: {
      type: String,
      required: true,
      enum: ["Geleverd" , "Leveren" , "Afgewerkt" , "Opgehaald"],
      default: "Leveren",
        },
    logistiekeReferentie:{
      type:String,
      required:true,
    }
},
  { timestamps: true },
)

export const Verhuur = mongoose.model("Verhuur" , VerhuurSchema , "Verhuringen")