import express from "express";
import * as WerfService from "./werf.service.js";
import auth from "../../../middelware/auth.js";

const router = express.Router();

router.get("/", auth("logistics", "admin"), async (req, res) => {
  try {
    const search = req.query.search || ""; 
    const werven = await WerfService.GetWerven(search); 
    res.status(200).json(werven);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/:id', auth("logistics", "admin"), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "ID is verplicht" });
        }

        const werf = await WerfService.getWerfById(id);

        if (!werf) {
            return res.status(404).json({ message: "Werf niet gevonden" });
        }

        res.status(200).json(werf);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server fout" });
    }
});
router.post("/", auth("logistics" , "admin"), async (req, res) => {
    try {
        const nieuweWerf = await WerfService.CreateWerf(req.body);
        res.status(201).json(nieuweWerf);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete("/:id" , auth("logistics" , "admin") , async(req,res) =>{
    try{
        const {id}  = req.params;
        await WerfService.deleteWerf(id);
        res.status(201).json( {message:"deletion succes"});
    }
    catch (error){
        res.status(400).json({message: error.message});
    }
})
router.patch("/:id", auth("logistics", "admin"), async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const updatedWerf = await WerfService.editWerf(id, data)

    res.status(200).json(updatedWerf)

  } catch (error) {
    console.error('PATCH /werven/:id error:', error)

    if (error.message === 'Werf niet gevonden') {
      return res.status(404).json({ message: error.message })
    }

    res.status(500).json({ message: 'Server fout' })
  }
})

export default router