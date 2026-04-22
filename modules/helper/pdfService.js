import PDFDocument from "pdfkit";

export const generateBoekingPDF = (res, boeking) => {

  const doc = new PDFDocument({
    size: "A4",
    margin: 40
  });

  res.setHeader("Content-Type","application/pdf");
  res.setHeader("Content-Disposition",`attachment; filename=${boeking.klant?.naam || "boeking"}.pdf`);

  doc.pipe(res);

  /* LOGO */

  doc.image("./assets/logo-bumacogroup.png", 40, 30, {
    width: 120
  });

  /* ============================= */
  /* REF BLOCK (DYNAMISCH) */
  /* ============================= */

  const refY = 110;

  const refText = `REF: ${boeking.ref} / Klantnummer:${boeking.klant?.klantNummer || ""}`;
  const periodeText = `${boeking.beginDatumFormatted} - ${boeking.eindDatumFormatted}`;

  const textWidth = 490;
  const padding = 15;

  doc.fontSize(16);
  const refHeight = doc.heightOfString(refText, { width: textWidth });

  doc.fontSize(11);
  const periodeHeight = doc.heightOfString(periodeText, { width: textWidth });

  const blockHeight = refHeight + periodeHeight + (padding * 2);

  doc.rect(40, refY, 515, blockHeight).fill("#e6f0fb");

  doc
    .fillColor("#0b3558")
    .fontSize(16)
    .text(refText, 55, refY + padding, {
      width: textWidth
    });

  doc
    .fontSize(11)
    .fillColor("#374151")
    .text(periodeText, 55, refY + padding + refHeight, {
      width: textWidth
    });

  /* ============================= */
  /* ADRES BLOKKEN (DYNAMISCH) */
  /* ============================= */

  const yStart = refY + blockHeight + 20;

  const lever = boeking.leverAdresDetails || {};
  const factuur = boeking.klant?.factuurAdres || {};

  const leftX = 50;
  const rightX = 315;
  const boxWidth = 250;
  const innerPadding = 10;
  const addrTextWidth = boxWidth - 20;

  // Leveringsadres
  const leverText = [
    lever.naam,
    `${lever.straat || "-"} ${lever.huisnummer || ""}`,
    `${lever.postcode || "-"} ${lever.gemeente || ""}`
  ].filter(Boolean).join("\n");

  doc.fontSize(11);
  const leverHeight = doc.heightOfString(leverText, { width: addrTextWidth });

  // Factuuradres
  const factuurText = [
    boeking.klant?.naam,
    `${factuur.straat || "-"} ${factuur.huisnummer || ""}`,
    `${factuur.postcode || "-"} ${factuur.gemeente || ""}`
  ].filter(Boolean).join("\n");

  const factuurHeight = doc.heightOfString(factuurText, { width: addrTextWidth });

  const titleHeight = 20;
  const boxHeight = Math.max(leverHeight, factuurHeight) + titleHeight + (innerPadding * 2);

  // Boxen
  doc.rect(40, yStart, boxWidth, boxHeight).stroke("#e2e8f0");
  doc.rect(305, yStart, boxWidth, boxHeight).stroke("#e2e8f0");

  // Titels
  doc.fontSize(12).fillColor("#0b3558")
    .text("Leveringsadres:", leftX, yStart + innerPadding);

  doc.text("Factuuradres:", rightX, yStart + innerPadding);

  // Tekst
  doc.fontSize(11).fillColor("#000")
    .text(leverText || "-", leftX, yStart + innerPadding + titleHeight, {
      width: addrTextWidth
    });

  doc.text(factuurText || "-", rightX, yStart + innerPadding + titleHeight, {
    width: addrTextWidth
  });

  /* ============================= */
  /* TABEL */
  /* ============================= */

  const tableTop = yStart + boxHeight + 20;

  doc.rect(40, tableTop, 515, 25).fill("#0284c7");

  doc.fillColor("#fff")
    .fontSize(11)
    .text("Type", 50, tableTop + 7)
    .text("Volgnummer", 250, tableTop + 7)
    .text("Aantal", 350, tableTop + 7, { width: 60, align: "center" })
    .text("Transport", 440, tableTop + 7);

  const rowY = tableTop + 25;

  doc.fillColor("#000")
    .fontSize(11)
    .text(boeking.toestelType?.naam || "-", 50, rowY + 8)
    .text(boeking.toestel?.Ref || "-", 250, rowY + 8)
    .text("1,00", 350, rowY + 8, { width: 60, align: "center" })
    .text(boeking.type || "-", 440, rowY + 8);

  /* ============================= */
  /* OPMERKING */
  /* ============================= */

  if (boeking.comment && boeking.comment.trim() !== "") {

    const opmerkingY = rowY + 50;

    doc
      .fontSize(12)
      .fillColor("#0b3558")
      .text("Opmerkingen:", 40, opmerkingY);

    doc
      .moveDown(0.5)
      .fontSize(11)
      .fillColor("#374151")
      .text(boeking.comment, {
        width: 515
      });
  }

  /* ============================= */
  /* FOOTER */
  /* ============================= */

  const footerY = doc.page.height - 75;

  doc
    .fontSize(10)
    .fillColor("#555")
    .text(
      "BUMACO bv – Stationsstraat 216 – 3110 Rotselaar",
      40,
      footerY,
      { align: "center", width: 515 }
    );

  doc.text(
    "Tel: 016/44.69.73 – Fax: 016/44.38.28 – E-mail: info@bumaco.be – www.bumaco.be",
    { align: "center" }
  );

  doc.text(
    "BTW BE 0455.064.414 – RPR Leuven",
    { align: "center" }
  );

  doc.end();
};

export const generateVerhuurPDF = (res, verhuur) => {

  const doc = new PDFDocument({
    size: "A4",
    margin: 40
  });

  res.setHeader("Content-Type","application/pdf");
  res.setHeader("Content-Disposition",`attachment; filename=${verhuur.reference || "verhuur"}.pdf`);

  doc.pipe(res);

  /* LOGO */

  doc.image("./assets/logo-bumacogroup.png", 40, 30, {
    width: 120
  });

  /* ============================= */
  /* REF BLOCK (DYNAMISCH) */
  /* ============================= */

  const refY = 110;

  const refText = `REF: ${verhuur.reference}`;
  const periodeText = `${new Date(
          verhuur.leverDatum
        ).toLocaleDateString("nl-BE")} - ${new Date(
          verhuur.ophaalDatum
        ).toLocaleDateString("nl-BE")}`;

  const textWidth = 490;
  const padding = 15;

  doc.fontSize(16);
  const refHeight = doc.heightOfString(refText, { width: textWidth });


  doc.fontSize(11);
  const logRefHeight = doc.heightOfString(verhuur.logistiekeReferentie , {width: textWidth});

  doc.fontSize(11);
  const periodeHeight = doc.heightOfString(periodeText, { width: textWidth });

  const blockHeight = refHeight + periodeHeight + + logRefHeight + (padding * 2);

  doc.rect(40, refY, 515, blockHeight).fill("#e6f0fb");

  doc
    .fillColor("#0b3558")
    .fontSize(16)
    .text(refText, 55, refY + padding, {
      width: textWidth
    });
doc
    .fontSize(11)
    .fillColor("#374151")
    .text("logistieke referentie:" + verhuur.logistiekeReferentie, 55, refY + padding + refHeight,{
      width:textWidth
    })

  doc
    .fontSize(11)
    .fillColor("#374151")
    .text(periodeText, 55, refY + padding + refHeight + periodeHeight + 3, {
      width: textWidth
    });

  const yStart = refY + blockHeight + 20;

  const adres = verhuur.werf.adres || {};

  const leftX = 50;
  const rightX = 315;
  const boxWidth = 250;
  const innerPadding = 10;
  const addrTextWidth = boxWidth - 20;

  // Leveringsadres
  const leverText = [
    verhuur.werf.naam,
    `${adres.straat || "-"} ${adres.huisnummer || ""}`,
    `${adres.postcode || "-"} ${adres.gemeente || ""}`
  ].filter(Boolean).join("\n");

  doc.fontSize(11);
  const leverHeight = doc.heightOfString(leverText, { width: addrTextWidth });


  const projectleiderText = [
    verhuur.projectleider?.naam || "",
    verhuur.projectleider?.entiteit.naam  || "",
    verhuur.projectleider?.mailAdres  || "",
  ].filter(Boolean).join("\n");
  const projectleiderHeight = doc.heightOfString(projectleiderText, { width: addrTextWidth });

  const titleHeight = 20;
  const boxHeight = Math.max(leverHeight, projectleiderHeight) + titleHeight + (innerPadding * 2);

  // Boxen
  doc.rect(40, yStart, boxWidth, boxHeight).stroke("#e2e8f0");
  doc.rect(305, yStart, boxWidth, boxHeight).stroke("#e2e8f0");

  // Titels
  doc.fontSize(12).fillColor("#0b3558")
    .text("Leveringsadres:", leftX, yStart + innerPadding);
  doc.text("Projectleider:", rightX, yStart + innerPadding);

  // Tekst
  doc.fontSize(11).fillColor("#000")
    .text(leverText || "-", leftX, yStart + innerPadding + titleHeight, {
      width: addrTextWidth
    });

  doc.text(projectleiderText || "-", rightX, yStart + innerPadding + titleHeight, {
    width: addrTextWidth
  });

  /* ============================= */
  /* TABEL */
  /* ============================= */

  const tableTop = yStart + boxHeight + 20;

  doc.rect(40, tableTop, 515, 25).fill("#0284c7");

  doc.fillColor("#fff")
    .fontSize(11)
    .text("Type", 50, tableTop + 7)
    .text("Volgnummer", 250, tableTop + 7)
    .text("Aantal", 450, tableTop + 7, { width: 60, align: "center" })

  const rowY = tableTop + 25;

  doc.fillColor("#000")
    .fontSize(11)
    .text(verhuur.assetType || "-", 50, rowY + 8)
    .text(verhuur.asset?.nummer || "-", 250, rowY + 8)
    .text("1,00", 450, rowY + 8, { width: 60, align: "center" })


  /* ============================= */
  /* FOOTER */
  /* ============================= */

  const footerY = doc.page.height - 75;

  doc
    .fontSize(10)
    .fillColor("#555")
    .text(
      "BUMACO bv – Stationsstraat 216 – 3110 Rotselaar",
      40,
      footerY,
      { align: "center", width: 515 }
    );

  doc.text(
    "Tel: 016/44.69.73 – Fax: 016/44.38.28 – E-mail: info@bumaco.be – www.bumaco.be",
    { align: "center" }
  );

  doc.text(
    "BTW BE 0455.064.414 – RPR Leuven",
    { align: "center" }
  );

  doc.end();
};

export const generateHoogtewerkersPDF = (res, assets) => {

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape", // 🔥 landscape
    margin: 40
  })

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", "attachment; filename=hoogtewerkers.pdf")

  doc.pipe(res)

  /* TITLE */
  const d = new Date();
  const date = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  doc.fontSize(18).text("Overzicht hoogtewerkers " + date, { align: "center" })
  doc.moveDown()

  /* TABLE HEADER */
  const startY = 100

  doc.rect(40, startY, 760, 25).fill("#0284c7") 

  doc.fillColor("#fff")
    .fontSize(11)
    .text("Nummer", 50, startY + 7)
    .text("Type", 200, startY + 7)
    .text("Locatie", 400, startY + 7)

  let y = startY + 25

  doc.fontSize(10).fillColor("#000")

  assets.forEach((asset, index) => {

    // nieuwe pagina
    if (y > doc.page.height - 80) {
      doc.addPage()
      y = 50
    }

    // 🔥 locatie bepalen
    let locatie = "Wingepark 27, 3110 Rotselaar"

    if (asset.huidigeBoekingen.length > 0) {
      const boeking = asset.huidigeBoekingen[0]

      const adres = boeking.werf?.adres || {}

      locatie = [
        boeking.werf?.naam || "",
        `${adres.straat || ""} ${adres.huisnummer || ""}`,
        `${adres.postcode || ""} ${adres.gemeente || ""}`
      ]
        .filter(Boolean)
        .join(", ")
    }

    /* zebra row */
    if (index % 2 === 0) {
      doc.rect(40, y, 760, 25).fill("#f9fafb")
      doc.fillColor("#000")
    }

    /* data */
    doc.text(asset.nummer || "-", 50, y + 7)

    doc.text(asset.Type?.naam || "-", 200, y + 7)

    doc.text(locatie, 400, y + 7, {
      width: 350
    })

    y += 25
  })

  doc.end()
}