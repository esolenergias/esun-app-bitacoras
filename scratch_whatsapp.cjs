const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes("import WhatsAppConfig")) {
  content = content.replace("import LegalTab from './legal/LegalTab';", "import LegalTab from './legal/LegalTab';\nimport WhatsAppConfig from './legal/WhatsAppConfig';");
}

// Add state
if (!content.includes("configSubTab")) {
  content = content.replace("const [activeTab, setActiveTab] = useState<string>('dashboard');", "const [activeTab, setActiveTab] = useState<string>('dashboard');\n  const [configSubTab, setConfigSubTab] = useState<'cfe' | 'whatsapp'>('cfe');");
}

// Replace the start of cfeconfig
const targetStart = `{(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'cfeconfig' && (
                <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                  {/* Config Header */}
                  <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">`;

const replacementStart = `{(currentUser.role === 'admin' || currentUser.role === 'master') && activeTab === 'cfeconfig' && (
                <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex space-x-2 border-b border-dark-4 pb-1 mb-6 overflow-x-auto">
                    <button 
                      onClick={() => setConfigSubTab('cfe')}
                      className={\`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap \${configSubTab === 'cfe' ? 'bg-dark-3 text-gold border-b-2 border-gold' : 'text-cream-muted hover:bg-dark-3/50'}\`}
                    >
                      <Sparkles className="inline-block w-4 h-4 mr-2" />
                      CFE IA
                    </button>
                    <button 
                      onClick={() => setConfigSubTab('whatsapp')}
                      className={\`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap \${configSubTab === 'whatsapp' ? 'bg-dark-3 text-gold border-b-2 border-gold' : 'text-cream-muted hover:bg-dark-3/50'}\`}
                    >
                      <MessageSquare className="inline-block w-4 h-4 mr-2" />
                      Bot WhatsApp
                    </button>
                  </div>

                  {configSubTab === 'cfe' && (
                  <>
                  {/* Config Header */}
                  <div className="bg-dark-2 border border-dark-4 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm select-none">`;

content = content.replace(targetStart, replacementStart);

// Replace the end of cfeconfig
const targetEnd = `                          Restablecer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}`;

const replacementEnd = `                          Restablecer
                        </button>
                      </div>
                    </div>
                  </div>
                  </>
                  )}

                  {configSubTab === 'whatsapp' && (
                    <WhatsAppConfig />
                  )}
                </div>
              )}`;

content = content.replace(targetEnd, replacementEnd);

fs.writeFileSync(file, content);
