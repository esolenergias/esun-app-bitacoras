const fs = require('fs');
const file = 'src/components/Portal.tsx';
const content = fs.readFileSync(file, 'utf8');
const fixedContent = content.replace(
    /Opciones de Administración<\/div>}\n\s*{adminMenu\.map\(renderButton\)}\n\s*<\/div>\n\s*\)}\n\s*<\/div>\n\s*\);\n\s*}\)\(\)}/,
    `Opciones de Administración</div>}\n                              {adminMenu.map(renderButton)}\n                            </div>\n                          )}\n                        </div>\n                      );\n                    })()}\n                  </div>\n                </div>\n\n                {/* Sidebar bottom actions */}`
);
fs.writeFileSync(file, fixedContent);
