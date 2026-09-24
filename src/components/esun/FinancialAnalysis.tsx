import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  DollarSign, Landmark, TrendingUp, Calendar, ShieldCheck, Edit3,
  Plus, Trash2, X, Search, Layers, Box, RotateCcw
} from 'lucide-react';
import { SOLAR_CONSTANTS } from './lib/solarConstants';
import { calculateFinancials, type FinancialResult } from './lib/financialEngine';
import type { CFEData } from './lib/cfeParser';
import {
  getMatrices, getInsumos, getAllSavedGroups, calculateMatrixDirectCost, calculateMatrixSellingPrice
} from '../../lib/cotizadorService';
import type { Matriz, Insumo, PresupuestoConcepto } from '../../types/cotizador';
import EnvironmentalImpact from './EnvironmentalImpact';

export interface ProposalConceptItem {
  id: string;
  category: string;
  code?: string;
  quantity: number;
  unit: string;
  description: string;
  unit_price: number;
  matriz_id?: string;
  insumo_id?: string;
  is_auto?: boolean;
}

export function getInitialAutoConcepts(system: any): ProposalConceptItem[] {
  const isOffGrid = system?.projectType === 'off-grid';
  const panelQty = system?.num_panels || system?.numberOfPanels || 1;
  const inverterQty = system?.num_inverters || 1;
  const panelW = system?.panel_w || system?.panelWattage || 550;
  const totalW = panelQty * panelW;

  const base: ProposalConceptItem[] = [
    {
      id: 'auto-panel',
      category: 'Paneles Solares',
      code: 'APU-PANEL-550',
      quantity: panelQty,
      unit: 'pza',
      description: system?.panel_name || `Suministro e instalación de módulo fotovoltaico ${panelW}W Monocristalino`,
      unit_price: Math.round(panelW * 5.2),
      is_auto: true
    },
    {
      id: 'auto-inverter',
      category: 'Inversor',
      code: isOffGrid ? 'INV-OFFGRID' : ((system?.inverter_kw || 5) >= 10 ? 'APU-INVER-15K' : 'INV 5KW GROW'),
      quantity: inverterQty,
      unit: 'pza',
      description: system?.inverter_name || (isOffGrid ? `Inversor Aislado Off-Grid` : `Inversor Interconexión CFE ${system?.inverter_kw || 5} kW`),
      unit_price: isOffGrid ? 18000 : Math.round(((system?.inverter_kw || 5) * 10500) / inverterQty),
      is_auto: true
    },
    {
      id: 'auto-structure',
      category: 'Estructura de montaje',
      code: 'EST-K2-2N-COMP',
      quantity: panelQty,
      unit: 'pza',
      description: 'Estructura sencilla de 2 niveles con base a estructura K2 Completa',
      unit_price: 1250,
      is_auto: true
    },
    {
      id: 'auto-labor',
      category: 'Mano de Obra y Servicios',
      code: 'MO - MO - BT',
      quantity: panelQty,
      unit: 'mo',
      description: 'Mano de obra especializada BAJA TENSIÓN, incluye: Acarreo, montaje de estructura y paneles, intalacion electrica en AC y DC, puesta en marcha y todo lo necesario para su correcta ejecución.',
      unit_price: 950,
      is_auto: true
    },
    {
      id: 'auto-elec-dc',
      category: 'Material Eléctrico DC',
      code: 'ELC-MAT-DC',
      quantity: 1,
      unit: 'Lote',
      description: 'Suministro e instalacion de material eléctrico en "DC" corriente directa.',
      unit_price: Math.round(totalW * 1.25),
      is_auto: true
    },
    {
      id: 'auto-elec-ac',
      category: 'Material Eléctrico AC',
      code: 'ELC-MAT-AC',
      quantity: 1,
      unit: 'Lote',
      description: 'Suministro e instalacion de material eléctrico en "AC" corriente alterna.',
      unit_price: Math.round(totalW * 1.15),
      is_auto: true
    }
  ];

  if (isOffGrid) {
    // Para off-grid las baterías pueden venir en requiredBatteryCapacityAh o depender de la selección de sistema
    const batQty = system?.num_batteries || (system?.requiredBatteryCapacityAh ? Math.ceil(system.requiredBatteryCapacityAh / 100) : 1);
    base.push({
      id: 'auto-battery',
      category: 'Material electrico DC',
      code: 'APU-BATERIA-LITIO',
      quantity: batQty,
      unit: 'pz',
      description: system?.battery_name || 'Batería Ciclo Profundo / Litio',
      unit_price: 24000,
      is_auto: true
    });
  } else {
    base.push({
      id: 'auto-tramite',
      category: 'Tramites',
      code: 'TR - TRAMITE - CFE',
      quantity: 1,
      unit: 'Tramite',
      description: 'Servicio de tramitologia para interconexion a CFE, incluye: armado de expediente, gestion y todo lo necesario para puesta de medidor.',
      unit_price: 4500,
      is_auto: true
    });
  }

  return base;
}

export function getEffectiveConcepts(customConcepts: ProposalConceptItem[] | undefined, system: any): ProposalConceptItem[] {
  return (customConcepts || getInitialAutoConcepts(system)).map(c => {
    // Migration: Map fake 'INV' code to real matrix codes so it hydrates correctly
    if (c.code === 'INV') {
      c = { ...c, code: (system?.inverter_kw || 5) >= 10 ? 'APU-INVER-15K' : 'INV 5KW GROW' };
    }

    // Migration: Fix legacy categories that were saved as 'Otros'
    if (c.id === 'auto-inverter' && c.category === 'Otros') {
      c = { ...c, category: 'Inversor' };
    }
    if (c.id === 'auto-structure' && c.category === 'Otros') {
      c = { ...c, category: 'Estructura de montaje' };
    }

    // Migration: If an old proposal saved Material Electrico with the totalW quantity (e.g., 6000), reset it to 1.
    if (c.is_auto && (c.code === 'ELC-MAT-DC' || c.code === 'ELC-MAT-AC') && Number(c.quantity) > 1) {
      return { ...c, quantity: 1, unit: 'Lote' };
    }

    // Auto-sync quantities with system configuration if it hasn't been manually detached
    if (c.is_auto) {
      const panelQty = system?.num_panels || 1;
      const inverterQty = system?.num_inverters || 1;
      const batQty = system?.num_batteries || 1;
      
      if (c.id === 'auto-panel' || c.code === 'APU-PANEL-550') {
        c = { 
          ...c, 
          code: system?.panel_code || c.code,
          quantity: panelQty, 
          description: system?.panel_name || c.description,
          unit_price: system?.panel_price ? Math.round(system.panel_price * 1.15) : c.unit_price // add 15% markup to cost if dynamic
        };
      } else if (c.id === 'auto-inverter' || c.code === 'APU-INVER-15K' || c.code === 'INV 5KW GROW' || c.code === 'INV-OFFGRID') {
        c = { 
          ...c, 
          code: system?.inverter_code || c.code,
          quantity: inverterQty, 
          description: system?.inverter_name || c.description,
          unit_price: system?.inverter_price ? Math.round(system.inverter_price * 1.15) : c.unit_price
        };
      } else if (c.id === 'auto-battery' || c.code === 'APU-BATERIA-LITIO') {
        c = { 
          ...c, 
          code: system?.battery_code || c.code,
          quantity: batQty, 
          description: system?.battery_name || c.description,
          unit_price: system?.battery_price ? Math.round(system.battery_price * 1.15) : c.unit_price
        };
      }
      
      if (c.code === 'EST-K2-2N-COMP' || c.code === 'MO - MO - BT') {
        c = { ...c, quantity: panelQty };
      }
    }

    return c;
  });
}

interface FinancialAnalysisProps {
  system: any;
  cfeData: CFEData;
  financialParams: any;
  onChangeFinancialParams: (params: any) => void;
}

export default function FinancialAnalysis({
  system,
  cfeData,
  financialParams,
  onChangeFinancialParams
}: FinancialAnalysisProps) {
  const { isCredit, interestRate, termMonths, manualCost } = financialParams;
  
  // Proportional Cost Forcing state
  const [isForcingTotal, setIsForcingTotal] = useState(false);
  const [forcedTotalInput, setForcedTotalInput] = useState<string>('');
  const [baseSnapshot, setBaseSnapshot] = useState<ProposalConceptItem[]>([]);
  const [snapshotTotal, setSnapshotTotal] = useState<number>(0);

  // Catalog Picker State
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'matrices' | 'insumos' | 'grupos'>('matrices');
  const [searchQuery, setSearchQuery] = useState('');
  const [matricesList, setMatricesList] = useState<Matriz[]>([]);
  const [insumosList, setInsumosList] = useState<Insumo[]>([]);
  const [groupsList, setGroupsList] = useState<{ group: PresupuestoConcepto; insumos: PresupuestoConcepto[] }[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Price Editing state for currency formatting
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [rawPriceInput, setRawPriceInput] = useState<string>('');

  // Hydration state for auto-concepts
  const [hydratedAuto, setHydratedAuto] = useState<Record<string, Partial<ProposalConceptItem>>>({});

  // Load catalog on modal open
  useEffect(() => {
    if (isCatalogOpen && matricesList.length === 0 && insumosList.length === 0) {
      setIsLoadingCatalog(true);
      Promise.all([getMatrices(), getInsumos(), getAllSavedGroups()])
        .then(([mRes, iRes, gRes]) => {
          setMatricesList(mRes);
          setInsumosList(iRes);
          setGroupsList(gRes);
        })
        .catch(err => console.error('Error fetching ESOL catalog:', err))
        .finally(() => setIsLoadingCatalog(false));
    }
  }, [isCatalogOpen, matricesList.length, insumosList.length]);

  // Concepts list state
  const baseConcepts: ProposalConceptItem[] = getEffectiveConcepts(financialParams.customConcepts, system);

  // Apply hydration locally so we don't force save to customConcepts and freeze system updates
  const concepts: ProposalConceptItem[] = baseConcepts.map(c => {
    if (c.is_auto && c.code && hydratedAuto[c.code]) {
      const hydrated = hydratedAuto[c.code];
      // Do not overwrite dynamic descriptions synced from system config
      if (c.id === 'auto-panel' || c.id === 'auto-inverter' || c.code === 'APU-PANEL-550' || c.code === 'APU-INVER-15K' || c.code === 'INV 5KW GROW') {
        const { description, ...rest } = hydrated;
        return { ...c, ...rest, description: c.description };
      }
      return { ...c, ...hydrated };
    }
    return c;
  });

  // Automatically update the total manual cost for the financial engine if hydration changes it
  const hydratedTotalCost = Math.round(concepts.reduce((acc, c) => acc + (Number(c.quantity || 0) * Number(c.unit_price || 0)), 0));
  useEffect(() => {
    if (financialParams.manualCost !== hydratedTotalCost) {
      onChangeFinancialParams({
        ...financialParams,
        manualCost: hydratedTotalCost
      });
    }
  }, [hydratedTotalCost, financialParams.manualCost]);

  const handleUpdateConcepts = (newConcepts: ProposalConceptItem[]) => {
    const totalCost = newConcepts.reduce((acc, c) => acc + (Number(c.quantity || 0) * Number(c.unit_price || 0)), 0);
    onChangeFinancialParams({
      ...financialParams,
      customConcepts: newConcepts,
      manualCost: Math.round(totalCost)
    });
  };

  // Hydrate auto concepts with real data from Supabase
  // For PANELS and INVERTERS: use the insumo directly (system.panel_id / system.inverter_id)
  // For everything else: use the matrix data (prices calculated from matrix insumos)
  useEffect(() => {
    const needsHydration = baseConcepts.some(c => c.is_auto && !hydratedAuto[c.code || ''] && c.code);
    if (!needsHydration) return;

    const panelCodes = ['APU-PANEL-550'];
    const inverterCodes = ['APU-INVER-15K', 'INV 5KW GROW'];
    const insumoDirectCodes = [...panelCodes, ...inverterCodes];

    Promise.all([getMatrices(), getInsumos()]).then(([matrices, allInsumos]) => {
      const newHydrated: Record<string, Partial<ProposalConceptItem>> = { ...hydratedAuto };
      let changed = false;

      baseConcepts.forEach(c => {
        if (c.is_auto && c.code && !hydratedAuto[c.code]) {
          // --- PANELS & INVERTERS: Pull directly from the insumo catalog ---
          if (insumoDirectCodes.includes(c.code)) {
            let matchedInsumo: any = null;

            if (panelCodes.includes(c.code) && system?.panel_id && system.panel_id !== 'manual') {
              matchedInsumo = allInsumos.find((ins: any) => ins.id === system.panel_id);
            } else if (inverterCodes.includes(c.code) && system?.inverter_id && system.inverter_id !== 'manual') {
              matchedInsumo = allInsumos.find((ins: any) => ins.id === system.inverter_id);
            }

            if (matchedInsumo) {
              // Also grab the matrix for the subcategory label
              const matchedMatrix = matrices.find(m => m.code === c.code);
              newHydrated[c.code] = {
                unit_price: Number(matchedInsumo.cost) || c.unit_price,
                description: matchedInsumo.description || c.description,
                unit: matchedInsumo.unit || c.unit,
                category: matchedMatrix?.subcategory || c.category,
                insumo_id: matchedInsumo.id
              };
              changed = true;
            } else {
              // Fallback: use matrix subcategory even if no insumo match
              const matchedMatrix = matrices.find(m => m.code === c.code);
              if (matchedMatrix) {
                newHydrated[c.code] = {
                  matriz_id: matchedMatrix.id,
                  unit_price: c.unit_price,
                  description: matchedMatrix.description || c.description,
                  unit: matchedMatrix.unit || c.unit,
                  category: matchedMatrix.subcategory || c.category
                };
                changed = true;
              }
            }
          } else {
            // --- ALL OTHER CONCEPTS: Use the matrix calculation as before ---
            const matched = matrices.find(m => m.code === c.code);
            if (matched) {
              const directCost = calculateMatrixDirectCost(matched.insumos || [], c.quantity);
              const sellingPrice = calculateMatrixSellingPrice(
                directCost,
                matched.indirect_percentage || 10,
                matched.utility_percentage || 8
              );
              newHydrated[c.code] = {
                matriz_id: matched.id,
                unit_price: sellingPrice > 0 ? sellingPrice : c.unit_price,
                description: matched.description || c.description,
                unit: matched.unit || c.unit,
                category: matched.subcategory || c.category
              };
              changed = true;
            }
          }
        }
      });
      
      if (changed) {
        setHydratedAuto(newHydrated);
      }
    }).catch(err => console.error("Error hydrating auto concepts:", err));
  }, [baseConcepts, hydratedAuto, system?.panel_id, system?.inverter_id]);

  const handleConceptChange = (index: number, field: keyof ProposalConceptItem, val: any) => {
    const updated = [...concepts];
    updated[index] = { ...updated[index], [field]: val };
    
    // If the user manually edits the quantity of an auto concept, detach it from auto-sync
    if (field === 'quantity' && updated[index].is_auto) {
      updated[index].is_auto = false;
    }
    
    handleUpdateConcepts(updated);
  };

  const handleDeleteConcept = (index: number) => {
    const updated = concepts.filter((_, i) => i !== index);
    handleUpdateConcepts(updated);
  };

  const handleResetConcepts = () => {
    // Wipe custom concepts completely to let getInitialAutoConcepts re-generate them dynamically
    onChangeFinancialParams({
      ...financialParams,
      customConcepts: undefined,
      manualCost: undefined
    });
  };

  const handleAddMatrix = (matrix: Matriz) => {
    const directCost = calculateMatrixDirectCost(matrix.insumos || []);
    const sellingPrice = calculateMatrixSellingPrice(
      directCost,
      matrix.indirect_percentage || 10,
      matrix.utility_percentage || 8
    );

    const newItem: ProposalConceptItem = {
      id: `matrix-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: matrix.subcategory || 'Matriz ESOL',
      code: matrix.code,
      quantity: 1,
      unit: matrix.unit || 'pza',
      description: matrix.description,
      unit_price: sellingPrice || 1000
    };

    handleUpdateConcepts([...concepts, newItem]);
    setIsCatalogOpen(false);
  };

  const handleAddInsumo = (insumo: Insumo) => {
    const newItem: ProposalConceptItem = {
      id: `insumo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: insumo.subcategory || 'Insumo ESOL',
      code: insumo.code,
      quantity: 1,
      unit: insumo.unit || 'pza',
      description: insumo.description,
      unit_price: Math.round(Number(insumo.cost) * 1.18) || Number(insumo.cost) || 100
    };

    handleUpdateConcepts([...concepts, newItem]);
    setIsCatalogOpen(false);
  };

  const handleAddGroup = (groupItem: { group: PresupuestoConcepto; insumos: PresupuestoConcepto[] }) => {
    const newItems: ProposalConceptItem[] = groupItem.insumos.map((child, idx) => ({
      id: `group-child-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      category: groupItem.group.description || 'Grupo ESOL',
      code: child.matriz?.code || 'GRUPO-INSUMO',
      quantity: Number(child.quantity || 1),
      unit: child.unit || 'pza',
      description: child.description,
      unit_price: calculateMatrixSellingPrice(Number(child.cost_price || 0), 10, 8) || Number(child.cost_price || 0)
    }));

    handleUpdateConcepts([...concepts, ...newItems]);
    setIsCatalogOpen(false);
  };

  // Compute financials based on system inputs
  const finInput = {
    system_kWp: system.system_kWp,
    installed_kWp: system.installed_kWp,
    annual_production_kWh: system.annual_production_kWh,
    monthly_consumption_kWh: cfeData.monthly_kWh,
    tariff_rate_mxn: cfeData.tariff_rate,
    custom_cost: manualCost,
    historic_periods: cfeData.historic_periods,
    is_bimonthly: cfeData.is_bimonthly,
    tariff_name: cfeData.tariff,
    demand_kw: cfeData.demand_kw
  };

  const results = calculateFinancials(finInput);

  const dailyGen = results.daily_generation_kWh;
  const dailyCons = cfeData.monthly_kWh / 30;

  const offgridGenData = [
    { name: 'Diaria', Generación: Math.round(dailyGen), Consumo: Math.round(dailyCons) },
    { name: 'Semanal', Generación: Math.round(dailyGen * 7), Consumo: Math.round(dailyCons * 7) },
    { name: 'Mensual', Generación: Math.round(dailyGen * 30), Consumo: Math.round(dailyCons * 30) }
  ];

  // Calculate Credit Payment parameters
  const investment = results.investment_mxn;
  const r = (interestRate / 100) / 12;
  const n = termMonths;
  const monthlyCreditPayment = r > 0 
    ? (investment * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : investment / n;

  // Yearly credit payment breakdown
  const creditPaymentsYr: number[] = [];
  let totalCreditPaid = 0;
  for (let yr = 1; yr <= 25; yr++) {
    let activeMonths = 0;
    const startMonth = (yr - 1) * 12;
    const endMonth = yr * 12;

    if (startMonth < n) {
      activeMonths = Math.min(n, endMonth) - startMonth;
    }
    const payment = monthlyCreditPayment * activeMonths;
    creditPaymentsYr.push(payment);
    totalCreditPaid += payment;
  }

  // Adjust metrics for cash vs credit
  const displayInvestment = isCredit ? 0 : investment;
  const displaySavingsYr1 = isCredit 
    ? results.annual_savings_yr1 - creditPaymentsYr[0]
    : results.annual_savings_yr1;

  // NPV under credit: cashflows discounted subtracting credit payments
  let displayNPV = results.npv;
  let displayPayback = results.payback_years;
  let displayROI = results.roi_pct;

  if (isCredit) {
    let npvCredit = 0;
    let cumulativeNetSavings = 0;
    let firstPositiveYr = -1;
    let totalSavingsWithCredit = 0;

    results.cashflows_25yr.forEach((savings, t) => {
      const netSavings = savings - creditPaymentsYr[t];
      totalSavingsWithCredit += netSavings;
      npvCredit += netSavings / Math.pow(1 + SOLAR_CONSTANTS.DISCOUNT_RATE, t + 1);

      cumulativeNetSavings += netSavings;
      if (cumulativeNetSavings > 0 && firstPositiveYr === -1) {
        firstPositiveYr = t + 1;
      }
    });

    displayNPV = npvCredit;
    displayPayback = firstPositiveYr !== -1 ? firstPositiveYr : 99;
    displayROI = totalCreditPaid > 0 ? (totalSavingsWithCredit / totalCreditPaid) * 100 : 0;
  }

  // Minimum fee logic
  const minAnnualFee = cfeData.is_bimonthly ? 600 : 1200;
  const annualCFEPaymentBase = cfeData.total_mxn * (cfeData.is_bimonthly ? 6 : 12);

  // Generate charts data
  const chartsData = Array.from({ length: 25 }, (_, i) => {
    const yr = i + 1;
    const savings = results.cashflows_25yr[i];
    const creditPayment = isCredit ? creditPaymentsYr[i] : 0;
    const netSavings = savings - creditPayment;

    // Cumulative Savings
    let accumulative = 0;
    for (let j = 0; j < yr; j++) {
      accumulative += results.cashflows_25yr[j] - (isCredit ? creditPaymentsYr[j] : 0);
    }
    if (!isCredit) {
      accumulative -= investment; // Subtract initial investment for net balance
    }

    // Line Chart: CFE Payments
    const paymentWithoutSolar = annualCFEPaymentBase * Math.pow(1 + SOLAR_CONSTANTS.TARIFF_ESCALATION, yr - 1);
    const paymentWithSolar = Math.max(
      minAnnualFee * Math.pow(1 + SOLAR_CONSTANTS.TARIFF_ESCALATION, yr - 1),
      paymentWithoutSolar - savings
    );

    return {
      year: yr,
      'Ahorro Neto Anual': netSavings,
      'Ahorro Acumulado': accumulative,
      'Sin Solar': paymentWithoutSolar,
      'Con Solar': paymentWithSolar,
      'Inversión': investment
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-dark-4 p-3.5 rounded-xl shadow-xl font-body">
          <p className="text-xs font-black text-cream mb-2 uppercase tracking-wider">Año {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs font-semibold font-mono flex items-center justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>${Math.round(entry.value).toLocaleString('es-MX')} MXN</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-dark-1 border border-dark-4 rounded-2xl shadow-2xl space-y-6">
      {/* Header and Manual Cost Edit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-dark-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#C49825]/10 rounded-lg text-gold border border-[#C49825]/20">
            <TrendingUp className="h-6 w-6 text-[#C49825]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-gold uppercase tracking-wide">Análisis Financiero</h2>
            <p className="text-cream-muted text-xs">Proyecciones y retorno de inversión a 25 años.</p>
          </div>
        </div>

      </div>

      {/* Financing Type Toggles */}
      <div className="flex justify-between items-center bg-dark-3/20 border border-dark-4 p-3 rounded-xl">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChangeFinancialParams({ ...financialParams, isCredit: false })}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              !isCredit 
                ? 'bg-[#C49825] text-dark-1 shadow-md shadow-gold/10' 
                : 'text-cream-muted hover:text-cream hover:bg-dark-3/50'
            }`}
          >
            Contado
          </button>
          <button
            type="button"
            onClick={() => onChangeFinancialParams({ ...financialParams, isCredit: true })}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              isCredit 
                ? 'bg-[#C49825] text-dark-1 shadow-md shadow-gold/10' 
                : 'text-cream-muted hover:text-cream hover:bg-dark-3/50'
            }`}
          >
            Crédito Solar
          </button>
        </div>
        
        {/* Credit Options Slider Panel */}
        {isCredit && (
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Tasa:</span>
              <span className="text-gold font-bold font-mono">{interestRate}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Plazo:</span>
              <span className="text-cream font-bold font-mono">{termMonths}m</span>
            </div>
          </div>
        )}
      </div>

      {/* Credit configuration sliders details (Mobile/Responsive expanded view) */}
      {isCredit && (
        <div className="p-4 bg-dark-3/30 border border-dark-4 rounded-xl space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Term Months Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Plazo de Financiamiento</span>
                <span className="text-cream font-bold font-mono">{termMonths} meses</span>
              </div>
              <input
                type="range"
                min={12}
                max={72}
                step={12}
                value={termMonths}
                onChange={(e) => onChangeFinancialParams({ ...financialParams, termMonths: Number(e.target.value) })}
                className="w-full h-1.5 bg-dark-4 rounded-lg appearance-none cursor-pointer accent-[#C49825]"
              />
              <div className="flex justify-between text-[9px] text-cream-muted font-mono">
                <span>12m</span>
                <span>36m</span>
                <span>72m</span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-cream-muted font-semibold uppercase tracking-wider text-[10px]">Tasa de Interés Anual</span>
                <span className="text-gold font-bold font-mono">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={20}
                step={0.5}
                value={interestRate}
                onChange={(e) => onChangeFinancialParams({ ...financialParams, interestRate: Number(e.target.value) })}
                className="w-full h-1.5 bg-dark-4 rounded-lg appearance-none cursor-pointer accent-[#C49825]"
              />
              <div className="flex justify-between text-[9px] text-cream-muted font-mono">
                <span>10%</span>
                <span>15%</span>
                <span>20%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2.5 border-t border-dark-4 text-xs font-semibold">
            <span className="text-cream-muted">Mensualidad Crédito:</span>
            <span className="text-gold font-mono font-black text-sm">
              ${Math.round(monthlyCreditPayment).toLocaleString('es-MX')} MXN
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={`grid gap-4 ${system?.projectType === 'off-grid' ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
        {/* Investment */}
        <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
          <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">
            {isCredit ? 'Inversión Inicial' : 'Inversión Contado'}
          </span>
          <span className="text-base font-black font-mono text-cream block leading-tight">
            {isCredit ? '$0' : `$${Math.round(displayInvestment).toLocaleString('es-MX')}`}
          </span>
          {isCredit && <span className="text-[9px] text-emerald-400 block font-bold">100% Financiado</span>}
        </div>

        {system?.projectType === 'off-grid' && (
          <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
            <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">Generación Promedio</span>
            <span className="text-base font-black font-mono text-emerald-400 block leading-tight">
              {results.daily_generation_kWh.toFixed(1)} <span className="text-sm">kWh/día</span>
            </span>
            <span className="text-[9px] text-cream-muted block font-mono">Energía disponible</span>
          </div>
        )}

        {system?.projectType !== 'off-grid' && (
          <>
            {/* Year 1 Savings */}
            <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
              <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">
                {isCredit ? 'Ahorro Año 1 (Neto)' : 'Ahorro Año 1'}
              </span>
              <span className="text-base font-black font-mono text-gold block leading-tight">
                ${Math.round(displaySavingsYr1).toLocaleString('es-MX')}
              </span>
              <span className="text-[9px] text-cream-muted block font-mono">
                ${Math.round(displaySavingsYr1 / 12).toLocaleString('es-MX')}/mes
              </span>
            </div>

            {/* Payback */}
            <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
              <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">Retorno de Inversión</span>
              <span className="text-base font-black font-mono text-cream block leading-tight">
                {displayPayback === 0 ? 'Inmediato' : `${displayPayback.toFixed(1)}`}
              </span>
              <span className="text-[9px] text-cream-muted block">años en recuperarse</span>
            </div>

            {/* ROI */}
            <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1">
              <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">ROI Acumulado</span>
              <span className="text-base font-black font-mono text-cream block leading-tight">
                {displayROI.toFixed(0)}%
              </span>
              <span className="text-[9px] text-cream-muted block font-mono">de retorno total</span>
            </div>

            {/* NPV */}
            <div className="p-3.5 bg-dark-1/55 border border-dark-4 rounded-xl space-y-1 col-span-2 md:col-span-1">
              <span className="text-[9px] text-cream-muted font-bold uppercase tracking-wider block">Valor Presente Neto</span>
              <span className={`text-base font-black font-mono block leading-tight ${displayNPV >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${Math.round(displayNPV).toLocaleString('es-MX')}
              </span>
              <span className="text-[9px] text-cream-muted block font-mono">VAN a 10% tasa desc</span>
            </div>
          </>
        )}
      </div>

      {/* Recharts Graphical Projections */}
      {system?.projectType !== 'off-grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Bar Chart of Savings */}
          <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Ahorro Neto Acumulado vs Inversión (MXN)</span>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Ahorro Acumulado" name="Balance Net" fill="#C49825" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Line Chart CFE Projections */}
          <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Proyección de Pagos a CFE (Anual)</span>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif' }} />
                  <Line type="monotone" dataKey="Sin Solar" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Con Solar" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {system?.projectType === 'off-grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-dark-4">
          <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Proyección de Generación vs Consumo (kWh)</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={offgridGenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif' }} />
                  <Line type="monotone" dataKey="Consumo" name="Consumo Estimado" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Generación" name="Generación Solar" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3">
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Tabla de Proyección de Energía (kWh)</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-dark-2 text-cream-muted text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Periodo</th>
                    <th className="p-3 text-right">Generación PV</th>
                    <th className="p-3 text-right">Consumo</th>
                    <th className="p-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-4 font-mono text-[11px]">
                  {offgridGenData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-dark-3/30 transition-colors">
                      <td className="p-3 font-bold text-cream">{row.name}</td>
                      <td className="p-3 text-right text-emerald-400">{row.Generación.toLocaleString('es-MX')} kWh</td>
                      <td className="p-3 text-right text-red-400">{row.Consumo.toLocaleString('es-MX')} kWh</td>
                      <td className="p-3 text-right text-gold">{(row.Generación - row.Consumo).toLocaleString('es-MX')} kWh</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Monthly Breakdown Table (Left Column) & Impacto Ambiental (Right Column) */}
      <div className={`grid grid-cols-1 ${system?.projectType === 'off-grid' ? '' : 'lg:grid-cols-2'} gap-6 pt-4 border-t border-dark-4`}>
        {/* 1. Monthly Breakdown Table */}
        {system?.projectType !== 'off-grid' && (
          <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Tabla de Comparativa Mensual CFE</span>
              <span className="text-[10px] text-gold font-mono font-bold">
                {cfeData.is_bimonthly ? 'Bimestral' : 'Mensual'} ({results.monthly_breakdown.length} Períodos)
              </span>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-dark-2 text-cream-muted text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-2">Periodo</th>
                    <th className="p-2 text-right">Consumo</th>
                    <th className="p-2 text-right">Pago Actual</th>
                    <th className="p-2 text-right">Pago Nuevo</th>
                    <th className="p-2 text-right">Ahorro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-4 font-mono text-[11px]">
                  {results.monthly_breakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-dark-3/30 transition-colors">
                      <td className="p-2 font-bold text-cream">{row.month}</td>
                      <td className="p-2 text-right text-cream-muted">{Math.round(row.kwh).toLocaleString()} kWh</td>
                      <td className="p-2 text-right text-red-400">${Math.round(row.original_mxn).toLocaleString('es-MX')}</td>
                      <td className="p-2 text-right text-emerald-400">${Math.round(row.new_mxn).toLocaleString('es-MX')}</td>
                      <td className="p-2 text-right text-gold">${Math.round(row.savings_mxn).toLocaleString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-dark-2 font-mono font-bold text-xs border-t border-dark-4">
                  <tr>
                    <td className="p-2 text-cream uppercase">Total</td>
                    <td className="p-2 text-right text-cream">
                      {Math.round(results.monthly_breakdown.reduce((acc, r) => acc + r.kwh, 0)).toLocaleString()} kWh
                    </td>
                    <td className="p-2 text-right text-red-400">
                      ${Math.round(results.monthly_breakdown.reduce((acc, r) => acc + r.original_mxn, 0)).toLocaleString('es-MX')}
                    </td>
                    <td className="p-2 text-right text-emerald-400">
                      ${Math.round(results.monthly_breakdown.reduce((acc, r) => acc + r.new_mxn, 0)).toLocaleString('es-MX')}
                    </td>
                    <td className="p-2 text-right text-gold">
                      ${Math.round(results.monthly_breakdown.reduce((acc, r) => acc + r.savings_mxn, 0)).toLocaleString('es-MX')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 2. Impacto Ambiental (Side by Side in Right Column) */}
        <div>
          <EnvironmentalImpact system={system} />
        </div>
      </div>

      {/* 3. Propuesta Económica FULL WIDTH (Conceptos del Proyecto) */}
      <div className="w-full pt-4 border-t border-dark-4">
        <div className="p-4 bg-dark-1/45 border border-dark-4 rounded-xl space-y-3 w-full">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">Propuesta Económica (Conceptos del Proyecto)</span>
              <span className="text-[9px] text-gold/80 block">Vinculado a Matrices y Catálogo de Presupuestos ESOL</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetConcepts}
                title="Restablecer conceptos automáticos"
                className="px-2 py-1 bg-dark-3 hover:bg-dark-4 text-cream-muted hover:text-cream text-[10px] rounded flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                className="px-3 py-1.5 bg-gold hover:bg-gold-light text-dark-1 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Concepto ESOL</span>
              </button>
            </div>
          </div>

          {/* Interactive Concepts Table - Fully Visible without inner vertical scrollbar */}
          <div className="overflow-x-auto border border-dark-4 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-dark-2 text-cream-muted text-[10px] font-bold uppercase tracking-wider z-10">
                <tr>
                  <th className="p-2 w-28">Concepto / Código</th>
                  <th className="p-2 text-center w-16">Cant.</th>
                  <th className="p-2 text-center w-14">Unidad</th>
                  <th className="p-2">Descripción del APU / Matriz ESOL</th>
                  <th className="p-2 text-right w-24">P.Unit ($)</th>
                  <th className="p-2 text-right w-24">Importe ($)</th>
                  <th className="p-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4 text-[11px]">
                {concepts.map((item, idx) => {
                  const importe = Number(item.quantity || 0) * Number(item.unit_price || 0);
                  return (
                    <tr key={item.id || idx} className="hover:bg-dark-3/30 transition-colors">
                      {/* Category / Code */}
                      <td className="p-2 font-bold text-gold">
                        <div>{item.category}</div>
                        {item.code && <div className="text-[9px] font-mono text-cream-muted">{item.code}</div>}
                      </td>

                      {/* Quantity */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={e => handleConceptChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-14 text-center bg-dark-3 border border-dark-4 text-cream font-mono font-bold rounded px-1 py-0.5 text-xs focus:border-gold outline-none"
                        />
                      </td>

                      {/* Unit */}
                      <td className="p-2 text-center text-cream-muted font-mono text-[10px]">
                        {item.unit}
                      </td>

                      {/* Description */}
                      <td className="p-2 text-cream">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleConceptChange(idx, 'description', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-dark-4 focus:border-gold text-cream text-xs px-1 py-0.5 outline-none"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="p-2 text-right">
                        <div className="relative inline-flex items-center justify-end">
                          <span className="text-gold font-mono text-xs mr-0.5">$</span>
                          <input
                            type="text"
                            value={
                              editingPriceIdx === idx
                                ? rawPriceInput
                                : Math.round(Number(item.unit_price || 0)).toLocaleString('es-MX')
                            }
                            onFocus={() => {
                              setEditingPriceIdx(idx);
                              setRawPriceInput(String(item.unit_price || 0));
                            }}
                            onBlur={() => setEditingPriceIdx(null)}
                            onChange={e => {
                              const valStr = e.target.value;
                              setRawPriceInput(valStr);
                              const parsed = parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0;
                              handleConceptChange(idx, 'unit_price', parsed);
                            }}
                            className="w-24 text-right bg-dark-3 border border-dark-4 text-gold font-mono font-bold rounded px-1.5 py-0.5 text-xs focus:border-gold outline-none"
                          />
                        </div>
                      </td>

                      {/* Total Importe */}
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">
                        ${Math.round(importe).toLocaleString('es-MX')}
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteConcept(idx)}
                          title="Eliminar concepto"
                          className="text-red-400/60 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-dark-2 font-mono font-bold text-xs border-t border-dark-4 z-10">
                <tr>
                  <td colSpan={4} className="p-2 text-cream uppercase">
                    Total Inversión Proyecto (Llave en Mano)
                  </td>
                  <td colSpan={3} className="p-2 text-right text-gold text-sm font-black">
                    {isForcingTotal ? (
                      <div className="flex justify-end items-center gap-2">
                        <span className="text-cream-muted font-normal text-xs">Forzar: $</span>
                        <input
                          type="number"
                          autoFocus
                          value={forcedTotalInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForcedTotalInput(val);
                            const newTotal = parseFloat(val);
                            if (!isNaN(newTotal) && newTotal > 0 && snapshotTotal > 0) {
                              const ratio = newTotal / snapshotTotal;
                              const scaledConcepts = baseSnapshot.map(c => ({
                                ...c,
                                unit_price: c.unit_price * ratio
                              }));
                              handleUpdateConcepts(scaledConcepts);
                            }
                          }}
                          onBlur={() => {
                            setIsForcingTotal(false);
                            setBaseSnapshot([]);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setIsForcingTotal(false);
                              setBaseSnapshot([]);
                            }
                          }}
                          className="w-28 text-right bg-dark-3 border border-dark-4 focus:border-gold outline-none text-gold rounded px-1.5 py-0.5"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span>${Math.round(investment).toLocaleString('es-MX')} MXN</span>
                        <button
                          onClick={() => {
                            setIsForcingTotal(true);
                            setForcedTotalInput(String(Math.round(investment)));
                            // Desvinculamos el is_auto para que el parser no sobreescriba los precios ajustados
                            setBaseSnapshot(concepts.map(c => ({ ...c, is_auto: false })));
                            setSnapshotTotal(investment);
                          }}
                          className="p-1 text-gold hover:bg-gold/10 rounded transition-colors"
                          title="Forzar cuadre de presupuesto"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Catalog Selector Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-dark-1 border-b border-dark-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="text-sm font-bold text-cream">Catálogo de Matrices e Insumos ESOL</h3>
                  <p className="text-[10px] text-cream-muted">Selecciona una matriz o insumo para agregarlo a la propuesta económica</p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="p-1 text-cream-muted hover:text-cream rounded-lg hover:bg-dark-3 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls: Search & Tabs */}
            <div className="p-4 bg-dark-2 border-b border-dark-4 space-y-3">
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-cream-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por código, concepto o descripción..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-3 border border-dark-4 rounded-lg pl-9 pr-4 py-2 text-xs text-cream focus:border-gold outline-none"
                  />
                </div>

                {/* Tabs */}
                <div className="flex bg-dark-3 p-1 rounded-lg border border-dark-4">
                  <button
                    onClick={() => setCatalogTab('matrices')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      catalogTab === 'matrices' ? 'bg-gold text-dark-1' : 'text-cream-muted hover:text-cream'
                    }`}
                  >
                    Matrices APU ({matricesList.length})
                  </button>
                  <button
                    onClick={() => setCatalogTab('insumos')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      catalogTab === 'insumos' ? 'bg-gold text-dark-1' : 'text-cream-muted hover:text-cream'
                    }`}
                  >
                    Insumos ({insumosList.length})
                  </button>
                  <button
                    onClick={() => setCatalogTab('grupos')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      catalogTab === 'grupos' ? 'bg-gold text-dark-1' : 'text-cream-muted hover:text-cream'
                    }`}
                  >
                    Grupos ({groupsList.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {isLoadingCatalog ? (
                <div className="py-12 text-center text-cream-muted text-xs">Cargando catálogo de Presupuestos ESOL...</div>
              ) : catalogTab === 'matrices' ? (
                /* Matrices List */
                matricesList
                  .filter(m =>
                    m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.subcategory || '').toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(m => {
                    const directCost = calculateMatrixDirectCost(m.insumos || []);
                    const sellingPrice = calculateMatrixSellingPrice(
                      directCost,
                      m.indirect_percentage || 10,
                      m.utility_percentage || 8
                    );
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleAddMatrix(m)}
                        className="p-3 bg-dark-1/60 hover:bg-dark-3 border border-dark-4 hover:border-gold/50 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                      >
                        <div className="space-y-1 max-w-[70%]">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-gold/10 text-gold text-[10px] font-mono font-bold rounded border border-gold/20">
                              {m.code}
                            </span>
                            {m.subcategory && (
                              <span className="text-[10px] text-cream-muted font-semibold uppercase">{m.subcategory}</span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-cream group-hover:text-gold transition-colors">
                            {m.description}
                          </p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="text-xs font-black font-mono text-emerald-400 block">
                            ${Math.round(sellingPrice).toLocaleString('es-MX')} / {m.unit || 'pza'}
                          </span>
                          <span className="text-[9px] text-cream-muted block font-mono">
                            C.Directo: ${Math.round(directCost).toLocaleString('es-MX')}
                          </span>
                        </div>
                      </div>
                    );
                  })
              ) : catalogTab === 'insumos' ? (
                /* Insumos List */
                insumosList
                  .filter(i =>
                    i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (i.subcategory || '').toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(i => (
                    <div
                      key={i.id}
                      onClick={() => handleAddInsumo(i)}
                      className="p-3 bg-dark-1/60 hover:bg-dark-3 border border-dark-4 hover:border-gold/50 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold rounded border border-blue-500/20">
                            {i.code}
                          </span>
                          <span className="text-[10px] text-cream-muted font-semibold uppercase">{i.type} {i.subcategory ? `• ${i.subcategory}` : ''}</span>
                        </div>
                        <p className="text-xs font-semibold text-cream group-hover:text-gold transition-colors">
                          {i.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-emerald-400 block">
                          ${Math.round(Number(i.cost) * 1.18).toLocaleString('es-MX')} / {i.unit}
                        </span>
                        <span className="text-[9px] text-cream-muted block font-mono">
                          Costo Base: ${Math.round(Number(i.cost)).toLocaleString('es-MX')}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                /* Grupos List */
                groupsList
                  .filter(g =>
                    (g.group.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    g.insumos.some(c => c.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((g, gIdx) => (
                    <div
                      key={g.group.id || gIdx}
                      onClick={() => handleAddGroup(g)}
                      className="p-3 bg-dark-1/60 hover:bg-dark-3 border border-dark-4 hover:border-gold/50 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold rounded border border-purple-500/20">
                            GRUPO ({g.insumos.length} Conceptos)
                          </span>
                        </div>
                        <p className="text-xs font-bold text-cream group-hover:text-gold transition-colors">
                          {g.group.description || 'Grupo de Insumos'}
                        </p>
                        <p className="text-[10px] text-cream-muted truncate">
                          Contiene: {g.insumos.map(c => c.description).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-gold/10 text-gold text-xs font-bold rounded-lg border border-gold/30">
                          + Agregar Grupo
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-dark-1 border-t border-dark-4 flex justify-between items-center text-xs text-cream-muted">
              <span>Al hacer clic en un elemento se agregará automáticamente a la propuesta.</span>
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="px-3 py-1 bg-dark-3 hover:bg-dark-4 text-cream font-bold text-xs rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
