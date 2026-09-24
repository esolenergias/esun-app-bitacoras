import { getLearnedTierBaseline } from './cronogramaLearningEngine';

export interface CronogramaPhase {
  id: string;
  title: string;
  category: 'epc' | 'cfe' | 'commissioning';
  startWeek: number; // 1-indexed (e.g. 1)
  durationWeeks: number; // e.g. 3
  label: string; // e.g. "2–3 sem"
  isCritical?: boolean;
}

export interface ExecutionStep {
  stepNumber: string; // "01", "02", etc.
  title: string;
  description: string;
  durationLabel: string;
  defaultWeeks: number;
  currentWeeks: number;
  isFinal?: boolean;
}

export interface CronogramaResult {
  scaleTier: 'residential' | 'commercial' | 'industrial';
  scaleTitle: string;
  totalWeeks: number;
  startDate: string; // ISO / YYYY-MM-DD
  endDate: string;
  formattedDateRange: string;
  weekColumns: { weekNum: number; label: string; dateRange: string }[];
  phases: (CronogramaPhase & { leftPct: number; widthPct: number; startDateStr: string; endDateStr: string })[];
  executionSteps: ExecutionStep[];
}

export interface CalculateCronogramaOptions {
  isOffGrid?: boolean;
  tariff?: string;
  phaseOverrides?: Record<string, number>;
  phaseCustomizations?: Record<string, { startWeek?: number; durationWeeks?: number }>;
  useLearnedDefaults?: boolean;
}

export function calculateCronograma(
  numPanels: number,
  startDateInput?: string | Date,
  options?: CalculateCronogramaOptions
): CronogramaResult {
  const panels = Math.max(1, Number(numPanels) || 1);
  let startDate = new Date();
  if (startDateInput) {
    const d = new Date(startDateInput);
    if (!isNaN(d.getTime())) {
      startDate = d;
    }
  }
  
  // Normalize startDate to start of day
  startDate.setHours(0, 0, 0, 0);

  let scaleTier: 'residential' | 'commercial' | 'industrial';
  let scaleTitle: string;
  let baseTotalWeeks: number;
  let rawPhases: CronogramaPhase[];
  let executionSteps: ExecutionStep[];
  const stepDefaultWeeks: Record<string, number> = {};

  if (panels <= 15) {
    // TIER 1: RESIDENCIAL (1 a 15 paneles) -> 3 Semanas (Reducido 1 semana)
    scaleTier = 'residential';
    scaleTitle = 'Proyecto Residencial / Baja Escala';
    baseTotalWeeks = 3;
    stepDefaultWeeks['01'] = 1;
    stepDefaultWeeks['02'] = 1;
    stepDefaultWeeks['03'] = 1;
    stepDefaultWeeks['04'] = 1;
    stepDefaultWeeks['05'] = 1;
    
    executionSteps = [
      {
        stepNumber: '01',
        title: 'Ingeniería',
        description: 'Levantamiento técnico, dimensionamiento y diagrama unifilar.',
        durationLabel: '3–5 Días',
        defaultWeeks: 1,
        currentWeeks: 1
      },
      {
        stepNumber: '02',
        title: 'Procura',
        description: 'Suministro de módulos, inversor y kit de microestructura.',
        durationLabel: '1 Semana',
        defaultWeeks: 1,
        currentWeeks: 1
      },
      {
        stepNumber: '03',
        title: 'Montaje',
        description: 'Fijación de anclajes mecánicos y colocación de paneles.',
        durationLabel: '2–4 Días',
        defaultWeeks: 1,
        currentWeeks: 1
      },
      {
        stepNumber: '04',
        title: 'Inst. Eléctrica',
        description: 'Canalizaciones, protecciones en AC/DC e interconexión al centro de carga.',
        durationLabel: '2–3 Días',
        defaultWeeks: 1,
        currentWeeks: 1
      },
      {
        stepNumber: '05',
        title: 'Puesta en Marcha',
        description: options?.isOffGrid ? 'Pruebas con banco de baterías y entrega.' : 'Ingreso a CFE, cambio de medidor bidireccional y activación.',
        durationLabel: '1 Semana',
        defaultWeeks: 1,
        currentWeeks: 1,
        isFinal: true
      }
    ];

    rawPhases = [
      {
        id: 'ing',
        title: 'Ingeniería y levantamiento',
        category: 'epc',
        startWeek: 1,
        durationWeeks: 0.8,
        label: '3–5 días',
        isCritical: true
      },
      {
        id: 'procura',
        title: 'Suministro de módulos e inversor',
        category: 'epc',
        startWeek: 1,
        durationWeeks: 1.5,
        label: '1–2 sem'
      },
      {
        id: 'montaje',
        title: 'Instalación mecánica y módulos',
        category: 'epc',
        startWeek: 1.6,
        durationWeeks: 0.8,
        label: '2–4 días',
        isCritical: true
      },
      {
        id: 'electrico',
        title: 'Cableado AC/DC y protecciones',
        category: 'epc',
        startWeek: 2.0,
        durationWeeks: 0.6,
        label: '2–3 días'
      },
      ...(options?.isOffGrid ? [] : [
        {
          id: 'cfe',
          title: 'Gestión / Solicitud CFE',
          category: 'cfe' as const,
          startWeek: 1,
          durationWeeks: 2.5,
          label: '2–3 sem (En paralelo)'
        },
        {
          id: 'medidor',
          title: 'Medidor bidireccional / Interconexión',
          category: 'cfe' as const,
          startWeek: 2.2,
          durationWeeks: 0.8,
          label: '1 sem'
        }
      ]),
      {
        id: 'pruebas',
        title: options?.isOffGrid ? 'Pruebas de banco y encendido' : 'Pruebas internas y puesta en servicio',
        category: 'commissioning',
        startWeek: 2.5,
        durationWeeks: 0.5,
        label: 'Puesta en Marcha',
        isCritical: true
      }
    ];
  } else if (panels <= 80) {
    // TIER 2: COMERCIAL / MEDIO (16 a 80 paneles) -> 6 Semanas (Reducido 1 semana)
    scaleTier = 'commercial';
    scaleTitle = 'Proyecto Comercial / Pyme';
    baseTotalWeeks = 6;
    stepDefaultWeeks['01'] = 2;
    stepDefaultWeeks['02'] = 2;
    stepDefaultWeeks['03'] = 2;
    stepDefaultWeeks['04'] = 1;
    stepDefaultWeeks['05'] = 1;

    executionSteps = [
      {
        stepNumber: '01',
        title: 'Ingeniería',
        description: 'Planos ejecutivos, memoria técnica y análisis estructural.',
        durationLabel: '1–2 Semanas',
        defaultWeeks: 2,
        currentWeeks: 2
      },
      {
        stepNumber: '02',
        title: 'Procura',
        description: 'Suministro de módulos, inversores comerciales y estructura de aluminio.',
        durationLabel: '2–3 Semanas',
        defaultWeeks: 2,
        currentWeeks: 2
      },
      {
        stepNumber: '03',
        title: 'Montaje',
        description: 'Anclaje de estructuras coplanares/inclinadas y montaje de módulos.',
        durationLabel: '1–2 Semanas',
        defaultWeeks: 2,
        currentWeeks: 2
      },
      {
        stepNumber: '04',
        title: 'Inst. Eléctrica',
        description: 'Tableros de combinación, cableado fotovoltaico y supresores.',
        durationLabel: '1–2 Semanas',
        defaultWeeks: 1,
        currentWeeks: 1
      },
      {
        stepNumber: '05',
        title: 'Puesta en Marcha',
        description: 'Inspección CFE, sellado de medidor bidireccional y energización.',
        durationLabel: '1–2 Semanas',
        defaultWeeks: 1,
        currentWeeks: 1,
        isFinal: true
      }
    ];

    rawPhases = [
      {
        id: 'ing',
        title: 'Ingeniería ejecutiva y planos',
        category: 'epc',
        startWeek: 1,
        durationWeeks: 1.5,
        label: '1–2 sem',
        isCritical: true
      },
      {
        id: 'estructura',
        title: 'Compra y suministro de estructura',
        category: 'epc',
        startWeek: 1.8,
        durationWeeks: 2.0,
        label: '2 sem'
      },
      {
        id: 'suministro',
        title: 'Suministro de módulos e inversores',
        category: 'epc',
        startWeek: 1.8,
        durationWeeks: 2.5,
        label: '2–3 sem'
      },
      {
        id: 'montaje',
        title: 'Instalación mecánica de módulos',
        category: 'epc',
        startWeek: 3.0,
        durationWeeks: 1.8,
        label: '1–2 sem',
        isCritical: true
      },
      {
        id: 'tableros',
        title: 'Tableros, protecciones y cableado',
        category: 'epc',
        startWeek: 4.0,
        durationWeeks: 1.3,
        label: '1–2 sem'
      },
      ...(options?.isOffGrid ? [] : [
        {
          id: 'cfe',
          title: 'Gestión / Trámites ante CFE',
          category: 'cfe' as const,
          startWeek: 1,
          durationWeeks: 4.5,
          label: '3–5 sem (En paralelo)'
        },
        {
          id: 'medidor',
          title: 'Medidor bidireccional CFE',
          category: 'cfe' as const,
          startWeek: 4.5,
          durationWeeks: 1.2,
          label: '1–2 sem'
        }
      ]),
      {
        id: 'pruebas',
        title: 'Pruebas internas y Puesta en Servicio',
        category: 'commissioning',
        startWeek: 5.2,
        durationWeeks: 0.8,
        label: 'Puesta en Servicio',
        isCritical: true
      }
    ];
  } else {
    // TIER 3: INDUSTRIAL / GRAN ESCALA (81 a 700+ paneles) -> 13 Semanas (Reducido 1 semana)
    scaleTier = 'industrial';
    scaleTitle = 'Proyecto Industrial / Gran Escala (0.5 MWp)';
    baseTotalWeeks = 13;
    stepDefaultWeeks['01'] = 2;
    stepDefaultWeeks['02'] = 4;
    stepDefaultWeeks['03'] = 4;
    stepDefaultWeeks['04'] = 3;
    stepDefaultWeeks['05'] = 1;

    executionSteps = [
      {
        stepNumber: '01',
        title: 'Ingeniería',
        description: 'Levantamiento, planos y memorias técnicas ejecutivas bajo norma.',
        durationLabel: '2–3 Semanas',
        defaultWeeks: 2,
        currentWeeks: 2
      },
      {
        stepNumber: '02',
        title: 'Procura',
        description: `Suministro de ${panels} módulos fotovoltaicos, inversores y perfilería estructural.`,
        durationLabel: '4–6 Semanas',
        defaultWeeks: 4,
        currentWeeks: 4
      },
      {
        stepNumber: '03',
        title: 'Montaje',
        description: 'Armado mecánico y fijación de estructura a 20° en loza/cubierta industrial.',
        durationLabel: '4–5 Semanas',
        defaultWeeks: 4,
        currentWeeks: 4
      },
      {
        stepNumber: '04',
        title: 'Inst. Eléctrica',
        description: 'Cableado AC/DC, canalizaciones, tableros de distribución y protecciones.',
        durationLabel: '3–4 Semanas',
        defaultWeeks: 3,
        currentWeeks: 3
      },
      {
        stepNumber: '05',
        title: 'Puesta en Marcha',
        description: 'Pruebas internas, verificación UVIE, inspección e interconexión final CFE.',
        durationLabel: '1–2 Semanas',
        defaultWeeks: 1,
        currentWeeks: 1,
        isFinal: true
      }
    ];

    rawPhases = [
      {
        id: 'ing',
        title: 'Ingeniería ejecutiva',
        category: 'epc',
        startWeek: 1,
        durationWeeks: 2.5,
        label: '2–3 sem',
        isCritical: true
      },
      {
        id: 'estructura',
        title: 'Compra / fabricación estructura',
        category: 'epc',
        startWeek: 1.8,
        durationWeeks: 4.5,
        label: '4–5 sem'
      },
      {
        id: 'suministro',
        title: 'Suministro de módulos e inversores',
        category: 'epc',
        startWeek: 1.8,
        durationWeeks: 6.0,
        label: '4–6 sem'
      },
      {
        id: 'montaje',
        title: 'Instalación mecánica FV',
        category: 'epc',
        startWeek: 4.5,
        durationWeeks: 4.5,
        label: '4–5 sem',
        isCritical: true
      },
      {
        id: 'tableros',
        title: 'Tableros, protecciones y canalizaciones',
        category: 'epc',
        startWeek: 6.5,
        durationWeeks: 4.5,
        label: '4–5 sem'
      },
      {
        id: 'electrico',
        title: 'Instalación eléctrica y conexiones',
        category: 'epc',
        startWeek: 9.0,
        durationWeeks: 3.0,
        label: '3 sem'
      },
      ...(options?.isOffGrid ? [] : [
        {
          id: 'cfe',
          title: 'Gestión / Interconexión CFE (UVIE / UI)',
          category: 'cfe' as const,
          startWeek: 1,
          durationWeeks: 5.5,
          label: '3–5 sem (En paralelo)'
        },
        {
          id: 'medidor',
          title: 'Medidor multifunción / Suministro e inst.',
          category: 'cfe' as const,
          startWeek: 9.0,
          durationWeeks: 2.5,
          label: '1–3 sem'
        }
      ]),
      {
        id: 'pruebas',
        title: 'Pruebas internas y Puesta en Servicio CFE',
        category: 'commissioning',
        startWeek: 11.5,
        durationWeeks: 1.5,
        label: 'Pruebas Finales',
        isCritical: true
      }
    ];
  }

  // --- APLICACIÓN DEL APRENDIZAJE ESTADÍSTICO ACUMULADO (Si no hay sobreescrituras activas) ---
  const learnedBaseline = getLearnedTierBaseline(scaleTier);
  if (learnedBaseline && !options?.phaseOverrides && !options?.phaseCustomizations) {
    executionSteps.forEach(step => {
      const learnedWeeks = learnedBaseline.stepAverages[step.stepNumber];
      if (learnedWeeks) {
        step.currentWeeks = Math.round(learnedWeeks * 10) / 10;
        step.durationLabel = `${step.currentWeeks} ${step.currentWeeks === 1 ? 'Semana' : 'Semanas'}`;
      }
    });

    rawPhases.forEach(phase => {
      const learnedPhase = learnedBaseline.phaseAverages[phase.id];
      if (learnedPhase) {
        phase.durationWeeks = Math.round(learnedPhase.avgDurationWeeks * 10) / 10;
        phase.startWeek = Math.round((1 + learnedPhase.avgStartWeekOffset) * 10) / 10;
        phase.label = `${phase.durationWeeks} sem`;
      }
    });
  }

  // --- MAPEO DE PASOS A FASES ---
  const stepToPhases: Record<string, string[]> = {
    '01': ['ing'],
    '02': ['procura', 'estructura', 'suministro'],
    '03': ['montaje'],
    '04': ['electrico', 'tableros'],
    '05': ['pruebas', 'medidor']
  };

  const phaseToStep: Record<string, string> = {
    ing: '01',
    procura: '02',
    estructura: '02',
    suministro: '02',
    montaje: '03',
    electrico: '04',
    tableros: '04',
    pruebas: '05',
    medidor: '05'
  };

  // --- APLICACIÓN DE SOBREESCRITURAS MANUALES Y/O GANTT CUSTOMIZATIONS ---
  // 1. Sobreescrituras de pasos superiores (01, 02, 03, 04, 05)
  if (options?.phaseOverrides) {
    const sortedSteps = ['01', '02', '03', '04', '05'];
    let runningShift = 0;

    for (const stepKey of sortedSteps) {
      const overrideVal = options.phaseOverrides[stepKey];
      const stepIdx = executionSteps.findIndex(s => s.stepNumber === stepKey);
      const defaultWeeks = stepDefaultWeeks[stepKey] || 1;

      if (stepIdx !== -1 && overrideVal !== undefined && overrideVal > 0) {
        executionSteps[stepIdx].currentWeeks = overrideVal;
        executionSteps[stepIdx].durationLabel = overrideVal === 1 ? '1 Semana' : `${overrideVal} Semanas`;
      }

      const phaseIds = stepToPhases[stepKey] || [];
      let stepMaxStretch = 0;

      for (const pId of phaseIds) {
        const pIdx = rawPhases.findIndex(p => p.id === pId);
        if (pIdx !== -1) {
          rawPhases[pIdx].startWeek += runningShift;

          if (overrideVal !== undefined && overrideVal > 0) {
            const oldDuration = rawPhases[pIdx].durationWeeks;
            rawPhases[pIdx].durationWeeks = overrideVal;
            rawPhases[pIdx].label = overrideVal === 1 ? '1 sem' : `${overrideVal} sem`;
            
            const stretch = overrideVal - defaultWeeks;
            if (stretch > stepMaxStretch) {
              stepMaxStretch = stretch;
            }
          }
        }
      }

      if (overrideVal !== undefined && overrideVal > 0) {
        runningShift += Math.max(0, stepMaxStretch);
      }
    }
  }

  // 2. Sobreescrituras directas de Gantt Bar (Libertad total de arrastre y estiramiento)
  if (options?.phaseCustomizations) {
    Object.entries(options.phaseCustomizations).forEach(([phaseId, custom]) => {
      const pIdx = rawPhases.findIndex(p => p.id === phaseId);
      if (pIdx !== -1) {
        if (custom.startWeek !== undefined && custom.startWeek >= 1) {
          rawPhases[pIdx].startWeek = custom.startWeek;
        }
        if (custom.durationWeeks !== undefined && custom.durationWeeks > 0) {
          rawPhases[pIdx].durationWeeks = custom.durationWeeks;
          rawPhases[pIdx].label = custom.durationWeeks === 1 ? '1 sem' : `${custom.durationWeeks} sem`;

          // Sincronización bilateral con la caja del paso superior
          const parentStep = phaseToStep[phaseId];
          if (parentStep) {
            const stepIdx = executionSteps.findIndex(s => s.stepNumber === parentStep);
            if (stepIdx !== -1) {
              executionSteps[stepIdx].currentWeeks = Math.ceil(custom.durationWeeks);
              executionSteps[stepIdx].durationLabel = `${custom.durationWeeks} ${custom.durationWeeks === 1 ? 'Semana' : 'Semanas'}`;
            }
          }
        }
      }
    });
  }

  // 3. Calcular duración total real basada en el fin de la última fase
  let calculatedMaxEnd = baseTotalWeeks;
  rawPhases.forEach(p => {
    const end = p.startWeek + p.durationWeeks - 1;
    if (end > calculatedMaxEnd) {
      calculatedMaxEnd = Math.ceil(end);
    }
  });
  const totalWeeks = calculatedMaxEnd;

  // Calculate calendar dates for week columns
  const weekColumns = Array.from({ length: totalWeeks }, (_, i) => {
    const wNum = i + 1;
    const wStart = new Date(startDate);
    wStart.setDate(startDate.getDate() + i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);

    const startMonth = wStart.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
    const endMonth = wEnd.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');

    const dateRange = startMonth === endMonth
      ? `${wStart.getDate()}–${wEnd.getDate()} ${startMonth}`
      : `${wStart.getDate()} ${startMonth} – ${wEnd.getDate()} ${endMonth}`;

    return {
      weekNum: wNum,
      label: `S${wNum}`,
      dateRange
    };
  });

  // Calculate overall end date
  const finalEndDate = new Date(startDate);
  finalEndDate.setDate(startDate.getDate() + totalWeeks * 7 - 1);

  const startMonthLong = startDate.toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' });
  const endMonthLong = finalEndDate.toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedDateRange = `${startMonthLong} al ${endMonthLong}`;

  // Format phases with percentages for CSS rendering
  const phases = rawPhases.map((phase) => {
    const leftOffsetWeeks = phase.startWeek - 1;
    const leftPct = Math.max(0, Math.min(100, (leftOffsetWeeks / totalWeeks) * 100));
    const widthPct = Math.max(2, Math.min(100 - leftPct, (phase.durationWeeks / totalWeeks) * 100));

    const pStart = new Date(startDate);
    pStart.setDate(startDate.getDate() + leftOffsetWeeks * 7);
    const pEnd = new Date(pStart);
    pEnd.setDate(pStart.getDate() + phase.durationWeeks * 7 - 1);

    const startDateStr = pStart.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const endDateStr = pEnd.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

    return {
      ...phase,
      leftPct,
      widthPct,
      startDateStr,
      endDateStr
    };
  });

  return {
    scaleTier,
    scaleTitle,
    totalWeeks,
    startDate: startDate.toISOString().split('T')[0],
    endDate: finalEndDate.toISOString().split('T')[0],
    formattedDateRange,
    weekColumns,
    phases,
    executionSteps
  };
}
