import {WerfContainer} from "./werfcontainer.model.js"
import {Verhuur} from "../verhuur/verhuur.model.js"
import {MachineType} from "../hoogtewerker/type.model.js"


export const getWerfcontainers = async (search) => {
     try {
    const query = {}

    // 🔍 SEARCH
    if (search && search.trim() !== '' && search !== 'undefined') {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [{ nummer: regex }]
    }

    // 🔥 Assets ophalen (nog steeds Hoogtewerkeren model voorlopig)
    const assets = await WerfContainer.find(query)
      .populate({ path: "Type", select: "naam type" })
      .populate({path: "entiteit" , select: "naam icon color"})
      .lean()

    const now = new Date()

    // 🔥 Actieve boekingen (met NIEUW systeem)
    const actieveBoekingen = await Verhuur.find({
      assetModel: "WerfContainer", // 🔥 BELANGRIJK
      leverDatum: { $lte: now },
      $or: [
        { ophaalDatum: { $gte: now } },
        { ophaalDatum: null }
      ]
    })
      .populate({ path: "asset", select: "nummer Type" }) // 🔥 FIX
      .populate({ path: "werf", select: "naam adres" })
      .populate({
        path:  "projectleider",
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
export const createWerfcontainer = async (data) => {
try{
        const nieuweWerfContainer = new WerfContainer(data);
        return await nieuweWerfContainer.save();
    }
    catch (err){
        throw new Error("fout bij aanmaken werfcontainer" , {cause: err});
    }
}
export const editWerfcontainer = async (id, data) => {
    try {
        const werfcontainer = await WerfContainer.findById(id);

        if (!werfcontainer) {
            throw new Error("werfcontainer niet gevonden met deze ID");
        }

        // velden updaten
        Object.assign(werfcontainer, data);

        const saved = await werfcontainer.save();

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
      type: { $in: ['Werfcontainer'] }
    });

    return types;
  } catch (err) {
    throw new Error("Fout bij het ophalen van de Types", { cause: err });
  }
};