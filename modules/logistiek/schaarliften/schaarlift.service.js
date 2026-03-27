import {Schaarlift} from './schaarlift.model.js'
import {Verhuur} from '../verhuur/verhuur.model.js'
import {MachineType} from './type.model.js'


export const getSchaarliften = async (search) => {
  try {
    const query = {};
    if (search && search.trim() !== '' && search !== 'undefined') {
      const regex = new RegExp(search.trim(), 'i'); 
      query.$or = [{ nummer: regex }];
    }

    const schaarliften = await Schaarlift.find(query)
      .populate({ path: "Type", select: "naam type" })
      .lean();

    const now = new Date();

    // Boekingen op dit moment ophalen
    const overlappendeBoekingen = await Verhuur.find({
      leverDatum: { $lte: now },
      ophaalDatum: { $gte: now },
    })
      .populate({ path: "toestel", select: "nummer Type" })
      .populate({ path: "werf", select: "naam adres" })
.populate({
  path: "projectleider",
  select: "naam entiteit",
  populate: {
    path: "entiteit",
    select: "naam"
  }
})      .lean();

    const boekingenPerToestel = {};

    overlappendeBoekingen.forEach(boeking => {
      const toestelId = boeking.toestel?._id?.toString();
      if (!toestelId) return;

      if (!boekingenPerToestel[toestelId]) boekingenPerToestel[toestelId] = [];
      boekingenPerToestel[toestelId].push(boeking);
    });

    const resultaat = schaarliften.map(lift => {
      const liftId = lift._id.toString();
      return {
        ...lift,
        huidigeBoekingen: boekingenPerToestel[liftId] || []
      };
    });

    return resultaat;

  } catch (err) {
    throw new Error("Fout bij het ophalen van de schaarliften", { cause: err });
  }
};

export const createSchaarlift = async (data) => {
    try{
        const nieuweSchaarlift = new Schaarlift(data);
        return await nieuweSchaarlift.save();
    }
    catch (err){
        throw new Error("fout bij aanmaken schaarlif" , {cause: err});
    }
}



export const editSchaarlift = async (id, data) => {
    try {
        const schaarlift = await Schaarlift.findById(id);

        if (!schaarlift) {
            throw new Error("Schaarlift niet gevonden met deze ID");
        }

        // velden updaten
        Object.assign(schaarlift, data);

        const saved = await schaarlift.save();

        return saved;
    } catch (err) {
        throw new Error("Fout bij het aanpassen van een schaarlift", {
            cause: err
        });
    }
};

export const getTypes = async () => {
    try{
        const types = await MachineType.find();
        return types;
    }
    catch(err){
        throw new Error("Fout bij het ophalen van de Types" , {cause: err})
    }
}

export const createType = async (data) => {
  try {
    const bestaandType = await MachineType.findOne({ naam: data.naam });
    if (bestaandType) {
      throw new Error(`Type met naam "${data.naam}" bestaat al.`);
    }

    const nieuweType = new MachineType(data);
    return await nieuweType.save();
  } catch (err) {
    console.log(err)
    throw new Error("Fout bij het aanmaken van een Type: " , {cause:  err});
  }
};