import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Battery, Zap, Clock, Save, Edit3 } from 'lucide-react';
import type { LoadAppliance, LoadProfile } from '../esunTypes';

interface ClientContactData {
  clientName: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  city?: string;
}

interface LoadProfileFormProps {
  initialData?: LoadProfile;
  initialClientData?: ClientContactData;
  initialClientName?: string; // backwards compatibility
  onSubmit: (data: LoadProfile, contactData: ClientContactData) => void;
}

const DEFAULT_APPLIANCES = [
  { name: 'Focos LED', watts: 10, hours: 6, qty: 5 },
  { name: 'Refrigerador', watts: 150, hours: 10, qty: 1 },
  { name: 'Televisión', watts: 80, hours: 4, qty: 1 },
  { name: 'Ventilador', watts: 60, hours: 8, qty: 2 }
];

export default function LoadProfileForm({ initialData, initialClientData, initialClientName, onSubmit }: LoadProfileFormProps) {
  const [clientName, setClientName] = useState(
    initialClientData?.clientName && initialClientData.clientName !== 'Nuevo Sistema Aislado' 
      ? initialClientData.clientName 
      : (initialClientName && initialClientName !== 'Nuevo Sistema Aislado' ? initialClientName : '')
  );
  const [email, setEmail] = useState(initialClientData?.email || '');
  const [phone, setPhone] = useState(initialClientData?.phone || '');
  const [address, setAddress] = useState(initialClientData?.address || '');
  const [rfc, setRfc] = useState(initialClientData?.rfc || '');
  const [city, setCity] = useState(initialClientData?.city || '');
  const [appliances, setAppliances] = useState<LoadAppliance[]>(initialData?.appliances || 
    DEFAULT_APPLIANCES.map(a => ({
      id: Math.random().toString(36).substring(7),
      name: a.name,
      quantity: a.qty,
      watts: a.watts,
      hoursPerDay: a.hours,
      daysPerWeek: 7
    }))
  );

  const [dailyWh, setDailyWh] = useState(0);
  const [peakW, setPeakW] = useState(0);

  useEffect(() => {
    let totalWh = 0;
    let maxW = 0;
    appliances.forEach(app => {
      // average daily usage factor
      const weeklyFactor = app.daysPerWeek / 7;
      const dailyLoad = app.quantity * app.watts * app.hoursPerDay * weeklyFactor;
      totalWh += dailyLoad;
      // Peak watts assumes all could be on at once
      maxW += (app.quantity * app.watts);
    });
    setDailyWh(totalWh);
    setPeakW(maxW);
  }, [appliances]);

  const addAppliance = () => {
    setAppliances([
      ...appliances,
      {
        id: Math.random().toString(36).substring(7),
        name: 'Nuevo aparato',
        quantity: 1,
        watts: 0,
        hoursPerDay: 0,
        daysPerWeek: 7
      }
    ]);
  };

  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter(a => a.id !== id));
  };

  const updateAppliance = (id: string, field: keyof LoadAppliance, value: string | number) => {
    setAppliances(appliances.map(a => {
      if (a.id === id) {
        return { ...a, [field]: value };
      }
      return a;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      appliances,
      daily_Wh: dailyWh,
      peak_W: peakW
    }, {
      clientName: clientName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      rfc: rfc.trim() || undefined,
      city: city.trim() || undefined
    });
  };

  return (
    <div className="bg-dark-2/90 border border-dark-4 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Battery className="w-48 h-48" />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 bg-dark-1 border border-dark-4 rounded-2xl shadow-inner">
          <Zap className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-black text-cream">Levantamiento de Cargas</h2>
          <p className="text-sm text-cream-muted">Perfil de consumo para sistema aislado (Off-Grid)</p>
        </div>
      </div>

      {/* Datos del Cliente y Ubicación */}
      <div className="bg-dark-1/60 border border-dark-4 p-5 rounded-2xl mb-8 relative z-10 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-dark-4/60">
          <Edit3 className="w-4 h-4 text-gold" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cream">Datos del Cliente & Proyecto (CRM)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-cream-muted uppercase tracking-wider mb-1.5">Nombre del Cliente / Razón Social *</label>
            <input 
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full bg-dark-2 border border-dark-4 focus:border-gold/50 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors text-sm"
              placeholder="Ej. Juan Pérez o Rancho El Mezquite"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-cream-muted uppercase tracking-wider mb-1.5">Teléfono de Contacto</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full bg-dark-2 border border-dark-4 focus:border-gold/50 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors text-sm"
              placeholder="Ej. (311) 123-4567"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-cream-muted uppercase tracking-wider mb-1.5">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full bg-dark-2 border border-dark-4 focus:border-gold/50 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors text-sm"
              placeholder="Ej. cliente@ejemplo.com"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-cream-muted uppercase tracking-wider mb-1.5">Dirección / Ubicación de Instalación</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full bg-dark-2 border border-dark-4 focus:border-gold/50 text-cream px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors text-sm"
              placeholder="Ej. Predio Las Palmas Km 14 Carr. Aislada"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-dark-1/50 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-cream-muted uppercase font-bold tracking-wider mb-1">Consumo Diario Estimado</p>
            <p className="text-2xl font-mono font-black text-emerald-400">
              {(dailyWh / 1000).toFixed(2)} <span className="text-sm font-normal text-cream-muted">kWh/día</span>
            </p>
          </div>
          <Clock className="w-8 h-8 text-emerald-400/20" />
        </div>
        <div className="bg-dark-1/50 border border-dark-4 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-cream-muted uppercase font-bold tracking-wider mb-1">Potencia Máxima Simulada</p>
            <p className="text-2xl font-mono font-black text-gold">
              {(peakW / 1000).toFixed(2)} <span className="text-sm font-normal text-cream-muted">kW</span>
            </p>
          </div>
          <Zap className="w-8 h-8 text-gold/20" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="overflow-x-auto rounded-xl border border-dark-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-dark-2 text-gold border-b border-dark-4 select-none">
                <th className="p-3 font-semibold uppercase tracking-wider">Aparato</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-center">Cant.</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-center">Watts (W)</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-center">Horas/Día</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-center">Días/Sem.</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-center">Total Wh/día</th>
                <th className="p-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-4 bg-dark-1/30">
              {appliances.map(app => {
                const wh = app.quantity * app.watts * app.hoursPerDay * (app.daysPerWeek / 7);
                return (
                  <tr key={app.id} className="hover:bg-dark-2/45 transition-colors">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-3 h-3 text-dark-4" />
                        <input
                          type="text"
                          value={app.name}
                          onChange={(e) => updateAppliance(app.id, 'name', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-cream px-2 py-1.5 rounded focus:outline-none transition-colors"
                          required
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={app.quantity}
                        onChange={(e) => updateAppliance(app.id, 'quantity', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 mx-auto block bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-cream px-2 py-1.5 rounded focus:outline-none text-center font-mono"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={app.watts}
                        onChange={(e) => updateAppliance(app.id, 'watts', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="w-20 mx-auto block bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-gold px-2 py-1.5 rounded focus:outline-none text-center font-mono"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={app.hoursPerDay}
                        onChange={(e) => updateAppliance(app.id, 'hoursPerDay', parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 mx-auto block bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-cream px-2 py-1.5 rounded focus:outline-none text-center font-mono"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={app.daysPerWeek}
                        onChange={(e) => updateAppliance(app.id, 'daysPerWeek', parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 mx-auto block bg-transparent focus:bg-dark-1 border border-transparent focus:border-gold/30 text-cream px-2 py-1.5 rounded focus:outline-none text-center font-mono"
                        required
                      />
                    </td>
                    <td className="p-2 text-center font-mono text-emerald-400 font-bold">
                      {Math.round(wh)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeAppliance(app.id)}
                        className="p-1.5 text-dark-4 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={addAppliance}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gold hover:text-gold-light hover:bg-gold/10 rounded-xl transition-colors font-bold"
          >
            <Plus className="w-4 h-4" /> Agregar Aparato
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#C49825] hover:bg-gold-light text-dark-1 font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-gold/10 hover:scale-105"
          >
            <Save className="h-4 w-4" />
            <span>Continuar con Dimensionamiento</span>
          </button>
        </div>
      </form>
    </div>
  );
}
