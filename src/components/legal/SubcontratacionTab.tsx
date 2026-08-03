import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Loader2, HardHat, Building2, MapPin, DollarSign, Save, Plus } from 'lucide-react';
import { getPresupuestos, getPresupuestoDetails } from '../../lib/cotizadorService';
import { supabase } from '../../context/supabase';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface SubcontratacionTabProps {
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

const numeroALetras = (numero: number): string => {
  if (numero === 0) return 'CERO PESOS 00/100 M.N.';
  const integerPart = Math.floor(numero);
  const decimalPart = Math.round((numero - integerPart) * 100);
  
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  
  const convertirGrupo = (n: number): string => {
    let texto = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (c === 1 && d === 0 && u === 0) texto += 'CIEN ';
    else if (c > 0) texto += centenas[c] + ' ';
    
    if (d === 1) texto += diezA19[u] + ' ';
    else {
      if (d === 2 && u === 0) texto += 'VEINTE ';
      else if (d === 2) texto += 'VEINTI' + unidades[u] + ' ';
      else if (d > 2) {
        texto += decenas[d] + ' ';
        if (u > 0) texto += 'Y ' + unidades[u] + ' ';
      } else if (u > 0) {
        texto += unidades[u] + ' ';
      }
    }
    return texto.trim();
  };

  let letras = '';
  let resto = integerPart;

  if (resto >= 1000000) {
    const millones = Math.floor(resto / 1000000);
    if (millones === 1) letras += 'UN MILLON ';
    else letras += convertirGrupo(millones) + ' MILLONES ';
    resto = resto % 1000000;
  }

  if (resto >= 1000) {
    const miles = Math.floor(resto / 1000);
    if (miles === 1) letras += 'MIL ';
    else letras += convertirGrupo(miles) + ' MIL ';
    resto = resto % 1000;
  }

  if (resto > 0) {
    letras += convertirGrupo(resto) + ' ';
  }

  const textoFinal = letras.trim() + ' PESOS ' + decimalPart.toString().padStart(2, '0') + '/100 M.N.';
  return textoFinal;
};

const numeroALetrasSimple = (numero: number): string => {
  if (numero === 0) return 'cero';
  const integerPart = Math.floor(numero);
  
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const diezA19 = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  const convertirGrupo = (n: number): string => {
    let texto = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (c === 1 && d === 0 && u === 0) texto += 'cien ';
    else if (c > 0) texto += centenas[c] + ' ';
    
    if (d === 1) texto += diezA19[u] + ' ';
    else {
      if (d === 2 && u === 0) texto += 'veinte ';
      else if (d === 2) texto += 'veinti' + unidades[u] + ' ';
      else if (d > 2) {
        texto += decenas[d] + ' ';
        if (u > 0) texto += 'y ' + unidades[u] + ' ';
      } else if (u > 0) {
        texto += unidades[u] + ' ';
      }
    }
    return texto.trim();
  };

  let letras = '';
  let resto = integerPart;

  if (resto >= 1000) {
    const miles = Math.floor(resto / 1000);
    if (miles === 1) letras += 'mil ';
    else letras += convertirGrupo(miles) + ' mil ';
    resto = resto % 1000;
  }

  if (resto > 0) {
    letras += convertirGrupo(resto) + ' ';
  }

  return letras.trim();
};

export default function SubcontratacionTab({ initialBudgetId }: SubcontratacionTabProps) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    contratistaRazonSocial: '',
    contratistaRepresentante: '',
    contratistaRFC: '',
    contratistaDomicilio: '',
    contratistaREPSE: '',
    montoSubcontrato: 0,
    fechaInicio: '',
    fechaTermino: '',
    descripcionEquipos: '',
    adicionalesEquipos: '',
    clienteFinal: '',
    direccionObra: '',
    // Datos de la Empresa eSol
    empresaRazonSocial: 'SOLUCIONES INTEGRALES DE NAYARIT, S. DE R.L. DE C.V.',
    empresaRepresentante: 'MANUEL DE JESUS FREGOSO SAMANIEGA',
    empresaRFC: 'SIN190211IC4',
    empresaDomicilio: 'Av. Insurgentes 56-A, Interior A, Colonia Centro, C.P. 63000, Tepic, Nayarit.',
  });

  const [subcontratistas, setSubcontratistas] = useState<any[]>([]);
  const [selectedSubcontratistaId, setSelectedSubcontratistaId] = useState<string>('');
  const [isSavingSubcontratista, setIsSavingSubcontratista] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const data = await getPresupuestos();
        setBudgets(data);
        if (initialBudgetId && data.find((b: any) => b.id === initialBudgetId)) {
          handleBudgetSelection(initialBudgetId, data);
        }
      } catch (error) {
        console.error("Error fetching budgets:", error);
      }
    };
    
    const fetchSubcontratistas = async () => {
      try {
        const { data, error } = await supabase.from('subcontratistas').select('*').order('razon_social', { ascending: true });
        if (error) throw error;
        setSubcontratistas(data || []);
      } catch (error) {
        console.error("Error fetching subcontratistas:", error);
      }
    };

    fetchBudgets();
    fetchSubcontratistas();
  }, [initialBudgetId]);

  const handleBudgetSelection = async (id: string, budgetList = budgets) => {
    setSelectedBudget(id);
    const budget = budgetList.find(b => b.id === id);
    if (!budget) return;

    try {
      setIsLoading(true);
      const details = await getPresupuestoDetails(id);
      
      // Regla global: Si un concepto está dentro de un grupo, solo consideramos el grupo, no su contenido.
      const topLevelItems = details.conceptos.filter((c: any) => !c.parent_id);

      const isMainEquip = (descStr: string, subcatStr: string = '') => {
        const lowerDesc = (descStr || '').toLowerCase();
        const lowerSubcat = (subcatStr || '').toLowerCase();

        // 1. Descartar falsos positivos que contengan la palabra "panel" pero no sean equipos
        if (lowerSubcat.includes('tramite') || lowerSubcat.includes('trámite')) return false;
        if (lowerSubcat.includes('mano de obra') || lowerDesc.includes('mano de obra') || lowerDesc.includes('mano de de obra')) return false;
        if (lowerDesc.includes('comisión') || lowerDesc.includes('comision')) return false;

        // 2. Identificar el equipo
        return lowerDesc.includes('panel') || 
               lowerDesc.includes('módulo') || 
               lowerDesc.includes('modulo') || 
               lowerDesc.includes('inversor') || 
               lowerDesc.includes('microinversor') ||
               lowerDesc.includes('growat') || // Atrapa "Growat 10 kw"
               lowerDesc.includes('hoymiles') ||
               lowerDesc.includes('enphase');
      };

      // 1. Equipos principales: solo el concepto de paneles solares e inversores
      const principales = topLevelItems.filter((c: any) => {
        const isMain = c.type !== 'group' && isMainEquip(c.description, c.matriz?.subcategory);
        return isMain;
      });

      // 2. Materiales Adicionales: el restante de conceptos con restricciones
      const adicionales = topLevelItems.filter((c: any) => {
        const desc = (c.description || '').toLowerCase();
        const subcat = (c.matriz?.subcategory || '').toLowerCase();

        // Si ya está en equipos principales, lo excluimos
        if (c.type !== 'group' && isMainEquip(c.description, subcat)) return false;

        // Restricción: No se deben de cargar subcategoria de tramites
        if (subcat.includes('tramite') || subcat.includes('trámite')) return false;
        if (c.type === 'group' && (desc.includes('tramite') || desc.includes('trámite'))) return false;

        // Restricción: no se debe de cargar el concepto de mano de obra
        if (desc.includes('mano de obra') || desc.includes('mano de de obra') || subcat.includes('mano de obra')) return false;

        // Limpieza de comisiones (opcional pero lo mantenemos por consistencia)
        if (desc.includes('comisión') || desc.includes('comision')) return false;

        return true;
      });

      let descPrincipales = "";
      principales.forEach((p: any) => {
        const qStr = `${p.quantity} ${p.unit}`;
        descPrincipales += `- ${qStr.padEnd(12, ' ')} | ${p.description}\n`;
      });

      let descAdicionales = "";
      adicionales.forEach((a: any) => {
        const qStr = `${a.quantity || 1} ${a.unit || 'PZA'}`;
        descAdicionales += `- ${qStr.padEnd(12, ' ')} | ${a.description}\n`;
      });

      let fetchedAddress = '';
      if (budget.client_name) {
        const { data: clientData } = await supabase
          .from('clientes')
          .select('direccion')
          .ilike('nombre_razon_social', budget.client_name.trim())
          .limit(1);
        if (clientData && clientData.length > 0 && clientData[0].direccion) {
          fetchedAddress = clientData[0].direccion;
        }
      }
      
      const finalAddress = details.ubicacion || fetchedAddress;

      setFormData(prev => ({
        ...prev,
        clienteFinal: budget.client_name || '',
        direccionObra: finalAddress,
        descripcionEquipos: descPrincipales.trim(),
        adicionalesEquipos: descAdicionales.trim()
      }));

    } catch (error) {
      setNotification({ type: 'error', message: "Error al cargar los detalles del presupuesto" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubcontratistaSelection = (id: string) => {
    setSelectedSubcontratistaId(id);
    if (id === 'new' || !id) {
      setFormData(prev => ({
        ...prev,
        contratistaRazonSocial: '',
        contratistaRepresentante: '',
        contratistaRFC: '',
        contratistaDomicilio: '',
        contratistaREPSE: '',
      }));
    } else {
      const sub = subcontratistas.find(s => s.id === id);
      if (sub) {
        setFormData(prev => ({
          ...prev,
          contratistaRazonSocial: sub.razon_social || '',
          contratistaRepresentante: sub.representante_legal || '',
          contratistaRFC: sub.rfc || '',
          contratistaDomicilio: sub.domicilio_fiscal || '',
          contratistaREPSE: sub.repse || '',
        }));
      }
    }
  };

  const handleSaveSubcontratista = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!formData.contratistaRazonSocial?.trim()) {
      setNotification({ type: 'error', message: 'La Razón Social es requerida para guardar el perfil.' });
      return;
    }

    setIsSavingSubcontratista(true);
    setNotification(null);

    try {
      const payload = {
        razon_social: formData.contratistaRazonSocial.trim(),
        representante_legal: formData.contratistaRepresentante?.trim() || '',
        rfc: formData.contratistaRFC?.trim() || '',
        domicilio_fiscal: formData.contratistaDomicilio?.trim() || '',
        repse: formData.contratistaREPSE?.trim() || ''
      };

      const isUpdate = Boolean(selectedSubcontratistaId && selectedSubcontratistaId !== 'new');

      const performSave = async () => {
        if (isUpdate) {
          const { error: updateError } = await supabase
            .from('subcontratistas')
            .update(payload)
            .eq('id', selectedSubcontratistaId);
          
          if (updateError) throw updateError;
        } else {
          const { data: insertData, error: insertError } = await supabase
            .from('subcontratistas')
            .insert([payload])
            .select();

          if (insertError) throw insertError;
          if (insertData && insertData.length > 0) {
            setSelectedSubcontratistaId(insertData[0].id);
          }
        }

        // Refetch list to sync state
        const { data: refreshedData, error: refetchError } = await supabase
          .from('subcontratistas')
          .select('*')
          .order('razon_social', { ascending: true });

        if (!refetchError && refreshedData) {
          setSubcontratistas(refreshedData);
        }
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Respuesta lenta de la base de datos (Timeout 10s)')), 10000)
      );

      await Promise.race([performSave(), timeoutPromise]);

      setNotification({
        type: 'success',
        message: isUpdate ? "Subcontratista actualizado correctamente." : "Nuevo subcontratista guardado correctamente."
      });

    } catch (error: any) {
      console.error("Error al guardar subcontratista:", error);
      setNotification({
        type: 'error',
        message: "Error al guardar: " + (error?.message || error?.details || "Ocurrió un error inesperado")
      });
    } finally {
      setIsSavingSubcontratista(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedBudget) {
      alert("Por favor selecciona un presupuesto base.");
      return;
    }
    if (!formData.contratistaRazonSocial || !formData.montoSubcontrato) {
      alert("Por favor ingresa la razón social del contratista y el monto a pagar.");
      return;
    }

    setIsGenerating(true);

    try {
      const element = document.createElement('div');
      
      const logoUrl = window.location.origin + '/Logo_esol_b.png';
      
      const parseFecha = (dateString: string) => {
        if (!dateString) return '____';
        const [y, m, d] = dateString.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
        const dayNum = dateObj.getDate();
        const yearNum = dateObj.getFullYear();
        const monthName = dateObj.toLocaleDateString('es-MX', { month: 'long' });
        
        return `${dayNum.toString().padStart(2, '0')} (${numeroALetrasSimple(dayNum)}) de ${monthName} de ${yearNum} (${numeroALetrasSimple(yearNum)})`;
      };

      const fechaInicioStr = parseFecha(formData.fechaInicio);
      const fechaTerminoStr = parseFecha(formData.fechaTermino);
      const formatConceptos = (text: string) => {
        if (!text) return '';
        const lines = text.split('\n').filter(l => l.trim() !== '');
        let html = '<table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 10px; line-height: 1.3;">';
        lines.forEach(line => {
          if (line.includes('|')) {
            const parts = line.split('|');
            html += `<tr><td style="width: 100px; padding-bottom: 2px; vertical-align: top; white-space: nowrap;">${parts[0].trim()}</td><td style="width: 15px; padding-bottom: 2px; vertical-align: top; text-align: center;">|</td><td style="padding-bottom: 2px; vertical-align: top;">${parts.slice(1).join('|').trim()}</td></tr>`;
          } else {
            html += `<tr><td colspan="3" style="padding-bottom: 2px;">${line}</td></tr>`;
          }
        });
        html += '</table>';
        return html;
      };

      const descEquiposHTML = formatConceptos(formData.descripcionEquipos);
      const addsEquiposHTML = formatConceptos(formData.adicionalesEquipos);

      element.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;600;700&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Montserrat', sans-serif; color: #0f172a; margin: 0; padding: 0; }
          .letter-sheet {
            width: 216mm;
            height: 558mm; /* Exactly 2 letter pages */
            padding: 20mm;
            margin: 0 auto;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.6;
            position: relative;
            overflow: hidden;
          }
          .title-box { text-align: center; margin-bottom: 25px; }
          h2 { font-family: 'Cinzel', serif; font-size: 16px; margin: 0; font-weight: 700; border-bottom: 2px solid #0f172a; padding-bottom: 6px; display: inline-block; }
          h3 { font-size: 12px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; font-weight: 700; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
          .bold { font-weight: 700; }
          p { text-align: justify; margin-bottom: 12px; margin-top: 0; font-size: 11px; color: #334155; }
          ul { margin-top: 0; margin-bottom: 12px; padding-left: 20px; text-align: justify; color: #334155; }
          li { margin-bottom: 4px; }
          .conceptos-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 15px; margin-bottom: 15px; color: #1e293b; }
          .signatures { position: absolute; bottom: 40mm; left: 0; width: 100%; box-sizing: border-box; padding: 0 20mm; display: flex; justify-content: space-evenly; }
          .sig-box { width: 40%; text-align: center; }
          .sig-line { border-top: 1px solid #0f172a; margin-top: 50px; margin-bottom: 5px; }
          .sig-name { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #0f172a; }
          .sig-role { font-size: 9px; color: #475569; }
          .page-2-start { position: absolute; top: 279mm; left: 0; width: 100%; box-sizing: border-box; padding: 20mm; padding-top: 0; }
        </style>
        
        <div class="letter-sheet">
          <!-- Page 1 Content -->
          <div class="title-box">
            <h2>CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS DE OBRA E INSTALACIÓN (SUBCONTRATACIÓN)</h2>
          </div>
          
          <p>
            CONTRATO DE PRESTACIÓN DE SERVICIOS ESPECIALIZADOS QUE CELEBRAN POR UNA PARTE <span class="bold">${formData.empresaRazonSocial.toUpperCase()} (ESOL ENERGÍAS)</span>, REPRESENTADA EN ESTE ACTO POR EL(LA) C. <span class="bold">${formData.empresaRepresentante.toUpperCase()}</span>, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ <span class="bold">"EL CONTRATANTE"</span>; Y POR LA OTRA PARTE <span class="bold">${formData.contratistaRazonSocial.toUpperCase()}</span>, REPRESENTADA EN ESTE ACTO POR EL(LA) C. <span class="bold">${formData.contratistaRepresentante.toUpperCase()}</span>, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ <span class="bold">"EL SUBCONTRATISTA"</span>, AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:
          </p>

          <h3>DECLARACIONES</h3>
          <p><span class="bold">I. DECLARA "EL CONTRATANTE":</span></p>
          <ul>
            <li>Ser una sociedad mercantil o persona física con actividad empresarial legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos, con R.F.C.: <span class="bold">${formData.empresaRFC}</span>.</li>
            <li>Que su domicilio fiscal se ubica en: <span class="bold">${formData.empresaDomicilio}</span>.</li>
            <li>Que requiere contratar servicios especializados de instalación para el proyecto de su cliente final: <span class="bold">${formData.clienteFinal}</span>, y que dichos servicios no forman parte de su objeto social ni de su actividad económica preponderante, en estricto apego a lo establecido en el artículo 15 de la Ley Federal del Trabajo.</li>
          </ul>

          <p><span class="bold">II. DECLARA "EL SUBCONTRATISTA":</span></p>
          <ul>
            <li>Estar legalmente constituido y registrado con R.F.C.: <span class="bold">${formData.contratistaRFC}</span> y domicilio fiscal en: <span class="bold">${formData.contratistaDomicilio}</span>.</li>
            <li>Contar con la experiencia, personal capacitado, herramientas y capacidad técnica y financiera para realizar instalaciones electromecánicas y fotovoltaicas.</li>
            ${formData.contratistaREPSE ? `<li>Que cuenta con el Registro en el Padrón Público de Contratistas de Servicios Especializados u Obras Especializadas (REPSE) número: <span class="bold">${formData.contratistaREPSE}</span> expedido por la Secretaría del Trabajo y Previsión Social, el cual se encuentra vigente.</li>` : ''}
          </ul>

          <h3>CLÁUSULAS</h3>
          <p><span class="bold">PRIMERA. OBJETO.</span> "EL CONTRATANTE" encomienda a "EL SUBCONTRATISTA", y este se obliga a prestar los servicios especializados de instalación y montaje electromecánico en el domicilio de la obra ubicado en: <span class="bold">${formData.direccionObra}</span>, respecto de los siguientes equipos suministrados por "EL CONTRATANTE":</p>
          
          <p class="bold" style="margin-bottom: 2px;">EQUIPOS PRINCIPALES:</p>
          <div class="conceptos-box">
            ${descEquiposHTML}
          </div>
          
          ${addsEquiposHTML ? `
          <p class="bold" style="margin-bottom: 2px;">MATERIALES ADICIONALES:</p>
          <div class="conceptos-box">
            ${addsEquiposHTML}
          </div>
          ` : ''}
          
          <!-- Page 2 Content -->
          <div class="page-2-start">
            <p><span class="bold">SEGUNDA. EXCLUSIONES.</span> "EL SUBCONTRATISTA" no será responsable de realizar ningún tipo de trámite, gestión o interconexión ante CFE (Comisión Federal de Electricidad). Su labor se limita estrictamente a la obra electromecánica e instalación física descrita en la Cláusula Primera.</p>

            <p><span class="bold">TERCERA. IMPORTE Y FORMA DE PAGO.</span> Como contraprestación por los servicios, "EL CONTRATANTE" pagará a "EL SUBCONTRATISTA" la cantidad total de <span class="bold">${formatCurrency(formData.montoSubcontrato)} (${numeroALetras(formData.montoSubcontrato)})</span>. El pago se realizará previa entrega del Comprobante Fiscal Digital por Internet (CFDI) correspondiente que cumpla con todos los requisitos fiscales vigentes.</p>

            <p><span class="bold">CUARTA. VIGENCIA Y EJECUCIÓN.</span> Las partes acuerdan que los trabajos de instalación darán inicio el día <span class="bold">${fechaInicioStr}</span> y concluirán a más tardar el día <span class="bold">${fechaTerminoStr}</span>.</p>

            <p><span class="bold">QUINTA. INDEPENDENCIA LABORAL Y BLINDAJE (REPSE).</span> "EL SUBCONTRATISTA" asume expresamente la responsabilidad total como patrón del personal que utilice para la ejecución de los servicios objeto de este contrato, liberando a "EL CONTRATANTE" y a su cliente final de cualquier responsabilidad laboral, civil, penal o de seguridad social. En apego a la Ley Federal del Trabajo, "EL SUBCONTRATISTA" se obliga a entregar mensualmente a "EL CONTRATANTE" los comprobantes fiscales por concepto de pago de salarios de los trabajadores involucrados, así como los recibos de pago de cuotas obrero-patronales al IMSS y aportaciones al INFONAVIT.</p>

            <p><span class="bold">SEXTA. RESPONSABILIDAD CIVIL Y DAÑOS.</span> "EL SUBCONTRATISTA" será el único responsable de cualquier daño o perjuicio ocasionado en el inmueble del cliente final <span class="bold">(${formData.clienteFinal})</span> derivado de negligencia, impericia o mala ejecución durante la realización de los trabajos de instalación, obligándose a resarcir los daños generados a su costa.</p>

            <p><span class="bold">SÉPTIMA. CONFIDENCIALIDAD.</span> "EL SUBCONTRATISTA" se obliga a mantener estricta confidencialidad respecto de los datos del cliente final y la información técnica, comercial o financiera proporcionada por "EL CONTRATANTE".</p>

            <p><span class="bold">OCTAVA. JURISDICCIÓN.</span> Para la interpretación y cumplimiento de este contrato, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad donde radica el domicilio fiscal de "EL CONTRATANTE", renunciando a cualquier otro fuero que pudiera corresponderles.</p>

            <p style="margin-top: 15px; text-align: center;">Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman de conformidad el día <strong>${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${formData.empresaRepresentante.toUpperCase()}</div>
              <div class="sig-role">REPRESENTANTE LEGAL</div>
              <div class="sig-role">${formData.empresaRazonSocial.toUpperCase()}</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${formData.contratistaRepresentante.toUpperCase()}</div>
              <div class="sig-role">"EL SUBCONTRATISTA"</div>
              <div class="sig-role">${formData.contratistaRazonSocial.toUpperCase()}</div>
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Subcontrato_${formData.contratistaRazonSocial.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      
    } catch (err: any) {
      console.error("Error al generar PDF de subcontratación:", err);
      alert("Error al generar PDF: " + (err.message || "Error al exportar"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-xl font-light text-cream">Contratos de Subcontratación de Obra</h3>
            <p className="text-sm text-cream-muted">Genera contratos para integradores y cuadrillas externas (Blindaje Legal y REPSE).</p>
          </div>
        </div>
        
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating || !selectedBudget}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold text-dark-1 font-bold rounded-xl hover:bg-yellow-500 transition-all shadow-[0_0_15px_rgba(196,152,37,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lado Izquierdo: Datos del Contrato y Obra */}
        <div className="space-y-6">
          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4">
            <h4 className="text-sm font-medium text-gold flex items-center gap-2 border-b border-dark-4 pb-3 mb-4">
              <Search className="w-4 h-4" /> Selección de Obra
            </h4>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-cream-muted mb-1">Seleccionar Presupuesto Base</label>
              <select
                value={selectedBudget}
                onChange={(e) => handleBudgetSelection(e.target.value)}
                className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold focus:ring-1 focus:ring-gold outline-none"
              >
                <option value="">-- Seleccionar Proyecto --</option>
                {budgets.map(b => (
                  <option key={b.id} value={b.id}>{b.project_name || b.name}</option>
                ))}
              </select>
            </div>
            
            {isLoading && (
              <div className="flex items-center gap-2 text-gold text-sm mt-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando conceptos...
              </div>
            )}
          </div>

          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4 space-y-4">
            <h4 className="text-sm font-medium text-gold flex items-center gap-2 border-b border-dark-4 pb-2">
              <MapPin className="w-4 h-4" /> Datos del Contrato y Obra
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">Cliente Final (Referencia)</label>
                <input
                  type="text"
                  value={formData.clienteFinal}
                  onChange={e => setFormData({...formData, clienteFinal: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  disabled
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">Dirección de Instalación</label>
                <input
                  type="text"
                  value={formData.direccionObra}
                  onChange={e => setFormData({...formData, direccionObra: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  placeholder="Calle, Número, Colonia, Ciudad..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">Monto a Pagar al Subcontratista</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-cream-muted" />
                  </div>
                  <input
                    type="number"
                    value={formData.montoSubcontrato || ''}
                    onChange={e => setFormData({...formData, montoSubcontrato: Number(e.target.value)})}
                    className="w-full bg-dark-1 border border-dark-4 rounded-lg pl-9 pr-3 py-2 text-cream focus:border-gold outline-none text-sm"
                    placeholder="Monto total del servicio"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Fecha Término</label>
                <input
                  type="date"
                  value={formData.fechaTermino}
                  onChange={e => setFormData({...formData, fechaTermino: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">Equipos Principales (Auto-generada)</label>
                <textarea
                  rows={4}
                  value={formData.descripcionEquipos}
                  onChange={e => setFormData({...formData, descripcionEquipos: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-xs font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-cream-muted mb-1">Materiales Adicionales (Auto-generada)</label>
                <textarea
                  rows={4}
                  value={formData.adicionalesEquipos}
                  onChange={e => setFormData({...formData, adicionalesEquipos: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Datos del Subcontratista */}
        <div className="space-y-6">
          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4 space-y-4">
            {notification && (
              <div className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between transition-all ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                <span>{notification.message}</span>
                <button type="button" onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100 font-bold ml-2">✕</button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-dark-4 pb-3">
              <h4 className="text-sm font-medium text-gold flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Datos del Subcontratista (Cuadrilla / Instalador)
              </h4>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedSubcontratistaId}
                  onChange={(e) => handleSubcontratistaSelection(e.target.value)}
                  className="bg-dark-1 border border-dark-4 rounded-lg px-2 py-1.5 text-cream text-xs focus:border-gold outline-none flex-1 sm:w-48"
                >
                  <option value="">-- Seleccionar Guardado --</option>
                  <option value="new">+ Crear Nuevo Perfil</option>
                  {subcontratistas.map(s => (
                    <option key={s.id} value={s.id}>{s.razon_social}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={(e) => handleSaveSubcontratista(e)}
                  disabled={isSavingSubcontratista}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  title="Guardar / Actualizar Perfil"
                >
                  {isSavingSubcontratista ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-gold" />
                      <span>Guardar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Razón Social o Nombre Completo</label>
                <input
                  type="text"
                  value={formData.contratistaRazonSocial}
                  onChange={e => setFormData({...formData, contratistaRazonSocial: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  placeholder="Ej. Instalaciones Solares S.A. o Nombre de Persona Física"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Representante Legal</label>
                <input
                  type="text"
                  value={formData.contratistaRepresentante}
                  onChange={e => setFormData({...formData, contratistaRepresentante: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  placeholder="Nombre del apoderado (si aplica)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">RFC</label>
                <input
                  type="text"
                  value={formData.contratistaRFC}
                  onChange={e => setFormData({...formData, contratistaRFC: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  placeholder="RFC con homoclave"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Domicilio Fiscal</label>
                <textarea
                  rows={2}
                  value={formData.contratistaDomicilio}
                  onChange={e => setFormData({...formData, contratistaDomicilio: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  placeholder="Calle, Número, Colonia, Ciudad, Estado, C.P."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Registro REPSE (Opcional)</label>
                <input
                  type="text"
                  value={formData.contratistaREPSE}
                  onChange={e => setFormData({...formData, contratistaREPSE: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                  placeholder="Núm. de Registro STPS"
                />
              </div>
            </div>
          </div>

          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4 space-y-4">
            <h4 className="text-sm font-medium text-gold flex items-center gap-2 border-b border-dark-4 pb-2">
              <Building2 className="w-4 h-4" /> Datos de la Empresa eSol (Contratante)
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Razón Social o Nombre Completo</label>
                <input
                  type="text"
                  value={formData.empresaRazonSocial}
                  onChange={e => setFormData({...formData, empresaRazonSocial: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Representante Legal</label>
                <input
                  type="text"
                  value={formData.empresaRepresentante}
                  onChange={e => setFormData({...formData, empresaRepresentante: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">RFC de Empresa</label>
                <input
                  type="text"
                  value={formData.empresaRFC}
                  onChange={e => setFormData({...formData, empresaRFC: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none uppercase text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Domicilio Fiscal</label>
                <textarea
                  rows={2}
                  value={formData.empresaDomicilio}
                  onChange={e => setFormData({...formData, empresaDomicilio: e.target.value})}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
