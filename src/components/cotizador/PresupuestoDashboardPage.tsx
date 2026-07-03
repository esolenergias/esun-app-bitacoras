import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { 
  getPresupuestoDetails, calculateMatrixSellingPrice, 
  calculateMatrixDirectCost, calculateBudgetTotals 
} from '../../lib/cotizadorService';
import type { Presupuesto, PresupuestoConcepto, Insumo, Matriz } from '../../types/cotizador';
import { 
  Loader2, AlertTriangle, FileText, ChevronRight, ChevronDown, 
  Layers, Package, Users, Cpu, ShieldCheck, DollarSign, 
  TrendingUp, Download, Eye, RefreshCw, X, ArrowLeft, Layers2, Wrench
} from 'lucide-react';

interface PresupuestoDashboardPageProps {
  id: string;
}

export default function PresupuestoDashboardPage({ id }: PresupuestoDashboardPageProps) {
  const [budget, setBudget] = useState<(Presupuesto & { conceptos: PresupuestoConcepto[] }) | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [expandedConcepts, setExpandedConcepts] = useState<Record<string, boolean>>({});

  // Auth check states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Auth fields
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Fetch user session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile);
          } else {
            // Fallback role mapping
            const email = session.user.email || '';
            let role = 'user';
            if (email === 'menyfre@gmail.com' || email.includes('master')) {
              role = 'master';
            } else if (email.includes('admin')) {
              role = 'admin';
            }
            setCurrentUser({ id: session.user.id, email, role, name: email.split('@')[0] });
          }
        }
      } catch (e) {
        console.error('Error fetching session:', e);
      } finally {
        setCheckingAuth(false);
      }
    };
    fetchSession();
  }, []);

  // Fetch budget details
  const fetchBudgetDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPresupuestoDetails(id);
      setBudget(data);
    } catch (err: any) {
      console.error('Error fetching budget details:', err);
      setError('No se pudo encontrar el presupuesto o no tienes permisos para acceder a él.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
      fetchBudgetDetails();
    }
  }, [id, currentUser]);

  const handleUpdateStatus = async (newStatus: 'borrador' | 'enviado' | 'aprobado' | 'rechazado') => {
    if (!budget) return;
    setUpdatingStatus(true);
    try {
      const { error: dbError } = await supabase
        .from('presupuestos')
        .update({ status: newStatus })
        .eq('id', budget.id);

      if (dbError) throw dbError;
      setBudget(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('No se pudo actualizar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput,
        options: {
          emailRedirectTo: window.location.href,
        }
      });
      if (error) throw error;
      setCodeSent(true);
      alert('¡Enlace de acceso enviado! Revisa tu bandeja de entrada.');
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Error al iniciar sesión.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Toggle concept accordion
  const toggleConcept = (conceptId: string) => {
    setExpandedConcepts(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }));
  };

  // Helper currency formatting
  const formatCurrencyMXN = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `$${formatted} MXN`;
  };

  const getStatusBadgeStyles = (status: 'borrador' | 'enviado' | 'aprobado' | 'rechazado') => {
    switch (status) {
      case 'borrador': return 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
      case 'enviado': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'aprobado': return 'bg-green-500/15 text-green-400 border border-green-500/30';
      case 'rechazado': return 'bg-red-500/15 text-red-400 border border-red-500/30';
      default: return 'bg-cream/15 text-cream border border-cream/20';
    }
  };

  // ----------------------------------------------------
  // CALCULATIONS / ANALYTICS
  // ----------------------------------------------------
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
          <p className="text-xs uppercase tracking-widest text-cream-dim mt-3 font-bold">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Auth requirement guard
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center p-4 font-sans selection:bg-gold selection:text-dark-1">
        <div className="w-full max-w-md bg-dark-2 border border-dark-4 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold/30 via-gold to-gold/30" />
          
          <div className="text-center space-y-2">
            <span className="inline-flex p-3 bg-gold/10 text-gold rounded-full border border-gold/20 mb-2">
              <ShieldCheck className="w-7 h-7" />
            </span>
            <h3 className="font-display font-black text-lg text-cream uppercase tracking-wider">Dashboard Cotizador</h3>
            <p className="text-xs text-cream-muted leading-relaxed font-body">
              Acceso restringido para el personal máster y administrador de eSol Energías. Introduce tu correo para ingresar.
            </p>
          </div>

          <form onSubmit={handleSendMagicLink} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/25 rounded-xl text-xs flex items-start gap-2 select-none animate-[shake_0.4s_ease-in-out]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-cream-dim uppercase font-bold tracking-wider">Correo Electrónico</label>
              <input
                type="email"
                placeholder="usuario@esol.com.mx"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-3 bg-dark-1 border border-dark-4 focus:border-gold/40 text-xs text-cream rounded-xl focus:outline-none transition-colors"
                required
                disabled={authLoading}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gold hover:bg-gold-light disabled:opacity-50 text-dark-1 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-gold/10"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando enlace...</span>
                </>
              ) : (
                <span>Enviar enlace de acceso</span>
              )}
            </button>
          </form>

          {codeSent && (
            <p className="text-center text-[10px] text-green-400 font-mono">
              ✓ Te hemos enviado un link de acceso. Haz clic en el enlace del correo para iniciar sesión.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Admin / Master Access Guard
  if (currentUser.role !== 'admin' && currentUser.role !== 'master') {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-dark-2 border border-dark-4 p-8 rounded-3xl space-y-4 text-center shadow-2xl relative">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full border border-red-500/25 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-display font-black text-base text-cream uppercase tracking-wider">Acceso Restringido</h3>
          <p className="text-xs text-cream-muted leading-relaxed font-body">
            Tu cuenta con rol <strong className="text-gold font-mono">"{currentUser.role}"</strong> no tiene permisos de visualización ni edición en el Cotizador IA.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
              className="px-4 py-2 border border-dark-4 hover:bg-dark-3 text-xs text-cream-muted hover:text-cream rounded-xl transition-colors cursor-pointer"
            >
              Cerrar Sesión / Cambiar Cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
          <p className="text-xs uppercase tracking-widest text-cream-dim mt-3 font-bold">Cargando dashboard del presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="min-h-screen bg-dark-1 text-cream flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-dark-2 border border-dark-4 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="font-display font-black text-base text-cream uppercase tracking-wide">Error al Cargar</h3>
          <p className="text-xs text-cream-muted font-body leading-relaxed">{error || 'No se pudo cargar la información del presupuesto.'}</p>
          <div className="pt-2">
            <button 
              onClick={() => window.close()}
              className="px-4 py-2 bg-dark-3 border border-dark-4 text-xs font-black uppercase tracking-wider text-gold rounded-xl hover:bg-dark-4 transition-colors cursor-pointer"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Calculations ---
  const concepts = budget.conceptos || [];
  const totals = calculateBudgetTotals(concepts);
  const directCost = totals.directCostTotal;
  const sellingPrice = totals.sellingPriceTotal;
  const marginVal = sellingPrice - directCost;
  const marginPct = sellingPrice > 0 ? (marginVal / sellingPrice) * 100 : 0;

  // Insumos Aggregation for sharing analytics
  const aggregatedInsumos = {
    material: 0,
    labor: 0,
    equipment: 0,
    tool: 0,
    service: 0,
    total: 0
  };

  concepts.forEach(c => {
    const qty = Number(c.quantity) || 0;
    const matrix = c.matriz;
    if (matrix && matrix.insumos) {
      matrix.insumos.forEach(item => {
        const costVal = Number(item.insumo.cost) || 0;
        const matrixQty = Number(item.quantity) || 0;
        const totalCost = costVal * matrixQty * qty;
        
        const type = item.insumo.type;
        if (type in aggregatedInsumos) {
          aggregatedInsumos[type as keyof typeof aggregatedInsumos] += totalCost;
          aggregatedInsumos.total += totalCost;
        }
      });
    }
  });

  return (
    <div className="min-h-screen bg-dark-1 text-cream font-sans p-6 space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-dark-2 border border-dark-4 p-5 rounded-2xl shadow-md select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gold/10 text-gold rounded-lg border border-gold/20">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="font-display font-black text-lg text-cream uppercase tracking-wide">
              DASHBOARD DE PRESUPUESTO
            </h1>
          </div>
          <p className="text-xs text-cream-muted leading-relaxed font-body">
            Cliente: <strong className="text-cream">{budget.client_name}</strong> &bull; Nombre: <strong className="text-cream">{budget.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status selector */}
          <div className="flex items-center gap-2 bg-dark-1 border border-dark-4 p-1.5 rounded-xl">
            <span className="text-[9px] font-black uppercase tracking-widest text-cream-muted pl-2">Estado:</span>
            <select
              value={budget.status}
              disabled={updatingStatus}
              onChange={(e) => handleUpdateStatus(e.target.value as any)}
              className="bg-transparent text-xs text-cream outline-none border-none pr-6 cursor-pointer font-bold uppercase tracking-wider"
            >
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
            {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold mr-1.5" />}
          </div>

          <button
            onClick={() => window.close()}
            className="px-4 py-2.5 bg-dark-3 border border-dark-4 hover:border-cream/20 text-cream-muted hover:text-cream text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Costo Directo Consolidado', value: formatCurrencyMXN(directCost), icon: DollarSign, color: 'text-cream' },
          { label: 'Precio de Venta Sugerido', value: formatCurrencyMXN(sellingPrice), icon: TrendingUp, color: 'text-gold' },
          { label: 'Margen Estimado (Utilidad)', value: formatCurrencyMXN(marginVal), icon: DollarSign, color: 'text-green-400' },
          { label: 'Porcentaje de Margen', value: `${marginPct.toFixed(2)}%`, icon: Layers, color: marginPct > 15 ? 'text-green-400' : 'text-amber-400' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-dark-2/60 border border-dark-4 rounded-2xl p-5 space-y-2 shadow-sm relative overflow-hidden group hover:border-gold/20 transition-all select-none">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-cream-muted">{kpi.label}</span>
              <span className={`p-2 bg-dark-1/80 border border-dark-4 rounded-xl ${kpi.color} group-hover:scale-105 transition-transform`}>
                <kpi.icon className="w-4 h-4" />
              </span>
            </div>
            <p className={`text-xl font-mono font-bold tracking-wide select-all ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 3. Main Dashboard Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Concept List Breakdown (Accordion) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-dark-2/40 border border-dark-4 p-4 rounded-2xl flex justify-between items-center select-none">
            <h2 className="font-display font-black text-xs uppercase tracking-wider text-cream flex items-center gap-1.5 font-sans">
              <Layers2 className="w-4 h-4 text-gold" />
              Desglose de Conceptos de Obra ({concepts.length})
            </h2>
            <span className="text-[10px] font-mono text-cream-muted">Haz clic en un concepto para expandir su APU</span>
          </div>

          <div className="space-y-3">
            {concepts.map((c) => {
              const unitSelling = calculateMatrixSellingPrice(Number(c.cost_price), Number(c.indirect_percentage), Number(c.utility_percentage));
              const totalDirect = Number(c.quantity) * Number(c.cost_price);
              const totalSelling = Number(c.quantity) * unitSelling;
              const isExpanded = !!expandedConcepts[c.id];

              return (
                <div key={c.id} className="bg-dark-2/65 border border-dark-4 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-gold/15">
                  
                  {/* Concept Summary Row (Header) */}
                  <div 
                    onClick={() => toggleConcept(c.id)}
                    className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-dark-3/20 select-none"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.matriz?.code && (
                          <span className="font-mono text-[9px] font-bold text-gold px-2 py-0.5 bg-gold/10 border border-gold/25 rounded-md">
                            {c.matriz.code}
                          </span>
                        )}
                        <span className="text-[10px] text-cream-muted font-mono uppercase">Unidad: {c.unit} &bull; Cant: {Number(c.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-xs font-bold text-cream leading-relaxed">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-6 justify-between w-full md:w-auto">
                      <div className="text-right space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-cream-muted">Importe Venta</p>
                        <p className="text-sm font-mono font-bold text-gold">{formatCurrencyMXN(totalSelling)}</p>
                        <p className="text-[8px] font-mono text-cream-dim">Directo: {formatCurrencyMXN(totalDirect)}</p>
                      </div>
                      <div className="text-cream-muted">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Concept Detail APU Breakdown (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-dark-4 bg-dark-1/30 p-5 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-gold select-none border-b border-dark-4/70 pb-2">
                        Desglose Interno del concepto (Análisis de Precios Unitarios)
                      </h4>

                      {c.matriz && c.matriz.insumos && c.matriz.insumos.length > 0 ? (
                        <div className="border border-dark-4/70 rounded-xl overflow-hidden">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="border-b border-dark-4 bg-dark-2/80 text-cream-muted select-none text-[9px] uppercase tracking-wider">
                                <th className="py-2.5 px-3 font-bold">Código</th>
                                <th className="py-2.5 px-3 font-bold">Tipo</th>
                                <th className="py-2.5 px-3 font-bold">Insumo</th>
                                <th className="py-2.5 px-3 font-bold text-center">Unidad</th>
                                <th className="py-2.5 px-3 font-bold text-right">Rend. Unit.</th>
                                <th className="py-2.5 px-3 font-bold text-right">Costo Unit.</th>
                                <th className="py-2.5 px-3 font-bold text-right">Cantidad Tot.</th>
                                <th className="py-2.5 px-3 font-bold text-right">Importe Tot.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-4/60">
                              {c.matriz.insumos.map((item, idx) => {
                                const rend = Number(item.quantity) || 0;
                                const costVal = Number(item.insumo.cost) || 0;
                                const totalQty = rend * Number(c.quantity);
                                const totalCost = costVal * totalQty;

                                return (
                                  <tr key={idx} className="hover:bg-dark-2/15 transition-colors">
                                    <td className="py-2 px-3 font-mono font-bold text-gold/90 select-all">{item.insumo.code}</td>
                                    <td className="py-2 px-3 select-none text-[9px]">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-95 border ${
                                        item.insumo.type === 'material' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        item.insumo.type === 'labor' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        item.insumo.type === 'equipment' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        item.insumo.type === 'tool' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      }`}>
                                        {item.insumo.type === 'material' ? 'Mat' :
                                         item.insumo.type === 'labor' ? 'MO' :
                                         item.insumo.type === 'equipment' ? 'Eq' :
                                         item.insumo.type === 'tool' ? 'Herr' : 'Trám'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-cream leading-relaxed">{item.insumo.description}</td>
                                    <td className="py-2 px-3 text-cream-muted text-center font-mono">{item.insumo.unit}</td>
                                    <td className="py-2 px-3 text-right font-mono select-all">{rend.toFixed(4)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-cream-dim select-all">{formatCurrencyMXN(costVal)}</td>
                                    <td className="py-2 px-3 text-right font-mono text-cream-dim select-all">{totalQty.toFixed(2)}</td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-cream select-all">{formatCurrencyMXN(totalCost)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[10px] text-cream-muted font-body">Esta matriz no tiene insumos asignados.</p>
                      )}

                      {/* Cascaded concept subtotal math card */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-dark-1/80 border border-dark-4/70 p-3 rounded-xl font-mono text-[10px]">
                        <div>
                          <span className="text-cream-dim block uppercase text-[8px] font-black tracking-widest select-none">P.U. Costo Directo</span>
                          <span className="text-cream font-bold">{formatCurrencyMXN(Number(c.cost_price))}</span>
                        </div>
                        <div>
                          <span className="text-cream-dim block uppercase text-[8px] font-black tracking-widest select-none">Margen Indirecto</span>
                          <span className="text-cream-dim">{c.indirect_percentage.toFixed(1)}% &bull; Utilidad: {c.utility_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="col-span-2 md:col-span-1 text-right">
                          <span className="text-gold block uppercase text-[8px] font-black tracking-widest select-none">P.U. Precio de Venta</span>
                          <span className="text-gold font-bold">{formatCurrencyMXN(unitSelling)}</span>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Analytics & Metadata Summary */}
        <div className="space-y-6">
          
          {/* Categoría Share Analytics card */}
          <div className="bg-dark-2/60 border border-dark-4 p-5 rounded-2xl space-y-4 shadow-sm select-none">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-cream flex items-center gap-1.5 font-sans">
              <Package className="w-4 h-4 text-gold" />
              Explosión Analítica de Costos
            </h3>
            <p className="text-[10px] text-cream-muted font-body leading-relaxed">
              Distribución total consolidada del costo directo acumulado por categoría de insumo.
            </p>

            <div className="space-y-3.5 pt-2">
              {([
                { key: 'material',  label: 'Materiales',   colorBg: 'bg-blue-500/15', colorFill: 'bg-blue-400', border: 'border-blue-500/20', text: 'text-blue-400' },
                { key: 'labor',     label: 'Mano de Obra', colorBg: 'bg-green-500/15', colorFill: 'bg-green-400', border: 'border-green-500/20', text: 'text-green-400' },
                { key: 'equipment', label: 'Equipos',      colorBg: 'bg-amber-500/15', colorFill: 'bg-amber-400', border: 'border-amber-500/20', text: 'text-amber-400' },
                { key: 'tool',      label: 'Herramientas', colorBg: 'bg-purple-500/15', colorFill: 'bg-purple-400', border: 'border-purple-500/20', text: 'text-purple-400' },
                { key: 'service',   label: 'Trámites',     colorBg: 'bg-rose-500/15', colorFill: 'bg-rose-400', border: 'border-rose-500/20', text: 'text-rose-400' }
              ] as const).map(cat => {
                const cost = aggregatedInsumos[cat.key];
                const pct = aggregatedInsumos.total > 0 ? (cost / aggregatedInsumos.total) * 100 : 0;

                return (
                  <div key={cat.key} className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-cream-dim">
                      <span className="font-bold">{cat.label}</span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                    {/* Visual bar progress */}
                    <div className="h-2 w-full bg-dark-1 rounded-full overflow-hidden border border-dark-4/40">
                      <div className={`h-full ${cat.colorFill} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-cream-muted pt-0.5">
                      <span>Importe:</span>
                      <span className="font-bold text-cream">{formatCurrencyMXN(cost)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-dark-4 pt-3 mt-4 flex justify-between items-center font-mono text-[10px] text-cream font-bold">
              <span>Costo Directo Total:</span>
              <span className="text-gold">{formatCurrencyMXN(directCost)}</span>
            </div>
          </div>

          {/* Budget metadata card */}
          <div className="bg-dark-2/60 border border-dark-4 p-5 rounded-2xl space-y-4 shadow-sm select-none font-mono text-[10px]">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-cream flex items-center gap-1.5 font-sans">
              <FileText className="w-4 h-4 text-gold" />
              Metadatos del Presupuesto
            </h3>
            
            <div className="divide-y divide-dark-4 space-y-2.5">
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">ID del Presupuesto</span>
                <span className="text-cream truncate max-w-[140px] select-all" title={budget.id}>{budget.id}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">Fecha de Creación</span>
                <span className="text-cream">{budget.created_at ? new Date(budget.created_at).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">Última Modificación</span>
                <span className="text-cream">{budget.updated_at ? new Date(budget.updated_at).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-cream-dim">Creado por</span>
                <span className="text-cream">eSol APU Portal</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
