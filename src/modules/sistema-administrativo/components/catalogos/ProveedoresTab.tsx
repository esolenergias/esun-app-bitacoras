import React, { useState } from 'react';
import type { Proveedor } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { 
  Building2, Phone, Mail, MapPin, Plus, Search, CreditCard, CheckCircle, Edit, Trash2,
  List, LayoutGrid
} from 'lucide-react';

interface ProveedoresTabProps {
  proveedores: Proveedor[];
  onRefresh: () => void;
}

export const ProveedoresTab: React.FC<ProveedoresTabProps> = ({
  proveedores,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'filas' | 'fichas'>('filas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [diasCredito, setDiasCredito] = useState<number | string>(0);
  const [limiteCredito, setLimiteCredito] = useState<number | string>(0);
  const [categoria, setCategoria] = useState('Paneles Solares e Inversores');

  const handleOpenCreate = () => {
    setEditingProveedor(null);
    setNombre('');
    setRfc('');
    setContacto('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setDiasCredito(0);
    setLimiteCredito(0);
    setCategoria('Paneles Solares e Inversores');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Proveedor) => {
    setEditingProveedor(p);
    setNombre(p.nombre);
    setRfc(p.rfc || '');
    setContacto(p.contacto_nombre || '');
    setTelefono(p.telefono || '');
    setEmail(p.email || '');
    setDireccion(p.direccion || '');
    setDiasCredito(p.dias_credito);
    setLimiteCredito(p.limite_credito);
    setCategoria(p.categoria_principal || 'General');
    setIsModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      alert('El nombre del proveedor es obligatorio.');
      return;
    }

    const payload: Partial<Proveedor> = {
      nombre: nombre.trim(),
      rfc: rfc.trim().toUpperCase(),
      contacto_nombre: contacto.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
      dias_credito: typeof diasCredito === 'string' ? (parseInt(diasCredito) || 0) : (diasCredito || 0),
      limite_credito: typeof limiteCredito === 'string' ? (parseFloat(limiteCredito) || 0) : (limiteCredito || 0),
      categoria_principal: categoria
    };

    if (editingProveedor) {
      payload.id = editingProveedor.id;
    }

    await adminDbService.guardarProveedor(payload);
    onRefresh();
    setIsModalOpen(false);
  };

  const filtered = proveedores.filter(p => {
    return (
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.rfc && p.rfc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.categoria_principal && p.categoria_principal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.contacto_nombre && p.contacto_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-2 p-5 rounded-2xl border border-dark-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-mono">
              Catálogo ({proveedores.length})
            </span>
            <h2 className="text-xl font-bold text-cream">Catálogo de Proveedores</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Directorio de distribuidores, condiciones de crédito, plazos de pago y datos fiscales.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl text-sm shadow-md shadow-gold/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Proveedor
        </button>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por nombre, RFC o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm text-cream placeholder-cream-muted/50 focus:border-gold focus:outline-none"
          />
        </div>

        {/* Toggle View Mode */}
        <div className="flex items-center bg-dark-3 p-1 rounded-xl border border-dark-4 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('filas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'filas'
                ? 'bg-gold text-dark-1 shadow-sm'
                : 'text-cream-muted hover:text-cream'
            }`}
            title="Ver en Filas (Tabla)"
          >
            <List className="w-3.5 h-3.5" />
            <span>Filas</span>
          </button>
          <button
            onClick={() => setViewMode('fichas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'fichas'
                ? 'bg-gold text-dark-1 shadow-sm'
                : 'text-cream-muted hover:text-cream'
            }`}
            title="Ver en Fichas (Cuadrícula)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Fichas</span>
          </button>
        </div>
      </div>

      {/* VISTA EN FILAS O FICHAS */}
      {filtered.length === 0 ? (
        <div className="bg-dark-2 p-12 rounded-2xl border border-dark-4 text-center">
          <Building2 className="w-12 h-12 text-cream-dim/40 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-cream">No hay proveedores registrados</h4>
          <p className="text-xs text-cream-muted mt-1">
            Haz clic en "Registrar Proveedor" para dar de alta un nuevo distribuidor.
          </p>
        </div>
      ) : viewMode === 'filas' ? (
        /* VISTA EN FILAS (TABLA) */
        <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Proveedor / Razón Social</th>
                  <th className="py-3.5 px-4">RFC</th>
                  <th className="py-3.5 px-4">Categoría Principal</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Teléfono / Correo</th>
                  <th className="py-3.5 px-4 text-center">Crédito</th>
                  <th className="py-3.5 px-4 text-right">Límite Crédito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-4/70 text-xs">
                {filtered.map((p, index) => (
                  <tr 
                    key={p.id} 
                    onClick={() => handleOpenEdit(p)}
                    className="hover:bg-dark-3/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-cream-dim text-[11px]">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gold/10 text-gold border border-gold/25 flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-gold group-hover:text-dark-1 transition-colors">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-cream text-sm group-hover:text-gold transition-colors">{p.nombre}</div>
                          {p.direccion && <div className="text-[10px] text-cream-muted truncate max-w-xs">{p.direccion}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gold">
                      {p.rfc || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-dark-3 text-cream-muted border border-dark-4">
                        {p.categoria_principal || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cream/90 font-medium">
                      {p.contacto_nombre || '—'}
                    </td>
                    <td className="py-3 px-4 text-cream-muted space-y-0.5">
                      {p.telefono && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-cream-dim" />
                          {p.telefono}
                        </div>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3 h-3 text-cream-dim" />
                          {p.email}
                        </div>
                      )}
                      {!p.telefono && !p.email && <span className="text-cream-dim">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-cream font-mono">
                        {p.dias_credito} d
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ${p.limite_credito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA EN FICHAS (CUADRÍCULA) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div 
              key={p.id} 
              onClick={() => handleOpenEdit(p)}
              className="bg-dark-2 rounded-2xl border border-dark-4 p-5 shadow-sm hover:shadow-md hover:border-gold/40 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-bold group-hover:bg-gold group-hover:text-dark-1 transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-cream text-sm leading-snug group-hover:text-gold transition-colors">{p.nombre}</h3>
                      <span className="text-xs text-cream-dim font-mono">{p.rfc || 'Sin RFC'}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(p);
                    }}
                    className="p-1.5 text-cream-dim hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-xs text-cream-muted">
                  {p.categoria_principal && (
                    <div className="inline-block px-2.5 py-0.5 rounded-md bg-dark-3 font-semibold text-cream/90 border border-dark-4">
                      {p.categoria_principal}
                    </div>
                  )}
                  {p.contacto_nombre && (
                    <div><span className="font-semibold text-cream-muted">Contacto:</span> {p.contacto_nombre}</div>
                  )}
                  {p.telefono && (
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-cream-dim" /> {p.telefono}</div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-cream-dim" /> {p.email}</div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-dark-4/50 flex justify-between items-center text-xs">
                <div>
                  <span className="text-cream-dim block text-[10px] uppercase">Crédito</span>
                  <span className="font-bold text-cream">{p.dias_credito} días</span>
                </div>
                <div className="text-right">
                  <span className="text-cream-dim block text-[10px] uppercase">Límite</span>
                  <span className="font-mono font-bold text-emerald-400">${p.limite_credito.toLocaleString('es-MX')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-lg w-full shadow-2xl border border-dark-4/50 overflow-hidden">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cream">
                    {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h3>
                  <p className="text-xs text-cream-muted">Configura datos fiscales y plazos comerciales.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-cream/90 uppercase mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Distribuidora Solar de México S.A. de C.V."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium text-cream focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    placeholder="DSM180901XX1"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono text-cream focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ej: Inversores, Estructuras..."
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Ej: Ing. Carlos Morales"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 55 1234 5678"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono text-cream focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Días de Crédito
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={diasCredito}
                    onChange={(e) => setDiasCredito(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold font-mono text-center text-cream focus:border-gold focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cream/90 uppercase mb-1">
                    Límite de Crédito ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={limiteCredito}
                    onChange={(e) => setLimiteCredito(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold font-mono text-center text-emerald-400 focus:border-gold focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-cream/90 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ventas@proveedor.com"
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-cream/90 uppercase mb-1">
                  Dirección / Domicilio
                </label>
                <textarea
                  rows={2}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, Número, Colonia, Ciudad..."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm text-cream focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              {editingProveedor ? (
                <button
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar al proveedor "${editingProveedor.nombre}"?`)) {
                      await adminDbService.eliminarProveedor(editingProveedor.id);
                      setIsModalOpen(false);
                      onRefresh();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={!nombre.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-dark-1 bg-gold hover:bg-gold-light disabled:opacity-50 rounded-xl shadow-md transition-all"
                >
                  Guardar Proveedor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
