import { Boeking } from "./boeking.model.js";
import { Toestel } from "../toestellen/toestel.model.js";
import { ToestelType } from "../toestellen/toestelType.model.js";
import { Klant } from "../klanten/klant.model.js";
import mongoose from "mongoose";

export const getBoekingen = async ({ search, startDatum, eindDatum, archief, type }) => {
  try {
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);
    let filter = {};
    // 🔹 Archief filter
    if (archief === "true") {
      filter.eindDatum = { $lt: vandaag }; 
    } else if (archief === "false") {
      filter.eindDatum = { $gte: vandaag };
    }
if (type && type !== 'null') {
  filter.toestelType = type;
}
    // 🔹 Date range filter
    if (startDatum !== 'null' && eindDatum !== 'null') { 
      filter.beginDatum = {}; 
      if (startDatum) filter.beginDatum.$gte = new Date(startDatum); 
      if (eindDatum) filter.beginDatum.$lte = new Date(eindDatum); 
    }

    if (search) {
  const regex = new RegExp(search, "i");

  const toestellen = await Toestel.find({ Ref: regex }).select("_id");

  const klantenMetLeveradres = await Klant.find({
    "leverAdressen.naam": regex
  })
  const matchingLeverAdresIds = [];
  klantenMetLeveradres.forEach(k => {
    k.leverAdressen.forEach(a => {
      if (regex.test(a.naam)) {
        matchingLeverAdresIds.push(a._id);
      }
    });
  });

  filter.$or = [
    { ref: regex },                                     
    { toestel: { $in: toestellen.map(t => t._id) } },   
    { leverAdres: { $in: matchingLeverAdresIds } },  
  ];
}

    const boekingen = await Boeking.find(filter)
      .populate({
        path: "toestel",
        select: "naam Ref type",
        populate: {
          path: "type",
          model: "ToestelType",
          select: "naam",
        },
      })
      .populate({
        path: "klant",
        select: "naam leverAdressen factuurAdres",
      })
      .populate({
        path: "toestelType",
        select: "naam",
      })
      .sort({ beginDatum: 1 })
      .lean();
    for (const boeking of boekingen) {
      if (boeking.klant) {
  if (boeking.leverAdres) {
    const gevondenAdres = boeking.klant.leverAdressen?.find(
      (adres) => adres._id.toString() === boeking.leverAdres.toString(),
    );
    boeking.leverAdresDetails = gevondenAdres || boeking.klant.factuurAdres;
  } else {
    // 👉 fallback naar factuuradres
    boeking.leverAdresDetails = boeking.klant.factuurAdres;
  }
} else {
  boeking.leverAdresDetails = null;
}

      if (boeking.beginDatum) {
        boeking.beginDatumFormatted = new Date(
          boeking.beginDatum
        ).toLocaleDateString("nl-BE");
      }
      if (boeking.eindDatum) {
        boeking.eindDatumFormatted = new Date(
          boeking.eindDatum
        ).toLocaleDateString("nl-BE");
      }
    }
    return boekingen;
  } catch (error) {
    throw new Error("Fout bij ophalen boekingen:", error);
  }
};
export const createBoeking = async (data) => {
  const { beginDatum, eindDatum, toestelType, klant } = data;

  const now = new Date();
  const start = new Date(beginDatum);

  if (start < now) {
    throw new Error("De boeking moet in de toekomst liggen!");
  }

  if (!data.leverAdres) {
    data.leverAdres = data.factuurAdres;
  }

  // 1️⃣ TypeId valideren
  const typeId = new mongoose.Types.ObjectId(toestelType);

  // 2️⃣ Check of type bestaat
  const typeExists = await ToestelType.findById(typeId);
  if (!typeExists) {
    throw new Error("ToestelType bestaat niet.");
  }

  // 3️⃣ Tel actieve toestellen van dit type
  const totaalAantal = await Toestel.countDocuments({
    type: typeId,
    "status.statusType": "Actief",
  });
 
  if (totaalAantal === 0) {
    throw new Error("Er bestaan geen actieve toestellen van dit type.");
  }

  // 4️⃣ Zoek overlappende boekingen van dit types
  const overlappendeBoekingen = await Boeking.find({
    beginDatum: { $lte: new Date(eindDatum) },
    eindDatum: { $gte: new Date(beginDatum) },
    toestelType: typeId,
  })
    .select("toestel")
    .lean();

  const aantalBezet = overlappendeBoekingen.length;

  if (aantalBezet >= totaalAantal) {
    throw new Error(
      "Geen toestellen van dit type beschikbaar in deze periode.",
    );
  }

  // 5️⃣ Ref genereren
  const laatsteBoeking = await Boeking.findOne().sort({ createdAt: -1 });
  let nieuwNummer = 1;

  if (laatsteBoeking?.ref) {
    const laatsteNummer = Number.parseInt(laatsteBoeking.ref.split("/")[0]);
    nieuwNummer = laatsteNummer + 1;
  }

  // 6️⃣ Klant checken
  const klantNaam = await Klant.findById(klant);
  if (!klantNaam) {
    throw new Error("Klant niet gevonden.");
  }

  const ref = `${nieuwNummer}/${typeExists.naam}/${klantNaam.naam}`;

  // 7️⃣ Boeking opslaan — zonder toestel!
  const nieuweBoeking = new Boeking({
    ...data,
    ref,
    toestel: null,
  });

  return await nieuweBoeking.save();
};
export const getBoekingById = async (id) => {
  try {
    const boeking = await Boeking.findById(id)
      .populate({
        path: "toestel",
        select: "naam Ref type status nrplaat chasisnummer",
        populate: {
          path: "type",
          model: "ToestelType",
          select: "naam",
        },
      })
      .populate({
        path: "klant",
        select: "naam leverAdressen factuurAdres klantNummer",
      })
      .populate({
        path: "toestelType",
        select: "naam",
      })
      .lean();

    if (!boeking) {
      throw new Error("Boeking niet gevonden");
    }

    let adres = null;

    if (boeking.klant && boeking.leverAdres) {
      adres = boeking.klant.leverAdressen.find(
        (a) => a._id.toString() === boeking.leverAdres.toString(),
      );
    }

    if (!adres && boeking.klant?.factuurAdres) {
      adres = boeking.klant.factuurAdres;
    }

    boeking.leverAdresDetails = adres;

    if (boeking.beginDatum) {
      boeking.beginDatumFormatted = new Date(
        boeking.beginDatum,
      ).toLocaleDateString("nl-BE");
    }

    if (boeking.eindDatum) {
      boeking.eindDatumFormatted = new Date(
        boeking.eindDatum,
      ).toLocaleDateString("nl-BE");
    }

    return boeking;
  } catch (error) {
    console.error("Fout bij ophalen boeking:", error);
    throw error;
  }
};
export const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is verplicht." });
    }

    const boeking = await Boeking.findById(id);

    if (!boeking) {
      return res.status(404).json({ message: "Boeking niet gevonden." });
    }

    boeking.status = status;
    boeking.updatedAt = new Date();

    if (boeking.status === "Afgewerkt") {
    boeking.eindDatum = new Date();
}
    await boeking.save();

    res.status(200).json({
      message: "Status succesvol gewijzigd.",
      boeking,
    });
  } catch (error) {
    console.error("Fout bij wijzigen status:", error);

    // Check voor Mongoose validation / pre-save error
    if (error.message.includes("Toestel is vereist")) {
      return res.status(400).json({ message: error.message });
    }

    if (error.message.includes("Einddatum moet later zijn dan begindatum")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Fout bij wijzigen status." });
  }
};
export const getVrijeToestellen = async (req, res) => {
  try {
    const { beginDatum, eindDatum, toestelType, klant } = req.query;

    if (!beginDatum || !eindDatum) {
      return res.status(400).json({
        message: "beginDatum en eindDatum zijn verplicht.",
      });
    }

    const start = new Date(beginDatum);
    const eind = new Date(eindDatum);

    // optional: normaliseren
    start.setSeconds(0, 0);
    eind.setSeconds(0, 0);

    // 1️⃣ basis query
    let toestellenQuery = {
      "status.statusType": "Actief",
    };

    // 2️⃣ filter toestelType
    if (toestelType && /^[0-9a-fA-F]{24}$/.test(toestelType)) {
      toestellenQuery.type = new mongoose.Types.ObjectId(toestelType);
    }

    // 3️⃣ filter klant (optioneel)
    if (klant && mongoose.Types.ObjectId.isValid(klant)) {
      toestellenQuery.klant = new mongoose.Types.ObjectId(klant);
    }

    // 4️⃣ overlappende boekingen ophalen
   const overlappendeBoekingen = await Boeking.find({
  toestel: { $ne: null },
  status: { $ne: "Afgewerkt" }, // afgewerkte boekingen niet meetellen
  beginDatum: { $lt: eind },
  eindDatum: { $gt: start },
})
  .select("toestel")
  .lean();

    // 5️⃣ bezette toestellen lijst
    const bezetteIds = overlappendeBoekingen.map((b) =>
      b.toestel.toString()
    );

    // 6️⃣ exclusief bezette toestellen
    toestellenQuery._id = { $nin: bezetteIds };

    // 7️⃣ ophalen vrije toestellen
    const toestellen = await Toestel.find(toestellenQuery)
      .populate({
        path: "type",
        model: "ToestelType",
        select: "naam",
      })
      .lean();

    return toestellen;
  } catch (error) {
    console.error("Fout bij ophalen vrije toestellen:", error);
    throw new Error("Fout bij ophalen vrije toestellen:", error)
  }
};
export const assignToestel = async (req, res) => {
  try {
    const { id } = req.params; // boekingId
    const { toestel: toestelId } = req.body;

    if (!toestelId) {
      return res.status(400).json({ message: "Toestel is verplicht." });
    }

    // 1️⃣ Boeking ophalen
    const boeking = await Boeking.findById(id);
    if (!boeking) {
      return res.status(404).json({ message: "Boeking niet gevonden." });
    }

    // 2️⃣ Toestel ophalen
    const toestel = await Toestel.findById(toestelId);
    if (!toestel) {
      return res.status(404).json({ message: "Toestel niet gevonden." });
    }

    // 3️⃣ Check dat toestel type overeenkomt met boekingstype
    if (!boeking.toestelType.equals(toestel.type)) {
      return res
        .status(400)
        .json({ message: "Toestel type komt niet overeen." });
    }

    // 4️⃣ Check dat toestel vrij is in deze periode
   const overlappendeBoekingen = await Boeking.find({
  toestel: toestel._id,
  _id: { $ne: boeking._id }, // andere boekingen
  status: { $nin: ["Afgewerkt"] },
  beginDatum: { $lt: boeking.eindDatum },
  eindDatum: { $gt: boeking.beginDatum },
});

    if (overlappendeBoekingen.length > 0) {
      return res
        .status(400)
        .json({ message: "Toestel is bezet in deze periode." });
    }

    // 5️⃣ Toewijzen
    boeking.toestel = toestel._id;
    boeking.updatedAt = new Date();
    await boeking.save();

    res.status(200).json({ message: "Toestel succesvol toegewezen.", boeking });
  } catch  {
    res.status(500).json({ message: "Fout bij toewijzen toestel." });
  }
};
export const boekingVerwijderen = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBoeking = await Boeking.findByIdAndDelete(id);

    if (!deletedBoeking) {
      return res.status(404).json({ message: "Boeking niet gevonden" });
    }

    res
      .status(200)
      .json({ message: "Boeking succesvol verwijderd", deletedBoeking });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: "Er is een fout opgetreden bij het verwijderen van de boeking",
      });
  }
};
export const updateBoeking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // 1️⃣ Boeking ophalen
    const boeking = await Boeking.findById(id);
    if (!boeking) {
      return res.status(404).json({ message: "Boeking niet gevonden." });
    }

    // 2️⃣ Datums correct omzetten
    if (updates.beginDatum !== undefined) {
      updates.beginDatum = new Date(updates.beginDatum);
    }

    if (updates.eindDatum !== undefined) {
      updates.eindDatum = new Date(updates.eindDatum);
    }

    // 3️⃣ Alleen toegestane velden updaten
    const allowedFields = [
      "leverAdres",
      "beginDatum",
      "eindDatum",
      "status",
      "klant",
      "toestelType",
      "comment",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        boeking[field] = updates[field];
      }
    });

    boeking.updatedAt = new Date();

    // 4️⃣ Opslaan
    await boeking.save();

    // 5️⃣ Populatie
    const populatedBoeking = await Boeking.findById(boeking._id)
      .populate({ path: "klant", select: "naam leverAdressen" })
      .populate({ path: "toestel", select: "naam Ref type" })
      .lean();

    // 6️⃣ Leveradres details toevoegen
    if (populatedBoeking?.klant?.leverAdressen && populatedBoeking.leverAdres) {
      populatedBoeking.leverAdresDetails =
        populatedBoeking.klant.leverAdressen.find(
          (adres) =>
            adres._id.toString() === populatedBoeking.leverAdres.toString(),
        ) || null;
    }

    res.status(200).json({
      message: "Boeking succesvol bijgewerkt.",
      boeking: populatedBoeking,
    });
  } catch (error) {
    console.error("Fout bij bijwerken boeking:", error);
    res.status(500).json({ message: "Fout bij bijwerken boeking." });
  }
};
export const updatePeriode = async (req, res) => {
  try {
    const { boekingId, beginDatum, eindDatum } = req.body;

    if (!boekingId || !beginDatum || !eindDatum) {
      return res.status(400).json({
        message: "boekingId, beginDatum en eindDatum zijn verplicht.",
      });
    }

    const start = new Date(beginDatum);
    const eind = new Date(eindDatum);

    // 1️⃣ Boeking ophalen
    const boeking = await Boeking.findById(boekingId);

    if (!boeking) {
      return res.status(404).json({ message: "Boeking niet gevonden." });
    }

    // 2️⃣ Check overlappende boekingen
    const overlappendeBoekingen = await Boeking.find({
      _id: { $ne: boeking._id },
      beginDatum: { $lte: eind },
      eindDatum: { $gte: start },
    }).lean();

    // -------------------------------
    // SCENARIO 1: toestel gekoppeld
    // -------------------------------
    if (boeking.toestel) {
      const toestelBezet = overlappendeBoekingen.some(
        (b) => b.toestel && b.toestel.toString() === boeking.toestel.toString(),
      );

      if (toestelBezet) {
        return res.status(400).json({
          message: "Het gekoppelde toestel is bezet in deze periode.",
        });
      }
    }
    // -------------------------------
    // SCENARIO 2: geen toestel
    // -------------------------------
    else {
      // alle toestellen van type
      const toestellen = await Toestel.find({
        type: boeking.toestelType,
      })
        .select("_id")
        .lean();

      if (!toestellen.length) {
        return res.status(400).json({
          message: "Er bestaan geen toestellen van dit type.",
        });
      }

      const bezetteToestellen = overlappendeBoekingen
        .filter((b) => b.toestel)
        .map((b) => b.toestel.toString());

      const vrijeToestellen = toestellen.filter(
        (t) => !bezetteToestellen.includes(t._id.toString()),
      );

      if (!vrijeToestellen.length) {
        return res.status(400).json({
          message: "Geen toestellen van dit type beschikbaar in deze periode.",
        });
      }
    }

    // 3️⃣ Periode updaten
    boeking.beginDatum = start;
    boeking.eindDatum = eind;
    boeking.updatedAt = new Date();

    await boeking.save();

    res.status(200).json({
      message: "Periode succesvol aangepast.",
      boeking,
    });
  } catch  {
    res.status(500).json({
      message: "Fout bij aanpassen periode.",
    });
  }
};

export const getAantalVrijeToestellen = async (req, res) => {
try {
    const { beginDatum, eindDatum, toestelType } = req.query;

    if (!beginDatum || !eindDatum || !toestelType) {
      return res.status(400).json({
        message: "beginDatum, eindDatum en toestelType zijn verplicht.",
      });
    }

    const start = new Date(beginDatum);
    const eind = new Date(eindDatum);

    start.setSeconds(0, 0);
    eind.setSeconds(0, 0);

    if (!mongoose.Types.ObjectId.isValid(toestelType)) {
      return res.status(400).json({
        message: "Ongeldig toestelType.",
      });
    }

    const typeId = new mongoose.Types.ObjectId(toestelType);

    // 1️⃣ totaal aantal toestellen van dat type
    const totaalToestellen = await Toestel.countDocuments({
      type: typeId,
      "status.statusType": "Actief",
    });

    // 2️⃣ aantal overlappende boekingen (OOK zonder toestel)
    const overlappendeBoekingen = await Boeking.countDocuments({
  beginDatum: { $lt: eind },
  eindDatum: { $gt: start },
  toestelType: typeId, // of wat jouw field is
})

    // 3️⃣ berekening beschikbaar
    const beschikbaar = Math.max(
      0,
      totaalToestellen - overlappendeBoekingen
    );

    return res.status(200).json({
      totaalToestellen,
      overlappendeBoekingen,
      beschikbaar,
    });
  } catch (error) {
    console.error("Fout bij berekenen beschikbare toestellen:", error);
    return res.status(500).json({
      message: "Fout bij berekenen beschikbare toestellen",
    });
  }
};