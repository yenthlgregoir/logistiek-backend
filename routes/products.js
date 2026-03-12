import express from "express";
import { Product } from "../models/Product.js"; // pas pad aan indien nodig
import auth from "../middelware/auth.js";
const router = express.Router();

/**
 * GET /products
 * Optioneel zoeken via ?search=
 */
router.get("/", auth("admin", "purchase"), async (req, res) => {
  try {
    const { q, leverancier, categorie, sort = "-createdAt" } = req.query;

    const filter = {};

    if (leverancier) filter.leverancier = leverancier;
    if (categorie) filter.categorie = categorie;

    const finalFilter = { ...filter };

    // Text search + fallback
    console.log(q);
    let useText = false;
    if (q && q.trim()) {
      useText = true;
      finalFilter.$text = { $search: q };
    }

    const sortObj = {};
    if (sort.startsWith("-")) sortObj[sort.substring(1)] = -1;
    else sortObj[sort] = 1;

    let items;
    try {
      items = await Product.find(finalFilter).sort(sortObj).lean();
    } catch (err) {
      if (useText) {
        delete finalFilter.$text;

        finalFilter.$or = [
          { productcode: { $regex: q, $options: "i" } },
          { omschrijving: { $regex: q, $options: "i" } },
          { leverancier: { $regex: q, $options: "i" } },
        ];

        items = await Product.find(finalFilter).sort(sortObj).lean();
      } else {
        throw err;
      }
    }

    res.json(items);
  } catch (err) {
    console.error("GET /products error", err);
    res.status(500).json({ message: "Fout bij ophalen producten" });
  }
});
/**
 * GET /products/:id
 */
router.get("/:id", auth("admin", "purchase"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product niet gevonden" });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * POST /products
 */
router.post("/", auth("admin", "purchase"), async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /products/:id
 */
router.put("/:id", auth("admin", "purchase"), async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product niet gevonden" });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /products/:id
 */
router.delete("/:id", auth("admin", "purchase"), async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product niet gevonden" });
    }

    res.json({ message: "Product verwijderd" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
