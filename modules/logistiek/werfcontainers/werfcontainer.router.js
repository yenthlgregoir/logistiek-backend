import express from "express"
import * as WerfcontainerService from "./werfcontainer.service.js"

const router = express.Router()

// 🔍 GET - alle werfcontainers (met search)
router.get("/", async (req, res) => {
  try {
    const { search } = req.query
    const result = await WerfcontainerService.getWerfcontainers(search)

    res.json(result)
  } catch (err) {
    res.status(500).json({
      message: "Fout bij ophalen werfcontainers",
      error: err.message
    })
  }
})

// ➕ POST - nieuwe werfcontainer
router.post("/", async (req, res) => {
  try {
    const nieuwe = await WerfcontainerService.createWerfcontainer(req.body)

    res.status(201).json(nieuwe)
  } catch (err) {
    res.status(400).json({
      message: "Fout bij aanmaken werfcontainer",
      error: err.message
    })
  }
})

// ✏️ PUT - werfcontainer aanpassen
router.put("/:id", async (req, res) => {
  try {
    const updated = await WerfcontainerService.editWerfcontainer(
      req.params.id,
      req.body
    )

    res.json(updated)
  } catch (err) {
    res.status(400).json({
      message: "Fout bij aanpassen werfcontainer",
      error: err.message
    })
  }
})

// 📦 GET - types ophalen
router.get("/types/all", async (req, res) => {
  try {
    const types = await WerfcontainerService.getTypes()

    res.json(types)
  } catch (err) {
    res.status(500).json({
      message: "Fout bij ophalen types",
      error: err.message
    })
  }
})

export default router