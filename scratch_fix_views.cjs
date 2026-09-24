const fs = require('fs');
const file = 'src/components/Portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix useEffect redirect for admin
content = content.replace(
  /if \(activeTab === 'dashboard' \|\| activeTab === 'cms' \|\| activeTab === 'agents' \|\| activeTab === 'seo' \|\| activeTab === 'roles'\) \{[\s\S]*?setActiveTab\('leads'\);[\s\S]*?\}/,
  `if (activeTab === 'cms' || activeTab === 'agents' || activeTab === 'seo' || activeTab === 'roles') {
            setActiveTab('dashboard');
          }`
);

// 2. Fix the MASTER WORKSPACE SCREENS wrapper
// The MASTER WORKSPACE SCREENS starts with {currentUser.role === 'master' && (
// I will change it to {(currentUser.role === 'master' || currentUser.role === 'admin') && (
content = content.replace(
  /\{\/\* MASTER WORKSPACE SCREENS \*\/\}[\s\S]*?\{currentUser\.role === 'master' && \(/,
  `{/* MASTER WORKSPACE SCREENS (Shared with Admin) */}
                {/* ==================================================== */}
                {(currentUser.role === 'master' || currentUser.role === 'admin') && (`
);

// 3. Fix the ADMIN WORKSPACE SCREENS wrapper
// We should probably just let the admin block remain since it contains "leads" and "inventory" and "logistics"
// But wait, are 'leads', 'inventory', 'logistics' ONLY for admin?
// If they are only for admin, master can't see them? Wait, master might be missing them!
// Let me check if master has them.
fs.writeFileSync(file, content);
