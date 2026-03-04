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
  },
async updateLeverAdres(req, res) {
  try {
    const { id } = req.params;                // Klant ID
    const { adres } = req.body;  // Nieuw adres object met _id en velden

    if (!adres || !adres._id) {
      return res.status(400).json({ message: "Leveradres met _id is verplicht." });
    }

    // Klant ophalen
    const klant = await Klant.findById(id);
    if (!klant) {
      return res.status(404).json({ message: "Klant niet gevonden." });
    }

    // Leveradres zoeken met .id() (Mongoose subdocument methode)
    const bestaandAdres = klant.leverAdressen.id(adres._id);
    if (!bestaandAdres) {
      return res.status(400).json({ message: "Dit leveradres hoort niet bij deze klant." });
    }

    // Leveradres bijwerken: alle velden overschrijven met het nieuwe object
    Object.assign(bestaandAdres, adres);

    // Klant opslaan met bijgewerkt leveradres
    await klant.save();

    res.status(200).json({ message: "Leveradres succesvol bijgewerkt.", adres: bestaandAdres });
  } catch (error) {
    console.error("Fout bij bijwerken leveradres:", error);
    res.status(500).json({ message: "Fout bij bijwerken leveradres." });
  }
}
};