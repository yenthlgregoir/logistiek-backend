// routes/archiveOrders.js
import express from "express";
import auth from "../middelware/auth.js";
import * as toestelService from "../service/toestelService.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { search, sort = "createdAt", order = "desc" } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { cntrRef: { $regex: search, $options: "i" } },
        // Omdat type een ObjectId is, zoek hier in de gekoppelde collectie eventueel anders:
        // Of via een populate en filter (complexer)
      ];
    }

    const sortObj = { [sort]: order === "desc" ? -1 : 1 };

    const items = await toestelService.getToestellen(query, sortObj);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fout bij ophalen toestellen" });
  }
});

router.get("/toestel/:id", auth, async (req, res) => {
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

router.post("/", auth, async (req, res) => {
  try {
    const nieuw = await toestelService.createToestel(req.body);
    res.status(201).json(nieuw);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Fout bij aanmaken", error: err.message });
  }
});

router.patch("/:id", auth, async (req, res) => {
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

router.delete("/:id", auth, async (req, res) => {
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

router.get("/types", auth, async (req, res) => {
  try {
    const types = await toestelService.getTypes();
    res.json({ types });
  } catch (error) {
    res.status(400).json({ message: "Fout bij het ophalen van de types" });
  }
});

router.patch("/types/:id", auth, async (req, res) => {
  try {
    const toestelId = req.params.id;
    const data = req.body;

    const updatedToestel = await toestelService.changeToetelStatus(toestelId, data);

    res.status(200).json({
      message: "Status succesvol aangepast",
      toestel: updatedToestel,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


export default router;