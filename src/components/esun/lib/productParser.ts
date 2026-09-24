import type { B2BProduct } from '../../../context/AppContext';

export function parsePanelSpecs(product: any): { wp: number; voc: number } {
  let wp = product.solarSpecs?.wp || 550; // default
  let voc = product.solarSpecs?.voc || 50; // default

  // If we already have them from the new specific fields, skip regex
  if (product.solarSpecs?.wp && product.solarSpecs?.voc) {
    return { wp, voc };
  }

  const productName = product.name || product.description || '';

  // Try extracting Wp from name or description
  const wpMatch = productName.match(/(\d{3,4})W/i);
  if (!product.solarSpecs?.wp && wpMatch && wpMatch[1]) {
    wp = parseInt(wpMatch[1], 10);
  } else if (!product.solarSpecs?.wp) {
    // Try in specs
    if (product.specs) {
      for (const spec of product.specs) {
        const specWpMatch = spec.match(/Potencia.*?(\d{3,4})W/i);
        if (specWpMatch && specWpMatch[1]) {
          wp = parseInt(specWpMatch[1], 10);
          break;
        }
      }
    }
  }

  // Try extracting Voc from specs
  let foundVoc = !!product.solarSpecs?.voc;
  if (!foundVoc && product.specs) {
    for (const spec of product.specs) {
      const vocMatch = spec.match(/Voltaje.*?(\d{2,3}(?:\.\d+)?)\s*(?:V|Vcc|Voc)/i);
      if (vocMatch && vocMatch[1]) {
        voc = parseFloat(vocMatch[1]);
        foundVoc = true;
        break;
      }
    }
  }

  if (!foundVoc) {
    // Check description (productName)
    const vocMatch = productName.match(/Voltaje.*?(\d{2,3}(?:\.\d+)?)\s*(?:V|Vcc|Voc)/i);
    if (vocMatch && vocMatch[1]) {
      voc = parseFloat(vocMatch[1]);
      foundVoc = true;
    }
  }

  // Fallbacks based on wattage if voc not explicitly found
  if (!foundVoc) {
    if (wp >= 600) voc = 53;
    else if (wp >= 540) voc = 50;
    else if (wp >= 450) voc = 41;
    else voc = 38;
  }

  return { wp, voc };
}

export function parseInverterSpecs(product: any): { kw: number; maxVdc: number; isMicro: boolean } {
  let kw = product.solarSpecs?.kw || 5; // default
  let maxVdc = product.solarSpecs?.maxVdc || 600; // default
  let isMicro = product.category === 'Microinversores' || (product.description && product.description.toLowerCase().includes('micro'));

  // If we already have them, return early
  if (product.solarSpecs?.kw && product.solarSpecs?.maxVdc) {
    return { kw, maxVdc, isMicro };
  }

  const productName = product.name || product.description || '';

  // Try extracting kW from name or description
  if (!product.solarSpecs?.kw) {
    const kwMatch = productName.match(/(\d+(?:\.\d+)?)\s*kW/i);
    if (kwMatch && kwMatch[1]) {
      kw = parseFloat(kwMatch[1]);
    } else {
      // Extract W and convert to kW (e.g. HM-1500 -> 1.5kW, SUN-2000 -> 2kW)
      const wMatch = productName.match(/(\d{3,4})(?:W|-|G)/i);
      if (wMatch && wMatch[1]) {
        const parsedW = parseInt(wMatch[1], 10);
        if (parsedW >= 300) { // Safety check to avoid matching model numbers like 30
          kw = parsedW / 1000;
        }
      }
    }
  }

  // Determine Max Vdc based on type and kW
  if (!product.solarSpecs?.maxVdc) {
    if (isMicro) {
      maxVdc = 60; // Standard microinverter max input voltage
    } else {
      // String inverters
      if (kw >= 10) maxVdc = 1000;
      else if (kw >= 5) maxVdc = 600;
      else maxVdc = 500;
    }

    // Try to override maxVdc from specs if available
    if (product.specs) {
      for (const spec of product.specs) {
        const vdcMatch = spec.match(/Vdc\s*(?:max|máx)?.*?(\d{3,4})/i) || spec.match(/(\d{3,4})\s*Vdc/i);
        if (vdcMatch && vdcMatch[1]) {
          maxVdc = parseInt(vdcMatch[1], 10);
          break;
        }
      }
    } else {
      // Check description (productName)
      const vdcMatch = productName.match(/Vdc\s*(?:max|máx)?.*?(\d{3,4})/i) || productName.match(/max\s*(\d{3,4})\s*Vdc/i) || productName.match(/(\d{3,4})\s*Vdc/i);
      if (vdcMatch && vdcMatch[1]) {
        maxVdc = parseInt(vdcMatch[1], 10);
      }
    }
  }

  return { kw, maxVdc, isMicro };
}
