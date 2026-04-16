import mongoose from "mongoose";

const WerfSchema = new mongoose.Schema({
    naam:{
        type: String,
        required: true,
    },
    adres:{
        straat:{
            type:String,
            required: true
        },
        huisnummer:{
            type: String,
            required: true,
        },
        postcode:{
            type: Number,
            required: true,
        },
        gemeente:{
            type: String,
            required: true,
        }
    },
    contactPersoon: {
        type: String,
        required: false,
    },
    status: {
        type: String, 
        required: true, 
        enum: ["Bezig" , "Afgerond" , "Onderhoud"],
        default: "Bezig"
    }
})

export const Werf = mongoose.model("Werf" , WerfSchema , "Werven");
