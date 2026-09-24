const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Hide Landing Page
const landingTarget = `{/* LANDING PAGE ACCORDION */}
                        <div className="pt-2">`;
if (content.includes(landingTarget)) {
    content = content.replace(landingTarget, `{/* LANDING PAGE ACCORDION */}
                        {currentUser.role === 'master' && (
                        <div className="pt-2">`);
}

// Hide Tienda esol (not requested but good to check if they wanted it, they only said landing and configuracion).
// But we need to close the Landing Page curly brace!
// Where does the Landing Page accordion end? Before Tienda esol.
const endLandingTarget = `                          </div>
                          )}
                        </div>
                        {/* TIENDA ESOL ACCORDION */}`;
if (content.includes(endLandingTarget)) {
    content = content.replace(endLandingTarget, `                          </div>
                          )}
                        </div>
                        )}
                        {/* TIENDA ESOL ACCORDION */}`);
} else {
    // maybe Tienda Esol is not there?
    const endLandingTarget2 = `                              </button>
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          {!sidebarCollapsed && (
                            <button 
                              onClick={() => setTiendaExpanded(!tiendaExpanded)}`;
    content = content.replace(endLandingTarget2, `                              </button>
                            </div>
                          )}
                        </div>
                        )}
                        <div className="pt-2">
                          {!sidebarCollapsed && (
                            <button 
                              onClick={() => setTiendaExpanded(!tiendaExpanded)}`);
}

const configTarget = `{/* CONFIGURACION ACCORDION */}
                      <div className="pt-2">`;
if (content.includes(configTarget)) {
    content = content.replace(configTarget, `{/* CONFIGURACION ACCORDION */}
                      {currentUser.role === 'master' && (
                      <div className="pt-2">`);
}

const endConfigTarget = `                            {currentUser.role === 'master' && (
                              <button
                                onClick={() => setActiveTab('roles')}`;
// actually we can just close it at the very end of the Accordion block.
// The accordion ends at:
const endConfigTargetReal = `                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Sidebar bottom actions */}`;
content = content.replace(endConfigTargetReal, `                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  </div>
                  {/* Sidebar bottom actions */}`);

fs.writeFileSync(file, content);
