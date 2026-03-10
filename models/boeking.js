// models/boeking.js
import mongoose from "mongoose";

const boekingSchema = new mongoose.Schema(
  {
    ref: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

    toestelType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ToestelType",
      required: true,
      index: true,
    },

    toestel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Toestel",
      default: null,
      required: false,
      index: true,
    },

    type: {
      type: String,
      enum: ["Transport door logistiek", "ophaling door klant"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Aangevraagd", "Bevestigd", "Leveren", "Geleverd"],
      default: "Aangevraagd",
      index: true,
    },

    klant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Klant",
      required: true,
      index: true,
    },

    leverAdres: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Adres",
      required: false,
    },
    
    comment: {
      type: String,
      ref: "Comment",
      required: false,
    }
  },
  { timestamps: true }
);

/* -------------------------------------------------------
   DATUM VALIDATIE (WERKT VOOR SAVE & UPDATE QUERIES)
   ------------------------------------------------------- */

async function validateDates() {
  const update = this.getUpdate?.() ?? this;

  const begin =
    update.beginDatum ??
    update.$set?.beginDatum ??
    this.beginDatum;

  const eind =
    update.eindDatum ??
    update.$set?.eindDatum ??
    this.eindDatum;

  if (begin && eind && new Date(eind) <= new Date(begin)) {
    throw new Error("Einddatum moet later zijn dan begindatum.");
  }
}

boekingSchema.pre("save", validateDates);
boekingSchema.pre("findOneAndUpdate", validateDates);
boekingSchema.pre("updateOne", validateDates);

/* -------------------------------------------------------
   BUSINESSREGEL: toestel verplicht bij Leveren / Geleverd
   ------------------------------------------------------- */

async function checkToestelRequired() {
  const update = this.getUpdate?.() ?? {};
  const nextStatus =
    update.status ??
    update.$set?.status ??
    this.status;

  if (["Leveren", "Geleverd"].includes(nextStatus)) {
    const toestelId =
      update.toestel ??
      update.$set?.toestel ??
      this.toestel;

    if (!toestelId) {
      throw new Error(
        "Toestel is vereist zodra de status 'Leveren' of 'Geleverd' wordt."
      );
    }
  }
}

boekingSchema.pre("save", checkToestelRequired);
boekingSchema.pre("findOneAndUpdate", checkToestelRequired);
boekingSchema.pre("updateOne", checkToestelRequired);

/* -------------------------------------------------------
   INDEXEN
   ------------------------------------------------------- */

boekingSchema.index({ toestelType: 1, beginDatum: 1, eindDatum: 1 });
boekingSchema.index({ toestel: 1, beginDatum: 1, eindDatum: 1 });
boekingSchema.index({ beginDatum: 1, eindDatum: 1 });

export const Boeking = mongoose.model("Boeking", boekingSchema, "Boekingen");