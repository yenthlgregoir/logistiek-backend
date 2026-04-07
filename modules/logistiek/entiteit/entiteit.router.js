import express from "express";
import * as EntiteitService from "./entiteit.service.js";
import auth from "../../../middelware/auth.js";

const router = express.Router();



router.get('/' , auth("logistics" , "admin") , async(req,res) => {
    try{
        const entiteiten = await EntiteitService.getEntiteiten();
        res.status(200).json(entiteiten);
    }
    catch (error) {
        res.status(500).json({message: error.message});
    }
})

router.post('/' , auth('logistics' , 'admin'),  async(req, res) => {
    try {
        const nieuweEntiteit = await EntiteitService.createEniteit(req.body);
        res.status(200).json(nieuweEntiteit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})

export default router