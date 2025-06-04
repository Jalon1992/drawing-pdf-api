// /api/merge.js
import { PDFDocument } from 'pdf-lib';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).send('Error parsing form data');
      return;
    }

    try {
      const pdfPath = files.pdfFile.filepath;
      const imgPath = files.imageFile.filepath;

      const existingPdfBytes = fs.readFileSync(pdfPath);
      const imgBytes = fs.readFileSync(imgPath);

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const image = await pdfDoc.embedPng(imgBytes);

      const imgDims = image.scale(0.5);
      const newPage = pdfDoc.addPage();
      const { width, height } = newPage.getSize();

      newPage.drawImage(image, {
        x: (width - imgDims.width) / 2,
        y: (height - imgDims.height) / 2,
        width: imgDims.width,
        height: imgDims.height,
      });

      const finalPdf = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
      res.end(Buffer.from(finalPdf));
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to generate PDF');
    }
  });
}
