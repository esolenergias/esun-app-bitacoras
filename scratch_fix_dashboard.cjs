const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetLoad = `              // Transform to match expected format for stats
              const mapped = data.map(p => ({
                id: p.id,
                client_name: p.client_name,
                financial: {
                  investment_mxn: p.investment_mxn || p.total_system_cost || 0
                }
              }));`;

const replacementLoad = `              // Transform to match expected format for stats
              const mapped = data.map(p => {
                let investment = 0;
                if (p.proposals && Array.isArray(p.proposals) && p.proposals.length > 0) {
                  investment = p.proposals[0]?.financial?.investment_mxn || p.proposals[0]?.financial?.total_cost_mxn || 0;
                }
                return {
                  id: p.id,
                  client_name: p.client_name,
                  financial: { investment_mxn: investment }
                };
              });`;

content = content.replace(targetLoad, replacementLoad);
fs.writeFileSync(file, content);
