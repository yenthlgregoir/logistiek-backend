import express from "express";
import fs from "fs-extra";
import path from "node:path";
import { upload } from "./multer.js";
import mime from "mime-types";
import auth from "../../middelware/auth.js";
import * as boekingService from "../renting/boekingen/boeking.service.js";
import PDFDocument from "pdfkit";
import * as pdfService from "./pdfService.js";

const router = express.Router();

router.post("/:id/upload", auth, upload.array("files"), async (req, res) => {
  try {
    const orderId = req.params.id;
    // ── Vriendelijke fout als er geen files zijn
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Geen bestanden ontvangen. Controleer dat je FormData gebruikt, geen 'Content-Type: application/json' zet, en de key 'files' gebruikt.",
      });
    }

    // ── Bouw response
    const files = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      path: `/uploads/orders/${orderId}/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return res.json({ success: true, files });
  } catch (err) {
    console.error("[UPLOAD] error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Upload mislukt",
        details: String(err),
      });
  }
});

router.delete("/:id/files/:filename", auth, async (req, res) => {
  try {
    const { id, filename } = req.params;

    // 1) path traversal voorkomen (alleen simpele bestandsnamen toelaten)
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Ongeldige bestandsnaam" });
    }

    const filePath = path.join("uploads", "orders", id, filename);

    // 2) check of bestand bestaat
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Bestand niet gevonden" });
    }

    // 3) verwijder
    await fs.remove(filePath);
    return res.json({ success: true });
  } catch (err) {
    console.error("[FILES][DELETE] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Verwijderen mislukt" });
  }
});

router.get("/:id/files", async (req, res) => {
  const dir = path.join("uploads", "orders", req.params.id);

  if (!fs.existsSync(dir)) {
    return res.json([]);
  }

  const files = await fs.readdir(dir);

  const fileData = files.map((file) => ({
    name: file,
    url: `/uploads/orders/${req.params.id}/${file}`,
  }));

  res.json(fileData);
});

router.get("/:id/files/:filename/open", auth, async (req, res) => {
  try {
    const { id, filename } = req.params;

    // Beveiliging tegen path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).send("Ongeldige bestandsnaam");
    }

    const filePath = path.join("uploads", "orders", id, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Bestand niet gevonden");
    }

    const mimeType = mime.lookup(filename) || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Open error:", err);
    res.status(500).send("Fout bij openen");
  }
});

router.get("/export-pdf", auth("admin", "renting"), async (req, res) => {
  try {
    const boekingen = await boekingService.getBoekingen();

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      layout: "landscape",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=boekingen.pdf");

    doc.pipe(res);

    // Titel
    doc.fontSize(20).text("Boekingen Overzicht", { align: "center" });

    doc.moveDown(2);

    // Kolommen
    const startY = doc.y;

    doc.fontSize(12);
    doc.text("ID", 50, startY);
    doc.text("Naam", 120, startY);
    doc.text("Email", 300, startY);
    doc.text("Datum", 450, startY);

    doc.moveDown();

    let y = startY + 25;

    boekingen.forEach((boeking) => {
      doc.text(boeking.id, 50, y);
      doc.text(boeking.naam, 120, y);
      doc.text(boeking.email, 300, y);
      doc.text(boeking.datum, 450, y);

      y += 20;

      // Nieuwe pagina indien nodig
      if (y > 550) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Fout bij PDF genereren");
  }
});

router.get("/export-pdf/:id", auth("admin", "renting"), async (req, res) => {
  try {
    const { id } = req.params;

    const boeking = await boekingService.getBoekingById(id);

    pdfService.generateBoekingPDF(res, boeking);
  } catch (error) {
    console.error(error);
    res.status(500).send("Fout bij PDF genereren");
  }
});

export default router;
