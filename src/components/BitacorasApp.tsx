import React, { useState, useEffect } from 'react';
import { supabase } from '../context/supabase';
import { RefreshCw, Search, Calendar, MapPin, HardHat, TrendingUp, DollarSign, Cloud, Users, CheckCircle, Clock } from 'lucide-react';

interface Bitacora {
  id: string;
  site_name: string;
  date: string;
  weather: string;
  crew_count: number;
  description: string;
  physical_progress: number;
  financial_progress: number;
  budget_estimate: number;
  created_at: string;
}

export default function BitacorasApp() {
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const fetchBitacoras = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registros_app')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bitacoras:', error);
      } else {
        setBitacoras(data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBitacoras();
  }, []);

  const projects = Array.from(new Set(bitacoras.map(b => b.site_name)));

  const filteredBitacoras = bitacoras.filter(b => {
    const matchesSearch = b.site_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || b.site_name === selectedProject;
    return matchesSearch && matchesProject;
  });

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-6 rounded-2xl border border-dark-4 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-cream flex items-center gap-2">
            <HardHat className="text-gold w-6 h-6" />
            Bitácoras de Obra
          </h2>
          <p className="text-sm text-cream-muted mt-1">
            Registros sincronizados desde la App Móvil en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input 
              type="text" 
              placeholder="Buscar bitácora..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-3 border border-dark-4 rounded-xl py-2 pl-9 pr-4 text-sm text-cream focus:border-gold focus:outline-none transition-all"
            />
          </div>
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-dark-3 border border-dark-4 rounded-xl py-2 px-4 text-sm text-cream focus:border-gold focus:outline-none hidden md:block"
          >
            <option value="all">Todas las Obras</option>
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button 
            onClick={fetchBitacoras}
            className="p-2.5 bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-xl text-gold transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bitacoras List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-cream-dim">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-gold" />
            <p>Cargando bitácoras sincronizadas...</p>
          </div>
        ) : filteredBitacoras.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-cream-dim bg-dark-2 rounded-2xl border border-dark-4 border-dashed">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-bold text-cream-muted">No se encontraron registros</p>
            <p className="text-sm mt-1">Intenta buscar con otros términos o espera una sincronización de la app.</p>
          </div>
        ) : (
          filteredBitacoras.map((bitacora) => (
            <div key={bitacora.id} className="bg-dark-2 border border-dark-4 rounded-2xl p-5 hover:border-gold/50 transition-colors shadow-lg relative overflow-hidden group">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-dim to-gold opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-dark-3 rounded-lg border border-dark-4">
                    <MapPin className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-cream text-base">{bitacora.site_name}</h3>
                    <p className="text-xs text-cream-dim flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {bitacora.date}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Sincronizado
                  </span>
                  <span className="text-[9px] text-cream-dim mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(bitacora.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <p className="text-sm text-cream-muted leading-relaxed mb-4 line-clamp-3 bg-dark-3/50 p-3 rounded-xl border border-dark-4/50">
                {bitacora.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-cream-dim">Avance Físico</p>
                    <p className="text-sm font-black text-cream">{bitacora.physical_progress}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-cream-dim">Gasto Devengado</p>
                    <p className="text-sm font-black text-cream">${bitacora.financial_progress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-cream-dim">Clima</p>
                    <p className="text-sm font-bold text-cream">{bitacora.weather}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-cream-dim">Cuadrilla</p>
                    <p className="text-sm font-bold text-cream">{bitacora.crew_count} Pax</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
