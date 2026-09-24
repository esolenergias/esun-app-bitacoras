const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// The CLIENT ROLE SIDEBAR TABS
const clientSidebar = `                  {/* ------------------------- */}
                  {/* CLIENT ROLE SIDEBAR TABS  */}
                  {/* ------------------------- */}
                  {currentUser.role === 'user' && (
                    <>
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer \${
                          activeTab === 'dashboard'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                      >
                        <Zap className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Monitoreo</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('projects')}
                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer \${
                          activeTab === 'projects'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                      >
                        <Layers className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Mis Proyectos 3D</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('cfe')}
                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer \${
                          activeTab === 'cfe'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                      >
                        <TrendingUp className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Recibos CFE</span>}
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer \${
                          activeTab === 'chat'
                            ? 'bg-gold/10 text-gold border-l-2 border-gold font-black shadow-inner shadow-gold/5'
                            : 'text-cream-muted hover:text-cream hover:bg-dark-3'
                        } \${sidebarCollapsed ? 'justify-center' : ''}\`}
                      >
                        <MessageSquare className="w-4 h-4 stroke-[2]" />
                        {!sidebarCollapsed && <span>Asistente IA</span>}
                      </button>
                    </>
                  )}
                  
                  {/* ------------------------- */}
                  {/* MASTER & ADMIN ROLE SIDEBAR TABS  */}
                  {/* ------------------------- */}
                  {(currentUser.role === 'master' || currentUser.role === 'admin') && (`;

content = content.replace(
  /\{\/\* ------------------------- \*\/\}\s*\{\/\* MASTER ROLE SIDEBAR TABS  \*\/\}\s*\{\/\* ------------------------- \*\/\}\s*\{true && \(/,
  clientSidebar
);

fs.writeFileSync(file, content);
