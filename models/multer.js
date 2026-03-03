import multer from "multer";
import fs from "fs-extra";
import path from "path";

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const orderId = req.params.id; // ID uit URL

    // Pad waar de bestanden komen
    const uploadPath = path.join("uploads", "orders", orderId);

    // Maak map automatisch aan
    await fs.ensureDir(uploadPath);

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

export const upload = multer({ storage });