import {Entiteit} from "../entiteit/entiteit.model.js"

export const getEntiteiten = async () => {
    try{
        return await Entiteit.find();
    }
    catch (err){
        throw new Error("Kan entiteiten neit ophalen" , {cause: err});
    }
}

export const createEniteit = async (data) => {
    try {
        const nieuweEntiteit = new Entiteit(data);
        return await nieuweEntiteit.save();
    }
    catch (err){
        throw new Error("fout bij aanmaken eniteit", {cause: err});
    }
}

