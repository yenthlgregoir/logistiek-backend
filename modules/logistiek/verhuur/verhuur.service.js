import {Verhuur} from "./verhuur.model.js"
import {MachineType} from "../schaarliften/type.model.js"
import {ProjectLeider} from "../projectleider/projectleider.model.js"
import {Werf} from "../werf/werf.model.js"
import {Schaarlift} from "../schaarliften/schaarlift.model.js"
import mongoose from 'mongoose';


export const getVerhuur = async (search, type) => {
  try {
    const query = {}

    // 🔍 Zoek op reference
    if (search && search.trim() !== '' && search !== 'undefined') {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [
        { reference: regex },
      ]
    }

    // 🟢 Filter op machineType
    if (type && type !== 'all') {
      console.log(type)
      query.machineType = type // verwacht ID van machineType
    }

    const Verhuringen = await Verhuur.find(query)
      .populate({
        path: "werf",
        select: "naam adres"
      })
      .populate({
        path: "projectleider",
        select: "naam"
      })
      .populate({
        path: "toestel",
        select: "nummer type"
      })
      .populate({
        path: "machineType",
        select: "naam type"
      })

    return Verhuringen
  }
  catch (err) {
    throw new Error("Fout in ophalen van verhuringen", { cause: err })
  }
}

export const createVerhuur = async (data) => {
  const { machineType, projectleider, werf, leverDatum, ophaalDatum, werkhoogte } = data;
  const now = new Date();

  const start = new Date(leverDatum);
  if (start < now) {
    throw new Error("Verhuur moet in de toekomst liggen");
  }

  // Check machine type
  const typeId = new mongoose.Types.ObjectId(machineType);
  const typeExists = await MachineType.findById(typeId);
  if (!typeExists) {
    throw new Error("Machine Type bestaat niet.");
  }

  // Check projectleider
  const aanvragerId = new mongoose.Types.ObjectId(projectleider);
  const aanvragerExists = await ProjectLeider.findById(aanvragerId);
  if (!aanvragerExists) {
    throw new Error("Projectleider bestaat niet");
  }

  // Check werf
  const werfId = new mongoose.Types.ObjectId(werf);
  const werfExists = await Werf.findById(werfId);
  if (!werfExists) {
    throw new Error("Werf bestaat niet");
  }

  // Controleer beschikbaar aantal toestellen
  const machineAantal = await Schaarlift.countDocuments({
    Type: typeId,
    werkhoogte: { $gte: werkhoogte },
    status: "Vrij",
  });
  if (machineAantal === 0) {
    throw new Error("Er bestaan geen actieve toestellen van dit type.");
  }

  // Zoek overlappende verhuur
  const overlappendeBoekingen = await Verhuur.find({
    leverDatum: { $lte: ophaalDatum ? new Date(ophaalDatum) : null }, // zie opmerking
    ophaalDatum: { $gte: new Date(leverDatum) },
    machineType: typeId,
  }).select("toestel").lean();

  // Speciale behandeling als ophaalDatum ontbreekt
  let aantalBezet = overlappendeBoekingen.length;
  if (!ophaalDatum) {
    // Als er al een open verhuur zonder ophaaldatum is, mag er niet nog een gestart worden
    const openVerhuur = overlappendeBoekingen.find(b => !b.ophaalDatum);
    if (openVerhuur) {
      throw new Error("Er is al een verhuur gestart vanaf deze leverdatum zonder ophaaldatum.");
    }
  }

  if (aantalBezet >= machineAantal) {
    throw new Error("Geen schaarliften van dit type beschikbaar in deze periode.");
  }

  // Genereer referentie
  const laatsteBoeking = await Verhuur.findOne().sort({ createdAt: -1 });
  let nieuwNummer = 1;
  if (laatsteBoeking?.reference) {
    const laatsteNummer = parseInt(laatsteBoeking.reference.split("/")[0]);
    nieuwNummer = laatsteNummer + 1;
  }
  const reference = `${nieuwNummer}/${aanvragerExists.naam}/${werfExists.naam}`;

  const nieuwVerhuur = new Verhuur({
    ...data,
    reference,
    toestel: null,
  });

  return await nieuwVerhuur.save();
};

export const getVrijeToestellen = async (data) => {
  try {
    const { machineType, leverDatum, ophaalDatum, werkhoogte } = data;

    if (!machineType || !leverDatum) {
      throw new Error("machineType en leverDatum zijn verplicht");
    }

    const typeId = new mongoose.Types.ObjectId(machineType);
    const beginNieuweBoek = new Date(leverDatum);
// juiste check voor ophaalDatum
const eindNieuweBoek = (ophaalDatum && ophaalDatum !== "null") 
  ? new Date(ophaalDatum) 
  : new Date(8640000000000000); // oneindig
    // Alle mogelijke toestellen van dit type en werkhoogte
    const mogelijkeToestellen = await Schaarlift.find({
      Type: typeId,
      werkhoogte: { $gte: werkhoogte },
      status: "Vrij",
    })
      .populate({ path: "Type", select: "naam type" })
      .lean();

    if (mogelijkeToestellen.length === 0) return [];

    // Zoek overlappende verhuur (inclusief null ophaalDatum)
    const overlappendeBoekingen = await Verhuur.find({
      machineType: typeId,
      $or: [
        {
          leverDatum: { $lte: eindNieuweBoek },
          $or: [
            { ophaalDatum: { $gte: beginNieuweBoek } },
            { ophaalDatum: null },
          ],
        },
      ],
    }).select("toestel").lean();

    // Haal bezette toestel-ID's
    const bezetIds = overlappendeBoekingen
      .map((b) => b.toestel?.toString())
      .filter(Boolean);

    // Filter vrije toestellen
    const vrijeToestellen = mogelijkeToestellen.filter(
      (t) => !bezetIds.includes(t._id.toString())
    );

    return vrijeToestellen;
  } catch (error) {
    throw new Error("Fout bij ophalen van vrije toestellen: ", {cause: error});
  }
};

export const assignToestel = async (data) => {

    try{
         const {toestel , verhuurId} = data;

    const verhuur = await Verhuur.findById(verhuurId);

    if(!verhuur){
        throw new Error ("geen verhuur gevonden");
    }

    verhuur.toestel = toestel;
    const saved = await verhuur.save();
    return saved;

    }
    catch (error){
        throw new Error("fout bij het toewijzen van een toestel" , {cause: error})
    }
}

export const updateVerhuur = async (id , data) => {
  try{
    return await Verhuur.findByIdAndUpdate(id ,data);
  }
  catch (err){
    throw new Error("fout bij het update van een verhuur" , {cause: err});
  }
}

export const deleteVerhuur = async (id) => {
  try {
    await Verhuur.findByIdAndDelete(id);
    return;
  }
  catch{
    throw new Error("fout bij het verwijderen van een boeking");
  }
}