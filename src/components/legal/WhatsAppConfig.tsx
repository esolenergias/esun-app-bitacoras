import React, { useState, useEffect, useRef } from 'react';
import { Phone, Power, QrCode, Save, RefreshCw, LogOut, CheckCircle2, XCircle, Bell, MessageSquare, AlertCircle, Settings } from 'lucide-react';

const API_URL = 'http://45.132.242.95:3001/api/whatsapp';
const API_KEY = 'esol-whatsapp-2024';

interface WaStatus {
  status: 'initializing' | 'qr' | 'connected' | 'disconnected';
  hasQR: boolean;
}

interface WaConfig {
  phone: string;
  friday_enabled: boolean;
  monday_enabled: boolean;
  friday_message: string;
  monday_message: string;
}

export default function WhatsAppConfig() {
  const [status, setStatus] = useState<WaStatus>({ status: 'initializing', hasQR: false });
  const [config, setConfig] = useState<WaConfig | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/status`, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        if (data.status === 'qr' && data.hasQR) {
          fetchQr();
        } else {
          setQr(null);
        }
      }
    } catch (err) {
      setStatus({ status: 'disconnected', hasQR: false });
    }
  };

  const fetchQr = async () => {
    try {
      const res = await fetch(`${API_URL}/qr`, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (res.ok && data.qr) {
        setQr(data.qr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/config`, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (res.ok) setConfig(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/logs`, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (res.ok && data.logs) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await fetchStatus();
    await fetchConfig();
    await fetchLogs();
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaveLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/config`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
      } else {
        setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red al guardar.' });
    }
    setSaveLoading(false);
  };

  const handleLogout = async () => {
    if (!confirm('¿Seguro que deseas desconectar el bot de WhatsApp? Tendrás que volver a escanear el QR.')) return;
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY }
      });
      setMessage({ type: 'success', text: 'Sesión cerrada.' });
      fetchStatus();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al cerrar sesión.' });
    }
  };

  return (
    <div className="bg-dark-2 border border-dark-4 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-light text-cream flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#25D366]" /> 
            Bot de Notificaciones WhatsApp
          </h3>
          <p className="text-sm text-cream-muted mt-1">
            Controla las notificaciones automatizadas del sistema hacia el grupo/encargado.
          </p>
        </div>
        <button 
          type="button"
          onClick={loadAll} 
          className="flex items-center gap-2 px-3 py-1.5 bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-lg text-cream-muted hover:text-cream text-xs transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Estado
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LADO IZQUIERDO: ESTADO Y QR */}
        <div className="space-y-6">
          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4">
            <h4 className="text-sm font-medium text-cream mb-4 flex items-center gap-2">
              <Power className="w-4 h-4 text-gold" /> Estado del Bot
            </h4>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-dark-1 rounded-lg border border-dark-4">
                {status.status === 'connected' ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-[#25D366] mb-2" />
                    <span className="text-sm font-medium text-[#25D366]">Bot Conectado</span>
                  </>
                ) : status.status === 'qr' ? (
                  <>
                    <QrCode className="w-8 h-8 text-gold mb-2" />
                    <span className="text-sm font-medium text-gold">Esperando Escaneo QR</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-500 mb-2" />
                    <span className="text-sm font-medium text-red-500">Desconectado</span>
                  </>
                )}
              </div>
            </div>

            {status.status === 'qr' && qr && (
              <div className="flex flex-col items-center p-4 bg-white rounded-lg mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`} 
                  alt="WhatsApp QR"
                  className="w-48 h-48"
                />
                <p className="text-xs text-center text-gray-600 mt-3">
                  Abre WhatsApp en tu teléfono, ve a <b>Dispositivos vinculados</b> y escanea este código.
                </p>
              </div>
            )}

            {status.status === 'connected' && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" /> Desvincular Bot
              </button>
            )}
          </div>

          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4">
            <h4 className="text-sm font-medium text-cream mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gold" /> Últimos Logs</span>
              <button type="button" onClick={fetchLogs} className="text-cream-muted hover:text-gold"><RefreshCw className="w-3 h-3" /></button>
            </h4>
            <div className="bg-dark-1 rounded-lg p-3 font-mono text-[10px] text-cream-muted h-48 overflow-y-auto border border-dark-4">
              {logs.length > 0 ? (
                logs.map((log, i) => <div key={i} className="mb-1 border-b border-dark-4 pb-1">{log}</div>)
              ) : (
                <div className="text-center mt-10">No hay registros recientes.</div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* LADO DERECHO: CONFIGURACIÓN */}
        <div>
          {config ? (
            <form onSubmit={handleSaveConfig} className="bg-dark-3/50 p-5 rounded-xl border border-dark-4 h-full flex flex-col">
              <h4 className="text-sm font-medium text-cream mb-4 flex items-center gap-2 border-b border-dark-4 pb-2">
                <Settings className="w-4 h-4 text-gold" /> Configuración de Avisos
              </h4>
              
              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-xs font-medium text-cream-muted mb-1 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Número de Destino (Admin/Grupo)
                  </label>
                  <input
                    type="text"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ej. 523112343034"
                    className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm font-mono"
                    required
                  />
                  <p className="text-[10px] text-dark-5 mt-1">Ingresa el código de país (52 para México) seguido del número.</p>
                </div>

                {/* Viernes */}
                <div className="border border-dark-4 rounded-lg p-3 bg-dark-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-cream flex items-center gap-2">
                      <Bell className="w-3 h-3 text-gold" /> Aviso de Viernes (4:00 PM)
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.friday_enabled}
                        onChange={(e) => setConfig({ ...config, friday_enabled: e.target.checked })}
                      />
                      <div className="w-9 h-5 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                  </div>
                  <textarea
                    value={config.friday_message}
                    onChange={(e) => setConfig({ ...config, friday_message: e.target.value })}
                    rows={4}
                    className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-xs"
                  />
                </div>

                {/* Lunes */}
                <div className="border border-dark-4 rounded-lg p-3 bg-dark-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-cream flex items-center gap-2">
                      <Bell className="w-3 h-3 text-gold" /> Aviso de Lunes (8:30 AM)
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={config.monday_enabled}
                        onChange={(e) => setConfig({ ...config, monday_enabled: e.target.checked })}
                      />
                      <div className="w-9 h-5 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                  </div>
                  <textarea
                    value={config.monday_message}
                    onChange={(e) => setConfig({ ...config, monday_message: e.target.value })}
                    rows={4}
                    className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-xs"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dark-4">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-dark-1 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saveLoading ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4 h-full flex items-center justify-center text-cream-muted text-sm">
              Cargando configuración...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
