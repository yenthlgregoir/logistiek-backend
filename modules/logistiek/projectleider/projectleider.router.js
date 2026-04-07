import express from "express";
import * as ProjectLeiderService from "./projectleider.service.js";
import auth from "../../../middelware/auth.js";

const router = express.Router();

// GET /projectleiders → alle projectleiders ophalen
router.get("/", auth("logistics", "admin"), async (req, res) => {
    try {
        const search = req.query.search || ""; 
        const projectleiders = await ProjectLeiderService.getProjectleiders(search);
        res.status(200).json(projectleiders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});


// POST /projectleiders → nieuwe projectleider aanmaken
router.post("/",auth("logistics", "admin"), async (req, res) => {
    try {
        const nieuweProjectLeider = await ProjectLeiderService.createProjectLeider(req.body);
        res.status(200).json(nieuweProjectLeider);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.patch("/:id", auth("logistics", "admin"), async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const updatedProjectLeider = await ProjectLeiderService.editProjectLeider(id , data);

    res.status(200).json(updatedProjectLeider)

  } catch (error) {
    console.error('PATCH /werven/:id error:', error)

    if (error.message === 'Pojectleider niet gevonden') {
      return res.status(404).json({ message: error.message })
    }

    res.status(500).json({ message: 'Server fout' })
  }
})

router.delete("/:id" , auth("logistics" , "admin") , async(req,res) =>{
    try{
        const {id}  = req.params;
        await ProjectLeiderService.removeProjectLeider(id);
        res.status(201).json( {message:"deletion succes"});
    }
    catch (error){
        res.status(400).json({message: error.message});
    }
})

export default router;