import express from "express";
import * as VerhuurService from "./verhuur.service.js";
import * as pdfService from "../../helper/pdfService.js";
import auth from "../../../middelware/auth.js";

const router = express.Router();

// Alle verhuringen ophalen
router.get("/", auth("logistics", "admin"), async (req, res) => {
  try {
    const search = req.query.search || "";
    const type = req.query.type || "";
    const assetModel = req.query.assetModel || "all"; // aangepast
    const verhuring = await VerhuurService.getVerhuur(search, assetModel , type);
    res.status(200).json(verhuring);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PDF export
router.get("/export-pdf/:id", auth("admin", "renting"), async (req, res) => {
  try {
    const { id } = req.params;
    const boeking = await VerhuurService.getVerhuurById(id);
    pdfService.generateVerhuurPDF(res, boeking);
  } catch (error) {
    console.error(error);
    res.status(500).send("Fout bij PDF genereren");
  }
});

// Nieuwe verhuur aanmaken
router.post("/", auth("logistics", "admin"), async (req, res) => {
  try {
    const nieuwVerhuur = await VerhuurService.createVerhuur(req.body);
    res.status(201).json(nieuwVerhuur);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Verhuur updaten
router.patch("/update/:id", auth("logistics", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const updatedVerhuur = await VerhuurService.updateVerhuur(id, req.body);
    res.status(201).json(updatedVerhuur);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vrije assets ophalen
router.get("/vrije-assets", auth("logistics", "admin"), async (req, res) => {
  try {
    const assets = await VerhuurService.getVrijeAssets(req.query); // aangepast
    res.status(200).json(assets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Asset toewijzen aan verhuur
router.patch("/assignAsset", auth("logistics", "admin"), async (req, res) => {
  try {
    const verhuur = await VerhuurService.assignAsset(req.body); // aangepast
    res.status(201).json(verhuur);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Verhuur verwijderen
router.delete("/:id", auth("logistics", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    await VerhuurService.deleteVerhuur(id);
    res.status(201).json(true);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;