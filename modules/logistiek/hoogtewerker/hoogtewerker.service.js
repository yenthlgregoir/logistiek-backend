import {Hoogtewerker} from './hoogtewerker.model.js'
import {Verhuur} from '../verhuur/verhuur.model.js'
import {MachineType} from './type.model.js'


export const getHoogtewerkers = async (search) => {
   try {
    const query = {}

    if (search && search.trim() !== '' && search !== 'undefined') {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [{ nummer: regex }]
    }

    const assets = await Hoogtewerker.find(query)
      .populate({ path: "Type", select: "naam type hefvermogen ingeklapteHoogte breedte omschrijving merk" })
      .lean()

    const now = new Date()

    const actieveBoekingen = await Verhuur.find({
      assetModel: "Hoogtewerker", // 🔥 BELANGRIJK
      leverDatum: { $lte: now },
      $or: [
        { ophaalDatum: { $gte: now } },
        { ophaalDatum: null }
      ]
    })
      .populate({ path: "asset", select: "nummer Type" }) // 🔥 FIX
      .populate({ path: "werf", select: "naam adres" })
      .populate({
        path: "projectleider",
        select: "naam entiteit",
        populate: {
          path: "entiteit",
          select: "naam"
        }
      })
      .lean()

    const boekingenPerAsset = {}

    actieveBoekingen.forEach(boeking => {
      const assetId = boeking.asset?._id?.toString()
      if (!assetId) return

      if (!boekingenPerAsset[assetId]) {
        boekingenPerAsset[assetId] = []
      }

      boekingenPerAsset[assetId].push(boeking)
    })

    // 🔥 Merge assets + boekingen
    const resultaat = assets.map(asset => {
      const assetId = asset._id.toString()

      return {
        ...asset,
        huidigeBoekingen: boekingenPerAsset[assetId] || []
      }
    })

    return resultaat

  } catch (err) {
    throw new Error("Fout bij het ophalen van assets", { cause: err })
  }
}
export const createHoogtewerker = async (data) => {
    try{
        const nieuweHoogtewerker = new Hoogtewerker(data);
        return await nieuweHoogtewerker.save();
    }
    catch (err){
        throw new Error("fout bij aanmaken schaarlif" , {cause: err});
    }
}



export const editHoogtewerker = async (id, data) => {
    try {
        const hoogtewerker = await Hoogtewerker.findById(id);

        if (!Hoogtewerker) {
            throw new Error("Hoogtewerker niet gevonden met deze ID");
        }

        // velden updaten
        Object.assign(hoogtewerker, data);

        const saved = await hoogtewerker.save();

        return saved;
    } catch (err) {
        throw new Error("Fout bij het aanpassen van een Hoogtewerker", {
            cause: err
        });
    }
};

export const getTypes = async () => {
  try {
    const types = await MachineType.find({
      type: { $in: ['Knikarm', 'Schaarlift'] }
    });

    return types;
  } catch (err) {
    throw new Error("Fout bij het ophalen van de Types", { cause: err });
  }
};

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