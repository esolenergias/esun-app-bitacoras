import React, { useState } from 'react';
import type { ClienteReal, ProyectoReal, InsumoReal } from '../../types/adminTypes';
import { 
  Users, Briefcase, Boxes, BookOpen, FileText, Search, ExternalLink, Phone, Mail, MapPin, DollarSign, Calendar
} from 'lucide-react';

interface ClientesViewProps {
  clientes: ClienteReal[];
}

export const ClientesAdminView: React.FC<ClientesViewProps> = ({ clientes }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.telefono && c.telefono.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.rfc && c.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-dark-2 p-5 rounded-2xl border border-dark-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-gold-light">
              Base de Datos Conectada
            </span>
            <h2 className="text-xl font-bold text-cream">Clientes Registrados (CRM)</h2>
          </div>
          <p className="text-xs text-cream-muted mt-1">Conectado en tiempo real con la tabla `public.clientes`.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-dark-3 border border-dark-4 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-dark-2 p-4 rounded-2xl border border-dark-4 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-cream text-sm">{c.nombre}</h4>
                <div className="text-[11px] text-cream-dim font-mono">{c.rfc || 'Sin RFC'}</div>
              </div>
            </div>
            <div className="text-xs text-cream-muted space-y-1 pt-2 border-t border-dark-4/50">
              {c.telefono && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-cream-dim" /> {c.telefono}</div>}
              {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-cream-dim" /> {c.email}</div>}
              {c.direccion && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cream-dim" /> {c.direccion}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ProyectosViewProps {
  proyectos: ProyectoReal[];
}

export const ProyectosAdminView: React.FC<ProyectosViewProps> = ({ proyectos }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = proyectos.filter(p => 
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.folio && p.folio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-dark-2 p-5 rounded-2xl border border-dark-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Base de Datos Conectada
            </span>
            <h2 className="text-xl font-bold text-cream">Proyectos y Presupuestos</h2>
          </div>
          <p className="text-xs text-cream-muted mt-1">Conectado en tiempo real con la tabla `public.presupuestos`.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar proyecto o presupuesto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-dark-3 border border-dark-4 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-dark-2 p-4 rounded-2xl border border-dark-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {p.folio || p.id.slice(0, 8)}
                  </span>
                  <h4 className="font-bold text-cream text-sm mt-1">{p.titulo}</h4>
                </div>
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-dark-3 text-cream-muted">
                  {p.estatus}
                </span>
              </div>
              <div className="text-xs text-cream-muted mt-2">
                Cliente: <span className="font-semibold text-cream/90">{p.cliente_nombre}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dark-4/50 flex justify-between items-center text-xs">
              <div>
                <span className="text-cream-dim text-[10px] block">Presupuesto Venta</span>
                <span className="font-mono font-bold text-cream text-sm">${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-right">
                <span className="text-cream-dim text-[10px] block">Costo Directo</span>
                <span className="font-mono font-bold text-cream-muted">${p.costo_directo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface InsumosViewProps {
  insumos: InsumoReal[];
}

export const MaterialesAdminView: React.FC<InsumosViewProps> = ({ insumos }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = insumos.filter(i => 
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.codigo && i.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.categoria && i.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-dark-2 p-5 rounded-2xl border border-dark-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
              Base de Datos Conectada
            </span>
            <h2 className="text-xl font-bold text-cream">Catálogo Maestro de Insumos y Materiales</h2>
          </div>
          <p className="text-xs text-cream-muted mt-1">Conectado en tiempo real con la tabla `public.insumos`.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream-dim" />
          <input
            type="text"
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-dark-3 border border-dark-4 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="bg-dark-2 rounded-2xl border border-dark-4 shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-dark-3/90 border-b border-dark-4 text-xs font-bold uppercase text-cream-muted tracking-wider">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Categoría</th>
              <th className="p-3 text-center">Unidad</th>
              <th className="p-3 text-right">Precio Base</th>
              <th className="p-3 text-center">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-4/70">
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-dark-3/60 text-xs">
                <td className="p-3 font-mono text-cream-muted">{i.codigo || '—'}</td>
                <td className="p-3 font-bold text-cream">{i.nombre}</td>
                <td className="p-3 text-cream-muted">{i.categoria || 'General'}</td>
                <td className="p-3 text-center font-semibold text-cream/90">{i.unidad}</td>
                <td className="p-3 text-right font-mono font-bold text-emerald-600">
                  ${i.precio_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-dark-3 text-cream-muted">
                    {i.tipo || 'material'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
