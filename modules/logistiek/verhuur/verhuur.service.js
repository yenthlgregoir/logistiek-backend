import { Verhuur } from "./verhuur.model.js";
import { ProjectLeider } from "../projectleider/projectleider.model.js";
import { Werf } from "../werf/werf.model.js";
import { Hoogtewerker} from "../hoogtewerker/hoogtewerker.model.js";
import { WerfContainer } from "../werfcontainers/werfcontainer.model.js";
import {MachineType} from "../hoogtewerker/type.model.js"

/**
 * Ophalen van alle verhuringen met search en assetType filters
 */
export const getVerhuur = async (search, assetModel , type) => {
  try {
    const query = {};

    if (search && search.trim() !== "" && search !== "undefined") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ reference: regex }];
    }

    if (assetModel && assetModel !== "all") {
      query.assetModel = assetModel; 
    }

    if (type){
      query.assetType = type;
    }

    const verhuringen = await Verhuur.find(query)
      .populate({ path: "werf", select: "naam adres" })
      .populate({ path: "projectleider", select: "naam" })
      .populate({
        path: "asset",
        select: "_id nummer werkhoogte platformhoogte serienummer Type entiteit status",
      });

    return verhuringen;
  } catch (err) {
    throw new Error("Fout in ophalen van verhuringen", { cause: err });
  }
};

/**
 * Ophalen van één verhuur op ID
 */
export const getVerhuurById = async (id) => {
  try {
    return await Verhuur.findById(id)
      .populate({ path: "werf", select: "naam adres" })
      .populate({
        path: "projectleider",
        select: "naam mailAdres entiteit",
        populate: { path: "entiteit", select: "naam" },
      })
      .populate({
        path: "asset",
        select: "_id nummer werkhoogte platformhoogte serienummer Type entiteit status",
      });
  } catch (err) {
    throw new Error("Verhuur niet gevonden", { cause: err });
  }
};

/**
 * Nieuwe verhuur aanmaken
 */
export const createVerhuur = async (data) => {
  try {
    const {
      asset,
      assetModel,
      assetType,
      projectleider,
      werf,
      leverDatum,
      ophaalDatum,
      werkhoogte,
      logistiekeReferentie,
      entiteit,
    } = data;

    // 🔴 VALIDATIE DATUMS
    if (!leverDatum) {
      throw new Error("Leverdatum is verplicht");
    }

    if (ophaalDatum && new Date(ophaalDatum) < new Date(leverDatum)) {
      throw new Error("Ophaaldatum kan niet vóór leverdatum liggen");
    }

    let projectleiderModel = null;

if (projectleider) {
  projectleiderModel = await ProjectLeider.findById(projectleider);
  if (!projectleiderModel) throw new Error("Projectleider bestaat niet");
}


    const werfModel = await Werf.findById(werf);
    if (!werfModel) throw new Error("Werf bestaat niet");

    let assetInstance = null;

    // 🔴 WerfContainer validatie
    if (assetModel === "WerfContainer" && !entiteit) {
      throw new Error("Entiteit is verplicht voor werfcontainer verhuur");
    }

    // =========================
    // 1. SPECIFIEK ASSET GEKOZEN
    // =========================
    if (asset) {
      if (assetModel === "Hoogtewerker") {
        assetInstance = await Hoogtewerker.findById(asset);
        if (!assetInstance) throw new Error("Hoogtewerker bestaat niet");
      }

      if (assetModel === "WerfContainer") {
        assetInstance = await WerfContainer.findById(asset);
        if (!assetInstance) throw new Error("WerfContainer bestaat niet");

        if (String(assetInstance.entiteit) !== String(entiteit)) {
          throw new Error("Container hoort niet bij deze entiteit");
        }
      }
    }

    // =========================
    // 2. AUTOMATISCH SELECTEREN
    // =========================
    if (!assetInstance) {
      const vrijeAssets = await getVrijeAssets({
        assetModel,
        leverDatum,
        ophaalDatum,
        werkhoogte,
      });

      if (!vrijeAssets?.length) {
        throw new Error(`Geen vrije ${assetType} beschikbaar in deze periode`);
      }

      // 🔴 FIX: eenvoudige en veilige type lookup
      const assetTypeDocs = await MachineType.find({
  $or: [
    { naam: assetType },
    { type: assetType }
  ]
});


      const assetTypeIds = assetTypeDocs.map(t => String(t._id));

      if (!assetTypeIds.length) {
        throw new Error(`Geen geldige machine types gevonden voor ${assetType}`);
      }

      let geschikteAssets = vrijeAssets.filter(a => {
        const typeMatch = assetTypeIds.includes(String(a.Type));

        if (assetModel === "WerfContainer") {
          return (
            typeMatch &&
            String(a.entiteit || "") === String(entiteit || "")
          );
        }

        return typeMatch;
      });

      if (!geschikteAssets.length) {
        throw new Error(`Geen vrije ${assetType} beschikbaar met deze filters`);
      }

      assetInstance = geschikteAssets[0];
    }

    // =========================
    // 3. WERKHOOGTE VALIDATIE
    // =========================
    if (assetModel === "Hoogtewerker") {
      const hoogte = werkhoogte || assetInstance?.werkhoogte;

      if (!hoogte) {
        throw new Error("Werkhoogte is verplicht voor Hoogtewerker");
      }
    }

    // =========================
    // 4. REFERENCE
    // =========================
    const laatsteBoeking = await Verhuur.findOne().sort({ createdAt: -1 });

    const nieuwNummer = laatsteBoeking
      ? Number.parseInt(laatsteBoeking.reference.split("/")[0]) + 1
      : 1;

const plNaam = projectleiderModel?.naam || "intern";

const reference = `${nieuwNummer}/${plNaam}/${werfModel.naam}`;
    // =========================
    // 5. SAVE
    // =========================
    const verhuur = new Verhuur({
      reference,
      asset:  null,
      assetModel,
      assetType,
      projectleider,
      werf,
      leverDatum,
      ophaalDatum: ophaalDatum || null,
      entiteit: assetModel === "WerfContainer" ? entiteit : undefined,
      werkhoogte:
        assetModel === "Hoogtewerker"
          ? (werkhoogte || assetInstance?.werkhoogte)
          : undefined,
      status: "Leveren",
      logistiekeReferentie,
    });

    return await verhuur.save();
  } catch (error) {
    console.error(error);
    throw new Error( error.message, {
      cause: error,
    });
  }
};
/**
 * Vrije assets ophalen
 */
export const getVrijeAssets = async (data) => {
  const { assetModel, leverDatum, ophaalDatum, werkhoogte } = data;

  if (!assetModel || !leverDatum) throw new Error("assetModel en leverDatum zijn verplicht");

  const beginNieuweBoek = new Date(leverDatum);
  const eindNieuweBoek = ophaalDatum ? new Date(ophaalDatum) : new Date(8640000000000000);

  // Alle assets van dit type
  const AssetModel = assetModel === "Hoogtewerker" ? Hoogtewerker: WerfContainer;
  const mogelijkeAssets = await AssetModel.find({
    status: "Vrij",
    ...(assetModel === "Hoogtewerker" && werkhoogte ? { werkhoogte: { $gte: werkhoogte } } : {}),
  }).lean();

  if (mogelijkeAssets.length === 0) return [];

  // Zoek overlappende verhuur
  const overlappendeBoekingen = await Verhuur.find({
    assetModel,
    $or: [
      {
        leverDatum: { $lte: eindNieuweBoek },
        $or: [
          { ophaalDatum: { $gte: beginNieuweBoek } },
          { ophaalDatum: null },
        ],
      },
    ],
  }).select("asset").lean();

  const bezetIds = overlappendeBoekingen.map(b => b.asset?.toString()).filter(Boolean);

  return mogelijkeAssets.filter(t => !bezetIds.includes(t._id.toString()));
};

/**
 * Asset toewijzen aan een verhuur
 */
export const assignAsset = async ({ asset, verhuurId }) => {
  const verhuur = await Verhuur.findById(verhuurId);
  if (!verhuur) throw new Error("Verhuur niet gevonden");

  verhuur.asset = asset;
  return await verhuur.save();
};

/**
 * Verhuur updaten
 */
export const updateVerhuur = async (id, data) => {
  const { projectleider, werf } = data;

  const projectleiderModel = await ProjectLeider.findById(projectleider);
  const werfModel = await Werf.findById(werf);

  const verhuur = await Verhuur.findById(id);
  if (!verhuur) throw new Error("Verhuur niet gevonden");

  let ref = verhuur.reference.split("/");
  if (projectleider && verhuur.projectleider?.toString() !== projectleiderModel._id.toString()) {
    ref[1] = projectleiderModel.naam;
  }
  if (werf && verhuur.werf?.toString() !== werfModel._id.toString()) {
    ref[2] = werfModel.naam;
  }

  data.reference = ref.join("/");

  return await Verhuur.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Verhuur verwijderen
 */
export const deleteVerhuur = async (id) => {
  await Verhuur.findByIdAndDelete(id);
};