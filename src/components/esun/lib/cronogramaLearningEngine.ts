// Sistema de Aprendizaje Adaptativo para Cronograma de Obra ESOL
// Registra y calibra las duraciones y desfases habituales según el historial del usuario

export interface LearnedTierData {
  count: number;
  lastUpdated: string;
  stepAverages: Record<string, number>; // '01', '02', '03', '04', '05' -> avg weeks
  phaseAverages: Record<string, { avgDurationWeeks: number; avgStartWeekOffset: number }>;
}

export interface LearningState {
  version: number;
  residential: LearnedTierData;
  commercial: LearnedTierData;
  industrial: LearnedTierData;
}

const STORAGE_KEY = 'esol_cronograma_learning_v1';

const DEFAULT_LEARNING_STATE: LearningState = {
  version: 1,
  residential: {
    count: 0,
    lastUpdated: new Date().toISOString(),
    stepAverages: { '01': 1, '02': 1, '03': 1, '04': 1, '05': 1 },
    phaseAverages: {
      ing: { avgDurationWeeks: 0.8, avgStartWeekOffset: 0 },
      procura: { avgDurationWeeks: 1.5, avgStartWeekOffset: 0 },
      montaje: { avgDurationWeeks: 0.8, avgStartWeekOffset: 0.6 },
      electrico: { avgDurationWeeks: 0.6, avgStartWeekOffset: 1.0 },
      cfe: { avgDurationWeeks: 2.5, avgStartWeekOffset: 0 },
      medidor: { avgDurationWeeks: 0.8, avgStartWeekOffset: 1.2 },
      pruebas: { avgDurationWeeks: 0.5, avgStartWeekOffset: 1.5 }
    }
  },
  commercial: {
    count: 0,
    lastUpdated: new Date().toISOString(),
    stepAverages: { '01': 2, '02': 2, '03': 2, '04': 1, '05': 1 },
    phaseAverages: {
      ing: { avgDurationWeeks: 1.5, avgStartWeekOffset: 0 },
      estructura: { avgDurationWeeks: 2.0, avgStartWeekOffset: 0.8 },
      suministro: { avgDurationWeeks: 2.5, avgStartWeekOffset: 0.8 },
      montaje: { avgDurationWeeks: 1.8, avgStartWeekOffset: 2.0 },
      tableros: { avgDurationWeeks: 1.3, avgStartWeekOffset: 3.0 },
      cfe: { avgDurationWeeks: 4.5, avgStartWeekOffset: 0 },
      medidor: { avgDurationWeeks: 1.2, avgStartWeekOffset: 3.5 },
      pruebas: { avgDurationWeeks: 0.8, avgStartWeekOffset: 4.2 }
    }
  },
  industrial: {
    count: 0,
    lastUpdated: new Date().toISOString(),
    stepAverages: { '01': 2, '02': 4, '03': 4, '04': 3, '05': 1 },
    phaseAverages: {
      ing: { avgDurationWeeks: 2.5, avgStartWeekOffset: 0 },
      estructura: { avgDurationWeeks: 4.5, avgStartWeekOffset: 0.8 },
      suministro: { avgDurationWeeks: 6.0, avgStartWeekOffset: 0.8 },
      montaje: { avgDurationWeeks: 4.5, avgStartWeekOffset: 3.5 },
      tableros: { avgDurationWeeks: 4.5, avgStartWeekOffset: 5.5 },
      electrico: { avgDurationWeeks: 3.0, avgStartWeekOffset: 8.0 },
      cfe: { avgDurationWeeks: 5.5, avgStartWeekOffset: 0 },
      medidor: { avgDurationWeeks: 2.5, avgStartWeekOffset: 8.0 },
      pruebas: { avgDurationWeeks: 1.5, avgStartWeekOffset: 10.5 }
    }
  }
};

export function getLearningState(): LearningState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEARNING_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_LEARNING_STATE, ...parsed };
  } catch (e) {
    return DEFAULT_LEARNING_STATE;
  }
}

export function saveLearningState(state: LearningState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('No se pudo guardar el estado de aprendizaje en localStorage:', e);
  }
}

/**
 * Registra un ajuste de tiempos manual del usuario para alimentar el modelo estadístico de aprendizaje.
 */
export function recordCronogramaCalibration(
  scaleTier: 'residential' | 'commercial' | 'industrial',
  stepDurations: Record<string, number>,
  phaseCustomizations?: Record<string, { startWeek?: number; durationWeeks?: number }>
): LearningState {
  const state = getLearningState();
  const tierData = state[scaleTier];
  const count = tierData.count + 1;

  // Peso de amortiguación para promediar suavemente (learning rate)
  const alpha = Math.max(0.15, 1 / Math.min(10, count + 1));

  // 1. Actualizar promedios de pasos (01, 02, 03, 04, 05)
  const updatedSteps = { ...tierData.stepAverages };
  Object.entries(stepDurations).forEach(([stepKey, weeks]) => {
    if (typeof weeks === 'number' && weeks > 0) {
      const prev = updatedSteps[stepKey] || weeks;
      updatedSteps[stepKey] = Number((prev * (1 - alpha) + weeks * alpha).toFixed(2));
    }
  });

  // 2. Actualizar promedios de fases individuales
  const updatedPhases = { ...tierData.phaseAverages };
  if (phaseCustomizations) {
    Object.entries(phaseCustomizations).forEach(([phaseId, custom]) => {
      const prev = updatedPhases[phaseId] || { avgDurationWeeks: 1, avgStartWeekOffset: 0 };
      let newDur = prev.avgDurationWeeks;
      let newOffset = prev.avgStartWeekOffset;

      if (custom.durationWeeks && custom.durationWeeks > 0) {
        newDur = Number((prev.avgDurationWeeks * (1 - alpha) + custom.durationWeeks * alpha).toFixed(2));
      }
      if (custom.startWeek && custom.startWeek >= 1) {
        const offset = custom.startWeek - 1;
        newOffset = Number((prev.avgStartWeekOffset * (1 - alpha) + offset * alpha).toFixed(2));
      }

      updatedPhases[phaseId] = {
        avgDurationWeeks: newDur,
        avgStartWeekOffset: newOffset
      };
    });
  }

  state[scaleTier] = {
    count,
    lastUpdated: new Date().toISOString(),
    stepAverages: updatedSteps,
    phaseAverages: updatedPhases
  };

  saveLearningState(state);
  return state;
}

/**
 * Obtiene los promedios aprendidos para un tier específico
 */
export function getLearnedTierBaseline(scaleTier: 'residential' | 'commercial' | 'industrial'): LearnedTierData | null {
  const state = getLearningState();
  const tier = state[scaleTier];
  if (tier && tier.count > 0) {
    return tier;
  }
  return null;
}

/**
 * Restablece los datos de aprendizaje a los valores predeterminados
 */
export function resetLearningState(scaleTier?: 'residential' | 'commercial' | 'industrial'): void {
  const state = getLearningState();
  if (scaleTier) {
    state[scaleTier] = { ...DEFAULT_LEARNING_STATE[scaleTier] };
  } else {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  saveLearningState(state);
}
