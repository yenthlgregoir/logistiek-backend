// services/toestelService.js
import mongoose from "mongoose";
import { Toestel } from "../models/toestel.js";
import { ToestelType } from "../models/toestelType.js";

export const getToestellen = async (filter = {}, sort = { createdAt: -1 }) => {
  const toestellen = await Toestel.find(filter)
    .sort(sort)
    .populate("type", "naam")
    .populate({
      path: "klant",
      select: "naam",
    })
    .lean();
  console.log(toestellen)
  return toestellen.sort((a, b) => {
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

// Haal 1 toestel op en vervang type ObjectId door type.naam
export const getToestelById = async (id) => {
  return await Toestel.findById(id)
    .populate("type", "naam", "Ref" , "Chasisnummer" , "Nummerplaat")
    .lean();
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
  const toestel = await Toestel.findById(id);

  if (!toestel) {
    throw new Error("Toestel niet gevonden");
  }

  const { newType, ...rest } = data;

  if (newType) {
    let bestaandType = await ToestelType.findOne({ naam: newType });

    if (!bestaandType) {
      bestaandType = new ToestelType({ naam: newType });
      await bestaandType.save();
    }

    rest.type = bestaandType._id;
  }

  Object.assign(toestel, rest);

  return await toestel.save();
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
    { new: true }
  );

  if (!updated) {
    throw new Error("Toestel niet gevonden.");
  }

  return updated;
};