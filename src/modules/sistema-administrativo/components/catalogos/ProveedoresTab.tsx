import React, { useState } from 'react';
import type { Proveedor } from '../../types/adminTypes';
import { adminDbService } from '../../services/adminDbService';
import { 
  Building2, Phone, Mail, MapPin, Plus, Search, CreditCard, CheckCircle, Edit, Trash2
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [diasCredito, setDiasCredito] = useState(30);
  const [limiteCredito, setLimiteCredito] = useState(50000);
  const [categoria, setCategoria] = useState('Paneles Solares e Inversores');

  const handleOpenCreate = () => {
    setEditingProveedor(null);
    setNombre('');
    setRfc('');
    setContacto('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setDiasCredito(30);
    setLimiteCredito(50000);
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
      dias_credito: diasCredito,
      limite_credito: limiteCredito,
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
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-gold-light">
              Catálogo
            </span>
            <h2 className="text-xl font-bold text-cream">Catálogo de Proveedores</h2>
          </div>
          <p className="text-sm text-cream-muted mt-1">
            Directorio de distribuidores, condiciones de crédito, plazos de pago y datos fiscales.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-light text-dark-1 font-bold rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Proveedor
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex bg-dark-2 p-4 rounded-xl border border-dark-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar por nombre, RFC o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-3 border border-dark-4 rounded-lg text-sm focus:bg-dark-2"
          />
        </div>
      </div>

      {/* Grid de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-dark-2 rounded-2xl border border-dark-4 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-cream text-sm leading-snug">{p.nombre}</h3>
                    <span className="text-xs text-cream-dim font-mono">{p.rfc || 'Sin RFC'}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 text-cream-dim hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-cream-muted">
                {p.categoria_principal && (
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-dark-3 font-semibold text-cream/90">
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
                <span className="font-mono font-bold text-emerald-600">${p.limite_credito.toLocaleString('es-MX')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-2 rounded-2xl max-w-lg w-full shadow-2xl border border-dark-4/50">
            <div className="p-6 border-b border-dark-4/50 flex justify-between items-center bg-dark-3/50">
              <div>
                <h3 className="text-lg font-bold text-cream">
                  {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>
                <p className="text-xs text-cream-muted">Configura datos fiscales y plazos comerciales.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-cream-dim hover:text-cream-muted font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Distribuidora Solar de México S.A. de C.V."
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-medium focus:bg-dark-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    placeholder="DSM180901XX1"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ej: Inversores, Estructuras..."
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Ej: Ing. Carlos Morales"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 55 1234 5678"
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Días de Crédito
                  </label>
                  <input
                    type="number"
                    value={diasCredito}
                    onChange={(e) => setDiasCredito(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                    Límite de Crédito ($)
                  </label>
                  <input
                    type="number"
                    value={limiteCredito}
                    onChange={(e) => setLimiteCredito(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm font-bold font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cream/90 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ventas@proveedor.com"
                  className="w-full p-2.5 bg-dark-3 border border-dark-4 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="p-6 border-t border-dark-4/50 flex justify-end gap-3 bg-dark-3/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-cream-muted hover:bg-dark-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={!nombre.trim()}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl shadow-md transition-all"
              >
                Guardar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
