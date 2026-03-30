import express from "express";
import * as VerhuurService from "./verhuur.service.js";
import * as pdfService from "../../helper/pdfService.js"
import auth from "../../../middelware/auth.js";

const router = express.Router();

router.get("/", auth("logistics", "admin"), async (req, res) => {
    try {
        const search = req.query.search || ""; 
        const type = req.query.type || "";
        const verhuring = await VerhuurService.getVerhuur(search , type);
        res.status(200).json(verhuring);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});
router.get("/export-pdf/:id", auth("admin", "renting"), async (req, res) => {
  try {
    const { id } = req.params;

    const boeking = await VerhuurService.getVerhuurById(id);

    pdfService.generateVerhuurPDF(res, boeking);
  } catch (error) {
    console.error(error);
    res.status(500).send("Fout bij PDF genereren");
  }
});
router.post("/", auth("logistics" , "admin"), async (req, res) => {
    try {
        const nieuwVerhuur = await VerhuurService.createVerhuur(req.body);
        res.status(201).json(nieuwVerhuur);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.patch("/update/:id" , auth("logistics" , "admin") , async(req,  res) =>{
    try{
        const id = req.params.id;
        const updatedVerhuur = VerhuurService.updateVerhuur(id , req.body);
        res.status(201).json(updatedVerhuur);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
})

router.get("/vrije-toestellen" , auth("logistics" , "admin"), async (req,res) => {
    try {
        const toestellen = await VerhuurService.getVrijeToestellen(req.query);
        res.status(200).json(toestellen);
    }
    catch(error) {
        res.status(400).json ({message : error.message});
    }
})


router.patch("/assignToestel" , auth("logistics" , "admin") , async (req, res) => {
    try{
        const verhuur = await VerhuurService.assignToestel(req.body);
        res.status(201).json(verhuur);
    }
    catch (err){
        res.status(400).json(err);
    }
})

router.delete("/:id" , auth("logistics" , "admin") , async(req, res) =>{
    try{
        const id = req.params.id;
        await VerhuurService.deleteVerhuur(id);
        res.status(201).json(true)
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
})


export default router;