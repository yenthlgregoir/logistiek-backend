import express from "express";
import * as SchaarliftService from "./schaarlift.service.js";
import auth from "../../../middelware/auth.js";

const router = express.Router();

router.get("/", auth("logistics", "admin"), async (req, res) => {
  try {
    const search = req.query.search || ""; 
    const schaarliften = await SchaarliftService.getSchaarliften(search); 
    res.status(200).json(schaarliften);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth("logistics" , "admin"), async (req, res) => {
    try {
        const nieuweSchaarlift = await SchaarliftService.createSchaarlift(req.body);
        res.status(201).json(nieuweSchaarlift);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.patch("/:id" , auth("logistics" , "admin") , async(req,res) => {
    try {
        const {id} = req.params;
        const data = req.body;

        const updatedSchaarlift = await SchaarliftService.editSchaarlift(id , data);
        res.status(201).json(updatedSchaarlift);
    }
    catch(err){
        res.status(500).json({message: err.cause});
    }
})

router.get("/types" , auth("logisctics" , "admin" ) , async(req,res) => {
    try{
        const types = await SchaarliftService.getTypes();
        res.status(200).json(types);
    }
    catch (err) {
        res.status(400).json({message: err.message});
    }
})
router.post("/types" , auth("logistics" , "admin") , async(req,res) => {
    try{
        const nieuweType = await SchaarliftService.createType(req.body);
        res.status(201).json(nieuweType);
    }
    catch (err) {
        res.status(400).json({message: err.message});
    }
})
export default router;
