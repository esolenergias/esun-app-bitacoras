const fs = require('fs');
const file = 'src/components/Portal.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* CLIENT ROLE SIDEBAR TABS  */}'));
const endIdx = lines.findIndex(l => l.includes('{/* Sidebar bottom actions */}'));

if (startIdx !== -1 && endIdx !== -1) {
    const newSidebar = `
                    {/* UNIFIED SIDEBAR TABS */}
                    {(() => {
                      const menu = [
                        { id: 'dashboard', label: 'Dashboard General', icon: BarChart, roles: ['master', 'admin'] },
                        { id: 'clientes', label: 'Clientes (CRM)', icon: Users, roles: ['master', 'admin'] },
                        { id: 'sdr', label: 'AI SDR (Ventas)', icon: Bot, roles: ['master', 'admin'] },
                        { id: 'grid', label: 'Esol Grid', icon: Globe, roles: ['master', 'admin', 'user'] },
                        { id: 'smart', label: 'Póliza Esol Smart', icon: Shield, roles: ['master', 'admin', 'user'] },
                        { id: 'esun', label: 'Esun Solar', icon: Sun, roles: ['master', 'admin'] },
                        { id: 'logistics', label: 'Logística envíos', icon: Truck, roles: ['master', 'admin'] },
                        { id: 'cfemanager', label: 'CFE Manager', icon: Zap, roles: ['master', 'admin'] },
                        { id: 'cotizador', label: 'Presupuestos esol', icon: Sparkles, roles: ['master', 'admin'] },
                        { id: 'legal', label: 'Legal Esol', icon: Shield, roles: ['master', 'admin'] },
                        { id: 'monitoreo', label: 'Monitoreo', icon: Activity, roles: ['master', 'admin'] },
                        { id: 'bitacoras', label: 'Bitácoras (App)', icon: Layers, roles: ['master', 'admin'] },
                        { id: 'mantenimientos', label: 'Mantenimientos (App)', icon: Wrench, roles: ['master', 'admin'] },
                      ];

                      const cmsMenu = [
                        { id: 'cms', label: 'Contenido CMS', icon: Edit, roles: ['master'] },
                        { id: 'modules', label: 'Módulos', icon: Layers, roles: ['master'] },
                        { id: 'seo', label: 'Lighthouse & SEO', icon: Globe, roles: ['master'] },
                      ];

                      const storeMenu = [
                        { id: 'store_products', label: 'Productos', icon: Package, roles: ['master'] },
                        { id: 'store_categories', label: 'Categorías', icon: Layers, roles: ['master'] },
                        { id: 'store_catalogs', label: 'Catálogos PDF', icon: FileText, roles: ['master'] },
                      ];

                      const adminMenu = [
                        { id: 'roles', label: 'Roles y Permisos', icon: Sliders, roles: ['master'] },
                        { id: 'cfeconfig', label: 'Ajustes Generales', icon: Settings, roles: ['master', 'admin'] },
                      ];

                      const renderButton = (item) => {
                        if (!item.roles.includes(currentUser.role)) return null;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); if (item.id === 'legal') setLegalTargetBudgetId(null); }}
                            className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer \${
                              activeTab === item.id
                                ? 'bg-gold/10 text-gold border-l-2 border-gold shadow-inner shadow-gold/5'
                                : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                            } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                          >
                            <Icon className="w-4 h-4 stroke-[2]" />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                          </button>
                        );
                      };

                      const hasCmsAccess = cmsMenu.some(i => i.roles.includes(currentUser.role));
                      const hasStoreAccess = storeMenu.some(i => i.roles.includes(currentUser.role));
                      const hasAdminAccess = adminMenu.some(i => i.roles.includes(currentUser.role));

                      return (
                        <div className="space-y-1">
                          {menu.map(renderButton)}

                          {hasCmsAccess && (
                            <div className="pt-2">
                              {!sidebarCollapsed && (
                                <button 
                                  onClick={() => setLandingExpanded(!landingExpanded)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase text-gold/70 hover:text-gold transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <LayoutTemplate className="w-3.5 h-3.5" />
                                    <span>Landing Page</span>
                                  </div>
                                  {landingExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                              {(landingExpanded || sidebarCollapsed) && (
                                <div className={sidebarCollapsed ? "space-y-0" : "pl-4 pr-2 py-1 space-y-1 border-l-2 border-dark-4 ml-4 mt-1"}>
                                  {cmsMenu.map(renderButton)}
                                </div>
                              )}
                            </div>
                          )}

                          {hasStoreAccess && (
                            <div className="pt-2">
                              {!sidebarCollapsed && (
                                <button 
                                  onClick={() => setTiendaExpanded(!tiendaExpanded)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase text-gold/70 hover:text-gold transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <Store className="w-3.5 h-3.5" />
                                    <span>Tienda Esol</span>
                                  </div>
                                  {tiendaExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                              {(tiendaExpanded || sidebarCollapsed) && (
                                <div className={sidebarCollapsed ? "space-y-0" : "pl-4 pr-2 py-1 space-y-1 border-l-2 border-dark-4 ml-4 mt-1"}>
                                  {storeMenu.map(renderButton)}
                                </div>
                              )}
                            </div>
                          )}

                          {hasAdminAccess && (
                            <div className="mt-8 pt-4 border-t border-dark-4/50 space-y-1">
                              {!sidebarCollapsed && <div className="px-3 pb-2 text-[8px] font-black uppercase text-cream-muted/40 tracking-widest text-center">Opciones de Administración</div>}
                              {adminMenu.map(renderButton)}
                            </div>
                          )}
                        </div>
                      );
                    })()}
`;
    lines.splice(startIdx - 1, endIdx - startIdx + 1, newSidebar);
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Success");
} else {
    console.log("Indices not found", startIdx, endIdx);
}
