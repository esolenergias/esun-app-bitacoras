import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Zap, Activity, CreditCard, CheckCircle2, AlertTriangle, BatteryCharging, Power } from 'lucide-react';
import { supabase } from '../../context/supabase';

// Mock de telemetría IoT
const MOCK_TELEMETRY = [
  { time: '00:00', kwh: 1.2 },
  { time: '04:00', kwh: 0.8 },
  { time: '08:00', kwh: 3.5 }, // Empieza la actividad en casa
  { time: '12:00', kwh: 2.1 }, // Solar está produciendo, consumo neto bajo
  { time: '16:00', kwh: 4.0 }, // AC encendido
  { time: '20:00', kwh: 5.5 }, // Horario punta, luces, tv
];

export default function EsolSmartTab() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    setLoading(true);
    try {
      // Obtenemos el usuario logueado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Revisar si tiene suscripción activa
      const { data, error } = await supabase
        .from('esol_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (data) {
        setHasSubscription(true);
      }
    } catch (e) {
      console.log('No subscription found or error checking');
    } finally {
      setLoading(false);
    }
  };

  const simulateCheckout = async () => {
    setProcessingPayment(true);
    try {
      const response = await fetch('http://localhost:4242/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; // Redirigir al cliente al Checkout seguro de Stripe
      } else {
        alert("Error creando la sesión de Stripe: " + data.error);
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error("Error conectando con el servidor de pagos", error);
      alert("Asegúrate de que el backend stripe_server.mjs esté corriendo.");
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-cream-dim animate-pulse font-mono text-sm">Cargando telemetría...</div>;
  }

  return (
    <div className="p-6 md:p-10 w-full h-full bg-dark-1 text-cream overflow-y-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-gold" />
            Esol <span className="text-gold">Smart Home</span>
          </h1>
          <p className="text-cream-dim text-sm font-mono mt-1">
            Plataforma de inteligencia energética y protección CFE.
          </p>
        </div>
        
        {hasSubscription ? (
          <div className="bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <span className="block text-[10px] uppercase font-black tracking-widest text-green-500/70">Estado de Póliza</span>
              <span className="block text-sm font-bold text-green-400">ACTIVA Y PROTEGIDA</span>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <div>
              <span className="block text-[10px] uppercase font-black tracking-widest text-red-500/70">Estado de Póliza</span>
              <span className="block text-sm font-bold text-red-400">VULNERABLE A CFE</span>
            </div>
          </div>
        )}
      </div>

      {!hasSubscription ? (
        // PANTALLA DE UPSELL (NO SUSCRITO)
        <div className="max-w-4xl mx-auto mt-12 bg-dark-2 border border-dark-4 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/5 rounded-full blur-3xl"></div>
          
          <Shield className="w-20 h-20 text-gold mx-auto mb-6" />
          <h2 className="text-3xl font-black font-display mb-4">Asegura tu "Recibo Cero"</h2>
          <p className="text-cream-muted text-lg mb-8 max-w-2xl mx-auto">
            Tu sistema fotovoltaico está funcionando, pero ¿qué pasa si falla y no te das cuenta hasta que CFE te cobra miles de pesos? Esol asume el riesgo por ti.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left mb-10">
            <div className="bg-dark-1 border border-dark-4 p-5 rounded-2xl">
              <Activity className="w-6 h-6 text-gold mb-3" />
              <h4 className="font-bold mb-2">Monitoreo IoT con IA</h4>
              <p className="text-xs text-cream-dim">Analizamos cada Watt de tu casa para detectar fugas de energía (Vampiros eléctricos).</p>
            </div>
            <div className="bg-dark-1 border border-dark-4 p-5 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-gold mb-3" />
              <h4 className="font-bold mb-2">Mantenimiento Preventivo</h4>
              <p className="text-xs text-cream-dim">Incluye 3 visitas de limpieza profunda con dron térmico al año.</p>
            </div>
            <div className="bg-dark-1 border-2 border-gold/50 bg-gold/5 p-5 rounded-2xl">
              <ShieldAlert className="w-6 h-6 text-gold mb-3" />
              <h4 className="font-bold mb-2">Garantía Financiera</h4>
              <p className="text-xs text-cream-dim">Si CFE te cobra de más por un fallo de tu sistema, Esol paga ese recibo de CFE. Cero estrés.</p>
            </div>
          </div>

          <div className="bg-dark-3 border border-dark-4 inline-block p-6 rounded-2xl w-full max-w-md mx-auto shadow-2xl">
            <h3 className="text-sm font-black uppercase text-cream-muted tracking-widest mb-2">Suscripción Mensual</h3>
            <div className="text-5xl font-display font-black text-white mb-6">$399 <span className="text-xl text-cream-dim font-body font-normal">MXN / mes</span></div>
            
            <button 
              onClick={simulateCheckout}
              disabled={processingPayment}
              className="w-full py-4 bg-gold hover:bg-gold-light text-dark-1 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {processingPayment ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {processingPayment ? 'Conectando con Banco...' : 'Activar Póliza Ahora'}
            </button>
            <p className="text-[9px] text-cream-muted mt-4 font-mono">Simulación: En producción esto abrirá Stripe Checkout.</p>
          </div>
        </div>
      ) : (
        // PANTALLA PREMIUM (SUSCRITO)
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Dashboard Izquierdo - Alertas y Telemetría */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-cream-dim mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold" /> Consumo vs Generación
              </h3>
              
              {/* Gráfica Mock */}
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {MOCK_TELEMETRY.map((data, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-full relative flex flex-col justify-end items-center h-48 bg-dark-1/50 rounded-t-lg overflow-hidden group-hover:bg-dark-1 transition-colors">
                      {/* Barra de Consumo (Rojo) */}
                      <div 
                        className="w-full bg-red-500/20 border-t border-red-500/50 absolute bottom-0"
                        style={{ height: `${(data.kwh / 6) * 100}%` }}
                      ></div>
                      {/* Barra de Generación Solar (Oro) */}
                      <div 
                        className="w-1/2 bg-gold/40 absolute bottom-0"
                        style={{ height: `${data.time === '12:00' || data.time === '16:00' ? 80 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono text-cream-muted">{data.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-cream-dim mb-4">Desagregación IA (NILM)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-dark-1 p-3 rounded-xl border border-dark-4">
                    <div className="flex items-center gap-3">
                      <Power className="w-4 h-4 text-blue-400" /> <span className="text-sm font-bold">Aire Acondicionado</span>
                    </div>
                    <span className="font-mono text-xs text-cream-dim">45% del total</span>
                  </div>
                  <div className="flex justify-between items-center bg-dark-1 p-3 rounded-xl border border-red-500/30">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-400" /> <span className="text-sm font-bold">Refrigerador (Fuga)</span>
                    </div>
                    <span className="font-mono text-xs text-red-400">30% (Alto)</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gold/10 border border-gold/30 rounded-2xl p-6 relative overflow-hidden">
                <Shield className="absolute -right-4 -bottom-4 w-32 h-32 text-gold/10" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gold mb-2">Seguro Activo</h3>
                <p className="text-2xl font-black text-white font-display">Recibo CFE <br/>Garantizado $0</p>
                <p className="text-xs text-cream-dim mt-4 max-w-[200px]">Tu cobertura está vigente. Cualquier fallo técnico es riesgo de Esol, no tuyo.</p>
              </div>
            </div>
          </div>

          {/* Panel Lateral Derecho */}
          <div className="space-y-6">
            <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-cream-dim mb-4">Salud del Inversor</h3>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-32 h-32 rounded-full border-4 border-green-500/20 flex items-center justify-center relative">
                  <div className="w-28 h-28 rounded-full border-4 border-green-500 border-t-transparent animate-spin-slow"></div>
                  <div className="absolute text-center">
                    <span className="block text-2xl font-black text-green-400">98%</span>
                    <span className="text-[9px] uppercase tracking-widest text-cream-dim">Óptimo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-cream-dim mb-4">Mantenimientos</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-1 rounded-xl opacity-50 grayscale">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-xs font-bold">Limpieza Primaveral</span>
                  </div>
                  <span className="text-[10px] font-mono">15 Mar 2026</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-1 border border-gold/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <BatteryCharging className="w-4 h-4 text-gold" /> <span className="text-xs font-bold text-gold">Inspección Térmica</span>
                  </div>
                  <span className="text-[10px] font-mono text-gold">Programado: 10 Nov</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
