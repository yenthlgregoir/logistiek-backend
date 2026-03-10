import express from 'express'
import fs from "fs-extra";
import path from "path";
import {upload} from '../models/multer.js'
import mime from "mime-types";
import auth from "../middelware/auth.js";
import * as boekingService from "../service/boekingService.js"
import ejs from 'ejs'
import puppeteer from "puppeteer"
import { fileURLToPath } from 'url';


const router = express.Router()

router.post("/:id/upload",auth, upload.array("files"), async (req, res) => {
  try {
    const orderId = req.params.id;
    // ── Vriendelijke fout als er geen files zijn
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Geen bestanden ontvangen. Controleer dat je FormData gebruikt, geen 'Content-Type: application/json' zet, en de key 'files' gebruikt."
      });
    }

    // ── Bouw response
    const files = req.files.map(file => ({
      originalName: file.originalname,
      fileName: file.filename,
      path: `/uploads/orders/${orderId}/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    return res.json({ success: true, files });
  } catch (err) {
    console.error("[UPLOAD] error:", err);
    return res.status(500).json({ success: false, message: "Upload mislukt", details: String(err) });
  }
});


router.delete("/:id/files/:filename",auth, async (req, res) => {
  try {
    const { id, filename } = req.params;

    // 1) path traversal voorkomen (alleen simpele bestandsnamen toelaten)
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ success: false, message: "Ongeldige bestandsnaam" });
    }

    const filePath = path.join("uploads", "orders", id, filename);

    // 2) check of bestand bestaat
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return res.status(404).json({ success: false, message: "Bestand niet gevonden" });
    }

    // 3) verwijder
    await fs.remove(filePath);
    return res.json({ success: true });

  } catch (err) {
    console.error("[FILES][DELETE] error:", err);
    return res.status(500).json({ success: false, message: "Verwijderen mislukt" });
  }
});

router.get("/:id/files", async (req, res) => {
  const dir = path.join("uploads", "orders", req.params.id);

  // Als map niet bestaat → lege lijst
  if (!fs.existsSync(dir)) {
    return res.json([]);
  }

  // Lees directory
  const files = await fs.readdir(dir);

  // Geef URLs terug
  const fileData = files.map(file => ({
    name: file,
    url: `/uploads/orders/${req.params.id}/${file}`
  }));

  res.json(fileData);
});



router.get("/:id/files/:filename/open",auth, async (req, res) => {
  try {
    const { id, filename } = req.params;

    // Beveiliging tegen path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
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

router.get('/export-pdf' , auth("admin" ,"renting"),async (req, res) => {
  try{
      const boekingen = await boekingService.getBoekingen();
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const templatePath = path.join(__dirname, '..', 'template', 'boekingenTemplate.ejs');
      const html = await ejs.renderFile(templatePath , {boekingen})
      const browser = await puppeteer.launch();
      const page =  await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

     const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
      landscape: true,      

  margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
});

await browser.close();

res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename=boekingen.pdf');
res.send(pdfBuffer);
      }catch(error){
        console.error(error);
        res.status(500).send('Fout bij PDF genereren');
      }
  });
router.get('/export-pdf/:id' , auth("admin" ,"renting"),async (req, res) => {
  try{
      const {id} = req.params
      const boeking = await boekingService.getBoekingById(id);
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const templatePath = path.join(__dirname, '..', 'template', 'boekingTemplate.ejs');
      const html = await ejs.renderFile(templatePath , {boeking})
      const browser = await puppeteer.launch();
      const page =  await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

     const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,

  margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
});

await browser.close();

res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename=boekingen.pdf');
res.send(pdfBuffer);
      }catch(error){
        console.error(error);
        res.status(500).send('Fout bij PDF genereren');
      }
  });

export default router;