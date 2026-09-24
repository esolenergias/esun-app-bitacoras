import React, { useState, useEffect, useRef } from 'react';
import { Phone, Power, QrCode, Save, RefreshCw, LogOut, CheckCircle2, XCircle, Bell, MessageSquare, AlertCircle, Settings, Plus, Trash2, Edit2, Play, X } from 'lucide-react';

const getApiUrl = (path: string) => {
  const isHttps = window.location.protocol === 'https:';
  return isHttps ? `/whatsapp-proxy.php?endpoint=${path}` : `http://45.132.242.95:3001/api/whatsapp${path}`;
};
const API_KEY = 'esol-whatsapp-2024';

interface WaStatus {
  status: 'initializing' | 'qr' | 'connected' | 'disconnected';
  hasQR: boolean;
}

interface WaMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  time: string;
  days: number[];
  enabled: boolean;
}

interface WaConfig {
  messages: WaMessage[];
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

export default function WhatsAppConfig() {
  const [status, setStatus] = useState<WaStatus>({ status: 'initializing', hasQR: false });
  const [config, setConfig] = useState<WaConfig | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WaMessage | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${getApiUrl('/status')}`, { headers: { 'x-api-key': API_KEY } });
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
      const res = await fetch(`${getApiUrl('/qr')}`, { headers: { 'x-api-key': API_KEY } });
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
      const res = await fetch(`${getApiUrl('/config')}`, { headers: { 'x-api-key': API_KEY } });
      const data = await res.json();
      if (res.ok) setConfig(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${getApiUrl('/logs')}`, { headers: { 'x-api-key': API_KEY } });
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

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaveLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiUrl('/config')}`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente y actualizada en el servidor.' });
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
      await fetch(`${getApiUrl('/logout')}`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY }
      });
      setMessage({ type: 'success', text: 'Sesión cerrada.' });
      fetchStatus();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al cerrar sesión.' });
    }
  };

  const handleAddNew = () => {
    const newMsg: WaMessage = {
      id: `msg-${Date.now()}`,
      name: 'Nuevo Aviso',
      phone: config?.messages?.[0]?.phone || '',
      message: '',
      time: '09:00',
      days: [],
      enabled: true
    };
    setEditForm(newMsg);
    setEditingMsgId(newMsg.id);
  };

  const handleEdit = (msg: WaMessage) => {
    setEditForm({ ...msg });
    setEditingMsgId(msg.id);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este mensaje? Recuerda Guardar Cambios para aplicar.')) return;
    const newConfig = { ...config!, messages: config!.messages.filter(m => m.id !== id) };
    setConfig(newConfig);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    let newMessages = [...(config?.messages || [])];
    const idx = newMessages.findIndex(m => m.id === editForm.id);
    if (idx >= 0) {
      newMessages[idx] = editForm;
    } else {
      newMessages.push(editForm);
    }
    setConfig({ messages: newMessages });
    setEditingMsgId(null);
    setEditForm(null);
  };

  const handleToggleEnable = (id: string) => {
    if (!config) return;
    const newMessages = config.messages.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m);
    setConfig({ messages: newMessages });
  };

  const handleTestMessage = async (msg: WaMessage) => {
    if (!msg.phone || !msg.message) {
      setMessage({ type: 'error', text: 'El mensaje debe tener número y texto para probar.' });
      return;
    }
    try {
      setMessage({ type: 'success', text: 'Enviando prueba...' });
      const res = await fetch(`${getApiUrl('/send')}`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: msg.phone, message: msg.message })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Mensaje de prueba enviado.' });
        fetchLogs();
      } else {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        setMessage({ type: 'error', text: `Error: ${errData.error || 'No se pudo enviar la prueba.'}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red al probar mensaje. Verifica tu conexión.' });
    }
  };

  const toggleDay = (dayVal: number) => {
    if (!editForm) return;
    const isSelected = editForm.days.includes(dayVal);
    setEditForm({
      ...editForm,
      days: isSelected ? editForm.days.filter(d => d !== dayVal) : [...editForm.days, dayVal].sort((a, b) => a - b)
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-light text-cream flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#25D366]" /> 
            Administración de Avisos Automatizados
          </h3>
          <p className="text-sm text-cream-muted mt-1">
            Controla y programa los mensajes recurrentes que se enviarán vía WhatsApp.
          </p>
        </div>
        <button 
          type="button"
          onClick={loadAll} 
          className="flex items-center gap-2 px-4 py-2 bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-lg text-cream-muted hover:text-cream text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Estado
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] xl:grid-cols-[400px_1fr] gap-8 flex-1 items-stretch min-h-0">
        {/* LADO IZQUIERDO: ESTADO Y LOGS */}
        <div className="space-y-6 sticky top-6 h-fit">
          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4">
            <h4 className="text-sm font-medium text-cream mb-4 flex items-center gap-2">
              <Power className="w-4 h-4 text-gold" /> Estado del Servidor
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
                  Abre WhatsApp en tu teléfono, ve a <b>Dispositivos vinculados</b> y escanea.
                </p>
              </div>
            )}

            {status.status === 'connected' && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" /> Desvincular Dispositivo
              </button>
            )}
          </div>

          <div className="bg-dark-3/50 p-5 rounded-xl border border-dark-4">
            <h4 className="text-sm font-medium text-cream mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gold" /> Registro de Envíos</span>
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

        {/* LADO DERECHO: ADMINISTRACIÓN DE MENSAJES */}
        <div className="bg-dark-3/50 rounded-xl border border-dark-4 flex flex-col h-full">
          <div className="p-5 border-b border-dark-4 flex items-center justify-between">
            <h4 className="text-sm font-medium text-cream flex items-center gap-2">
              <Settings className="w-4 h-4 text-gold" /> Tareas Programadas
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-4 hover:bg-dark-5 border border-dark-4 rounded-lg text-cream text-xs transition-colors"
              >
                <Plus className="w-3 h-3" /> Nuevo
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saveLoading}
                className="flex items-center gap-2 bg-gold hover:bg-gold-light text-dark-1 font-medium px-4 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
            {!config ? (
              <div className="text-center text-sm text-cream-muted py-10">Cargando tareas...</div>
            ) : config.messages.length === 0 ? (
              <div className="text-center text-sm text-cream-muted py-10">No hay mensajes configurados.</div>
            ) : (
              config.messages.map((msg) => (
                <div key={msg.id} className="bg-dark-2 border border-dark-4 rounded-lg p-4 relative group">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-1">
                        <h5 className="text-sm font-medium text-cream">{msg.name}</h5>
                        <label className="relative inline-flex items-center cursor-pointer" title={msg.enabled ? 'Desactivar' : 'Activar'}>
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={msg.enabled}
                            onChange={() => handleToggleEnable(msg.id)}
                          />
                          <div className="w-7 h-4 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#25D366]"></div>
                        </label>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-cream-muted mb-3">
                        <span className="flex items-center gap-1"><Bell className="w-3 h-3" /> {msg.time}</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {msg.phone || 'Sin número'}
                        </span>
                        <div className="flex gap-1 ml-2">
                          {DAYS_OF_WEEK.map(d => (
                            <span key={d.value} className={`w-4 h-4 text-[9px] flex items-center justify-center rounded-sm ${msg.days.includes(d.value) ? 'bg-gold text-dark-1 font-bold' : 'bg-dark-4 text-dark-5'}`}>
                              {d.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-dark-1 rounded p-3 text-xs text-cream-muted whitespace-pre-wrap border border-dark-4">
                        {msg.message}
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 sm:static">
                      <button onClick={() => handleTestMessage(msg)} title="Probar Envío" className="p-1.5 bg-dark-4 hover:bg-dark-5 rounded text-cream transition-colors"><Play className="w-3 h-3" /></button>
                      <button onClick={() => handleEdit(msg)} title="Editar" className="p-1.5 bg-dark-4 hover:bg-dark-5 rounded text-gold transition-colors"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(msg.id)} title="Eliminar" className="p-1.5 bg-dark-4 hover:bg-red-500/20 rounded text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      {editingMsgId && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-dark-2 border border-dark-4 rounded-xl shadow-2xl max-w-lg w-full p-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 border-b border-dark-4 pb-3">
              <h3 className="text-lg font-medium text-cream">{editingMsgId.startsWith('msg-') && !config?.messages.some(m => m.id === editingMsgId) ? 'Nuevo Aviso' : 'Editar Aviso'}</h3>
              <button onClick={() => setEditingMsgId(null)} className="text-cream-muted hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Ej. Recordatorio Juntas"
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Número Destino</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="Ej. 5213112854134"
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Horario (24h)</label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-2">Días de Envío</label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                        editForm.days.includes(d.value) 
                          ? 'bg-gold text-dark-1 shadow-[0_0_10px_rgba(212,175,55,0.3)]' 
                          : 'bg-dark-1 border border-dark-4 text-cream-muted hover:text-cream hover:bg-dark-3'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cream-muted mb-1">Mensaje (admite emojis y formato WhatsApp)</label>
                <textarea
                  value={editForm.message}
                  onChange={e => setEditForm({ ...editForm, message: e.target.value })}
                  rows={8}
                  className="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-cream focus:border-gold outline-none text-sm font-mono"
                  placeholder="*Hola*, este es un _mensaje_..."
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={editForm.enabled}
                    onChange={e => setEditForm({ ...editForm, enabled: e.target.checked })}
                  />
                  <div className="w-9 h-5 bg-dark-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
                <span className="text-xs text-cream">Mensaje Activo</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-dark-4">
              <button 
                type="button"
                onClick={() => setEditingMsgId(null)}
                className="px-4 py-2 bg-dark-4 hover:bg-dark-5 rounded-lg text-cream text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-gold hover:bg-gold-light text-dark-1 font-medium rounded-lg text-sm transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
