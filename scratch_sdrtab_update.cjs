const fs = require('fs');

let c = fs.readFileSync('src/components/crm/SdrTab.tsx', 'utf8');

// 1. Fix all text-white to text-cream
c = c.replace(/text-white/g, 'text-cream');

// 2. Replace the workflow view entirely
const oldWorkflowMatch = /\{\/\* WORKFLOW \/ FLOWCHART VIEW \*\/\}[\s\S]*?(?=\{\/\* CONFIGURATION VIEW \*\/\})/m;

const newWorkflow = `\{/* WORKFLOW / FLOWCHART VIEW */\}
        {sdrView === 'workflow' && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500 p-8 overflow-y-auto">
            
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-black text-cream mb-2">Monitor de Agente IA</h2>
              <p className="text-cream-dim text-sm font-mono">Visualización en tiempo real de la oficina virtual del agente.</p>
            </div>

            {/* OFFICE FLOOR */}
            <div className="w-full max-w-5xl relative h-64 border-b-4 border-dark-4 flex items-end justify-between px-4 md:px-12 pb-2">
              
              {/* PIXEL AGENT CHARACTER */}
              <div 
                className="absolute bottom-2 w-16 h-20 transition-all duration-700 ease-in-out z-20 flex flex-col items-center justify-end pointer-events-none"
                style={{ 
                  left: workflowStep === 0 
                          ? '10%' 
                          : \`calc(\${10 + ((workflowStep - 1) * 20)}%)\`,
                  transform: 'translateX(-50%)',
                  opacity: workflowStep === 0 ? 0.3 : 1,
                  scale: workflowStep === 0 ? '0.8' : '1'
                }}
              >
                <div className={\`relative \${workflowStep > 0 && workflowStep < 5 ? 'animate-bounce' : ''}\`}>
                  <svg viewBox="0 0 100 120" className="w-16 h-20 drop-shadow-[0_10px_15px_rgba(212,175,55,0.3)]">
                    {/* Arms (Back) */}
                    <rect x="0" y="55" width="20" height="8" fill="currentColor" className="text-cream-dim" />
                    
                    {/* Legs */}
                    <rect x="35" y="80" width="8" height="20" fill="currentColor" className="text-cream-dim" />
                    <rect x="55" y="80" width="8" height="20" fill="currentColor" className="text-cream-dim" />
                    
                    {/* Feet */}
                    <rect x="25" y="95" width="18" height="8" fill="#141410" />
                    <rect x="55" y="95" width="18" height="8" fill="#141410" />
                    
                    {/* Body / Screen */}
                    <rect x="20" y="30" width="60" height="55" rx="8" fill="#C49825" />
                    <rect x="25" y="35" width="50" height="40" rx="4" fill="#141410" />
                    
                    {/* Animated Face inside screen */}
                    {workflowStep > 0 && workflowStep < 5 ? (
                      <g className="animate-pulse">
                        {/* Working Eyes */}
                        <rect x="35" y="45" width="8" height="8" fill="#C49825" />
                        <rect x="55" y="45" width="8" height="8" fill="#C49825" />
                        <rect x="42" y="60" width="16" height="4" fill="#C49825" />
                      </g>
                    ) : (
                      <g>
                        {/* Idle/Happy Eyes */}
                        <rect x="35" y="48" width="8" height="4" fill="#C49825" />
                        <rect x="55" y="48" width="8" height="4" fill="#C49825" />
                        <path d="M40,60 Q50,65 60,60" stroke="#C49825" strokeWidth="3" fill="none" />
                      </g>
                    )}
                    
                    {/* Arms (Front working) */}
                    {workflowStep > 0 && workflowStep < 5 ? (
                      <g className="animate-[pulse_0.2s_ease-in-out_infinite]">
                        <rect x="65" y="60" width="30" height="8" fill="currentColor" className="text-cream" />
                        <rect x="85" y="68" width="8" height="12" fill="currentColor" className="text-cream" />
                      </g>
                    ) : (
                      <g>
                        <rect x="75" y="55" width="8" height="25" fill="currentColor" className="text-cream" />
                      </g>
                    )}
                    
                    {/* Antena */}
                    <rect x="48" y="10" width="4" height="20" fill="#C49825" />
                    <circle cx="50" cy="10" r="4" fill="#C49825" className={workflowStep > 0 ? 'animate-ping' : ''} />
                  </svg>
                </div>
              </div>

              {/* DESK STATIONS */}
              {[
                { step: 1, title: 'Scraping', icon: Search, detail: 'Buscando' },
                { step: 2, title: 'Datos', icon: Database, detail: 'Extrayendo' },
                { step: 3, title: 'Filtro', icon: Target, detail: 'Calificando' },
                { step: 4, title: 'Pitch', icon: Zap, detail: 'Redactando' },
                { step: 5, title: 'CRM', icon: CheckCircle, detail: 'Guardando' }
              ].map((s, idx) => {
                const isActive = workflowStep === s.step;
                const isPast = workflowStep > s.step;
                const Icon = s.icon;
                
                return (
                  <div key={s.step} className="relative z-10 flex flex-col items-center w-24" style={{ left: \`\${10 + (idx * 20)}%\`, position: 'absolute', bottom: 0, transform: 'translateX(-50%)' }}>
                    
                    {/* Desk Graphic */}
                    <div className={\`w-20 h-24 rounded-t-xl flex flex-col items-center justify-end pb-2 relative transition-colors \${isActive ? 'bg-dark-3 border-t-2 border-l-2 border-r-2 border-gold shadow-[0_-5px_20px_rgba(212,175,55,0.15)]' : 'bg-dark-2 border-t-2 border-l-2 border-r-2 border-dark-4'}\`}>
                       
                       {/* Desk Top */}
                       <div className="absolute top-4 w-12 h-12 bg-dark-1 rounded-lg flex items-center justify-center border border-dark-4">
                         <Icon className={\`w-6 h-6 \${isActive ? 'text-gold animate-bounce' : isPast ? 'text-gold/50' : 'text-dark-4'}\`} />
                       </div>
                       
                       {/* Activity indicator */}
                       {isActive && (
                         <div className="absolute top-2 right-2 flex space-x-1">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0ms'}}></div>
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" style={{animationDelay: '150ms'}}></div>
                         </div>
                       )}

                       {/* Progress line connector */}
                       {idx < 4 && (
                          <div className="absolute top-10 left-[100%] w-[calc(100vw*0.13)] max-w-[150px] h-1 bg-dark-4 -z-10 hidden md:block">
                            <div 
                              className="h-full bg-gold transition-all duration-1000 ease-linear"
                              style={{ width: isPast ? '100%' : isActive ? '50%' : '0%' }}
                            ></div>
                          </div>
                       )}
                    </div>
                    
                    {/* Label */}
                    <div className="mt-4 text-center absolute -bottom-12">
                      <h3 className={\`font-black text-xs uppercase tracking-wide leading-tight \${isActive || isPast ? 'text-gold' : 'text-cream-dim'}\`}>
                        {s.title}
                      </h3>
                      <p className="text-[9px] font-mono text-cream-muted mt-1 opacity-75">{s.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-28 text-center relative z-30">
              {workflowStep === 0 ? (
                <button 
                  onClick={runAiAgent}
                  className="px-8 py-4 bg-gold hover:bg-gold-light text-dark-1 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-3 mx-auto transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:scale-105"
                >
                  <Play className="w-5 h-5" /> Iniciar Ciclo de Prospección
                </button>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-dark-3 border border-dark-4 rounded-full text-gold font-mono text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <Activity className="w-4 h-4 animate-spin" />
                  Trabajando en el módulo actual...
                </div>
              )}
            </div>
          </div>
        )}

        `;

if (!oldWorkflowMatch.test(c)) {
  console.log("Could not find the workflow block to replace!");
  process.exit(1);
}

c = c.replace(oldWorkflowMatch, newWorkflow);
fs.writeFileSync('src/components/crm/SdrTab.tsx', c);
console.log("Successfully updated SdrTab.tsx");
