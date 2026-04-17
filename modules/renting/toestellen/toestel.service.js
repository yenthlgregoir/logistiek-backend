import mongoose from "mongoose";
import { Toestel } from "./toestel.model.js";
import { ToestelType } from "./toestelType.model.js";
import { Boeking } from "../boekingen/boeking.model.js";



export const getToestellen = async (filter = {}, sort = { createdAt: -1 }) => {

  const cleanFilter = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v != null && v !== '' && v !== 'undefined')
  );

  const toestellen = await Toestel.find(cleanFilter)
    .sort(sort)
    .populate("type", "naam")
    .lean();

  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);

  const actieveBoekingen = await Boeking.find({
  toestel: { $ne: null },
  beginDatum: { $lte: vandaag },
  eindDatum: { $gte: vandaag },
})
.populate({
  path: "klant",
  select: "leverAdressen",
})
.select("toestel leverAdres klant")
.lean();

const toestelMap = {};

actieveBoekingen.forEach(b => {
  if (!b.toestel) return;

  let adres = null;

  if (b.klant && b.leverAdres) {
    adres = b.klant.leverAdressen?.find(
      a => a._id.toString() === b.leverAdres.toString()
    );
  }

  toestelMap[b.toestel.toString()] = adres || null;
});



  // 🔹 gnw toevoegen
  const enriched = toestellen.map(t => {
  const adres = toestelMap[t._id.toString()];

  return {
    ...t,
    gnw: adres ? adres : "vrij"
  };
});

  return enriched.sort((a, b) => {
    const aIsNumeric = /^[0-9]+$/.test(a.Ref);
    const bIsNumeric = /^[0-9]+$/.test(b.Ref);

    if (aIsNumeric && !bIsNumeric) return -1;
    if (!aIsNumeric && bIsNumeric) return 1;

    if (aIsNumeric && bIsNumeric) {
      return Number(a.Ref) - Number(b.Ref);
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};
export const createToestel = async (data) => {
  const { type, ...rest } = data;

  let typeId;

  if (mongoose.Types.ObjectId.isValid(type)) {
    const bestaandType = await ToestelType.findById(type);
    if (!bestaandType) {
      throw new Error("ToestelType bestaat niet.");
    }
    typeId = bestaandType._id;
  } else {
    let bestaandType = await ToestelType.findOne({ naam: type });
    if (!bestaandType) {
      bestaandType = new ToestelType({ naam: type });
      await bestaandType.save();
    }
    typeId = bestaandType._id;
  }

  return await Toestel.create({
    ...rest,
    type: typeId,
  });
};
export const updateToestel = async (id, data) => {
  try {
    const updates = { ...data };

    const toestel = await Toestel.findById(id);
    if (!toestel) {
      throw new Error("Toestel niet gevonden");
    }

    // 🔧 Fix voor ObjectId velden
    if (updates.klant === "null" || updates.klant === "") {
      updates.klant = null;
    }

    if (updates.type === "null" || updates.type === "") {
      updates.type = null;
    }

    // status fix
    if ("status" in updates) {
      updates.status =
        typeof updates.status === "object"
          ? updates.status
          : { statusType: updates.status };
    }

    const allowedFields = [
      "naam",
      "Ref",
      "type",
      "status",
      "chasisnummer",
      "nrplaat",
      "klant",
    ];

    allowedFields.forEach((field) => {
      if (field in updates) {
        toestel[field] = updates[field];
      }
    });

    await toestel.save();

    const populated = await Toestel.findById(toestel._id)
      .populate("type", "naam")
      .populate("klant", "naam")
      .lean();

    return populated;
  } catch (error) {
    console.error("UpdateToestel error:", error);
    throw error;
  }
};
export const deleteToestel = async (id) => {
  const deleted = await Toestel.findByIdAndDelete(id);
  if (!deleted) {
    throw new Error("Toestel niet gevonden");
  }
  return deleted;
};

export const getTypes = async () => {
  return await ToestelType.find().sort({ naam: 1 }).lean();
};
export const changeToetelStatus = async (id, data) => {
  const { statusType } = data;

  const toegelatenStatussen = ["Actief", "Kapot"];

  if (!toegelatenStatussen.includes(statusType)) {
    throw new Error("Ongeldige status. Enkel 'Actief' of 'Kapot' toegestaan.");
  }

  const updated = await Toestel.findByIdAndUpdate(
    id,
    { "status.statusType": statusType },
    { new: true },
  );

  if (!updated) {
    throw new Error("Toestel niet gevonden.");
  }

  return updated;
};
