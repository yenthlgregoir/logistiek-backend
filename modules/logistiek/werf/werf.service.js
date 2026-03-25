import {Werf} from "./werf.model.js";


export const GetWerven = async (search = '') => {
  try {
    // Bouw een query-object voor MongoDB
    const query = {};

    if (search && search.trim() !== '' && search !== 'undefined') {
      const regex = new RegExp(search.trim(), 'i'); 
      query.$or = [
        { naam: regex },
        { 'adres.gemeente': regex },
        { 'adres.straat': regex },
      ];
    }
    const werven = await Werf.find(query); 
    return werven;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const getWerfById = async (id) => {
    try {
        const werf = await Werf.findById(id);
        if(!werf){
            throw new Error("Werf niet gevonden");
        }
        return werf;
    } catch (error) {
        throw new Error("fout bij ophalen van werf" , {cause: error});
    }
}

export const CreateWerf = async (data) => { 
    try {
        const nieuweWerf = new Werf(data);
        return await nieuweWerf.save();
    } catch (error) {
        console.error(error);
        throw new Error(`CreateWerf failed`, { cause: error });    
    }
};

export const deleteWerf = async (id) => {
    try{
        await Werf.findByIdAndDelete(id);
    }
    catch(err){
        throw new Error(`Werf not deleted`, { cause: err })
    }
}

export const editWerf = async (id, data) => {
  try {
    console.log(data)
    const updatedWerf = await Werf.findByIdAndUpdate(
      id,
      data,
      {
        new: true,        
        runValidators: true
      }
    )

    if (!updatedWerf) {
      throw new Error('Werf niet gevonden')
    }

    return updatedWerf

  } catch (error) {
    console.error('editWerf error:', error)
    throw error
  }
}