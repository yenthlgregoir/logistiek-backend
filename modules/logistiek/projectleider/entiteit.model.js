import mongoose from "mongoose";

const EntiteitSchema = new mongoose.Schema({
    naam: {
        type: String, 
        required: true
    },
    icon: {
        type:String, 
        required:true,
    },
    color:{
        type: String, 
        required: true,
    },
})

export const Entiteit = mongoose.model("Entiteit", EntiteitSchema , "Entiteiten");