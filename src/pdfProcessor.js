import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assets directory
const assetsDir = path.join(__dirname, '..', 'assets');
const defaultWatermarkPath = path.join(assetsDir, 'watermark.png');
const defaultEndingPdfPath = path.join(assetsDir, 'default-ending.pdf');

// Cache default assets in memory
let cachedDefaultWatermark = null;
let cachedDefaultEndingPdf = null;

function getDefaultWatermark() {
  if (!cachedDefaultWatermark && fs.existsSync(defaultWatermarkPath)) {
    cachedDefaultWatermark = fs.readFileSync(defaultWatermarkPath);
  }
  return cachedDefaultWatermark;
}

function getDefaultEndingPdf() {
  if (!cachedDefaultEndingPdf && fs.existsSync(defaultEndingPdfPath)) {
    cachedDefaultEndingPdf = fs.readFileSync(defaultEndingPdfPath);
  }
  return cachedDefaultEndingPdf;
}

/**
 * Process uploaded primary PDF:
 * 1. Add watermark to all primary pages (if enabled)
 * 2. Append ending PDF to the end (clean, without watermark)
 * 
 * @param {Buffer} inputPdfBuffer 
 * @param {Object} options 
 * @param {boolean} [options.watermarkEnabled=true]
 * @param {Buffer} [options.customWatermark=null]
 * @param {Buffer} [options.customEndingPdf=null]
 * @returns {Promise<Buffer>}
 */
export async function processPdfDocument(inputPdfBuffer, options = {}) {
  const {
    watermarkEnabled = true,
    customWatermark = null,
    customEndingPdf = null
  } = options;

  // 1. Load primary PDF
  const primaryDoc = await PDFDocument.load(inputPdfBuffer, { ignoreEncryption: true });

  // 2. Apply watermark to primary pages if enabled
  if (watermarkEnabled) {
    const watermarkBytes = customWatermark || getDefaultWatermark();
    if (watermarkBytes) {
      let embeddedWatermark = null;
      try {
        embeddedWatermark = await primaryDoc.embedPng(watermarkBytes);
      } catch (pngErr) {
        // Fallback in case custom watermark is JPEG
        try {
          embeddedWatermark = await primaryDoc.embedJpg(watermarkBytes);
        } catch (jpgErr) {
          console.error('Failed to embed watermark image:', jpgErr);
        }
      }

      if (embeddedWatermark) {
        const targetHeight = 55;
        const imgDims = embeddedWatermark.scale(targetHeight / embeddedWatermark.height);
        const pages = primaryDoc.getPages();

        for (const page of pages) {
          const { width } = page.getSize();
          const x = (width / 2) - (imgDims.width / 2);
          const y = 5;

          page.drawImage(embeddedWatermark, {
            x,
            y,
            width: imgDims.width,
            height: imgDims.height,
            opacity: 1
          });
        }
      }
    }
  }

  // 3. Append ending PDF pages
  const endingBytes = customEndingPdf || getDefaultEndingPdf();
  if (endingBytes) {
    try {
      const endingDoc = await PDFDocument.load(endingBytes, { ignoreEncryption: true });
      const endingPages = await primaryDoc.copyPages(endingDoc, endingDoc.getPageIndices());
      for (const page of endingPages) {
        primaryDoc.addPage(page);
      }
    } catch (endingErr) {
      console.error('Failed to append ending PDF:', endingErr);
    }
  }

  // 4. Save and return output buffer
  const outputBytes = await primaryDoc.save();
  return Buffer.from(outputBytes);
}
