import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from 'canvas';
import Tesseract from 'tesseract.js';

const NodeCanvasFactory = {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  },
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

async function testModes(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(2);
  
  const scale = 3.0; // High scale
  const viewport = page.getViewport({ scale });
  const { canvas, context } = NodeCanvasFactory.create(viewport.width, viewport.height);
  
  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvasFactory: NodeCanvasFactory
  }).promise;
  
  const buffer = canvas.toBuffer('image/png');
  
  const worker = await Tesseract.createWorker('spa');
  
  for (const psm of [3, 4, 6, 11]) {
    console.log(`\n\n=== PSM ${psm} ===`);
    const { data: { text } } = await worker.recognize(buffer, { tessedit_pageseg_mode: psm });
    
    // Check if it matches our new regex
    const regex = /(?:del\s+)?(\d{1,2}\s+[a-zA-Z]{3}\s+\d{2})\s+(?:al|a)\s+(\d{1,2}\s+[a-zA-Z]{3}\s+\d{2})\s+(\d{1,5})\s+\$?([\d,]+\.\d{2})/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
       console.log("MATCH:", match[0]);
    }
    
    console.log(text.substring(0, 500));
  }
  
  await worker.terminate();
}

testModes("C:\\Users\\mafre\\Esolenergias\\Esun\\cfe atenas 31.pdf").catch(console.error);
