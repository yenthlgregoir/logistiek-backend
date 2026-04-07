import {ProjectLeider} from "./projectleider.model.js";
import {Entiteit} from "../entiteit/entiteit.model.js"

export const getProjectleiders = async (search = '') => {
    try{
        const query = {};
        
        if (search && search.trim() !== '' && search !== 'undefined') {
            const regex = new RegExp(search.trim(), 'i'); 
            query.$or = [
            { naam: regex },
      ];
    }
        const projectleiders = await ProjectLeider.find(query).populate({
        path: "entiteit",
        select: "naam color icon"});
        return projectleiders;
    }
    catch(err){
        throw new Error("Fout in ophalen van projectleiders" , {cause: err});
    }
}

export const createProjectLeider = async (data) => {
    try{
        const nieuweProjectLeider = new ProjectLeider(data);
        return await nieuweProjectLeider.save();
    }
    catch(err){
        throw new Error("Fout bij het aanmaken van een projectleider" , {cause: err});
    }
}

export const editProjectLeider = async (id,data) => {
      try {
    const updatedProjectLeider = await ProjectLeider.findByIdAndUpdate(
      id,
      data,
      {
        new: true,        
        runValidators: true
      }
    )

    if (!updatedProjectLeider) {
      throw new Error('Werf niet gevonden')
    }

    return updatedProjectLeider

  } catch (error) {
    console.error('editWerf error:', error)
    throw error
  }
}
export const removeProjectLeider = async (id) =>{
    try {
        await ProjectLeider.findByIdAndDelete(id);
    }catch(err){
        throw new Error(`Projectleider not deleted`, { cause: err })
    }
}

