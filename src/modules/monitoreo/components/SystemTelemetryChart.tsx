import React from 'react';
import { BarChart2, Calendar, RefreshCw } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';

interface SystemTelemetryChartProps {
  period: 'day' | 'month' | 'year' | 'total';
  setPeriod: (period: 'day' | 'month' | 'year' | 'total') => void;
  chartData: Array<{ date: string; fullDate: string; generacion: number; ahorroMxn: number }>;
  syncing: boolean;
  handleManualSync: () => void;
}

export const SystemTelemetryChart: React.FC<SystemTelemetryChartProps> = ({
  period,
  setPeriod,
  chartData,
  syncing,
  handleManualSync,
}) => {
  return (
    <div className="bg-dark-1 border border-dark-4 rounded-2xl p-5 space-y-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black text-cream flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gold" />
            Gestión de Energía Fotovoltaica ({period === 'day' ? 'Diario / Horas' : period === 'year' ? 'Anual / Meses' : period === 'total' ? 'Vida Útil / Años' : 'Mensual / Días'})
          </h3>
          <p className="text-[11px] text-cream-muted">
            Información de producción oficial sincronizada periódicamente en Supabase
          </p>
        </div>
        <span className="text-[10px] font-mono bg-dark-2 text-gold px-2.5 py-1 rounded-lg border border-dark-4 font-bold flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Vista: {period === 'day' ? 'Día (Horas)' : period === 'year' ? 'Año (Meses)' : period === 'total' ? 'Total (Años)' : 'Mes (Días)'}
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-cream-muted space-y-2">
            <p>No hay registros telemétricos guardados en Supabase para este período.</p>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/30 text-xs font-bold hover:bg-gold/20 cursor-pointer"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar ahora con FusionSolar'}
            </button>
          </div>
        ) : period === 'day' ? (
          <ResponsiveContainer key={`area-container-${period}`} width="100%" height="100%">
            <AreaChart key={`area-chart-${period}`} data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGeneracionReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5C158" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#E5C158" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2D31" />
              <XAxis dataKey="date" stroke="#8E9299" tick={{ fontSize: 10 }} interval={2} />
              <YAxis stroke="#8E9299" tick={{ fontSize: 10 }} unit=" kWh" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1C1E', borderColor: '#2B2D31', borderRadius: '12px', color: '#F3F4F6' }}
                formatter={(val: number) => [`${val} kWh`, 'Generación Horaria']}
              />
              <Area type="monotone" dataKey="generacion" name="Generación Real" stroke="#E5C158" strokeWidth={3} fillOpacity={1} fill="url(#colorGeneracionReal)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer key={`bar-container-${period}`} width="100%" height="100%">
            <BarChart key={`bar-chart-${period}`} data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2D31" />
              <XAxis dataKey="date" stroke="#8E9299" tick={{ fontSize: period === 'month' ? 9 : 10 }} interval={0} />
              <YAxis stroke="#8E9299" tick={{ fontSize: 10 }} unit={period === 'total' ? ' MWh' : ' kWh'} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1C1E', borderColor: '#2B2D31', borderRadius: '12px', color: '#F3F4F6' }}
                formatter={(val: number) => [`${val} ${period === 'total' ? 'MWh' : 'kWh'}`, 'Generación']}
              />
              <Bar dataKey="generacion" name="Generación" fill="#E5C158" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
