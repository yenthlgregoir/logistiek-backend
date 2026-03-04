import express from "express";
import { createBoeking, getBoekingen, getBoekingById , changeStatus, getVrijeToestellen, assignToestel, boekingVerwijderen, updateBoeking } from "../service/boekingService.js";
import auth from "../middelware/auth.js";

const router = express.Router();

// POST /api/boekingen
router.get("/", auth, getBoekingen);
router.post("/", auth, async (req, res) => {
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
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    // Haal boeking op via service
    const boeking = await getBoekingById(id)

    if (!boeking) {
      return res.status(404).json({ message: 'Boeking niet gevonden' })
    }

    res.json(boeking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.patch("/:id/status", changeStatus);

router.get("/toestellen/vrij", getVrijeToestellen);
router.patch("/:id/toestellen/assign", assignToestel);

router.delete("/:id" , boekingVerwijderen)

router.patch('/:id' , updateBoeking)
export default router;