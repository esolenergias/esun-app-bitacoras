const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

const landingBlock = `<div className="pt-2">
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
                              <button
                                onClick={() => setActiveTab('cms')}
                                className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer \${
                                  activeTab === 'cms'
                                    ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                                    : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                                } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                              >
                                <Edit className="w-4 h-4 stroke-[2]" />
                                {!sidebarCollapsed && <span>Contenido CMS</span>}
                              </button>
                              <button
                                onClick={() => setActiveTab('modules')}
                                className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer \${
                                  activeTab === 'modules'
                                    ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                                    : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                                } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                              >
                                <Layers className="w-4 h-4 stroke-[2]" />
                                {!sidebarCollapsed && <span>Mdulos</span>}
                              </button>
                              <button
                                onClick={() => setActiveTab('seo')}
                                className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer \${
                                  activeTab === 'seo'
                                    ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                                    : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                                } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                              >
                                <Globe className="w-4 h-4 stroke-[2]" />
                                {!sidebarCollapsed && <span>Lighthouse & SEO</span>}
                              </button>
                            </div>
                          )}
                        </div>`;

if (content.includes(landingBlock)) {
    content = content.replace(landingBlock, `{currentUser.role === 'master' && (\n` + landingBlock + `\n)}`);
}

const configBlock = `<div className="pt-2">
                        {!sidebarCollapsed && (
                          <button 
                            onClick={() => setConfigExpanded(!configExpanded)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase text-gold/70 hover:text-gold transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Settings className="w-3.5 h-3.5" />
                              <span>Configuracin</span>
                            </div>
                            {configExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                        {(configExpanded || sidebarCollapsed) && (
                          <div className={sidebarCollapsed ? "space-y-0" : "pl-4 pr-2 py-1 space-y-1 border-l-2 border-dark-4 ml-4 mt-1"}>
                            <button
                              onClick={() => setActiveTab('agents')}
                              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer \${
                                activeTab === 'agents'
                                  ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                                  : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                              } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                            >
                              <Bot className="w-4 h-4 stroke-[2]" />
                              {!sidebarCollapsed && <span>Motores Chat IA</span>}
                            </button>
                            {currentUser.role === 'master' && (
                              <button
                                onClick={() => setActiveTab('roles')}
                                className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer \${
                                  activeTab === 'roles'
                                    ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                                    : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                                } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                              >
                                <Shield className="w-4 h-4 stroke-[2]" />
                                {!sidebarCollapsed && <span>Roles y Accesos</span>}
                              </button>
                            )}
                            <button
                              onClick={() => setActiveTab('cfeconfig')}
                              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer \${
                                activeTab === 'cfeconfig'
                                  ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                                  : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                              } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                            >
                              <Settings className="w-4 h-4 stroke-[2]" />
                              {!sidebarCollapsed && <span>Ajustes Generales</span>}
                            </button>
                          </div>
                        )}
                      </div>`;

if (content.includes(configBlock)) {
    content = content.replace(configBlock, `{currentUser.role === 'master' && (\n` + configBlock + `\n)}`);
}

fs.writeFileSync(file, content);
