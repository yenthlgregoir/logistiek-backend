import express from "express";
import {
  createBoeking,
  getBoekingen,
  getBoekingById,
  changeStatus,
  getVrijeToestellen,
  assignToestel,
  boekingVerwijderen,
  updateBoeking,
  updatePeriode,
} from "./boeking.service.js";
import auth from "../../../middelware/auth.js";
const router = express.Router();

router.get("/", auth("admin", "renting"), async (req, res) => {
  try {
    const { search, startDatum, eindDatum, archief, type } = req.query;
    const boekingen = await getBoekingen({ search, startDatum, eindDatum, archief, type });
    res.status(200).json(boekingen);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.post("/", auth("admin", "renting"), async (req, res) => {
  try {
    const boeking = await createBoeking(req.body);

    res.status(201).json({
      success: true,
      data: boeking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /boekingen/:id
router.get("/:id", auth("admin", "renting"), async (req, res) => {
  try {
    const { id } = req.params;

    // Haal boeking op via service
    const boeking = await getBoekingById(id);

    if (!boeking) {
      return res.status(404).json({ message: "Boeking niet gevonden" });
    }

    res.json(boeking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/status", auth("admin", "renting"),changeStatus);

router.get("/toestellen/vrij", auth("admin", "renting"), async (req, res) => {
  try {
    // Hier roep je de service-functie aan
    const toestellen = await getVrijeToestellen(req, res);
    res.json(toestellen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fout bij ophalen vrije toestellen" });
  }
});router.patch("/:id/toestellen/assign", auth("admin", "renting"), assignToestel);

router.delete("/:id", auth("admin", "renting"), boekingVerwijderen);

router.patch("/:id", auth("admin", "renting"), updateBoeking);

router.patch("/periode/update", updatePeriode);

export default router;
