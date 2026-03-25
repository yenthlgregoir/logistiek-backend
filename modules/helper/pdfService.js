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