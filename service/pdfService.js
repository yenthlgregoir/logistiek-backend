import PDFDocument from "pdfkit";

export const generateBoekingPDF = (res, boeking) => {

  const doc = new PDFDocument({
    size: "A4",
    margin: 40
  });

  res.setHeader("Content-Type","application/pdf");
  res.setHeader("Content-Disposition",`attachment; filename=${boeking.klant?.naam}.pdf`);

  doc.pipe(res);

  /* LOGO */

  doc.image("./assets/logo-bumacogroup.png", 40, 30, {
    width: 120
  });

  /* REF BLOCK */

  const refY = 110;

  doc.rect(40, refY, 515, 60).fill("#e6f0fb");

  doc
    .fillColor("#0b3558")
    .fontSize(16)
    .text(
      `REF: ${boeking.ref} / Klantnummer:${boeking.klant?.klantNummer || ""}`,
      55,
      refY + 15
    );

  doc
    .fontSize(11)
    .fillColor("#374151")
    .text(
      `${boeking.beginDatumFormatted} - ${boeking.eindDatumFormatted}`,
      55,
      refY + 35
    );

  /* ADRES BLOKKEN */
  const yStart = 180;
  const lever = boeking.leverAdresDetails || {};
  const factuur = boeking.klant?.factuurAdres || {};

  doc.rect(40,yStart,250,90).stroke("#e2e8f0");

  doc.fontSize(12).fillColor("#0b3558")
    .text("Leveringsadres:",50,yStart+10);

  doc.fontSize(11).fillColor("#000")
    .text(lever.naam || "-",50,yStart+30)
    .text(`${lever.straat || "-"} ${lever.huisnummer || ""}`,50,yStart+45)
    .text(`${lever.postcode || "-"} ${lever.gemeente || ""}`,50,yStart+60);

  doc.rect(305,yStart,250,90).stroke("#e2e8f0");

  doc.fontSize(12).fillColor("#0b3558")
    .text("Factuuradres:",315,yStart+10);

  doc.fontSize(11).fillColor("#000")
    .text(boeking.klant?.naam || "-",315,yStart+30)
    .text(`${factuur.straat || "-"} ${factuur.huisnummer || ""}`,315,yStart+45)
    .text(`${factuur.postcode || "-"} ${factuur.gemeente || ""}`,315,yStart+60);

  /* TABEL */

  const tableTop = 300;

  doc.rect(40,tableTop,515,25).fill("#0284c7");

  doc.fillColor("#fff")
    .fontSize(11)
    .text("Type",50,tableTop+7)
    .text("Volgnummer",250, tableTop+7)
    .text("Aantal",350,tableTop+7,{width:60,align:"center"})
    .text("Transport",440,tableTop+7);

  const rowY = tableTop + 25;

  doc.fillColor("#000")
    .fontSize(11)
    .text(boeking.toestelType?.naam || "-",50,rowY+8)
    .text(boeking.toestel.Ref ,250,rowY+8)
    .text("1,00",350,rowY+8,{width:60,align:"center"})
    .text(boeking.type || "-",440,rowY+8);

  /* OPMERKING */

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

  /* FOOTER */

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