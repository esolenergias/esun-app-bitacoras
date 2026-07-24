import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../context/supabase';
import { Search, FileText, Download, Loader2, User, Building2, Upload, Sparkles } from 'lucide-react';
import { getPresupuestos, getPresupuestoDetails, calculateBudgetTotals } from '../../lib/cotizadorService';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ContratosPanelesTabProps {
  initialBudgetId?: string | null;
}

const formatCurrency = (val: number) => {
  if (isNaN(val)) return '$0.00';
  let parts = val.toFixed(2).split('.');
  let integerPart = parts[0];
  let decimalPart = parts[1];
  
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let splitted = integerPart.split(',');
  if (splitted.length > 2) {
    let result = '';
    for (let i = 0; i < splitted.length; i++) {
      result += splitted[i];
      if (i < splitted.length - 1) {
        if (i === splitted.length - 3) result += "'";
        else result += ",";
      }
    }
    integerPart = result;
  }
  
  return '$' + integerPart + '.' + decimalPart;
};

const numeroALetras = (num: number): string => {
  function Unidades(n: number) {
    switch (n) {
      case 1: return 'UN';
      case 2: return 'DOS';
      case 3: return 'TRES';
      case 4: return 'CUATRO';
      case 5: return 'CINCO';
      case 6: return 'SEIS';
      case 7: return 'SIETE';
      case 8: return 'OCHO';
      case 9: return 'NUEVE';
      default: return '';
    }
  }
  function Decenas(n: number) {
    let decena = Math.floor(n / 10);
    let unidad = n - (decena * 10);
    switch (decena) {
      case 1:
        switch (unidad) {
          case 0: return 'DIEZ';
          case 1: return 'ONCE';
          case 2: return 'DOCE';
          case 3: return 'TRECE';
          case 4: return 'CATORCE';
          case 5: return 'QUINCE';
          default: return 'DIECI' + Unidades(unidad);
        }
      case 2:
        switch (unidad) {
          case 0: return 'VEINTE';
          default: return 'VEINTI' + Unidades(unidad);
        }
      case 3: return DecenasY('TREINTA', unidad);
      case 4: return DecenasY('CUARENTA', unidad);
      case 5: return DecenasY('CINCUENTA', unidad);
      case 6: return DecenasY('SESENTA', unidad);
      case 7: return DecenasY('SETENTA', unidad);
      case 8: return DecenasY('OCHENTA', unidad);
      case 9: return DecenasY('NOVENTA', unidad);
      case 0: return Unidades(unidad);
      default: return '';
    }
  }
  function DecenasY(strSin: string, numUnidades: number) {
    if (numUnidades > 0) return strSin + ' Y ' + Unidades(numUnidades);
    return strSin;
  }
  function Centenas(n: number) {
    let centenas = Math.floor(n / 100);
    let decenas = n - (centenas * 100);
    switch (centenas) {
      case 1:
        if (decenas > 0) return 'CIENTO ' + Decenas(decenas);
        return 'CIEN';
      case 2: return 'DOSCIENTOS ' + Decenas(decenas);
      case 3: return 'TRESCIENTOS ' + Decenas(decenas);
      case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
      case 5: return 'QUINIENTOS ' + Decenas(decenas);
      case 6: return 'SEISCIENTOS ' + Decenas(decenas);
      case 7: return 'SETECIENTOS ' + Decenas(decenas);
      case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
      case 9: return 'NOVECIENTOS ' + Decenas(decenas);
      default: return Decenas(decenas);
    }
  }
  function Seccion(n: number, divisor: number, strSingular: string, strPlural: string) {
    let cientos = Math.floor(n / divisor);
    let resto = n - (cientos * divisor);
    let letras = '';
    if (cientos > 0)
      if (cientos > 1) letras = Centenas(cientos) + ' ' + strPlural;
      else letras = strSingular;
    if (resto > 0) letras += '';
    return letras;
  }
  function Miles(n: number) {
    let divisor = 1000;
    let cientos = Math.floor(n / divisor);
    let resto = n - (cientos * divisor);
    let strMiles = Seccion(n, divisor, 'UN MIL', 'MIL');
    let strCentenas = Centenas(resto);
    if (strMiles == '') return strCentenas;
    return strMiles + (strCentenas ? ' ' + strCentenas : '');
  }
  function Millones(n: number) {
    let divisor = 1000000;
    let cientos = Math.floor(n / divisor);
    let resto = n - (cientos * divisor);
    let strMillones = Seccion(n, divisor, 'UN MILLON', 'MILLONES');
    let strMiles = Miles(resto);
    if (strMillones == '') return strMiles;
    return strMillones + (strMiles ? ' ' + strMiles : '');
  }

  let entero = Math.floor(num);
  let centavos = Math.round((num - entero) * 100);
  let letrasCentavos = (centavos < 10 ? '0' + centavos : centavos) + '/100 M.N.';

  if (entero === 0) return 'CERO PESOS ' + letrasCentavos;
  if (entero === 1) return Millones(entero) + ' PESO ' + letrasCentavos;
  return Millones(entero) + ' PESOS ' + letrasCentavos;
};

const FormattedCurrencyInput = ({ value, onChange, readOnly, className }: { value: number, onChange?: (val: number) => void, readOnly?: boolean, className?: string }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localStr, setLocalStr] = useState(value.toFixed(2));
  
  useEffect(() => {
    if (!isFocused) setLocalStr(value.toFixed(2));
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalStr(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && onChange) {
      onChange(parsed);
    } else if (e.target.value === '' && onChange) {
      onChange(0);
    }
  };

  return (
    <input
      type={isFocused && !readOnly ? "number" : "text"}
      value={isFocused && !readOnly ? localStr : formatCurrency(value)}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        if (onChange) {
            const parsed = parseFloat(localStr);
            if (!isNaN(parsed)) onChange(parsed);
        }
      }}
      readOnly={readOnly}
      className={className}
    />
  );
};

export default function ContratosPanelesTab({ initialBudgetId }: ContratosPanelesTabProps) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>(initialBudgetId || '');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const getTodayDateString = () => {
    const d = new Date();
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  };

  // Form Data
  const [formData, setFormData] = useState({
    fechaEmision: getTodayDateString(),
    tipoPersona: 'fisica',
    clienteRazonSocial: '',
    representanteLegal: '',
    rfc: '',
    curp: '',
    cic: '',
    ocr: '',
    clienteDireccion: '',
    descripcionEquipos: '',
    adicionales: '',
    montoTotal: 0,
    porcentajeAnticipo: 70,
    porcentajeAnticipoStr: "70",
    montoAnticipo: 0,
    montoRestante: 0,
    pagosDiferidosActivos: false,
    numeroPagosDiferidos: 3,
    // Datos de la Empresa
    empresaRazonSocial: 'SOLUCIONES INTEGRALES DE NAYARIT, S. DE R.L. DE C.V.',
    empresaRepresentante: 'MANUEL DE JESUS FREGOSO SAMANIEGA',
    empresaRFC: 'SIN190211IC4',
    empresaDomicilio: 'Av. Insurgentes 56-A, Interior A, Colonia Centro, C.P. 63000, Tepic, Nayarit.',
    empresaEscritura: '333',
    empresaNotario: 'Dr. José Trinidad Espinoza Vargas, Notario Titular de la Notaría Pública Número 37 de Tepic, Nayarit.',
    empresaBanco: 'BBVA Bancomer',
    empresaCuenta: '0113456789',
    empresaClabe: '012560001134567895'
  });

  const pctAnticipo = formData.porcentajeAnticipo.toFixed(1);
  const pagoDiferidoAmount = formData.numeroPagosDiferidos > 0 ? (formData.montoRestante / formData.numeroPagosDiferidos) : 0;

  const getFechaPago = (monthsToAdd: number) => {
    const parts = formData.fechaEmision.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      date.setMonth(date.getMonth() + monthsToAdd);
      return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return '';
  };

  const contractRef = useRef<HTMLDivElement>(null);

  // Fetch available budgets
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const data = await getPresupuestos();
        setBudgets(data);
        if (initialBudgetId) {
          handleBudgetSelection(initialBudgetId, data);
        }
      } catch (error) {
        console.error("Error fetching budgets:", error);
      }
    };
    fetchBudgets();
  }, [initialBudgetId]);

  const handleBudgetSelection = async (id: string, budgetList = budgets) => {
    setSelectedBudget(id);
    const budget = budgetList.find(b => b.id === id);
    if (!budget) return;

    try {
      const details = await getPresupuestoDetails(id);
      const totals = calculateBudgetTotals(details.conceptos, details.indirect_percentage, details.utility_percentage);
      
      const totalConIva = totals.sellingPriceTotal * 1.16;
      const anticipo = totalConIva * (formData.porcentajeAnticipo / 100); 
      const restante = totalConIva - anticipo;

      const validConceptos = details.conceptos.filter((c: any) => 
        !c.parent_id &&
        !c.description?.toLowerCase().includes('comisión') &&
        !c.description?.toLowerCase().includes('comision')
      );

      const paneles: any[] = [];
      const inversores: any[] = [];
      const estructuras: any[] = [];
      const otros: any[] = [];

      validConceptos.forEach((c: any) => {
        const desc = c.description?.toLowerCase() || '';
        
        // Force service/labor/materials into 'otros' so they don't get matched as equipment
        // CRITICAL: We do NOT use 'instalación' here because panels/inverters often say "Suministro e instalación de..."
        if (
          desc.includes('mano de obra') || 
          desc.includes('mano de de obra') || 
          desc.includes('servicio') || 
          desc.includes('tramitologia') || 
          desc.includes('flete') || 
          desc.includes('envío') || 
          desc.includes('envio') || 
          desc.includes('viáticos') || 
          desc.includes('viaticos') ||
          desc.includes('material') ||
          desc.includes('inspección') ||
          desc.includes('inspeccion') ||
          desc.includes('verificación') ||
          desc.includes('verificacion')
        ) {
          otros.push(c);
        } else if (desc.includes('panel') || desc.includes('módulo') || desc.includes('modulo')) {
          paneles.push(c);
        } else if (desc.includes('inversor') || desc.includes('inverter') || desc.includes('microinversor') || desc.includes('growat')) {
          inversores.push(c);
        } else if (desc.includes('estructura') || desc.includes('estructrura')) {
          estructuras.push(c);
        } else {
          otros.push(c);
        }
      });

      let desc = "SISTEMA DE GENERACIÓN DE ENERGÍA FOTOVOLTAICA QUE INCLUYE:\n";
      if (paneles.length > 0) {
        paneles.forEach((p: any) => desc += `- ${p.quantity} x ${p.description}\n`);
      }
      if (inversores.length > 0) {
        inversores.forEach((i: any) => desc += `- ${i.quantity} x ${i.description}\n`);
      }
      if (estructuras.length > 0) {
        estructuras.forEach((e: any) => desc += `- ${e.description}\n`);
      }

      let adds = "";
      if (otros.length > 0) {
        adds = "MATERIALES ADICIONALES:\n";
        otros.forEach((o: any) => adds += `- ${o.description}\n`);
      }

      setFormData(prev => ({
        ...prev,
        clienteRazonSocial: budget.client_name || '',
        clienteDireccion: '',
        descripcionEquipos: desc.trim(),
        adicionales: adds.trim(),
        montoTotal: totalConIva,
        porcentajeAnticipo: prev.porcentajeAnticipo,
        porcentajeAnticipoStr: prev.porcentajeAnticipo.toString(),
        montoAnticipo: anticipo,
        montoRestante: restante,
      }));
    } catch (error) {
      console.error("Error fetching budget details:", error);
    }
  };

  const updateAnticipoPorcentaje = (pct: number, strVal?: string) => {
    const validPct = isNaN(pct) ? 0 : pct;
    const val = Math.max(0, Math.min(100, validPct));
    const ant = formData.montoTotal * (val / 100);
    const rest = formData.montoTotal - ant;
    setFormData(prev => ({ 
      ...prev, 
      porcentajeAnticipo: val, 
      porcentajeAnticipoStr: strVal !== undefined ? strVal : val.toString(),
      montoAnticipo: ant, 
      montoRestante: rest 
    }));
  };

  const updateAnticipoMonto = (monto: number) => {
    const val = Math.max(0, Math.min(formData.montoTotal, monto));
    const pct = formData.montoTotal > 0 ? (val / formData.montoTotal) * 100 : 0;
    const rest = formData.montoTotal - val;
    setFormData(prev => ({ 
      ...prev, 
      montoAnticipo: val, 
      porcentajeAnticipo: pct, 
      porcentajeAnticipoStr: pct.toFixed(1),
      montoRestante: rest 
    }));
  };

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    const webhookUrl = localStorage.getItem('esol_make_webhook_url') || '';

    const parseFecha = (dateString: string) => {
      if (!dateString) return '----';
      const [y, m, d] = dateString.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
      return dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const fechaHoy = parseFecha(formData.fechaEmision);
    const cliente = formData.clienteRazonSocial || '----';
    const direccion = formData.clienteDireccion || '----';
    const repLegal = formData.representanteLegal || '----';
    const rfc = formData.rfc || '----';
    const curp = formData.curp || '----';
    const cic = formData.cic || '----';
    const ocr = formData.ocr || '----';
    const empRazonSocial = formData.empresaRazonSocial || '----';
    const empRepresentante = formData.empresaRepresentante || '----';
    const empDomicilio = formData.empresaDomicilio || '----';
    const empRFC = formData.empresaRFC || '----';
    const empEscritura = formData.empresaEscritura || '----';
    const empNotario = formData.empresaNotario || '----';
    const empBanco = formData.empresaBanco || '----';
    const empCuenta = formData.empresaCuenta || '----';
    const empClabe = formData.empresaClabe || '----';

    const isEmpresa = formData.tipoPersona === 'moral';
    
    const proemioCliente = isEmpresa 
      ? `<strong>${cliente}</strong>, representada en este acto por su apoderado o representante legal el(la) C. <strong>${repLegal}</strong>`
      : `<strong>${cliente}</strong>`;

    const declaracionCapacidad = isEmpresa
      ? `Que es una persona moral legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos, y que su representante legal cuenta con las facultades necesarias y suficientes para obligarla en los términos de este instrumento, las cuales no le han sido revocadas ni limitadas en forma alguna.`
      : `Que es una persona física, mayor de edad, y que cuenta con la capacidad legal y jurídica suficiente para obligarse en los términos del presente contrato.`;

    const firmaCliente = isEmpresa
      ? `<strong>${cliente}</strong><br/><span style="font-size: 11px; font-weight: normal;">Representada por: ${repLegal}</span>`
      : `<strong>${cliente}</strong>`;

    const logoUrl = window.location.origin + '/Logo_esol_b.png';

    const montoTotal = formatCurrency(formData.montoTotal);
    const montoAnticipo = formatCurrency(formData.montoAnticipo);
    const montoRestante = formatCurrency(formData.montoRestante);

    const descEquiposHTML = (formData.descripcionEquipos || '').replace(/\n/g, '<br/>');
    const adicionalesHTML = (formData.adicionales || '').replace(/\n/g, '<br/>');

    let pagaresHTML = '';
    if (formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0) {
      for (let i = 0; i < formData.numeroPagosDiferidos; i++) {
        const fechaPagoStr = getFechaPago(i + 1);
        pagaresHTML += `
          <div class="letter-sheet page-break" style="padding: 20mm; position: relative;">
            <div style="position: absolute; top: 15mm; bottom: 15mm; left: 15mm; right: 15mm; border: 2px solid #1e293b; border-radius: 8px; padding: 30px;">
              
              <table style="width: 100%; margin-bottom: 25px; border-bottom: 2px solid #1e293b; padding-bottom: 15px; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top; text-align: left;">
                    <h2 style="margin: 0; font-family: 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #1e293b; letter-spacing: 2px;">PAGARÉ</h2>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #475569; font-weight: bold;">NÚMERO: ${i + 1} DE ${formData.numeroPagosDiferidos}</p>
                  </td>
                  <td style="vertical-align: top; text-align: right; width: 50%;">
                    <div style="border: 2px solid #94a3b8; padding: 10px 15px; text-align: left; float: right; min-width: 160px; background-color: #f8fafc;">
                      <div style="font-size: 11px; color: #475569; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">Bueno por:</div>
                      <div style="font-size: 18px; font-weight: bold; color: #000;">${formatCurrency(pagoDiferidoAmount)} MXN</div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="text-align: right; margin-bottom: 25px; font-size: 12px;">
                <strong>Lugar y fecha de expedición:</strong> Tepic, Nayarit, a ${fechaHoy}.
              </p>

              <p style="text-align: justify; margin-bottom: 25px; line-height: 2; font-size: 12px; font-weight: normal; color: #000;">
                Por este pagaré me obligo incondicionalmente a pagar a la orden de <strong>${empRazonSocial}</strong>, en su domicilio ubicado en ${empDomicilio}, o en cualquier otro que se me indique por escrito, la cantidad de <strong>${formatCurrency(pagoDiferidoAmount)} MXN (${numeroALetras(pagoDiferidoAmount)})</strong>.
              </p>

              <p style="text-align: justify; margin-bottom: 25px; line-height: 2; font-size: 12px; font-weight: normal; color: #000;">
                La suma anterior ampara el valor recibido a mi entera satisfacción. El pago de este documento deberá efectuarse puntualmente el día <strong>${fechaPagoStr}</strong>.
              </p>

              <p style="text-align: justify; margin-bottom: 25px; line-height: 1.8; font-size: 11px; color: #334155;">
                Si el pago no fuere cubierto a su vencimiento, causará intereses moratorios a razón del <strong>5% (cinco por ciento) mensual</strong>, generados desde la fecha de vencimiento y hasta su total liquidación, conjuntamente con el principal.
              </p>

              <p style="text-align: justify; margin-bottom: 30px; line-height: 1.8; font-size: 11px; color: #334155;">
                El presente Pagaré es mercantil y está regido por la Ley General de Títulos y Operaciones de Crédito en sus artículos 170, 171, 172, 173 y 174, por no ser pagaré domiciliado y demás artículos correlativos. El suscriptor renuncia al fuero de su domicilio y se somete expresamente a la jurisdicción de los tribunales competentes en Tepic, Nayarit.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 4px; font-size: 11px; line-height: 1.6; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0;"><strong>DATOS DEL SUSCRIPTOR (DEUDOR):</strong></p>
                <p style="margin: 0;"><strong>Nombre:</strong> ${cliente}</p>
                <p style="margin: 0;"><strong>Domicilio:</strong> ${direccion}</p>
                ${isEmpresa ? `<p style="margin: 0;"><strong>Representante Legal:</strong> ${repLegal}</p>` : ''}
              </div>

              <div style="position: absolute; bottom: 30px; left: 0; right: 0; text-align: center;">
                <p style="margin: 0 0 45px 0; font-size: 11px; color: #475569; font-weight: bold;">ACEPTO(AMOS) Y ME(NOS) OBLIGO(AMOS) A SU PAGO A LA FECHA DE VENCIMIENTO</p>
                <div style="border-top: 1px solid #000; width: 300px; margin: 0 auto 8px auto;"></div>
                <p style="font-weight: bold; margin: 0; font-size: 12px; text-transform: uppercase;">FIRMA DEL SUSCRIPTOR</p>
                <p style="font-size: 11px; margin-top: 4px; color: #475569;">${firmaCliente}</p>
              </div>

            </div>
          </div>
        `;
      }
    }

    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contrato - ${cliente}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: #525659; font-family: Arial, Helvetica, sans-serif; }
    .no-print-bar { position: fixed; top: 0; left: 0; right: 0; height: 50px; background: #1e293b; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 99999; color: #fff; font-family: sans-serif; }
    .btn { background: #c49825; color: #000; font-weight: bold; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px; font-size: 13px; }
    .btn:hover { background: #eab308; }
    
    .letter-sheet {
      width: 215.9mm;
      height: 279.4mm;
      margin: 25px auto;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      padding: 15mm 20mm 15mm 20mm;
      box-sizing: border-box;
      color: #000000;
      font-size: 12px;
      line-height: 1.5;
      position: relative;
      overflow: hidden;
    }
      padding: 15mm 20mm 15mm 20mm;
      box-sizing: border-box;
      color: #000000;
      font-size: 12px;
      line-height: 1.5;
      position: relative;
    }
    
    .page-break { page-break-before: always; break-before: page; }

    @media print {
      .no-print-bar { display: none !important; }
      body { background: #ffffff; }
      .letter-sheet {
        width: 100% !important;
        margin: 0 !important;
        box-shadow: none !important;
        padding: 15mm 20mm !important;
        page-break-after: always;
        break-after: page;
      }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>VISTA PREVIA DE CONTRATO (FORMATO CARTA - MÁRGENES 2 CM)</strong> - ${cliente}</div>
    <div>
      <button class="btn" onclick="descargarDirecto()">💾 Descargar PDF</button>
    </div>
  </div>
  
  <div style="height: 60px;"></div>

  <div id="contract-doc-wrapper">
    <!-- SHEET 1: Contrato (Declaraciones y Cláusulas 1 y 2) -->
    <div class="letter-sheet">
      <h2 style="text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 20px; text-transform: uppercase;">CONTRATO DE PRESTACIÓN DE SERVICIOS</h2>
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;">
        Contrato de prestación de servicios que celebran por una parte <strong>${empRazonSocial}</strong>, representada legalmente por ${empRepresentante}, a quien en lo sucesivo se le denominará EL PRESTADOR, y por otra parte ${proemioCliente}, a quien en lo sucesivo se le denominará EL CLIENTE, al tenor de las siguientes Declaraciones y Cláusulas:
      </p>
      
      <h3 style="text-align: center; font-weight: bold; font-size: 13px; margin-top: 20px; margin-bottom: 15px; text-transform: uppercase;">DECLARACIONES</h3>
      <p style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">PRIMERA. EL PRESTADOR declara:</p>
      <ul style="padding-left: 25px; margin-bottom: 15px; text-align: justify; font-size: 12px; line-height: 1.6;">
        <li style="margin-bottom: 4px;">Que su denominación social es ${empRazonSocial}</li>
        <li style="margin-bottom: 4px;">Que el(la) C. ${empRepresentante} acredita su representación legal por medio de la Escritura Pública Número ${empEscritura}, expedida por el ${empNotario}.</li>
        <li style="margin-bottom: 4px;">Que tiene su domicilio en ${empDomicilio}</li>
        <li style="margin-bottom: 4px;">Que cuenta con Registro Federal de Contribuyentes de clave ${empRFC} y que se encuentra al corriente en el cumplimiento de sus obligaciones fiscales.</li>
        <li style="margin-bottom: 4px;">Que es titular y/o licenciatario autorizado de la Marca Energy Solares ®.</li>
        <li style="margin-bottom: 4px;">Que cuenta con los recursos humanos, materiales, equipo técnico y personal especializado en la instalación de sistemas generadores de energía fotovoltaicos en residencia, comercio e industria, contando con las certificaciones expedidas por la Asociación de Normalización y Certificación, A.C. y CENCER Energía Renovable, S.A. DE C.V. para ejercer el servicio contratado.</li>
        <li style="margin-bottom: 4px;">Que los datos bancarios y de pago contenidos en el “Anexo 1. DATOS GENERALES” son verdaderos y vigentes.</li>
      </ul>

      <p style="font-weight: bold; margin-top: 15px; margin-bottom: 8px; font-size: 12px;">SEGUNDA. EL CLIENTE declara:</p>
      <ul style="padding-left: 25px; margin-bottom: 15px; text-align: justify; font-size: 12px; line-height: 1.6;">
        <li style="margin-bottom: 4px;">Que sus datos contenidos en el “Anexo 1. DATOS GENERALES” son verdaderos.</li>
        <li style="margin-bottom: 4px;">${declaracionCapacidad} Así mismo, declara que ostenta la legal posesión o propiedad del inmueble donde se ejecutará la instalación: <strong>${direccion}</strong>.</li>
        <li style="margin-bottom: 4px;">Que es el titular registrado del contrato del suministro eléctrico ante la Comisión Federal de Electricidad (CFE) correspondiente al recibo de luz del inmueble. En caso de ser un tercero, declara contar con la autorización legal del titular.</li>
        <li style="margin-bottom: 4px;">Que es su interés contratar los servicios especializados de EL PRESTADOR, teniendo pleno conocimiento de los beneficios, alcances, responsabilidades y especificaciones técnicas correspondientes.</li>
      </ul>

      <p style="font-weight: bold; margin-top: 15px; margin-bottom: 8px; font-size: 12px;">TERCERA. Declaran LAS PARTES en conjunto:</p>
      <ul style="padding-left: 25px; margin-bottom: 20px; text-align: justify; font-size: 12px; line-height: 1.6;">
        <li style="margin-bottom: 4px;">Que los datos contenidos en el “Anexo 1. DATOS GENERALES” son verdaderos.</li>
        <li style="margin-bottom: 4px;">Que cuentan con la capacidad y medios suficientes para cumplir y celebrar el presente documento.</li>
        <li style="margin-bottom: 4px;">Que en el presente contrato no media dolo, error, mala fe, coacción ni cualquier vicio en el consentimiento.</li>
        <li style="margin-bottom: 4px;">Que reconocen expresamente la validez plena de la firma del presente contrato y sus Anexos mediante firmas autógrafas o medios electrónicos, de conformidad con la legislación aplicable.</li>
      </ul>

    </div>

    <!-- SHEET 2: Cláusulas 1 a 3 -->
    <div class="letter-sheet page-break">
      <h3 style="text-align: center; font-weight: bold; font-size: 13px; margin-top: 10px; margin-bottom: 15px; text-transform: uppercase;">CLÁUSULAS</h3>
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>PRIMERA. OBJETO.</strong> EL PRESTADOR se obliga a prestar los servicios especializados de suministro e instalación de sistema de generación de energía fotovoltaica que se describen en el “Anexo 2. Descripción del Servicio, Alcance Técnico y Forma de Pago” a favor de EL CLIENTE. En el cumplimiento de esta cláusula EL PRESTADOR actuará de manera diligente, profesional y de buena fe.</p>
      
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>SEGUNDA. VALOR DE LA TRANSACCIÓN Y ESTRUCTURA DE PAGOS.</strong> LAS PARTES acuerdan que el valor total de la operación es la cantidad estipulada en el ANEXO 2, la cual asciende a <strong>${montoTotal} MXN</strong> (Incluye IVA). Los pagos se realizarán vía transferencia bancaria, cheque o efectivo a las cuentas señaladas por EL PRESTADOR.<br/><br/>
      La estructura de pagos se establece en porcentajes exactos sobre el valor total de la transacción:<br/>
      - <strong>Anticipo (${pctAnticipo}%):</strong> Equivalente a la cantidad de <strong>${montoAnticipo} MXN</strong>, pagaderos a la firma del presente contrato para el suministro de materiales y programación de obra.<br/>
      - <strong>Saldo Final / Restante:</strong> Equivalente a la cantidad de <strong>${montoRestante} MXN</strong>. ${formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0 ? `Este saldo será liquidado en ${formData.numeroPagosDiferidos} pagos diferidos mensuales por la cantidad de ${formatCurrency(pagoDiferidoAmount)} MXN cada uno, obligados mediante pagarés anexos.` : `El cual deberá ser liquidado por EL CLIENTE dentro de un plazo máximo de 5 (cinco) días hábiles posteriores a la conclusión de la instalación física y la firma del Acta de Entrega - Recepción (Anexo 4).`}<br/><br/>
      ${(!formData.pagosDiferidosActivos || formData.numeroPagosDiferidos === 0) ? "La firma del Acta de Entrega - Recepción constituye la aceptación formal de la obra física y obliga legalmente a EL CLIENTE a realizar el pago del saldo final dentro del plazo establecido. La mora en el pago generará un interés moratorio del 5% mensual sobre el saldo insoluto." : ""}
      </p>

      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;">En caso de mora o incumplimiento de pago por parte de EL CLIENTE transcurrido el plazo acordado, EL PRESTADOR notificará por escrito o vía electrónica a EL CLIENTE requiriendo el pago. De persistir el incumplimiento por más de 5 días adicionales, EL PRESTADOR quedará facultado para suspender servicios, revocar la garantía y/o rescindir el contrato, iniciando las acciones legales o de recuperación correspondientes conforme a derecho.</p>

      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>SEGUNDA BIS. BLINDAJE SOBRE ADEUDOS Y SITUACIÓN CON CFE.</strong> EL CLIENTE declara expresamente bajo protesta de decir verdad que no cuenta con adeudos, irregularidades, sanciones o reportes pendientes ante la CFE. Si CFE bloquea o rechaza el trámite de interconexión por adeudos o irregularidades previas del CLIENTE, será responsabilidad exclusiva de EL CLIENTE resolverlo y pagarlo en un plazo máximo de 30 días naturales. Si EL CLIENTE no resuelve dicha situación, el contrato se dará por rescindido aplicando la pena convencional del 40% del anticipo por gastos operativos.</p>
      
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>TERCERA. ALCANCE TÉCNICO, UBICACIÓN Y TRABAJOS EXTRAORDINARIOS.</strong> EL CLIENTE firmará la aceptación técnica del área asignada. Cualquier cambio posterior de ubicación que implique modificar estructura o tubería generará costos adicionales.<br/>
      <em>Adecuaciones Estructurales Imprevistas:</em> Si el personal detecta vicios ocultos o deterioro en la losa o impermeabilización, las reparaciones requeridas deberán ser autorizadas y costeadas por EL CLIENTE antes de continuar la obra.<br/>
      <em>Facultad Técnica:</em> El criterio técnico del instalador prevalecerá en todo momento por encima de sugerencias estéticas de EL CLIENTE que pongan en riesgo el rendimiento o la seguridad del sistema.</p>

      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>TERCERA BIS. TIEMPOS Y TRÁMITES ANTE CFE.</strong> La responsabilidad de EL PRESTADOR concluye formalmente al ingresar la solicitud y expediente técnico completo ante CFE. Los tiempos de revisión, aprobación e instalación del medidor bidireccional dependen al 100% de los procesos de CFE, eximiendo a EL PRESTADOR de cualquier responsabilidad por demoras.</p>
    </div>

    <!-- SHEET 3: Cláusulas restantes, Jurisdicción, Fecha y Firmas -->
    <div class="letter-sheet page-break">
      
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>CUARTA. GARANTÍAS Y REESTRUCTURACIÓN DE MANTENIMIENTOS.</strong> Las garantías del proyecto se regulan bajo los siguientes términos:<br/>
      <em>Garantía de Equipos:</em> Es otorgada directamente por el fabricante de los equipos bajo sus propias políticas. EL PRESTADOR fungirá como gestor autorizado sin costo directo para EL CLIENTE.<br/>
      <em>Garantía de Instalación:</em> EL PRESTADOR otorga una garantía de 3 (tres) años sobre la calidad de la mano de obra, sujeción y materiales eléctricos.<br/>
      <em>Mantenimientos Preventivos:</em> EL CLIENTE reconoce que la garantía de instalación y el rendimiento óptimo están condicionados a la realización de mantenimientos preventivos anuales. Dichos mantenimientos no son gratuitos; deberán contratarse independientemente con EL PRESTADOR.</p>
      
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>QUINTA. CONECTIVIDAD E INFRAESTRUCTURA DE INTERNET.</strong> El servicio de monitoreo remoto depende enteramente de la infraestructura de red Wi-Fi de EL CLIENTE. Si EL CLIENTE cambia de proveedor, contraseña, o presenta interrupciones, la pérdida del monitoreo no será responsabilidad de EL PRESTADOR.</p>

      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>SEXTA. CANCELACIONES Y REEMBOLSOS.</strong> Si EL CLIENTE rescinde el contrato antes de la adquisición de insumos, EL PRESTADOR retendrá el 40% del anticipo. Una vez adquiridos los materiales o iniciados los trabajos, no habrá reembolso alguno.</p>
      
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>SÉPTIMA. RESCISIÓN.</strong> Cualquiera de las partes podrá rescindir el contrato mediante aviso por escrito con 10 días naturales de anticipación ante incumplimiento grave. EL PRESTADOR podrá rescindir de inmediato por falta de pago del anticipo o por la negativa injustificada del acceso al inmueble.</p>
      
      <p style="text-align: justify; margin-bottom: 15px; font-size: 12px; line-height: 1.6;"><strong>OCTAVA. CONCLUSIÓN DEL CONTRATO.</strong> La prestación del servicio se tendrá por formalmente concluida a la firma del Acta de Entrega - Recepción (Anexo 4).</p>
      
      <p style="text-align: justify; margin-bottom: 20px; font-size: 12px; line-height: 1.6;"><strong>NOVENA. LEGISLACIÓN, JURISDICCIÓN Y FIRMA.</strong> Para la interpretación y cumplimiento de este contrato, las partes se someten a la legislación del Estado de Nayarit y a la jurisdicción de los Tribunales de la ciudad de Tepic, Nayarit.</p>

      <p style="text-align: justify; margin-bottom: 30px; font-size: 12px; line-height: 1.6;">Leído el presente contrato y enteradas las partes de su alcance legal, se firma en dos tantos el día <strong>${fechaHoy}</strong>.</p>
      
      <div style="position: absolute; bottom: 80px; left: 0; width: 100%; display: flex; justify-content: space-evenly; box-sizing: border-box;">
        <div style="text-align: center; width: 35%;">
          <div style="border-top: 1px solid #000; width: 100%; margin-bottom: 8px;"></div>
          <p style="font-weight: bold; margin: 0; font-size: 12px;">EL PRESTADOR</p>
          <p style="font-size: 11px; margin-top: 2px;">${empRepresentante}</p>
        </div>
        <div style="text-align: center; width: 35%;">
          <div style="border-top: 1px solid #000; width: 100%; margin-bottom: 8px;"></div>
          <p style="font-weight: bold; margin: 0; font-size: 12px;">EL CLIENTE</p>
          <p style="font-size: 11px; margin-top: 2px;">${firmaCliente}</p>
        </div>
      </div>
    </div>

    <!-- SHEET 3: ANEXO 1. DATOS GENERALES Y ESPECIFICACIONES DEL SITIO (HOJA INDEPENDIENTE) -->
    <div class="letter-sheet page-break">
      <h3 style="font-weight: bold; font-size: 15px; margin-top: 10px; margin-bottom: 20px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 6px; text-align: center;">ANEXO 1. DATOS GENERALES Y ESPECIFICACIONES DEL SITIO</h3>
      
      <div style="margin-bottom: 20px; background-color: #f8fafc; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">I. Información General del Suscriptor y Sitio</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.8;">
          <tr>
            <td style="width: 35%; font-weight: bold; color: #334155;">Nombre o Denominación Social:</td>
            <td>${cliente}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">Representante Legal:</td>
            <td>${repLegal}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">RFC:</td>
            <td>${rfc}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">CURP:</td>
            <td>${curp}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">No. Identificación (CIC):</td>
            <td>${cic}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">No. Identificador (OCR):</td>
            <td>${ocr}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">Domicilio de Instalación:</td>
            <td>${direccion}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">Fecha de Contratación:</td>
            <td>${fechaHoy}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">Municipio y Estado:</td>
            <td>Tepic, Nayarit, México</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px; background-color: #f8fafc; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">II. Datos del Servicio ante CFE</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.8;">
          <tr>
            <td style="width: 35%; font-weight: bold; color: #334155;">Titular del Contrato CFE:</td>
            <td>${cliente} (o representante legal)</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">Esquema de Tarifas CFE:</td>
            <td>PDBT / GDBT / Tarifa Residencial u Operativa</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">Tipo de Conexión Eléctrica:</td>
            <td>Bifásica 220V / Trifásica 220V / Monofásica 120V</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #334155;">Estado de Cuenta CFE:</td>
            <td>Declarado Sin Adeudos Ni Penalizaciones Pendientes</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px; background-color: #f8fafc; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">III. Identificación Oficial / Constancia de Situación Fiscal</h4>
        <div style="display: flex; gap: 20px; margin-top: 15px;">
          <div style="flex: 1; border: 2px dashed #94a3b8; border-radius: 8px; height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #ffffff;">
            <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 0;">ANVERSO (FRENTE)</p>
            <p style="color: #94a3b8; font-size: 10px; margin: 4px 0 0 0;">Identificación Oficial</p>
          </div>
          <div style="flex: 1; border: 2px dashed #94a3b8; border-radius: 8px; height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #ffffff;">
            <p style="color: #64748b; font-size: 12px; font-weight: bold; margin: 0;">REVERSO</p>
            <p style="color: #94a3b8; font-size: 10px; margin: 4px 0 0 0;">Identificación Oficial</p>
          </div>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: justify; font-size: 11px; color: #64748b; line-height: 1.5;">
        <em>Nota Oficial:</em> Los datos declarados en este anexo sirven de base técnica para la elaboración de los planos, diagramas unifilares e integración del expediente oficial de interconexión ingresado ante la Comisión Federal de Electricidad (CFE).
      </div>
    </div>

    <!-- SHEET 4: ANEXO 2. DESCRIPCIÓN DEL SERVICIO Y ESTRUCTURA FINANCIERA (HOJA INDEPENDIENTE) -->
    <div class="letter-sheet page-break">
      <h3 style="font-weight: bold; font-size: 15px; margin-top: 10px; margin-bottom: 20px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 6px; text-align: center;">ANEXO 2. DESCRIPCIÓN DEL SERVICIO, ALCANCE TÉCNICO Y FORMA DE PAGO</h3>
      
      <p style="font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #1e293b;">I. Componentes Principales del Sistema Fotovoltaico:</p>
      <div style="text-align: justify; margin-bottom: 20px; font-size: 12px; padding: 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; line-height: 1.7;">
        ${descEquiposHTML}
      </div>
      
      ${adicionalesHTML ? `
        <p style="font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #1e293b;">II. Materiales Adicionales de Instalación y Protección Eléctrica:</p>
        <div style="text-align: justify; margin-bottom: 20px; font-size: 12px; padding: 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; line-height: 1.7; color: #334155;">
          ${adicionalesHTML}
        </div>
      ` : ''}

      <p style="font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #1e293b;">III. Alcance Técnico e Ingeniería Incluida:</p>
      <ul style="padding-left: 20px; margin-bottom: 20px; font-size: 12px; line-height: 1.6; color: #334155;">
        <li style="margin-bottom: 4px;">Cableado solar 100% cobre con recubrimiento especial UV y tubería de canalización protectora.</li>
        <li style="margin-bottom: 4px;">Instalación de gabinete de protecciones en Corriente Directa (CC) y Alterna (CA) con supresores de picos.</li>
        <li style="margin-bottom: 4px;">Configuración de sistema de monitoreo remoto Wi-Fi vía aplicación móvil para el cliente.</li>
        <li style="margin-bottom: 4px;">Gestión completa del trámite de interconexión y entrega del expediente técnico ante CFE.</li>
      </ul>
      
      <div style="margin-top: 25px; background-color: #f8fafc; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; line-height: 1.8;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">IV. Desglose Financiero y Esquema de Pagos</h4>
        <div style="font-size: 12px; line-height: 1.6; color: #334155;">
          <p style="margin: 0 0 2px 0;">Valor Total de la Operación (IVA Incluido):</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #000; font-size: 13px;">${montoTotal} MXN <span style="font-size: 11px; font-weight: normal; color: #475569;">(${numeroALetras(formData.montoTotal)})</span></p>
          
          <p style="margin: 0 0 2px 0;">Monto de Anticipo Acordado (${pctAnticipo}%):</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #059669; font-size: 13px;">${montoAnticipo} MXN <span style="font-size: 11px; font-weight: normal; color: #475569;">(${numeroALetras(formData.montoAnticipo)})</span></p>
          
          <p style="margin: 0 0 2px 0;">Saldo Restante Pendiente de Pago${formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0 ? ' (Diferido)' : ' (Pago Único)'}:</p>
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #d97706; font-size: 13px;">${montoRestante} MXN <span style="font-size: 11px; font-weight: normal; color: #475569;">(${numeroALetras(formData.montoRestante)})</span></p>
        </div>
        ${formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0 ? `
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #1e293b;">
            <strong>Esquema de Diferimiento:</strong> ${formData.numeroPagosDiferidos} pagos diferidos mensuales de <strong>${formatCurrency(pagoDiferidoAmount)} MXN</strong> cada uno, respaldados mediante Pagarés individuales.
          </div>
        ` : ''}
      </div>

      <div style="margin-top: 20px; background-color: #ffffff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #475569; line-height: 1.6;">
        <strong>Datos Bancarios Oficiales para Depósito / Transferencia:</strong><br/>
        Banco: ${empBanco} | Titular: ${empRazonSocial}<br/>
        Cuenta: ${empCuenta} | CLABE Interbancaria: ${empClabe} | RFC: ${empRFC}
      </div>
    </div>

    <!-- SHEET 4: ANEXO 3. PÓLIZA DE GARANTÍA -->
    <div class="letter-sheet page-break">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #C49825; padding-bottom: 12px; margin-bottom: 30px; margin-top: 10px;">
        <img src="${logoUrl}" style="height: 55px; width: auto;" alt="eSol Energías" onerror="this.style.display='none';">
        <div style="text-align: right;">
          <h3 style="font-family: 'Cinzel', serif; font-weight: 700; font-size: 20px; margin: 0; color: #0f172a; letter-spacing: 0.5px;">PÓLIZA DE GARANTÍA</h3>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Anexo 3 • ESOL ENERGÍAS</p>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #C49825; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
        <p style="text-align: justify; margin: 0; font-size: 13px; line-height: 1.8; color: #334155;">
          Esta <strong>Póliza Oficial</strong> certifica la cobertura de garantía sobre la instalación del Sistema Fotovoltaico a favor de <strong>${cliente}</strong>, sujeto a las siguientes condiciones y términos de cobertura:
        </p>
      </div>

      <ul style="padding-left: 0; list-style-type: none; margin-bottom: 40px; text-align: justify; line-height: 1.8; font-size: 13px; color: #1e293b;">
        <li style="margin-bottom: 16px; display: flex; align-items: flex-start;">
          <span style="color: #C49825; font-size: 16px; margin-right: 12px;">♦</span>
          <div><strong>Garantía de Instalación:</strong> EL PRESTADOR garantiza por 3 (tres) años la mano de obra, sujeción y cableado eléctrico a partir de la firma del Acta de Entrega - Recepción.</div>
        </li>
        <li style="margin-bottom: 16px; display: flex; align-items: flex-start;">
          <span style="color: #C49825; font-size: 16px; margin-right: 12px;">♦</span>
          <div><strong>Garantía de Componentes:</strong> La garantía sobre los módulos fotovoltaicos e inversor la otorga directamente el fabricante conforme a sus certificados individuales.</div>
        </li>
        <li style="margin-bottom: 16px; display: flex; align-items: flex-start;">
          <span style="color: #C49825; font-size: 16px; margin-right: 12px;">♦</span>
          <div><strong>Mantenimientos Preventivos:</strong> Para garantizar la eficiencia operativa del sistema y conservar la garantía de instalación, EL CLIENTE deberá realizar mantenimientos preventivos anuales. Dichos mantenimientos deberán ser contratados de forma independiente con EL PRESTADOR o proveedores certificados.</div>
        </li>
        <li style="margin-bottom: 16px; display: flex; align-items: flex-start;">
          <span style="color: #C49825; font-size: 16px; margin-right: 12px;">♦</span>
          <div><strong>Exclusiones:</strong> Variaciones o descargas eléctricas externas de CFE, modificaciones por personal ajeno a EL PRESTADOR, mala conectividad Wi-Fi del inmueble o contingencias ambientales extremas.</div>
        </li>
      </ul>
      
      <div style="position: absolute; bottom: 80px; left: 0; width: 100%; text-align: center;">
        <div style="border-top: 1px solid #000; width: 260px; margin: 0 auto 8px auto;"></div>
        <p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;">EL PRESTADOR</p>
        <p style="font-size: 12px; margin-top: 4px; margin-bottom: 2px; color: #475569;">${empRepresentante}</p>
        <p style="font-size: 10px; margin: 0; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Representante legal de Soluciones Integrales de Nayarit</p>
        <div style="border-bottom: 2px solid #C49825; width: 80%; margin: 25px auto 0 auto;"></div>
      </div>
    </div>

    <!-- SHEET 5: ANEXO 4. ACTA DE ENTREGA RECEPCIÓN -->
    <div class="letter-sheet page-break">
      <h3 style="font-weight: bold; font-size: 15px; margin-bottom: 25px; text-transform: uppercase; text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px;">ANEXO 4. ACTA DE ENTREGA - RECEPCIÓN Y CONFORMIDAD DE OBRA</h3>
      
      <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8; font-size: 12px;">
        En la ciudad de Tepic, Nayarit, se hace constar la entrega formal de la obra física correspondiente al Sistema de Generación Fotovoltaico instalado en el inmueble ubicado en: <strong>${direccion}</strong>.
      </p>

      <p style="text-align: justify; margin-bottom: 10px; line-height: 1.8; font-size: 12px;">
        Se detallan a continuación los equipos, materiales y conceptos instalados de acuerdo con lo estipulado en el presupuesto original, amparando legalmente la totalidad de la obra ejecutada y entregada funcionando al 100%:
      </p>

      <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; margin-bottom: 20px; color: #1e293b;">
        <div style="font-family: monospace; white-space: pre-wrap; line-height: 1.5;">${descEquiposHTML}</div>
      </div>
      
      <p style="font-weight: bold; margin-bottom: 12px; text-transform: uppercase; text-align: center; font-size: 12px;">DECLARACIÓN DE CONFORMIDAD Y COMPROMISO DE PAGO:</p>
      
      <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8; font-size: 12px;">
        Mediante la firma del presente documento, EL CLIENTE (o su representante autorizado) acusa de recibido a entera satisfacción el sistema fotovoltaico con los conceptos previamente listados en sus condiciones físicas y operativas, y se obliga incondicionalmente a liquidar a favor de EL PRESTADOR el saldo restante de <strong>${montoRestante} MXN</strong> dentro de un plazo no mayor a 5 (cinco) días hábiles a partir de esta fecha.
      </p>

      <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8; font-size: 12px;">
        El presente instrumento se emite de conformidad con lo establecido en el Código Civil aplicable al Estado de Nayarit y Código Civil Federal en materia de contratos de obra y prestación de servicios. Se anexa de forma indisoluble al Contrato Principal celebrado entre las partes, constituyendo prueba plena de la entrega real y jurídica de los bienes, aceptando el cliente irrevocablemente su conformidad.
      </p>
      
      <p style="text-align: justify; margin-bottom: 40px; line-height: 1.8; font-size: 12px;">
        Fecha de Entrega Física: _____ de ____________________ de 20____.
      </p>

      <div style="position: absolute; bottom: 60px; left: 0; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-evenly; margin-bottom: 55px;">
          <div style="text-align: center; width: 35%;">
            <div style="border-top: 1px solid #000; width: 100%; margin-bottom: 8px;"></div>
            <p style="font-weight: bold; margin: 0; font-size: 12px;">ENTREGA (EL PRESTADOR)</p>
            <p style="font-size: 11px; margin-top: 2px;">${empRepresentante}</p>
          </div>
          <div style="text-align: center; width: 35%;">
            <div style="border-top: 1px solid #000; width: 220px; margin-bottom: 8px;"></div>
            <p style="font-weight: bold; margin: 0; font-size: 12px;">RECIBE (EL CLIENTE)</p>
            <p style="font-size: 11px; margin-top: 2px;">${firmaCliente}</p>
          </div>
        </div>
        <div style="display: flex; justify-content: center;">
          <div style="text-align: center; width: 35%;">
            <div style="border-top: 1px solid #000; width: 100%; margin-bottom: 8px;"></div>
            <p style="font-weight: bold; margin: 0; font-size: 12px;">TESTIGO</p>
            <p style="font-size: 11px; margin-top: 2px; color: #64748b;">Nombre y Firma</p>
          </div>
        </div>
      </div>
    </div>

    ${pagaresHTML}
  </div>

  <script>
    function descargarDirecto() {
      const element = document.getElementById('contract-doc-wrapper');
      
      const originalCssText = element.style.cssText;
      const originalBodyBg = document.body.style.background;
      
      document.body.style.background = '#ffffff';
      element.style.cssText = 'width: 215.9mm; margin: 0 auto; padding: 0; background: #ffffff; overflow: visible;';
      
      const sheets = document.querySelectorAll('.letter-sheet');
      const originalSheetsCss = [];
      sheets.forEach(s => {
        originalSheetsCss.push(s.style.cssText);
        s.style.cssText = 'width: 215.9mm; height: 279.4mm; margin: 0; padding: 15mm 20mm; box-sizing: border-box; box-shadow: none; background: #ffffff; position: relative; overflow: hidden;';
      });

      // Remove any CSS page breaks during export since sheets already have exact 279.4mm height
      sheets.forEach(s => {
        s.classList.remove('page-break', 'html2pdf__page-break');
      });

      window.scrollTo(0, 0);
      const opt = {
        margin: [0, 0, 0, 0],
        filename: 'Contrato_' + '${cliente}'.replace(/\\s+/g, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.7 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: [] }
      };
      
      const restoreStyles = () => {
        document.body.style.background = originalBodyBg;
        element.style.cssText = originalCssText;
        sheets.forEach((s, i) => {
          s.style.cssText = originalSheetsCss[i];
          if (i > 0) s.classList.add('page-break');
        });
      };
      
      const urlHook = '${webhookUrl}';
      
      html2pdf().from(element).set(opt).toPdf().get('pdf').then(function(pdfObj) {
        // Obtenemos el archivo completo en formato DataURI antes de guardarlo (para evitar bugs de jsPDF)
        const pdfDataUri = pdfObj.output('datauristring');
        
        // 1. Descargar el archivo localmente
        pdfObj.save(opt.filename);
        
        restoreStyles();
        
        // 2. Intentar subir a Drive en segundo plano usando FormData estándar y Blob nativo
        if (urlHook && urlHook.includes('http')) {
          try {
            // Convertir Data URI a Blob manualmente (garantiza que el archivo sea idéntico y sin corrupción)
            const byteString = atob(pdfDataUri.split(',')[1]);
            const mimeString = pdfDataUri.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], {type: mimeString});

            const webhookData = new FormData();
            webhookData.append('file', blob, opt.filename);
            webhookData.append('filename', opt.filename);
            webhookData.append('cliente', '${cliente}');
            webhookData.append('montoTotal', '${montoTotal}');
            
            fetch(urlHook, {
              method: 'POST',
              body: webhookData
            })
            .then(res => res.text())
            .then(text => {
              console.log('¡Enviado a Make exitosamente!', text);
              
              // Intentar parsear si Make devolvió JSON (ej. {"driveUrl": "..."})
              try {
                const data = JSON.parse(text);
                if (data && data.driveUrl && window.opener && window.opener.updateSupabaseContract) {
                  window.opener.updateSupabaseContract(data.driveUrl);
                }
              } catch(e) {}

              alert('✅ PDF descargado localmente y enviado a Google Drive (vía Make).');
            })
            .catch(err => {
              console.error('Error enviando al webhook', err);
              alert('⚠️ El PDF se descargó localmente, pero ocurrió un error de red al enviarlo a Make: ' + err.message);
            });
          } catch(e) {
            console.error('Error procesando Blob', e);
          }
        } else {
          alert('ℹ️ PDF descargado localmente.\\n\\nNota: Para subir automáticamente a Google Drive, configura la URL de Webhook de Make.com en el menú "Ajustes" del módulo Legal.');
        }
      });
    }
  </script>
</body>
</html>`;

    (window as any).updateSupabaseContract = async (driveUrl: string) => {
      if (!selectedBudget) return;
      try {
        const { supabase } = await import('../../context/supabase');
        await supabase.from('presupuestos').update({ contrato_url: driveUrl }).eq('id', selectedBudget);
        console.log('✅ Contrato vinculado en CRM:', driveUrl);
      } catch(err) {
        console.error('Error al actualizar Supabase:', err);
      }
    };

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(fullHTML);
      win.document.close();
    } else {
      alert('Por favor permite las ventanas emergentes (pop-ups) en tu navegador para ver el contrato.');
    }
    setIsGenerating(false);
  };


  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-light text-cream mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold" />
          Datos del Contrato
        </h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-cream-muted mb-1">Seleccionar Presupuesto Base</label>
            <select
              value={selectedBudget}
              onChange={(e) => handleBudgetSelection(e.target.value)}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-cream focus:border-gold focus:ring-1 focus:ring-gold outline-none"
            >
              <option value="">-- Seleccionar --</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.name} - {b.client_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-cream-muted mb-1">Fecha de Salida / Emisión</label>
              <input
                type="date"
                value={formData.fechaEmision}
                onChange={e => setFormData({...formData, fechaEmision: e.target.value})}
                className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-cream focus:border-gold outline-none mb-3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-3/30 p-4 rounded-xl border border-dark-4">
              {/* Bloque de escaneo INE / Constancia */}
              <div className="md:col-span-2 mb-2 bg-dark-1 p-4 rounded-xl border border-dashed border-dark-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-cream">Extracción Automática</h4>
                    <p className="text-[10px] text-cream-muted">Sube el INE o Constancia de Situación Fiscal para auto-completar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Simulación: Extrayendo datos con IA')}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-blue-500/30 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Extraer con IA
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-dark-4 rounded-lg p-4 text-center cursor-pointer hover:bg-dark-3/50 transition-colors">
                    <Upload className="w-5 h-5 mx-auto text-cream-muted mb-2" />
                    <span className="text-xs text-cream-muted font-medium">Documento Frontal</span>
                  </div>
                  <div className="border border-dark-4 rounded-lg p-4 text-center cursor-pointer hover:bg-dark-3/50 transition-colors">
                    <Upload className="w-5 h-5 mx-auto text-cream-muted mb-2" />
                    <span className="text-xs text-cream-muted font-medium">Reverso (INE)</span>
                  </div>
                </div>
              </div>

              {/* Selector de Tipo de Persona */}
              <div className="md:col-span-2 flex items-center justify-between bg-dark-1/50 p-3 rounded-lg border border-dark-4">
                <label className="text-sm font-medium text-cream-muted">Tipo de Cliente</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, tipoPersona: 'fisica', representanteLegal: ''})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${formData.tipoPersona === 'fisica' ? 'bg-gold text-dark-1' : 'bg-dark-3 text-cream-muted hover:bg-dark-4'}`}
                  >
                    Persona Física
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, tipoPersona: 'moral'})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${formData.tipoPersona === 'moral' ? 'bg-gold text-dark-1' : 'bg-dark-3 text-cream-muted hover:bg-dark-4'}`}
                  >
                    Persona Moral
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-cream-muted mb-1">Nombre o Denominación Social</label>
                <input
                  type="text"
                  placeholder="Nombre completo o Empresa"
                  value={formData.clienteRazonSocial}
                  onChange={e => setFormData({...formData, clienteRazonSocial: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>

              {formData.tipoPersona === 'moral' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-cream-muted mb-1">Representante Legal (Obligatorio para P. Moral)</label>
                  <input
                    type="text"
                    placeholder="Nombre completo del representante legal"
                    value={formData.representanteLegal}
                    onChange={e => setFormData({...formData, representanteLegal: e.target.value})}
                    className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">RFC</label>
                <input
                  type="text"
                  value={formData.rfc}
                  onChange={e => setFormData({...formData, rfc: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none uppercase text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">CURP</label>
                <input
                  type="text"
                  value={formData.curp}
                  onChange={e => setFormData({...formData, curp: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none uppercase text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">No. CIC (Credencial)</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={formData.cic}
                  onChange={e => setFormData({...formData, cic: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Número Identificador (OCR)</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={formData.ocr}
                  onChange={e => setFormData({...formData, ocr: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cream-muted mb-1">Domicilio de Instalación</label>
              <input
                type="text"
                value={formData.clienteDireccion}
                onChange={e => setFormData({...formData, clienteDireccion: e.target.value})}
                className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-cream focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cream-muted mb-1">Descripción de Equipos Principales</label>
              <textarea
                rows={5}
                value={formData.descripcionEquipos}
                onChange={e => setFormData({...formData, descripcionEquipos: e.target.value})}
                className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-cream focus:border-gold outline-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cream-muted mb-1">Materiales Adicionales</label>
              <textarea
                rows={4}
                value={formData.adicionales}
                onChange={e => setFormData({...formData, adicionales: e.target.value})}
                className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2.5 text-cream focus:border-gold outline-none font-mono text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-dark-3/50 p-4 rounded-xl border border-dark-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-cream-muted mb-1">Monto Total</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted">$</span>
                  <FormattedCurrencyInput
                    value={formData.montoTotal}
                    onChange={val => {
                      const newTotal = val || 0;
                      const ant = newTotal * (formData.porcentajeAnticipo / 100);
                      setFormData({...formData, montoTotal: newTotal, montoAnticipo: ant, montoRestante: newTotal - ant});
                    }}
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl pl-7 pr-4 py-2 text-cream focus:border-gold outline-none"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-cream-muted mb-1">% Anticipo</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.porcentajeAnticipoStr}
                    onChange={e => updateAnticipoPorcentaje(parseFloat(e.target.value), e.target.value)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:border-gold outline-none text-center"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted">%</span>
                </div>
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-cream-muted mb-1">Anticipo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted">$</span>
                  <FormattedCurrencyInput
                    value={formData.montoAnticipo}
                    onChange={val => updateAnticipoMonto(val || 0)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl pl-7 pr-2 py-2 text-cream focus:border-gold outline-none"
                  />
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-cream-muted mb-1">Restante</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-muted">$</span>
                  <FormattedCurrencyInput
                    value={formData.montoRestante}
                    readOnly
                    className="w-full bg-dark-3 border border-dark-4 rounded-xl pl-7 pr-4 py-2 text-gold font-bold outline-none cursor-not-allowed opacity-80"
                  />
                </div>
              </div>
            </div>

            <div className="bg-dark-3/50 p-4 rounded-xl border border-dark-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-cream">Pagos Diferidos del Restante</label>
                <select
                  value={formData.pagosDiferidosActivos ? "yes" : "no"}
                  onChange={e => setFormData({...formData, pagosDiferidosActivos: e.target.value === "yes"})}
                  className="bg-dark-1 border border-dark-4 rounded-lg px-3 py-1.5 text-cream text-sm focus:border-gold outline-none"
                >
                  <option value="no">No (Un solo pago)</option>
                  <option value="yes">Sí (Múltiples pagos)</option>
                </select>
              </div>

              {formData.pagosDiferidosActivos && (
                <div className="flex gap-4 items-center">
                  <div className="w-1/3">
                    <label className="block text-xs text-cream-muted mb-1">Número de pagos</label>
                    <input
                      type="number"
                      min="2"
                      max="24"
                      value={formData.numeroPagosDiferidos}
                      onChange={e => setFormData({...formData, numeroPagosDiferidos: parseInt(e.target.value) || 2})}
                      className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-center"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs text-cream-muted mb-1">Monto por pago</label>
                    <div className="text-gold font-medium">
                      {formData.numeroPagosDiferidos} pagos de {formatCurrency(pagoDiferidoAmount)}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={!selectedBudget || isGenerating}
            className="w-full py-3 mt-4 bg-gold text-dark-1 font-medium rounded-xl hover:bg-yellow-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isGenerating ? 'Generando PDF...' : 'Generar y Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Company Data Section */}
      <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl h-max">
        <h3 className="text-xl font-light text-cream mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold" />
          Datos de Nuestra Empresa
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-cream-muted mb-1">Razón Social</label>
            <input
              type="text"
              value={formData.empresaRazonSocial}
              onChange={e => setFormData({...formData, empresaRazonSocial: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:border-gold outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cream-muted mb-1">Representante Legal</label>
            <input
              type="text"
              value={formData.empresaRepresentante}
              onChange={e => setFormData({...formData, empresaRepresentante: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:border-gold outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cream-muted mb-1">RFC de Empresa</label>
            <input
              type="text"
              value={formData.empresaRFC}
              onChange={e => setFormData({...formData, empresaRFC: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:border-gold outline-none uppercase text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cream-muted mb-1">Domicilio Fiscal</label>
            <textarea
              rows={2}
              value={formData.empresaDomicilio}
              onChange={e => setFormData({...formData, empresaDomicilio: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:border-gold outline-none text-sm"
            />
          </div>
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 space-y-4">
            <h4 className="text-gold font-medium text-sm border-b border-gold/20 pb-2">Datos Bancarios</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">Banco</label>
                <input
                  type="text"
                  value={formData.empresaBanco}
                  onChange={e => setFormData({...formData, empresaBanco: e.target.value})}
                  className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Cuenta</label>
                <input
                  type="text"
                  value={formData.empresaCuenta}
                  onChange={e => setFormData({...formData, empresaCuenta: e.target.value})}
                  className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">CLABE</label>
                <input
                  type="text"
                  value={formData.empresaClabe}
                  onChange={e => setFormData({...formData, empresaClabe: e.target.value})}
                  className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={contractRef} style={{ display: 'none' }}>
        <div className="bg-white text-black text-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: '1.5' }}>
          
          {/* Page 1: Declaraciones y Cláusulas iniciales */}
          <div className="p-10">
             <h2 className="text-center font-bold text-lg mb-6 uppercase">CONTRATO DE PRESTACIÓN DE SERVICIOS</h2>
             <p className="text-left mb-4">
               Contrato de prestación de servicios que celebran por una parte <strong>SOLUCIONES INTEGRALES DE NAYARIT, S. DE R.L. DE C.V.</strong>, representada legalmente por GUSTAVO CORONA CERVANTES, a quien en lo sucesivo se le denominará EL PRESTADOR, y por otra parte <strong>{formData.clienteNombre || '_________________'}</strong>, a quien en lo sucesivo se le denominará EL CLIENTE, al tenor de las siguientes Declaraciones y Cláusulas:
             </p>
             
             <h3 className="text-center font-bold mt-6 mb-4 uppercase">DECLARACIONES</h3>
             <p className="font-bold">PRIMERA. EL PRESTADOR declara:</p>
             <ul className="list-disc pl-8 mb-4 text-left space-y-1">
               <li>Que su denominación social es Soluciones Integrales de Nayarit, S. de R.L. de C.V.</li>
               <li>Que el Sr. GUSTAVO CORONA CERVANTES acredita su representación legal por medio de la Escritura Pública Número 333, Tomo Primero, Libro Cuarto, expedida por el Dr. José Trinidad Espinoza Vargas, Notario Titular de la Notaría Pública Número 37 de Tepic, Nayarit.</li>
               <li>Que tiene su domicilio en Av. Insurgentes 56-A, Interior A, Colonia Centro, C.P. 63000, Tepic, Nayarit.</li>
               <li>Que cuenta con Registro Federal de Contribuyentes de clave SIN190211IC4 y que se encuentra al corriente en el cumplimiento de sus obligaciones fiscales.</li>
               <li>Que es titular y/o licenciatario autorizado de la Marca Energy Solares ®.</li>
               <li>Que cuenta con los recursos humanos, materiales, equipo técnico y personal especializado en la instalación de sistemas generadores de energía fotovoltaicos en residencia, comercio e industria, contando con las certificaciones expedidas por la Asociación de Normalización y Certificación, A.C. y CENCER Energía Renovable, S.A. DE C.V. para ejercer el servicio contratado.</li>
               <li>Que los datos bancarios y de pago contenidos en el “Anexo 1. DATOS GENERALES” son verdaderos y vigentes.</li>
             </ul>
             <p className="font-bold mt-4">SEGUNDA. EL CLIENTE declara:</p>
             <ul className="list-disc pl-8 mb-4 text-left space-y-1">
               <li>Que sus datos contenidos en el “Anexo 1. DATOS GENERALES” son verdaderos.</li>
               <li>Que cuenta con la capacidad legal, técnica y jurídica suficiente para obligarse en los términos del presente contrato, y que ostenta la legal posesión o propiedad del inmueble donde se ejecutará la instalación: <strong>{formData.clienteDireccion || '_________________'}</strong>.</li>
               <li>Que es el titular registrado del contrato del suministro eléctrico ante la Comisión Federal de Electricidad (CFE) correspondiente al recibo de luz del inmueble. En caso de ser un tercero, declara contar con la autorización legal del titular.</li>
               <li>Que es su interés contratar los servicios especializados de EL PRESTADOR, teniendo pleno conocimiento de los beneficios, alcances, responsabilidades y especificaciones técnicas correspondientes.</li>
             </ul>
             <p className="font-bold mt-4">TERCERA. Declaran LAS PARTES en conjunto:</p>
             <ul className="list-disc pl-8 mb-6 text-left space-y-1">
               <li>Que los datos contenidos en el “Anexo 1. DATOS GENERALES” son verdaderos.</li>
               <li>Que cuentan con la capacidad y medios suficientes para cumplir y celebrar el presente documento.</li>
               <li>Que en el presente contrato no media dolo, error, mala fe, coacción ni cualquier vicio en el consentimiento.</li>
               <li>Que reconocen expresamente la validez plena de la firma del presente contrato y sus Anexos mediante firmas autógrafas o medios electrónicos, de conformidad con la legislación aplicable.</li>
             </ul>
             
             <h3 className="text-center font-bold mt-6 mb-4 uppercase">CLÁUSULAS</h3>
             <p className="text-left mb-4"><strong>PRIMERA. OBJETO.</strong> EL PRESTADOR se obliga a prestar los servicios especializados de suministro e instalación de sistema de generación de energía fotovoltaica que se describen en el “Anexo 2. Descripción del Servicio, Alcance Técnico y Forma de Pago” a favor de EL CLIENTE. En el cumplimiento de esta cláusula EL PRESTADOR actuará de manera diligente, profesional y de buena fe.</p>
             
             <p className="text-left mb-4"><strong>SEGUNDA. VALOR DE LA TRANSACCIÓN Y ESTRUCTURA DE PAGOS.</strong> LAS PARTES acuerdan que el valor total de la operación es la cantidad estipulada en el ANEXO 2, la cual asciende a <strong>{formatCurrency(formData.montoTotal)} MXN</strong> (Incluye IVA). Los pagos se realizarán vía transferencia bancaria, cheque o efectivo a las cuentas señaladas por EL PRESTADOR.<br/><br/>
             La estructura de pagos se establece en porcentajes exactos sobre el valor total de la transacción:<br/>
             - <strong>Anticipo ({formData.porcentajeAnticipo.toFixed(1)}%):</strong> Equivalente a la cantidad de <strong>{formatCurrency(formData.montoAnticipo)} MXN</strong>, pagaderos a la firma del presente contrato para el suministro de materiales y programación de obra.<br/>
             - <strong>Saldo Final / Restante:</strong> Equivalente a la cantidad de <strong>{formatCurrency(formData.montoRestante)} MXN</strong>. {formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0 ? `Este saldo será liquidado en ${formData.numeroPagosDiferidos} pagos diferidos mensuales por la cantidad de ${formatCurrency(pagoDiferidoAmount)} MXN cada uno, obligados mediante pagarés anexos.` : `El cual deberá ser liquidado por EL CLIENTE dentro de un plazo máximo de 5 (cinco) días hábiles posteriores a la conclusión de la instalación física y la firma del Acta de Entrega - Recepción (Anexo 4).`}<br/><br/>
             {(!formData.pagosDiferidosActivos || formData.numeroPagosDiferidos === 0) && "La firma del Acta de Entrega - Recepción constituye la aceptación formal de la obra física y obliga legalmente a EL CLIENTE a realizar el pago del saldo final dentro del plazo establecido. La mora en el pago generará un interés moratorio del 5% mensual sobre el saldo insoluto."}
             </p>
          </div>
          
          <div className="html2pdf__page-break"></div>
          
          {/* Page 2 */}
          <div className="p-10">
             <p className="text-left mb-4">En caso de mora o incumplimiento de pago por parte de EL CLIENTE transcurrido el plazo acordado, EL PRESTADOR notificará por escrito o vía electrónica a EL CLIENTE requiriendo el pago. De persistir el incumplimiento por más de 5 días adicionales, EL PRESTADOR quedará facultado para suspender servicios, revocar la garantía y/o rescindir el contrato, iniciando las acciones legales o de recuperación correspondientes conforme a derecho.</p>

             <p className="text-left mb-4"><strong>SEGUNDA BIS. BLINDAJE SOBRE ADEUDOS Y SITUACIÓN CON CFE.</strong> EL CLIENTE declara expresamente bajo protesta de decir verdad que no cuenta con adeudos, irregularidades, sanciones o reportes pendientes ante la CFE. Si CFE bloquea o rechaza el trámite de interconexión por adeudos o irregularidades previas del CLIENTE, será responsabilidad exclusiva de EL CLIENTE resolverlo y pagarlo en un plazo máximo de 30 días naturales. Si EL CLIENTE no resuelve dicha situación, el contrato se dará por rescindido aplicando la pena convencional del 40% del anticipo por gastos operativos.</p>
             <p className="text-left mb-4"><strong>TERCERA. ALCANCE TÉCNICO, UBICACIÓN Y TRABAJOS EXTRAORDINARIOS.</strong> EL CLIENTE firmará la aceptación técnica del área asignada. Cualquier cambio posterior de ubicación que implique modificar estructura o tubería generará costos adicionales.<br/>
             <em>Adecuaciones Estructurales Imprevistas:</em> Si el personal detecta vicios ocultos o deterioro en la losa o impermeabilización, las reparaciones requeridas deberán ser autorizadas y costeadas por EL CLIENTE antes de continuar la obra.<br/>
             <em>Facultad Técnica:</em> El criterio técnico del instalador prevalecerá en todo momento por encima de sugerencias estéticas de EL CLIENTE que pongan en riesgo el rendimiento o la seguridad del sistema.</p>
             <p className="text-left mb-4"><strong>TERCERA BIS. TIEMPOS Y TRÁMITES ANTE CFE.</strong> La responsabilidad de EL PRESTADOR concluye formalmente al ingresar la solicitud y expediente técnico completo ante CFE. Los tiempos de revisión, aprobación e instalación del medidor bidireccional dependen al 100% de los procesos de CFE, eximiendo a EL PRESTADOR de cualquier responsabilidad por demoras.</p>
             <p className="text-left mb-4"><strong>CUARTA. GARANTÍAS Y REESTRUCTURACIÓN DE MANTENIMIENTOS.</strong> Las garantías del proyecto se regulan bajo los siguientes términos:<br/>
             <em>Garantía de Equipos:</em> Es otorgada directamente por el fabricante de los equipos bajo sus propias políticas. EL PRESTADOR fungirá como gestor autorizado sin costo directo para EL CLIENTE.<br/>
             <em>Garantía de Instalación:</em> EL PRESTADOR otorga una garantía de 3 (tres) años sobre la calidad de la mano de obra, sujeción y materiales eléctricos.<br/>
             <em>Mantenimientos Preventivos:</em> EL CLIENTE reconoce que la garantía de instalación y el rendimiento óptimo están condicionados a la realización de mantenimientos preventivos anuales. Dichos mantenimientos no son gratuitos; deberán contratarse independientemente con EL PRESTADOR.</p>
             <p className="text-left mb-4"><strong>QUINTA. CONECTIVIDAD E INFRAESTRUCTURA DE INTERNET.</strong> El servicio de monitoreo remoto depende enteramente de la infraestructura de red Wi-Fi de EL CLIENTE. Si EL CLIENTE cambia de proveedor, contraseña, o presenta interrupciones, la pérdida del monitoreo no será responsabilidad de EL PRESTADOR.</p>
             <p className="text-left mb-4"><strong>SEXTA. CANCELACIONES Y REEMBOLSOS.</strong> Si EL CLIENTE rescinde el contrato antes de la adquisición de insumos, EL PRESTADOR retendrá el 40% del anticipo. Una vez adquiridos los materiales o iniciados los trabajos, no habrá reembolso alguno.</p>
             <p className="text-left mb-4"><strong>SÉPTIMA. RESCISIÓN.</strong> Cualquiera de las partes podrá rescindir el contrato mediante aviso por escrito con 10 días naturales de anticipación ante incumplimiento grave. EL PRESTADOR podrá rescindir de inmediato por falta de pago del anticipo o por la negativa injustificada del acceso al inmueble.</p>
             <p className="text-left mb-4"><strong>OCTAVA. CONCLUSIÓN DEL CONTRATO.</strong> La prestación del servicio se tendrá por formalmente concluida a la firma del Acta de Entrega - Recepción (Anexo 4).</p>
             <p className="text-left mb-6"><strong>NOVENA. LEGISLACIÓN, JURISDICCIÓN Y FIRMA.</strong> Para la interpretación y cumplimiento de este contrato, las partes se someten a la legislación del Estado de Nayarit y a la jurisdicción de los Tribunales de la ciudad de Tepic, Nayarit.</p>

             <p className="text-left mb-10">Leído el presente contrato y enteradas las partes de su alcance legal, se firma en dos tantos el día <strong>{new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
             <div className="flex justify-between mt-10 pt-10 px-10">
               <div className="text-center">
                 <div className="border-t border-black w-48 mb-2"></div>
                 <p className="font-bold">EL PRESTADOR</p>
                 <p className="text-xs">GUSTAVO CORONA CERVANTES</p>
               </div>
               <div className="text-center">
                 <div className="border-t border-black w-48 mb-2"></div>
                 <p className="font-bold">EL CLIENTE</p>
                 <p className="text-xs">{formData.clienteNombre || '_________________'}</p>
               </div>
             </div>
          </div>
          
          <div className="html2pdf__page-break"></div>
          
          {/* Page 3: Anexos 1, 2, 3 */}
          <div className="p-10">
             <h3 className="font-bold mt-6 mb-2 uppercase text-lg">ANEXO 1. DATOS GENERALES</h3>
             <ul className="mb-4 space-y-1">
               <li><strong>Nombre o Denominación Social:</strong> {formData.clienteRazonSocial || '----'}</li>
               <li><strong>Representante Legal:</strong> {formData.representanteLegal || '----'}</li>
               <li><strong>RFC:</strong> {formData.rfc || '----'}</li>
               <li><strong>CURP:</strong> {formData.curp || '----'}</li>
               <li><strong>No. CIC:</strong> {formData.cic || '----'}</li>
               <li><strong>No. OCR:</strong> {formData.ocr || '----'}</li>
               <li><strong>Domicilio de Instalación:</strong> {formData.clienteDireccion || '----'}</li>
               <li><strong>Fecha de Contratación:</strong> {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
             </ul>

             <h3 className="font-bold mt-8 mb-2 uppercase text-lg">ANEXO 2. DESCRIPCIÓN DEL SERVICIO, ALCANCE TÉCNICO Y FORMA DE PAGO</h3>
             <p className="font-bold text-sm mb-2">Conceptos Principales:</p>
             <div className="text-left mb-4 text-sm p-4 bg-gray-50 border border-gray-200" dangerouslySetInnerHTML={{ __html: formData.descripcionEquipos.replace(/\n/g, '<br/>') }}></div>
             
             {formData.adicionales && (
               <>
                 <p className="font-bold text-sm mb-2">Materiales Adicionales:</p>
                 <div className="text-left mb-4 text-sm p-4 bg-gray-50 border border-gray-200 text-gray-700" dangerouslySetInnerHTML={{ __html: formData.adicionales.replace(/\n/g, '<br/>') }}></div>
               </>
             )}
             
             <div className="mt-6 bg-gray-50 p-4 border border-gray-200 text-sm space-y-4">
               <div>
                 <p className="text-gray-600 mb-1">Valor Total de la Operación (IVA Incluido):</p>
                 <p className="font-bold text-black">{formatCurrency(formData.montoTotal)} MXN <span className="text-xs text-gray-500 font-normal">({numeroALetras(formData.montoTotal)})</span></p>
               </div>
               <div>
                 <p className="text-gray-600 mb-1">Monto de Anticipo Acordado ({formData.porcentajeAnticipo.toFixed(1)}%):</p>
                 <p className="font-bold text-green-700">{formatCurrency(formData.montoAnticipo)} MXN <span className="text-xs text-gray-500 font-normal">({numeroALetras(formData.montoAnticipo)})</span></p>
               </div>
               <div>
                 <p className="text-gray-600 mb-1">Saldo Restante Pendiente de Pago{formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0 ? ' (Diferido)' : ' (Pago Único)'}:</p>
                 <p className="font-bold text-amber-600">{formatCurrency(formData.montoRestante)} MXN <span className="text-xs text-gray-500 font-normal">({numeroALetras(formData.montoRestante)})</span></p>
               </div>
               {formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0 && (
                 <div className="pt-2 border-t border-gray-200 border-dashed text-gray-800">
                   <strong>Esquema de Diferimiento:</strong> {formData.numeroPagosDiferidos} pagos diferidos mensuales de <strong>{formatCurrency(pagoDiferidoAmount)} MXN</strong> cada uno, respaldados mediante Pagarés individuales.
                 </div>
               )}
             </div>

             <h3 className="font-bold mt-10 mb-4 uppercase text-lg">ANEXO 3. PÓLIZA DE GARANTÍA Y MANTENIMIENTOS</h3>
             <p className="text-left mb-4">Esta Póliza certifica la cobertura de garantía sobre la instalación del Sistema Fotovoltaico, sujeto a las siguientes condiciones:</p>
             <ul className="list-disc pl-8 mb-4 text-left space-y-2">
               <li><strong>Garantía de Instalación:</strong> EL PRESTADOR garantiza por 3 (tres) años la mano de obra, sujeción y cableado eléctrico a partir de la firma del Acta de Entrega - Recepción.</li>
               <li><strong>Garantía de Componentes:</strong> La garantía sobre los módulos fotovoltaicos e inversor la otorga directamente el fabricante conforme a sus certificados individuales.</li>
               <li><strong>Mantenimientos Preventivos:</strong> Para garantizar la eficiencia operativa del sistema y conservar la garantía de instalación, EL CLIENTE deberá realizar mantenimientos preventivos anuales. Dichos mantenimientos deberán ser contratados de forma independiente con EL PRESTADOR o proveedores certificados.</li>
               <li><strong>Exclusiones:</strong> Variaciones o descargas eléctricas externas de CFE, modificaciones por personal ajeno a EL PRESTADOR, mala conectividad Wi-Fi del inmueble o contingencias ambientales extremas.</li>
             </ul>
          </div>
          
          <div className="html2pdf__page-break"></div>

          {/* Page 4: Anexo 4 (Acta de Entrega Recepción) */}
          <div className="p-10">
             <h3 className="font-bold text-lg mb-8 uppercase text-center">ANEXO 4. ACTA DE ENTREGA - RECEPCIÓN Y CONFORMIDAD DE OBRA</h3>
             
             <p className="text-left mb-6 leading-loose">
               En la ciudad de Tepic, Nayarit, se hace constar la entrega formal de la obra física correspondiente al Sistema de Generación Fotovoltaico instalado en el inmueble ubicado en: <strong>{formData.clienteDireccion || '____________________________________________________'}</strong>.
             </p>
             
             <p className="font-bold mb-4 uppercase text-center">DECLARACIÓN DE CONFORMIDAD Y COMPROMISO DE PAGO:</p>
             
             <p className="text-left mb-6 leading-loose">
               Mediante la firma del presente documento, EL CLIENTE (o su representante autorizado) acusa de recibido a entera satisfacción el sistema fotovoltaico en sus condiciones físicas y operativas, y se obliga incondicionalmente a liquidar a favor de EL PRESTADOR el saldo restante de <strong>{formatCurrency(formData.montoRestante)} MXN</strong> dentro de un plazo no mayor a 5 (cinco) días hábiles a partir de esta fecha.
             </p>
             
             <p className="text-left mb-10 leading-loose">
               Fecha de Entrega Física: _____ de ____________________ de 20____.
             </p>

             <div className="flex justify-between mt-20 pt-10 px-10">
               <div className="text-center">
                 <div className="border-t border-black w-48 mb-2"></div>
                 <p className="font-bold">ENTREGA (EL PRESTADOR)</p>
                 <p className="text-xs">GUSTAVO CORONA CERVANTES</p>
               </div>
               <div className="text-center">
                 <div className="border-t border-black w-48 mb-2"></div>
                 <p className="font-bold">RECIBE (EL CLIENTE)</p>
                 <p className="text-xs">{formData.clienteNombre || '_________________'}</p>
               </div>
             </div>
          </div>

          {/* Page 5+: Pagarés (Only if deferred payments are active) */}
          {formData.pagosDiferidosActivos && formData.numeroPagosDiferidos > 0 && Array.from({ length: formData.numeroPagosDiferidos }).map((_, i) => (
             <div key={i} className="p-10 html2pdf__page-break">
               <div className="relative border-2 border-slate-800 rounded-lg p-8 min-h-[800px] flex flex-col">
                 
                 <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
                   <div>
                     <h2 className="m-0 font-serif text-3xl font-bold text-slate-800 tracking-widest">PAGARÉ</h2>
                     <p className="mt-1 text-sm text-slate-500 font-bold">NÚMERO: {i + 1} DE {formData.numeroPagosDiferidos}</p>
                   </div>
                   <div className="text-right">
                     <div className="bg-slate-50 border border-slate-400 px-4 py-2 rounded inline-block text-left">
                       <p className="m-0 text-[10px] text-slate-600 font-bold uppercase">Bueno por:</p>
                       <p className="m-0 mt-1 text-lg font-bold text-black">{formatCurrency(pagoDiferidoAmount)} MXN</p>
                     </div>
                   </div>
                 </div>

                 <p className="text-right mb-6 text-sm">
                   <strong>Lugar y fecha de expedición:</strong> Tepic, Nayarit, a {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}.
                 </p>

                 <p className="text-justify mb-6 leading-loose text-sm text-black">
                   Por este pagaré me obligo incondicionalmente a pagar a la orden de <strong>Soluciones Integrales de Nayarit S. de R.L. de C.V.</strong>, en su domicilio ubicado en Av. Insurgentes 56-A, Interior A, Colonia Centro, C.P. 63000, Tepic, Nayarit., o en cualquier otro que se me indique por escrito, la cantidad de <strong>{formatCurrency(pagoDiferidoAmount)} MXN ({numeroALetras(pagoDiferidoAmount)})</strong>.
                 </p>

                 <p className="text-justify mb-6 leading-loose text-sm text-black">
                   La suma anterior ampara el valor recibido a mi entera satisfacción. El pago de este documento deberá efectuarse puntualmente el día <strong>{getFechaPago(i + 1)}</strong>.
                 </p>

                 <p className="text-justify mb-6 leading-relaxed text-xs text-slate-700">
                   Si el pago no fuere cubierto a su vencimiento, causará intereses moratorios a razón del <strong>5% (cinco por ciento) mensual</strong>, generados desde la fecha de vencimiento y hasta su total liquidación, conjuntamente con el principal.
                 </p>

                 <p className="text-justify mb-8 leading-relaxed text-xs text-slate-700">
                   El presente Pagaré es mercantil y está regido por la Ley General de Títulos y Operaciones de Crédito en sus artículos 170, 171, 172, 173 y 174, por no ser pagaré domiciliado y demás artículos correlativos. El suscriptor renuncia al fuero de su domicilio y se somete expresamente a la jurisdicción de los tribunales competentes en Tepic, Nayarit.
                 </p>

                 <div className="bg-slate-50 border border-slate-300 p-4 rounded text-xs leading-relaxed mb-8">
                   <p className="mb-1"><strong>DATOS DEL SUSCRIPTOR (DEUDOR):</strong></p>
                   <p className="m-0"><strong>Nombre:</strong> {formData.clienteNombre}</p>
                   <p className="m-0"><strong>Domicilio:</strong> {formData.clienteDireccion}</p>
                   {formData.tipoPersona === 'moral' && <p className="m-0"><strong>Representante Legal:</strong> {formData.representanteLegal}</p>}
                 </div>

                 <div className="absolute bottom-8 left-0 right-0 text-center">
                   <p className="mb-10 text-xs text-slate-600 font-bold">ACEPTO(AMOS) Y ME(NOS) OBLIGO(AMOS) A SU PAGO A LA FECHA DE VENCIMIENTO</p>
                   <div className="border-t border-black w-72 mx-auto mb-2"></div>
                   <p className="font-bold text-sm uppercase m-0">FIRMA DEL SUSCRIPTOR</p>
                   <p className="text-xs text-slate-600 mt-1">{formData.clienteNombre}</p>
                 </div>
               </div>
             </div>
          ))}

        </div>
      </div>

    </div>
  );
}
