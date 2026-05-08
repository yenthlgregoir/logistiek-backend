import mongoose from "mongoose";
import { Toestel } from "./toestel.model.js";
import { ToestelType } from "./toestelType.model.js";
import { Boeking } from "../boekingen/boeking.model.js";

const DEFAULT_SORT = { createdAt: -1 };

export const getToestellen = async (filter = {}, sort = DEFAULT_SORT) => {
  const cleanFilter = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v != null && v !== '' && v !== 'undefined')
  );

  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);

  const sortKey = Object.keys(sort)[0] || "createdAt";
  const sortDir = sort[sortKey] === -1 ? -1 : 1;

  // =========================
  // 1. BASIS TOESTELLEN (TYPE FILTER!)
  // =========================
  const toestellen = await Toestel.find(
    cleanFilter.type ? { type: cleanFilter.type } : {}
  )
    .sort(sort)
    .populate("type", "naam")
    .lean();

  if (!toestellen.length) return [];

  const toestelIds = toestellen.map(t => t._id);

  // =========================
  // 2. ACTIEVE BOEKINGEN
  // =========================
  const boekingQuery = {
    toestel: { $in: toestelIds },
    beginDatum: { $lte: vandaag },
    eindDatum: { $gte: vandaag },
  };

  // 🔥 KLANT FILTER HIER TOEVOEGEN
  if (cleanFilter.klant) {
    boekingQuery.klant = cleanFilter.klant;
  }

  const actieveBoekingen = await Boeking.find(boekingQuery)
    .populate({
      path: "klant",
      select: "leverAdressen naam",
    })
    .select("toestel leverAdres klant")
    .lean();

  // =========================
  // 3. MAP BOEKINGEN → toestelId
  // =========================
  const boekingMap = {};

  actieveBoekingen.forEach(b => {
    if (!b.toestel) return;

    let adres = null;

    if (b.klant && b.leverAdres) {
      adres = b.klant.leverAdressen?.find(
        a => a._id.toString() === b.leverAdres.toString()
      );
    }

    boekingMap[b.toestel.toString()] = adres || null;
  });

  // =========================
  // 4. RESULTAAT BOUWEN
  // =========================
  let result = toestellen.map(t => ({
    ...t,
    gnw: boekingMap[t._id.toString()] || "vrij",
  }));

  // =========================
  // 5. 🔥 BELANGRIJK: ALS KLANT FILTER → ENKEL DIE MET BOEKING
  // =========================
  if (cleanFilter.klant) {
    result = result.filter(t => boekingMap[t._id.toString()]);
  }

  // =========================
  // 6. SORT
  // =========================
  return sortToestellen(result, sortKey, sortDir);
};


// =========================
// SORT HELPER
// =========================
function sortToestellen(arr, sortKey, sortDir) {
  return arr.sort((a, b) => {
    if (sortKey === "Ref") {
      const aIsNumeric = /^[0-9]+$/.test(a.Ref);
      const bIsNumeric = /^[0-9]+$/.test(b.Ref);

      if (aIsNumeric && !bIsNumeric) return -1 * sortDir;
      if (!aIsNumeric && bIsNumeric) return 1 * sortDir;

      if (aIsNumeric && bIsNumeric) {
        return (Number(a.Ref) - Number(b.Ref)) * sortDir;
      }
    }

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (!aVal) return 1;
    if (!bVal) return -1;

    if (!Number.isNaN(new Date(aVal)) && !Number.isNaN(new Date(bVal))) {
      return (new Date(aVal) - new Date(bVal)) * sortDir;
    }

    if (typeof aVal === "string") {
      return aVal.localeCompare(bVal) * sortDir;
    }
    return (aVal - bVal) * sortDir;
  });
}
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
    { "status.statu sType": statusType },
    { new: true },
  );

  if (!updated) {
    throw new Error("Toestel niet gevonden.");
  }

  return updated;
};
