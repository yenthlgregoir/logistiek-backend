import mongoose from "mongoose"

const VerhuurSchema = new mongoose.Schema({
    reference: {
        type: String, 
        required: true,
        index: true,
        unique: true,
    },
    type: {
        type: mongoose.model.ObjectId,
        ref: "MachineType",
        required: true
    },
    werf:{
        type: mongoose.model.objectId,
        ref: "Werf",
        required: true
    },
    projectleider:{
        type: mongoose.model.objectId,
        ref: "Projectleider",
        required: true,
    },
    toestel: {
        type: mongoose.model.objectId,
        ref: "Schaarlift",
        required: false,
    },

    beginDatum: {
      type: Date,
      required: true,
    },

    eindDatum: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.beginDatum;
        },
        message: "Einddatum moet later zijn dan begindatum.",
      },
    },
})

export const Verhuur = mongoose.model("Verhuur" , VerhuurSchema , "Verhuringen")