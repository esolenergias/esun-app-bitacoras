const fs = require('fs');

let c = fs.readFileSync('src/components/crm/SdrTab.tsx', 'utf8');

const oldWorkflowMatch = /\{\/\* WORKFLOW \/ FLOWCHART VIEW \*\/\}[\s\S]*?(?=\{\/\* CONFIGURATION VIEW \*\/\})/m;

const newWorkflow = `\{/* WORKFLOW / FLOWCHART VIEW */\}
        {sdrView === 'workflow' && (
          <div className="h-full flex flex-col items-center animate-in fade-in duration-500 overflow-hidden relative">
            
            <div className="text-center mt-12 mb-8 relative z-30">
              <h2 className="text-3xl font-display font-black text-cream mb-2">Monitor de Agente IA</h2>
              <p className="text-cream-dim text-sm font-mono">Visualización en tiempo real del proceso.</p>
            </div>

            {/* VISUALIZATION CONTAINER */}
            <div className="w-full max-w-5xl h-[28rem] relative mt-4">
              
              {/* THE STREET / HALLWAY */}
              <div className="absolute top-1/2 -translate-y-1/2 left-[2%] right-[2%] h-12 bg-dark-2 rounded-xl border border-dark-4 flex items-center justify-center shadow-inner overflow-hidden z-10">
                <div className="w-full h-1 border-t-[3px] border-dashed border-gold/30"></div>
                {/* Street details */}
                <div className="absolute left-0 bottom-0 w-full h-1 bg-dark-4/50"></div>
              </div>

              {/* PIXEL AGENT CHARACTER (ABOVE THE STREET) */}
              <div 
                className="absolute transition-all duration-700 ease-in-out z-30 flex flex-col items-center justify-end pointer-events-none"
                style={{ 
                  bottom: 'calc(50% + 24px)', // Standing exactly on the street
                  left: workflowStep === 0 ? '10%' : \`calc(\${10 + ((workflowStep - 1) * 20)}%)\`,
                  transform: 'translateX(-50%)',
                  opacity: workflowStep === 0 ? 0.3 : 1,
                  scale: workflowStep === 0 ? '0.8' : '1'
                }}
              >
                {/* Connection shadow down to street */}
                <div className="absolute -bottom-6 w-12 h-4 bg-dark-1/80 blur-sm rounded-[100%]"></div>
                <div className="absolute -bottom-6 w-8 h-3 bg-gold/20 blur-sm rounded-[100%] animate-pulse"></div>

                <div className={\`relative \${workflowStep > 0 && workflowStep < 5 ? 'animate-bounce' : ''}\`}>
                  <svg viewBox="0 0 100 120" className="w-16 h-20 drop-shadow-[0_10px_15px_rgba(212,175,55,0.4)]">
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
                        <rect x="35" y="45" width="8" height="8" fill="#C49825" />
                        <rect x="55" y="45" width="8" height="8" fill="#C49825" />
                        <rect x="42" y="60" width="16" height="4" fill="#C49825" />
                      </g>
                    ) : (
                      <g>
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

              {/* MODULE ICONS (BELOW THE STREET) */}
              {[
                { step: 1, title: 'Scraping', icon: Search, detail: 'Buscando empresas' },
                { step: 2, title: 'Datos', icon: Database, detail: 'Extrayendo' },
                { step: 3, title: 'Calificación', icon: Target, detail: 'Tarifa CFE' },
                { step: 4, title: 'Generación', icon: Zap, detail: 'Pitch IA' },
                { step: 5, title: 'Pipeline', icon: CheckCircle, detail: 'CRM' }
              ].map((s, idx) => {
                const isActive = workflowStep === s.step;
                const isPast = workflowStep > s.step;
                const Icon = s.icon;
                
                return (
                  <div 
                    key={s.step} 
                    className="absolute flex flex-col items-center w-28 transition-all" 
                    style={{ 
                      top: 'calc(50% + 40px)', // Placed directly below the street
                      left: \`\${10 + (idx * 20)}%\`, 
                      transform: 'translateX(-50%)' 
                    }}
                  >
                    
                    {/* Connecting line to street */}
                    <div className={\`w-1 h-12 \${isActive || isPast ? 'bg-gold' : 'bg-dark-4'} transition-colors duration-700 absolute -top-12 z-0\`}></div>

                    {/* Icon Block */}
                    <div className={\`w-16 h-16 rounded-2xl flex items-center justify-center relative transition-all duration-500 z-20 shadow-lg
                      \${isActive ? 'bg-gold border-2 border-gold scale-110 shadow-[0_0_25px_rgba(212,175,55,0.4)]' : isPast ? 'bg-dark-2 border-2 border-gold' : 'bg-dark-2 border border-dark-4'}\`}
                    >
                      <Icon className={\`w-7 h-7 \${isActive ? 'text-dark-1 animate-pulse' : isPast ? 'text-gold' : 'text-dark-4'}\`} />
                      
                      {/* Activity pings */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 flex space-x-1">
                          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="mt-4 text-center w-full">
                      <h3 className={\`font-black text-xs uppercase tracking-wide leading-tight \${isActive || isPast ? 'text-gold' : 'text-cream-dim'}\`}>
                        {s.title}
                      </h3>
                      <p className={\`text-[9px] font-mono mt-1 \${isActive ? 'text-cream font-bold' : 'text-cream-muted opacity-75'}\`}>
                        {s.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTON */}
            <div className="mt-8 text-center relative z-30">
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
                  El agente está en movimiento...
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
console.log("Successfully updated SdrTab.tsx with the street layout.");
