import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;

export async function createTextPDF(text) {
  const pdfDoc = await PDFDocument.create();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const maxLineWidth = PAGE_WIDTH - MARGIN * 2;
  const lines = wrapText(text, font, FONT_SIZE, maxLineWidth);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const line of lines) {
    if (y < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    page.drawText(line, {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font,
      color: rgb(0, 0, 0),
    });

    y -= LINE_HEIGHT;
  }

  const pdfBytes = await pdfDoc.save();

  return new Blob([pdfBytes], { type: "application/pdf" });
}

function wrapText(text, font, fontSize, maxWidth) {
  return text.split("\n").flatMap((paragraph) => {
    const lines = [];
    let line = "";

    const words = paragraph.split(/\s+/).filter(Boolean);

    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;

      if (font.widthOfTextAtSize(nextLine, fontSize) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = nextLine;
      }
    }

    lines.push(line);
    return lines;
  });
}
