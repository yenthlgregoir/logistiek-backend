// services/klantenService.js
import { Klant } from "../models/klant.js";

export const klantenService = {

  async getAll({ search, sort = "createdAt", order = "desc" }) {
    const query = {};

    if (search) {
      query.$or = [
        { naam: { $regex: search, $options: "i" } },
        { mailadres: { $regex: search, $options: "i" } },
      ];
    }

    return await Klant.find(query)
      .sort({ [sort]: order === "desc" ? -1 : 1 });
  },

  async getById(id) {
    return await Klant.findById(id);
  },

  async create(data) {
    return await Klant.create(data);
  },

  async update(id, data) {
    const klant = await Klant.findById(id);
    if (!klant) return null;

    Object.assign(klant, data);
    return await klant.save();
  },

  async delete(id) {
    return await Klant.findByIdAndDelete(id);
  },

  // 🔥 Leveradres toevoegen
  async addLeverAdres(klantId, adresData) {
    return await Klant.findByIdAndUpdate(
      klantId,
      { $push: { leverAdressen: adresData } },
      { new: true }
    );
  },

  // 🔥 Leveradres verwijderen
  async removeLeverAdres(klantId, adresId) {
    return await Klant.findByIdAndUpdate(
      klantId,
      { $pull: { leverAdressen: { _id: adresId } } },
      { new: true }
    );
  }

};