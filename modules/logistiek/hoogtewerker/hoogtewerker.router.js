import express from "express";
import * as HoogtewerkerService from "./hoogtewerker.service.js";
import auth from "../../../middelware/auth.js";
import {generateHoogtewerkersPDF} from "../../helper/pdfService.js"

const router = express.Router();

router.get("/", auth("logistics", "admin"), async (req, res) => {
  try {
    const search = req.query.search || ""; 
    const schaarliften = await HoogtewerkerService.getHoogtewerkers(search); 
    res.status(200).json(schaarliften);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth("logistics" , "admin"), async (req, res) => {
    try {
        const nieuweSchaarlift = await HoogtewerkerService.createHoogtewerker(req.body);
        res.status(201).json(nieuweSchaarlift);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.patch("/:id" , auth("logistics" , "admin") , async(req,res) => {
    try {
        const {id} = req.params;
        const data = req.body;

        const updatedSchaarlift = await HoogtewerkerService.editHoogtewerker(id , data);
        res.status(201).json(updatedSchaarlift);
    }
    catch(err){
        res.status(500).json({message: err.cause});
    }
})

router.get("/types" , auth("logisctics" , "admin" ) , async(req,res) => {
    try{
        const types = await HoogtewerkerService.getTypes();
        res.status(200).json(types);
    }
    catch (err) {
        res.status(400).json({message: err.message});
    }
})
router.post("/types" , auth("logistics" , "admin") , async(req,res) => {
    try{
        const nieuweType = await HoogtewerkerService.createType(req.body);
        res.status(201).json(nieuweType);
    }
    catch (err) {
        res.status(400).json({message: err.message});
    }
})

router.get("/pdf", async (req, res) => {
  try {
    const data = await await HoogtewerkerService.getHoogtewerkersNu(req.query.search)

    generateHoogtewerkersPDF(res, data)

  } catch (err) {
    console.error(err)
    res.status(500).send("Fout bij genereren PDF")
  }
})
export default router;
