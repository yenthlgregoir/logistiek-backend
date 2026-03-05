// routes/archiveOrders.js
import express from "express";
import { ArchiveOrder, LiveOrder } from "../models/Order.js";

const router = express.Router();
import auth from "../middelware/auth.js";

/** Zelfde list-endpoint als live, met filters/zoek/sort/paging */
router.get("/", auth("admin" , "purchase"), async (req, res) => {
  try {
    const {
      status,
      leverancier,
      categorie,
      aanvrager,
      q,
      sort = "-createdAt",
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (leverancier) filter.leverancier = leverancier;
    if (categorie) filter.categorie = categorie;
    if (aanvrager) filter.aanvrager = aanvrager;

    const finalFilter = { ...filter };
    let useText = false;
    if (q && q.trim()) {
      useText = true;
      finalFilter.$text = { $search: q };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const sortObj = {};
    if (sort.startsWith("-")) sortObj[sort.substring(1)] = -1;
    else sortObj[sort] = 1;

    let items, total;
    try {
      [items, total] = await Promise.all([
        ArchiveOrder.find(finalFilter).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
        ArchiveOrder.countDocuments(finalFilter)
      ]);
    } catch (e) {
      if (useText) {
        delete finalFilter.$text;
        finalFilter.ref = { $regex: q, $options: "i" };
        [items, total] = await Promise.all([
          ArchiveOrder.find(finalFilter).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
          ArchiveOrder.countDocuments(finalFilter)
        ]);
      } else {
        throw e;
      }
    }

    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("GET /archive-orders error", err);
    res.status(500).json({ message: "Fout bij ophalen archive orders" });
  }
});

router.get("/:id",auth("admin" , "purchase"), async (req, res) => {
  try {
    const item = await ArchiveOrder.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ message: "Niet gevonden" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Fout bij ophalen archive order" });
  }
});

router.post("/",auth("admin" , "purchase"), async (req, res) => {
  try {
    const created = await ArchiveOrder.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "ID bestaat al", keyValue: err.keyValue });
    }
    res.status(400).json({ message: "Validatie of invoerfout", details: err.message });
  }
});

router.patch("/:id",auth("admin" , "purchase"), async (req, res) => {
  try {
    const updated = await ArchiveOrder.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Niet gevonden" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Update fout", details: err.message });
  }
});

router.delete("/:id",auth("admin" , "purchase"), async (req, res) => {
  try {
    const result = await ArchiveOrder.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Niet gevonden" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Verwijderen mislukt" });
  }
});

/** POST /archive-orders/:id/restore → verplaats terug naar live_orders */
router.post("/:id/restore",auth("admin" , "purchase"), async (req, res) => {
  try {
    const doc = await ArchiveOrder.findOneAndDelete({ id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ message: "Niet gevonden" });

    const restored = await LiveOrder.create(doc);
    res.status(201).json(restored);
  } catch (err) {
    res.status(500).json({ message: "Herstellen mislukt", details: err.message });
  }
});

export default router;
