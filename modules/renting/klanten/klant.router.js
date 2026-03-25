// routes/klanten.js
import express from "express";
import auth from "../../../middelware/auth.js";
import {klantenService} from "./klant.service.js"

const router = express.Router();


router.get("/", auth("admin" , "renting"), async (req, res) => {
  try {
    const items = await klantenService.getAll(req.query);
    res.json({ items });
  } catch  {
    res.status(500).json({ message: "Fout bij ophalen klanten" });
  }
});

router.get("/:id", auth("admin" , "renting"), async (req, res) => {
  try {
    const item = await klantenService.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Niet gevonden" });
    }
    res.json(item);
    } catch  {
    res.status(400).json({ message: "Ongeldig ID" });
  }
});

router.post("/", auth("admin" , "renting"), async (req, res) => {
  try {
    const nieuw = await klantenService.create(req.body);
    res.status(201).json(nieuw);
  } catch (err) {
    res.status(400).json({ message: "Fout bij aanmaken", error: err.message });
  }
});

router.patch("/:id", auth("admin" , "renting"), async (req, res) => {
  try {
    const updated = await klantenService.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Klant niet gevonden" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Fout bij updaten", error: err.message });
  }
});

router.delete("/:id", auth("admin" , "renting"), async (req, res) => {
  try {
    const deleted = await klantenService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Niet gevonden" });
    }
    res.json({ message: "Succesvol verwijderd" });
    } catch  {
    res.status(400).json({ message: "Fout bij verwijderen" });
  }
});

router.post("/:id/leveradressen", auth("admin" , "renting"), async (req, res) => {
  try {
    const updated = await klantenService.addLeverAdres(
      req.params.id,
      req.body
    );

    if (!updated) {
      return res.status(404).json({ message: "Klant niet gevonden" });
    }

    res.json(updated);
    } catch  {
    res.status(400).json({ message: "Fout bij toevoegen leveradres" });
  }
});


router.delete("/:id/leveradressen/:adresId", auth("admin" , "renting"), async (req, res) => {
  try {
    const updated = await klantenService.removeLeverAdres(
      req.params.id,
      req.params.adresId
    );

    if (!updated) {
      return res.status(404).json({ message: "Klant niet gevonden" });
    }

    res.json(updated);
    } catch {
    res.status(400).json({ message: "Fout bij verwijderen leveradres" });
  }
});

router.patch('/:id/leveradres', klantenService.updateLeverAdres);


export default router;