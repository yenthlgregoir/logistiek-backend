import mongoose from "mongoose";

const ProjectleiderSchema = new mongoose.Schema({
    naam: {
        type: String, 
        required: true
    },
    mailAdres: {
        type:String, 
        required:false,
        default: "N/A",
    },
    telefoonnummer:{
        type: String, 
        required: false,
        default: "N/A",
    },
    entiteit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Entiteit",
        required : true,
    }
})

export const ProjectLeider = mongoose.model("Projectleider", ProjectleiderSchema , "ProjectLeiders");