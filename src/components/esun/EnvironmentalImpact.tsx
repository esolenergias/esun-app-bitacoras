import React from 'react';
import { Leaf, Trees, Car, Flame, ShieldAlert } from 'lucide-react';
import { SOLAR_CONSTANTS } from './lib/solarConstants';

interface EnvironmentalImpactProps {
  system: any; // Result from SystemProposal
}

export default function EnvironmentalImpact({ system }: EnvironmentalImpactProps) {
  const annualProduction = system.annual_production_kWh || 0;
  
  // Calculate metrics
  const totalProduction25yr = annualProduction * SOLAR_CONSTANTS.SYSTEM_LIFE;
  const co2SavedTons = (totalProduction25yr * SOLAR_CONSTANTS.CO2_FACTOR) / 1000;
  const treesEquivalent = (totalProduction25yr * SOLAR_CONSTANTS.CO2_FACTOR) / SOLAR_CONSTANTS.CO2_PER_TREE_KG;
  const carsEquivalent = co2SavedTons / SOLAR_CONSTANTS.CO2_PER_CAR_TONS;
  const coalEquivalentTons = co2SavedTons / SOLAR_CONSTANTS.CO2_PER_COAL_TON;

  return (
    <div className="p-6 bg-dark-1 border border-dark-4 rounded-2xl shadow-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-dark-4">
        <div className="p-2 bg-[#C49825]/10 rounded-lg text-gold border border-[#C49825]/20">
          <Leaf className="h-6 w-6 text-[#C49825]" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-gold uppercase tracking-wide">Impacto Ambiental</h2>
          <p className="text-cream-muted text-xs">Contribución ecológica estimada a lo largo de 25 años de operación.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CO2 Saved */}
        <div className="p-5 bg-dark-3/20 border border-dark-4 rounded-xl flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/25 text-emerald-400">
            <Leaf className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black font-mono text-cream block leading-tight">
              {Math.round(co2SavedTons).toLocaleString()}
            </span>
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">
              Toneladas CO₂
            </span>
          </div>
          <p className="text-[10px] text-cream-muted leading-relaxed">
            Emisiones de carbono evitadas a la atmósfera.
          </p>
        </div>

        {/* Trees */}
        <div className="p-5 bg-dark-3/20 border border-dark-4 rounded-xl flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-green-500/10 rounded-full border border-green-500/25 text-green-400">
            <Trees className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black font-mono text-cream block leading-tight">
              {Math.round(treesEquivalent).toLocaleString()}
            </span>
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">
              Árboles Plantados
            </span>
          </div>
          <p className="text-[10px] text-cream-muted leading-relaxed">
            Equivalente en árboles maduros absorbiendo CO₂.
          </p>
        </div>

        {/* Cars */}
        <div className="p-5 bg-dark-3/20 border border-dark-4 rounded-xl flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/25 text-blue-400">
            <Car className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black font-mono text-cream block leading-tight">
              {Math.round(carsEquivalent).toLocaleString()}
            </span>
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">
              Autos Fuera
            </span>
          </div>
          <p className="text-[10px] text-cream-muted leading-relaxed">
            Vehículos de pasajeros retirados por un año.
          </p>
        </div>

        {/* Coal */}
        <div className="p-5 bg-dark-3/20 border border-dark-4 rounded-xl flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-red-500/10 rounded-full border border-red-500/25 text-red-400">
            <Flame className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-black font-mono text-cream block leading-tight">
              {Math.round(coalEquivalentTons).toLocaleString()}
            </span>
            <span className="text-[10px] text-cream-muted font-bold uppercase tracking-wider block">
              Ton Carbón No Quemado
            </span>
          </div>
          <p className="text-[10px] text-cream-muted leading-relaxed">
            Combustible fósil que no se necesitó quemar.
          </p>
        </div>
      </div>
    </div>
  );
}
