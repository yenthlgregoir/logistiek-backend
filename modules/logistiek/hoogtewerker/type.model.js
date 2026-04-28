import mongoose from 'mongoose';

const TypeSchema = new mongoose.Schema({
    naam: {
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    type: {
        type: String, 
        required: true,
        unique: false,
        enum: ["Schaarlift" , "Knikarm" , "Werfcontainer"]
    },

    hefvermogen: { type: Number, required: false },
    ingeklapteHoogte: {type: Number , required: false},
    merk: {type: String , required: false},
    breedte: {type: Number, required: false},
    omschrijving: { type: String , required: false},
})

export const MachineType = mongoose.model("MachineType", TypeSchema, "MachineTypes");
