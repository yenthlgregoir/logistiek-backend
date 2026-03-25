// routes/archiveOrders.js
import express from "express";
import auth from "../../../middelware/auth.js";
import * as toestelService from "./toestel.service.js";
import { ToestelType } from "./toestelType.model.js";
import { Klant } from "../klanten/klant.model.js"
import * as boekingService from "../boekingen/boeking.service.js"

const router = express.Router();

router.get("/", auth("admin", "renting"), async (req, res) => {
  try {
    const { search, type, klant, beginDatum, eindDatum, sort = "createdAt", order = "desc" } = req.query;

    const query = {};

    // --- TYPE filter ---
    if (type) {
      const typeDoc = await ToestelType.findOne({ naam: type }).lean();
      if (typeDoc) query.type = typeDoc._id;
     
    }

    // --- KLANT filter ---
    if (klant) {
      const klantDoc = await Klant.findOne({ naam: klant }).lean();
      if (klantDoc) query.klant = klantDoc._id;
     
    }

    let items = [];

    // --- VRIJE TOESTELLEN FILTER ---
    if (beginDatum && eindDatum) {
      // Hergebruik de bestaande functie van boekingService
      const vrijeToestellen = await boekingService.getVrijeToestellen({
        query: {
          beginDatum,
          eindDatum,
          toestelType: query.type ? query.type.toString() : type || "", 
          klant:query.klant ? query.klant.toString() : klant || "",
        },
      });
      items = vrijeToestellen;
    } else {
      // --- Normale toestellen query ---

      const sortObj = { [sort]: order === "desc" ? -1 : 1 };
      items = await toestelService.getToestellen(query, sortObj);
    }

    // --- SEARCH filter ---
    if (search && search !== "undefined") {
      const lower = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.type?.naam?.toLowerCase().includes(lower) ||
          t.klant?.naam?.toLowerCase().includes(lower) ||
          t.Ref?.toLowerCase().includes(lower) ||
          t.chasisnummer?.toLowerCase().includes(lower) ||
          t.nrplaat?.toLowerCase().includes(lower)
      );
    }

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fout bij ophalen toestellen" });
  }
});

router.get("/toestel/:id", auth("admin", "renting"), async (req, res) => {
  try {
    const item = await toestelService.getToestelById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Niet gevonden" });
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Ongeldig ID" });
  }
});

router.post("/", auth("admin", "renting"), async (req, res) => {
  try {
    const nieuw = await toestelService.createToestel(req.body);
    res.status(201).json(nieuw);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Fout bij aanmaken", error: err.message });
  }
});

router.patch("/:id", auth("admin", "renting"), async (req, res) => {
  try {
    const updated = await toestelService.updateToestel(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (err.message === "Toestel niet gevonden") {
      res.status(404).json({ message: err.message });
    } else {
      res.status(400).json({ message: "Fout bij updaten", error: err.message });
    }
  }
});

router.delete("/:id", auth("admin", "renting"), async (req, res) => {
  try {
    await toestelService.deleteToestel(req.params.id);
    res.json({ message: "Succesvol verwijderd" });
  } catch (err) {
    console.error(err);
    if (err.message === "Toestel niet gevonden") {
      res.status(404).json({ message: err.message });
    } else {
      res.status(400).json({ message: "Fout bij verwijderen" });
    }
  }
});

router.get("/types", auth("admin", "renting"), async (req, res) => {
  try {
    const types = await toestelService.getTypes();
    res.json({ types });
  } catch {
    res.status(400).json({ message: "Fout bij het ophalen van de types" });
  }
});

router.patch("/types/:id", auth("admin", "renting"), async (req, res) => {
  try {
    const toestelId = req.params.id;
    const data = req.body;

    const updatedToestel = await toestelService.changeToetelStatus(
      toestelId,
      data,
    );

    res.status(200).json({
      message: "Status succesvol aangepast",
      toestel: updatedToestel,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
