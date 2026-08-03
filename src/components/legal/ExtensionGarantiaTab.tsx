import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { Save, Download, FileText, Calendar, DollarSign, MapPin, Building2, User } from 'lucide-react';
import { getPresupuestos, getPresupuestoDetails } from '../../lib/cotizadorService';
import html2pdf from 'html2pdf.js';

interface ExtensionGarantiaTabProps {
  initialBudgetId?: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
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

  return letras.trim() + ' PESOS ' + decimalPart.toString().padStart(2, '0') + '/100 M.N.';
};

export default function ExtensionGarantiaTab({ initialBudgetId }: ExtensionGarantiaTabProps) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clienteFinal: '',
    direccionInstalacion: '',
    tamanoSistema: '',
    montoAnual: 0,
    fechaInicio: new Date().toISOString().split('T')[0]
  });

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
    fetchBudgets();
  }, [initialBudgetId]);

  const handleBudgetSelection = async (id: string, budgetList = budgets) => {
    setSelectedBudget(id);
    const budget = budgetList.find(b => b.id === id);
    if (!budget) return;

    try {
      setIsLoading(true);
      const details = await getPresupuestoDetails(id);
      
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

      // Extract system size info (sum panels)
      const topLevelItems = details.conceptos.filter((c: any) => !c.parent_id);
      let totalPanels = 0;
      topLevelItems.forEach((c: any) => {
        if (c.type !== 'group') {
          const desc = (c.description || '').toLowerCase();
          const subcat = (c.matriz?.subcategory || '').toLowerCase();
          
          // Exclude false positives (structures, labor, paperwork)
          if (desc.includes('estructura') || subcat.includes('estructura')) return;
          if (desc.includes('mano de obra') || subcat.includes('mano de obra')) return;
          if (subcat.includes('tramite') || subcat.includes('trámite')) return;
          
          if (desc.includes('panel') || desc.includes('módulo') || desc.includes('modulo')) {
            totalPanels += Number(c.quantity) || 0;
          }
        }
      });
      
      let tamanoStr = totalPanels > 0 ? `${totalPanels} Paneles Solares` : 'Sistema Fotovoltaico Estándar';

      setFormData(prev => ({
        ...prev,
        clienteFinal: budget.client_name || '',
        direccionInstalacion: finalAddress,
        tamanoSistema: tamanoStr
      }));
    } catch (error) {
      console.error("Error fetching budget details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedBudget) {
      alert("Por favor selecciona un presupuesto/obra base.");
      return;
    }
    if (!formData.montoAnual) {
      alert("Por favor ingresa el monto anual de la póliza.");
      return;
    }

    setIsGenerating(true);

    try {
      const element = document.createElement('div');
      
      const parseFechaText = (dateString: string) => {
        if (!dateString) return '----';
        const [y, m, d] = dateString.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
        return dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      };

      // Calculate the 4 maintenance visits based on start date
      const startDate = new Date(formData.fechaInicio);
      
      // Calculate months
      const getFutureDate = (monthsAdded: number) => {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + monthsAdded);
          return d;
      };

      const visitDates = [
        getFutureDate(3),
        getFutureDate(6),
        getFutureDate(9),
        getFutureDate(12),
      ].map(d => d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase());

      element.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Montserrat', sans-serif; color: #0f172a; margin: 0; padding: 0; }
          .letter-sheet {
            width: 216mm;
            height: 279mm;
            padding: 12mm 15mm;
            margin: 0 auto;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.3;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          /* Modern Header */
          .header-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 4px solid #d4af37;
          }
          .header-title {
            font-family: 'Cinzel', serif;
            font-size: 18px;
            margin: 0;
            color: #d4af37; /* Gold */
            letter-spacing: 1px;
          }
          .header-subtitle {
            font-size: 10px;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.9;
          }

          /* Info Grid */
          .info-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
          }
          .info-item {
            flex: 1 1 45%;
            background: #f8fafc;
            padding: 10px;
            border-radius: 8px;
            border-left: 3px solid #d4af37;
          }
          .info-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 11px;
            font-weight: 600;
            color: #0f172a;
          }

          /* Section Titles */
          .section-title {
            font-family: 'Cinzel', serif;
            font-size: 12px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 10px;
            margin-top: 10px;
            font-weight: 700;
          }

          /* Two columns for terms */
          .terms-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .term-box {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .term-box h4 {
            margin: 0 0 8px 0;
            font-size: 10px;
            color: #0f172a;
            text-transform: uppercase;
            font-weight: 700;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }
          .term-box ul {
            margin: 0;
            padding-left: 16px;
            font-size: 9.5px;
            color: #1e293b;
            list-style-type: disc;
            font-weight: 500;
          }
          .term-box li {
            margin-bottom: 4px;
            text-align: left;
            line-height: 1.3;
          }

          /* Maintenance Schedule Table */
          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9.5px;
          }
          .schedule-table th {
            background: #f1f5f9;
            color: #1e293b;
            font-weight: 700;
            padding: 6px;
            text-align: left;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 8.5px;
          }
          .schedule-table td {
            padding: 6px;
            border: 1px solid #cbd5e1;
            font-weight: 600;
            color: #0f172a;
          }
          
          /* Warning Box */
          .warning-box {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
          }
          .warning-box p {
            margin: 0;
            font-size: 9.5px;
            color: #92400e;
            text-align: justify;
            font-weight: 600;
          }

          /* Signatures */
          .signatures {
            margin-top: auto;
            display: flex;
            justify-content: space-evenly;
            padding-top: 5px;
            padding-bottom: 10px;
          }
          .sig-box {
            width: 40%;
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #0f172a;
            margin-top: 35px;
            margin-bottom: 5px;
          }
          .sig-name { font-size: 10px; font-weight: 700; text-transform: uppercase; }
          .sig-role { font-size: 9px; color: #475569; font-weight: 500; }
        </style>
        
        <div class="letter-sheet">
          
          <!-- Header -->
          <div class="header-box">
            <h2 class="header-title">PÓLIZA DE GARANTÍA EXTENDIDA</h2>
            <div class="header-subtitle">Certificado Oficial de Operación y Mantenimiento Anual</div>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Titular de la Póliza</div>
              <div class="info-value">${formData.clienteFinal.toUpperCase()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de Emisión</div>
              <div class="info-value">${parseFechaText(formData.fechaInicio)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Ubicación del Sistema</div>
              <div class="info-value">${formData.direccionInstalacion}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Capacidad del Sistema</div>
              <div class="info-value">${formData.tamanoSistema}</div>
            </div>
          </div>

          <!-- Terms Grid -->
          <div class="section-title">COBERTURA DEL SERVICIO ANUAL</div>
          <div class="terms-grid">
            <div class="term-box">
              <h4>¿Qué Incluye la Póliza?</h4>
              <ul>
                <li><strong>4 Visitas Trimestrales</strong> de inspección física en&nbsp;sitio.</li>
                <li>Limpieza especializada de paneles solares para optimizar&nbsp;rendimiento.</li>
                <li>Termografía en tableros e inversores para detectar puntos&nbsp;calientes.</li>
                <li>Revisión de torque, conexiones eléctricas y estructura de&nbsp;montaje.</li>
                <li>Actualización de firmware de inversores y auditoría de&nbsp;monitoreo.</li>
                <li>Asesoría técnica prioritaria ante variaciones de red&nbsp;(CFE).</li>
              </ul>
            </div>
            <div class="term-box">
              <h4>Exclusiones Principales</h4>
              <ul>
                <li>Daños causados por fenómenos meteorológicos (huracanes,&nbsp;tormentas).</li>
                <li>Fallas derivadas por sobretensiones extremas o apagones de&nbsp;CFE.</li>
                <li>Vandalismo, robo parcial o total del sistema o sus&nbsp;componentes.</li>
                <li>Modificaciones o manipulaciones realizadas por personal ajeno a&nbsp;ESOL.</li>
                <li>Reemplazo de equipos cuya garantía de fábrica haya&nbsp;expirado.</li>
              </ul>
            </div>
          </div>

          <!-- Important Legal Warning -->
          <div class="warning-box">
            <p><strong>CONDICIONANTE LEGAL DE GARANTÍA:</strong> La validez de la garantía de instalación original de ESOL, así como la gestión gratuita de trámites de reemplazo de garantías con el fabricante original de los equipos, está estrictamente condicionada a la vigencia de la presente póliza. Si personal no autorizado manipula el sistema, o si se omite el mantenimiento preventivo, la garantía total quedará invalidada.</p>
          </div>

          <!-- Schedule -->
          <div class="section-title">CALENDARIO DE VISITAS PROYECTADO</div>
          <table class="schedule-table">
            <thead>
              <tr>
                <th>Visita</th>
                <th>Periodo Estimado</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mantenimiento Trimestral 1</td>
                <td><strong>${visitDates[0]}</strong></td>
                <td>Programado</td>
              </tr>
              <tr>
                <td>Mantenimiento Trimestral 2</td>
                <td><strong>${visitDates[1]}</strong></td>
                <td>Programado</td>
              </tr>
              <tr>
                <td>Mantenimiento Trimestral 3</td>
                <td><strong>${visitDates[2]}</strong></td>
                <td>Programado</td>
              </tr>
              <tr>
                <td>Mantenimiento Trimestral 4</td>
                <td><strong>${visitDates[3]}</strong></td>
                <td>Programado</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 10px; margin-bottom: 5px; text-align: justify; color: #334155;">
            Por el presente instrumento se avala que el sistema fotovoltaico se encuentra bajo el esquema de Operación y Mantenimiento Anual. 
            Monto de Inversión Único Anual: <strong>${formatCurrency(formData.montoAnual)} (${numeroALetras(formData.montoAnual)})</strong>.
          </div>

          <!-- Signatures -->
          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">ESOL ENERGÍAS</div>
              <div class="sig-role">Área de Ingeniería y Mantenimiento</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${formData.clienteFinal.toUpperCase()}</div>
              <div class="sig-role">Titular del Sistema / Cliente</div>
            </div>
          </div>

        </div>
      `;

      const opt = {
        margin:       0,
        filename:     `Poliza_Garantia_${formData.clienteFinal}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6 pb-6 border-b border-dark-4">
        <h3 className="text-xl font-light text-cream flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold" />
          Generador de Póliza de Garantía Extendida
        </h3>
        <p className="text-sm text-cream-muted mt-2">
          Crea un certificado de mantenimiento (O&M) moderno para blindar la postventa de tus clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cream-muted mb-1">Presupuesto / Obra Base</label>
            <select
              value={selectedBudget}
              onChange={(e) => handleBudgetSelection(e.target.value)}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:outline-none focus:border-gold transition-colors"
            >
              <option value="">Seleccione una obra...</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>
                  {b.client_name || 'Sin Cliente'} - {b.project_name || b.nombre_proyecto || b.name || 'Sin Obra'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cream-muted mb-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              Titular del Sistema
            </label>
            <input
              type="text"
              value={formData.clienteFinal}
              onChange={e => setFormData({...formData, clienteFinal: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:outline-none focus:border-gold"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream-muted mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Dirección de Instalación
            </label>
            <textarea
              value={formData.direccionInstalacion}
              onChange={e => setFormData({...formData, direccionInstalacion: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:outline-none focus:border-gold h-20 resize-none custom-scrollbar"
              placeholder="Ubicación física"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cream-muted mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Capacidad del Sistema
            </label>
            <input
              type="text"
              value={formData.tamanoSistema}
              onChange={e => setFormData({...formData, tamanoSistema: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:outline-none focus:border-gold"
              placeholder="Ej. 12 Paneles Solares"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream-muted mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Fecha de Inicio de Póliza
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream-muted mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Monto Anual de la Póliza (MXN)
            </label>
            <input
              type="number"
              min="0"
              value={formData.montoAnual || ''}
              onChange={e => setFormData({...formData, montoAnual: parseFloat(e.target.value) || 0})}
              className="w-full bg-dark-3 border border-dark-4 rounded-lg px-4 py-2 text-cream focus:outline-none focus:border-gold"
              placeholder="Costo total de 4 visitas"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-dark-4">
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating || !selectedBudget || !formData.montoAnual}
          className="bg-gold text-dark-1 px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {isGenerating ? 'Generando PDF...' : 'Generar Póliza PDF'}
        </button>
      </div>
    </div>
  );
}
