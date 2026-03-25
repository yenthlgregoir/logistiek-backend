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
        enum: ["Schaarlift" , "Knikarm"]
    },
})

export const MachineType = mongoose.model("MachineType", TypeSchema, "MachineTypes");
