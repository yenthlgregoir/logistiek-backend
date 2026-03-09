// routes/liveOrders.js
import express from "express";
import { LiveOrder, ArchiveOrder } from "../models/Order.js";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import puppeteer from "puppeteer";
import mammoth from "mammoth";
import auth from "../middelware/auth.js";
const router = express.Router();


router.get("/",auth("admin" , "purchase"), async (req, res) => {
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

    // Veilig filter-object (zonder getFilter-magic)
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

    let query = LiveOrder.find(finalFilter);

    // Als $text niet werkt (geen index), vang de fout af en gebruik regex
    let items, total;
    try {
      [items, total] = await Promise.all([
        query.sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
        LiveOrder.countDocuments(finalFilter)
      ]);
    } catch (e) {
      // Fallback naar regex (alleen als q er is en text faalt)
      if (useText) {
        delete finalFilter.$text;
        finalFilter.ref = { $regex: q, $options: "i" };

        [items, total] = await Promise.all([
          LiveOrder.find(finalFilter).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
          LiveOrder.countDocuments(finalFilter)
        ]);
      } else {
        throw e;
      }
    }

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error("GET /live-orders error", err);
    res.status(500).json({ message: "Fout bij ophalen live orders" });
  }
});

/** GET /live-orders/:id  (op jouw custom 'id') */
/** GET /live-orders/:id */
router.get("/:id", async (req, res) => {
  try {
    const item = await LiveOrder
      .findById(req.params.id)
      .populate("producten.product", "productcode omschrijving eenheidsprijs")
      .lean();

    if (!item) {
      return res.status(404).json({ message: "Niet gevonden" });
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fout bij ophalen live order" });
  }
});


/** POST /live-orders  (nieuw item) */
router.post("/",auth("admin" , "purchase"), async (req, res) => {
  try {
    const created = await LiveOrder.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    // Duplicate key (bv. id al in gebruik)
    if (err.code === 11000) {
      return res.status(409).json({ message: "ID bestaat al", keyValue: err.keyValue });
    }
    console.error("POST /live-orders error", err);
    res.status(400).json({ message: "Validatie of invoerfout", details: err.message });
  }
});

/** PATCH /live-orders/:id  (partiële update) */
router.patch("/:id",auth("admin" , "purchase"), async (req, res) => {
  try {
    const order = await LiveOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order niet gevonden" });
    }

    // 2. Update alleen de velden die in de body zitten
    // Object.assign kopieert de waarden van req.body naar het order-document
    Object.assign(order, req.body);

    // 3. Sla het document op (Mongoose checkt nu automatisch alle validaties)
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: "Update mislukt", details: err.message });
  }
});



/** DELETE /live-orders/:id */
router.delete("/:id",auth("admin" , "purchase"), async (req, res) => {
  try {
    const result = await LiveOrder.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Niet gevonden" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Verwijderen mislukt" });
  }
});

/**
 * POST /live-orders/:id/archive
 * Verplaats item van live_orders → archive_orders
 */
router.post("/:id/archive",auth("admin" , "purchase"), async (req, res) => {
  try {
    // 1) Haal het item uit live
    const doc = await LiveOrder.findOneAndDelete({ _id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ message: "Niet gevonden" });

    // 2) Stop het in archive
    const archived = await ArchiveOrder.create(doc);
    res.status(201).json(archived);
  } catch (err) {
    // Als archiveren faalt, zou je het doc terug kunnen zetten in live (complexer).
    res.status(500).json({ message: "Archiveren mislukt", details: err.message });
  }
});

router.post("/:id/product",auth("admin" , "purchase"), async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, aantal } = req.body;

    const updatedOrder = await LiveOrder.findByIdAndUpdate(
      id,
      {
        $push: {
          producten: {
            product: productId,
            aantal: aantal
          }
        }
      },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get("/:id/pdf", auth("admin" , "purchase"),async (req, res) => {
  try {
    const order = await LiveOrder
      .findById(req.params.id)
      .populate("producten.product");

    if (!order) {
      return res.status(404).json({ message: "Order niet gevonden" });
    }

    // 1️⃣ Laad template
    const templatePath = path.resolve("template/bestellingNaarPDF.dotx");
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      delimiters: { start: '[[', end: ']]' },
      nullGetter: () => ''
    });

    // 2️⃣ Bereken producten & totalen
    const producten = (order.producten || []).map(p => {
      const eenheidsprijs = Number(p?.product?.eenheidsprijs) || 0;
      const aantal = Number(p?.aantal) || 0;
      const lijnTotaal = aantal * eenheidsprijs;

      return {
        productcode: p?.product?.productcode ?? '',
        omschrijving: p?.product?.omschrijving ?? '',
        aantal,
        prijs: eenheidsprijs.toFixed(2),
        lijnTotaal: lijnTotaal.toFixed(2)
      };
    });

    const totaalExclNum = producten.reduce((sum, p) => sum + Number(p.lijnTotaal), 0);
    const btwNum = +(totaalExclNum * 0.21).toFixed(2);
    const totaalInclNum = +(totaalExclNum + btwNum).toFixed(2);

    // 3️⃣ Nieuwe API — doc.render(data)
    doc.render({
      ref: order.ref ?? '',
      leverancier: order.leverancier ?? '',
      producten,
      totaalExcl: totaalExclNum.toFixed(2),
      btw: btwNum.toFixed(2),
      totaalIncl: totaalInclNum.toFixed(2)
    });

    // 4️⃣ Genereer DOCX buffer
    const docxBuf = doc.getZip().generate({ type: "nodebuffer" });

    // 5️⃣ DOCX → HTML
    const htmlResult = await mammoth.convertToHtml({ buffer: docxBuf });
    const html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          td, th { border: 1px solid #ccc; padding: 6px; }
          h1, h2, h3 { margin: 0; padding: 10px 0; }
        </style>
      </head>
      <body>${htmlResult.value}</body>
      </html>
    `;

    // 6️⃣ HTML → PDF met Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // 7️⃣ Verstuur PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=bestelling_${order.ref}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("PDF generatie fout:", err);
    res.status(500).json({ message: "Fout bij genereren PDF" });
  }
});

export default router;