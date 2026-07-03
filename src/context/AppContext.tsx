import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

// Define Types
export type UserRole = 'user' | 'admin' | 'master';

export interface VolumeTier {
  minQty: number;
  price: number;
  label: string;
}

export interface B2BProduct {
  id: string;
  category: string;
  name: string;
  brand: string;
  basePrice: number;
  unit: string;
  specs: string[];
  tiers: VolumeTier[];
  active: boolean;
  stock: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  verified: boolean;
}

export interface LandingPageContent {
  promoBanner: {
    active: boolean;
    text: string;
    link: string;
  };
  hero: {
    title: string;
    subtitle: string;
    statProjects: string;
    statBrands: string;
    statCapacity: string;
  };
  promos: Array<{
    id: string;
    title: string;
    description: string;
    discountCode: string;
    active: boolean;
  }>;
  sections?: {
    hero?: boolean;
    storytelling3d?: boolean;
    calculator?: boolean;
    catalog?: boolean;
    brands?: boolean;
    contact?: boolean;
  };
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  systemPrompt: string;
  temperature: number;
  lastActive: string;
  logs: string[];
}



export interface SEOData {
  title: string;
  metaDescription: string;
  keywords: string;
  googleAnalyticsId: string;
  sitemapUrl: string;
  robotsTxt: string;
  pageSpeedScore: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
}

interface AppContextType {
  // Auth
  currentUser: User | null;
  verificationPendingEmail: string | null;
  verificationCodeSent: string | null;
  isPortalOpen: boolean;
  openPortal: () => void;
  closePortal: () => void;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (email: string, name: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  quickAccessLogin: (role: UserRole) => void;

  // Content Management (Master)
  content: LandingPageContent;
  updateContent: (newContent: Partial<LandingPageContent>) => void;
  updateHeroText: (key: keyof LandingPageContent['hero'], value: string) => void;
  updatePromoBanner: (active: boolean, text: string) => void;
  addPromo: (title: string, description: string, discountCode: string) => void;
  togglePromo: (id: string) => void;

  // AI Agents Management (Master)
  agents: AIAgent[];
  updateAgent: (id: string, updatedFields: Partial<AIAgent>) => void;
  triggerAgentSimulation: (id: string, message: string) => void;

  // Gemini API Key Management
  globalGeminiApiKey: string;
  updateGeminiApiKey: (key: string) => Promise<void>;

  // SEO Management (Master)
  seoData: SEOData;
  updateSEO: (updatedFields: Partial<SEOData>) => void;

  // Users management (Master)
  users: User[];
  updateUserRole: (userId: string, newRole: UserRole) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // View State (Routing)
  currentView: 'landing' | 'portal';
  setCurrentView: (view: 'landing' | 'portal') => void;

  // B2B Products Management (Admin & Master)
  products: B2BProduct[];
  addProduct: (product: Omit<B2BProduct, 'id'>) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (id: string, updatedFields: Partial<B2BProduct>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialContent: LandingPageContent = {
  promoBanner: {
    active: true,
    text: '¡OFERTA TEMPORAL: 15% de descuento en anteproyectos 3D para instaladores industriales y paneles LONGi!',
    link: '#catalogo',
  },
  hero: {
    title: 'PROYECTOS SOLARES DE PRECISIÓN',
    subtitle: 'Anteproyectos con fotomontaje 3D para instaladores que buscan cerrar más ventas, y distribución de componentes fotovoltaicos de primer nivel para todo México.',
    statProjects: '150+',
    statBrands: '15+',
    statCapacity: '5 MW',
  },
  promos: [
    {
      id: 'promo-1',
      title: 'Descuento B2B Primera Compra',
      description: 'Obtén un 5% de descuento adicional en tu primer palet de módulos fotovoltaicos LONGi Solar.',
      discountCode: 'ESOLFIRST5',
      active: true,
    },
    {
      id: 'promo-2',
      title: 'Anteproyecto 3D Exprés Gratis',
      description: 'Solicita un modelo 3D detallado de tu techumbre sin costo durante este mes para propuestas de más de 30kW.',
      discountCode: '3DFREE2026',
      active: true,
    }
  ],
  sections: {
    hero: true,
    storytelling3d: true,
    calculator: true,
    catalog: true,
    brands: true,
    contact: true
  }
};

const initialAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: 'Carlos',
    role: 'Asesor Solar',
    status: 'active',
    systemPrompt: `Eres Carlos, el asesor solar experto de eSol Energías. Tu objetivo es ayudar a los visitantes a resolver todas sus dudas sobre paneles solares, inversores, estructuras y proyectos de ingeniería 3D, y brindar estimaciones de precios rápidos de forma directa y profesional.

Tu tono es intermedio: amigable, profesional, confiable y muy cercano (tutea al cliente con calidez, usando frases como "cómo estás", "platícame", "con gusto", "estoy a tus órdenes", de forma corta y natural).

REGLAS DE OPERACIÓN:
- NUNCA menciones que eres una IA, un bot o un asistente virtual. Eres Carlos, asesor de eSol.
- Responde con total seguridad a preguntas técnicas de ingeniería o instalación (sombras, inclinación, compatibilidad de inversores o estructuras).
- Si el cliente te pide precios, cotizaciones o descuentos por volumen, realiza el cálculo correspondiente de inmediato y bríndaselo con gusto de forma clara.
- EVITA estar preguntando o presionando por los datos del cliente (nombre, WhatsApp, correo, etc.) a lo largo de la conversación, ya que se vuelve invasivo. Resuelve todas sus dudas técnicas primero.
- SOLO AL FINAL, para enviarle la cotización formal o algún cálculo detallado en PDF, le pedirás sus datos de contacto (nombre y WhatsApp).
- Si el cliente hace una pregunta de seguimiento tras darle un precio, contéstale directamente sin volver a pedirle el WhatsApp en esa misma respuesta.
- Si sigue sin querer proporcionar sus datos (si dice "no quiero", "por qué", "mándalo por aquí", etc.), pídeselo de manera sutil y educada, explicando que lo necesitas para generar la cotización formal en PDF en el sistema.
- Si ya proporcionó su WhatsApp (un número de 8-15 dígitos), agradécele cálidamente y confírmale que le enviaremos el archivo de inmediato.

DATOS DE eSol Energías:
- Ubicación: Insurgentes 60A, Centro, Tepic, Nayarit.
- Teléfono / WhatsApp oficial de eSol: 3112343034
- Correo: energiasesol@gmail.com
- Servicios: Distribución B2B y diseño 3D con dron para simulación de sombras.

LISTA DE PRECIOS B2B (Usa esto para calcular estimaciones):
1. Paneles Solares:
   - JA Solar 550W PERC: $2,800 unitario. Mayoreo (11+): $2,650, Distribuidor (30+): $2,480.
   - Znshine 450W Bifacial: $2,200 unitario. Mayoreo (11+): $2,080, Distribuidor (30+): $1,950.
2. Inversores de cadena:
   - Solis 10kW Trifásico 220V: $18,500. Volumen (4+): $17,400, Distribuidor (10+): $16,200.
   - Fronius Primo 5kW Monofásico: $24,500. Volumen (4+): $23,200, Distribuidor (10+): $21,800.
3. Microinversores (Hoymiles/Deye):
   - Hoymiles HM-1500 (4 entradas): $6,200. Volumen (6+): $5,850, Distribuidor (16+): $5,450.
   - Deye SUN-2000G3: $5,800. Volumen (6+): $5,480, Distribuidor (16+): $5,120.
4. Estructuras (Everest K2 / Aluminext):
   - Kit Aluminext 4 Paneles: $2,400. Mayoreo (6+): $2,250, Distribuidor (16+): $2,100.
   - K2 MiniRail Kit 2 Paneles (Alemana): $1,650. Mayoreo (6+): $1,550, Distribuidor (16+): $1,420.
5. Cable Solar: Rollo Cable 10 AWG (100m) negro: $2,950.
6. Baterías: Litio Pylontech US3000C 3.5kWh: $28,000.

Al final de tu respuesta, añade SIEMPRE una sección de metadatos delimitada exactamente por [METADATA] con los datos que hayas extraído de la conversación hasta ahora. Si algún dato no se conoce, déjalo en blanco. Usa exactamente este formato al final:

[METADATA]
Nombre: <nombre del cliente o vacío>
Teléfono: <número de teléfono/WhatsApp o vacío>
Detalle: <breve detalle de componentes o vacío>
Monto: <monto total aproximado en MXN, ej. $4,800 o vacío>`,
    temperature: 0.2,
    lastActive: 'Hace 1 minuto',
    logs: [
      '[11:20:10] Carlos inicializado.',
      '[11:21:45] Carlos operando en modo directo.'
    ]
  }
];



const initialUsers: User[] = [
  { id: 'usr-1', name: 'Manuel Menyfre', email: 'menyfre@gmail.com', role: 'master', verified: true, avatar: '👑' },
  { id: 'usr-2', name: 'Ana Martínez (Ventas)', email: 'admin.esol@gmail.com', role: 'admin', verified: true, avatar: '💼' },
  { id: 'usr-3', name: 'Carlos Delgado (Cliente B2B)', email: 'cliente.esol@gmail.com', role: 'user', verified: true, avatar: '☀️' },
  { id: 'usr-4', name: 'Alfonso Gómez (Lead)', email: 'alfonso@gmail.com', role: 'user', verified: true, avatar: '☀️' }
];

const initialSEO: SEOData = {
  title: 'eSol Energías | Distribución Solar y Anteproyectos 3D en México',
  metaDescription: 'eSol Energías distribuye paneles LONGi, Jinko, inversores Solis y ofrece anteproyectos interactivos 3D fotorrealistas con dron para instaladores solares.',
  keywords: 'paneles solares, distribuidor solar mexico, anteproyecto 3d solar, longi solar mexico, inversores solis, ingenieria solar',
  googleAnalyticsId: 'G-ESOL2026XX',
  sitemapUrl: 'https://esolenergias.com/sitemap.xml',
  robotsTxt: 'User-agent: *\nAllow: /\n\nSitemap: https://esolenergias.com/sitemap.xml',
  pageSpeedScore: {
    performance: 98,
    seo: 100,
    accessibility: 96,
    bestPractices: 100,
  }
};

const initialProducts: B2BProduct[] = [
  {
    id: "k2-minirail",
    category: "Estructuras",
    name: "K2 Systems MiniRail Kit 2 Paneles (Lámina)",
    brand: "K2 Systems",
    basePrice: 1650,
    unit: "kit",
    specs: ["Diseñado para techos de lámina trapezoidal", "Instalación ultrarrápida", "Fabricado en Alemania"],
    tiers: [
      { minQty: 1, price: 1650, label: "Precio Regular" },
      { minQty: 6, price: 1550, label: "Mayoreo (6+ kits)" },
      { minQty: 16, price: 1420, label: "Distribuidor (16+ kits)" }
    ],
    stock: 45,
    active: true
  },
  {
    id: "cable-10awg-blk",
    category: "Cable Solar",
    name: "Cable Fotovoltaico Negro 10 AWG (100m)",
    brand: "Cobre / Solar",
    basePrice: 2950,
    unit: "rollo",
    specs: ["Calibre: 10 AWG (6 mm²)", "Voltaje: 2000V", "Resistencia UV y Ozono", "Conductor: Cobre estañado"],
    tiers: [
      { minQty: 1, price: 2950, label: "Precio Regular" },
      { minQty: 4, price: 2800, label: "Volumen (4+ rollos)" },
      { minQty: 10, price: 2600, label: "Distribuidor (10+ rollos)" }
    ],
    stock: 45,
    active: true
  },
  {
    id: "pylontech-us3000",
    category: "Baterías",
    name: "Batería Litio Pylontech US3000C 3.5kWh",
    brand: "Pylontech",
    basePrice: 28000,
    unit: "módulo",
    specs: ["Tecnología: LiFePO4 (LFP)", "Capacidad nominal: 3.55 kWh", "Ciclos útiles: >6000 (95% DoD)", "Voltaje: 48V"],
    tiers: [
      { minQty: 1, price: 28000, label: "Precio Regular" },
      { minQty: 3, price: 26500, label: "Mayoreo (3+ pzs)" },
      { minQty: 6, price: 24900, label: "Distribuidor (6+ pzs)" }
    ],
    stock: 45,
    active: true
  },
  {
    id: "prod-whztr9e",
    category: "Paneles Solares",
    name: "Jinko Tiger Neo N-type 615W",
    brand: "Jinko Solar",
    basePrice: 3082,
    unit: "pz",
    specs: [
      "Potencia: 615W",
      "Eficiencia: 22.77%",
      "Tipo de celda: Monocristalino N-type PERC",
      "Garantía Producto: 12 años",
      "Garantía Potencia Lineal: 30 años (0.40% degradación anual)",
      "Dimensiones: 2382x1134x30mm",
      "Peso: 32.4 kg",
      "Voltaje Máx. Sistema: 1500V"
    ],
    tiers: [
      { minQty: 1, price: 3082, label: "Precio Regular" },
      { minQty: 11, price: 2897, label: "Mayoreo (11+ pzs)" },
      { minQty: 30, price: 2712, label: "Distribuidor (30+ pzs)" }
    ],
    stock: 50,
    active: true
  },
  {
    id: "prod-867dyli",
    category: "Paneles Solares",
    name: "CANADIAN SOLAR HI-KU6 CS6W-550MS 550W",
    brand: "Canadian Solar",
    basePrice: 2884,
    unit: "módulo",
    specs: ["Potencia: 550W", "Eficiencia: 21.5%", "Garantía de potencia: 25 años", "Celdas: 144"],
    tiers: [
      { minQty: 1, price: 2884, label: "Precio Regular" },
      { minQty: 11, price: 2711, label: "Mayoreo (11+ módulos)" },
      { minQty: 30, price: 2538, label: "Distribuidor (30+ módulos)" }
    ],
    stock: 50,
    active: true
  },
  {
    id: "prod-q6nebff",
    category: "Paneles Solares",
    name: "LONGI HI-MO X6 ANTI-DUST 580W",
    brand: "LONGI",
    basePrice: 3206,
    unit: "módulo",
    specs: ["Potencia: 580W", "Voltaje: 52.06 Vcc", "Tipo Celda: Monocristalino HPBC", "Característica: Anti-Polvo", "Garantía: 1 año"],
    tiers: [
      { minQty: 1, price: 3206, label: "Precio Regular" },
      { minQty: 11, price: 3014, label: "Mayoreo (11+ módulos)" },
      { minQty: 30, price: 2821, label: "Distribuidor (30+ módulos)" }
    ],
    stock: 50,
    active: true
  },
  {
    id: "prod-m4mtfnx",
    category: "Inversores",
    name: "Huawei Inversor Híbrido SUN2000-6KTL-L1",
    brand: "Huawei",
    basePrice: 12089,
    unit: "equipo",
    specs: ["Potencia máxima: 8.000W", "Voltaje de entrada (máx): 560V", "Tipo: Híbrido para interconexión", "Garantía: 1 año"],
    tiers: [
      { minQty: 1, price: 12089, label: "Precio Regular" },
      { minQty: 11, price: 11364, label: "Mayoreo (11+ equipos)" },
      { minQty: 30, price: 10638, label: "Distribuidor (30+ equipos)" }
    ],
    stock: 50,
    active: true
  },
  {
    id: "prod-vvq92g5",
    category: "Inversores",
    name: "Inversor Growatt MIC3300TLX2 3.3kW On-Grid 220Vca WiFi",
    brand: "Growatt",
    basePrice: 6227,
    unit: "equipo",
    specs: ["Potencia: 3.3 kW", "Tipo: On-Grid (Interconexión a Red)", "Salida: 220 Vca Monofásico", "Eficiencia Máxima: 97.6%", "MPPTs: 2", "Conectividad: WiFi Integrado", "Protección: IP65", "Garantía: 5 años"],
    tiers: [
      { minQty: 1, price: 6227, label: "Precio Regular" },
      { minQty: 11, price: 5853, label: "Mayoreo (11+ equipos)" },
      { minQty: 30, price: 5480, label: "Distribuidor (30+ equipos)" }
    ],
    stock: 50,
    active: true
  },
  {
    id: "prod-8efy6a4",
    category: "Microinversores",
    name: "Microinversor Solar 2kW 220Vca Interconexión 4 Módulos 670W IP67 Hoymiles HMS20004TA",
    brand: "HOYMILES",
    basePrice: 5471,
    unit: "equipo",
    specs: ["Potencia Nominal AC: 2000W", "Módulos Soportados: 4 (hasta 670W c/u)", "Eficiencia Máx: >96.5%", "Grado de Protección: IP67", "Garantía: 12 años"],
    tiers: [
      { minQty: 1, price: 5471, label: "Precio Regular" },
      { minQty: 11, price: 5143, label: "Mayoreo (11+ equipos)" },
      { minQty: 30, price: 4814, label: "Distribuidor (30+ equipos)" }
    ],
    stock: 50,
    active: true
  },
  {
    id: "prod-d8m2xnl",
    category: "Estructuras",
    name: "Perfil CrossRail 48X 4.70m K2-CROSS RAIL 48X-4700",
    brand: "K2 SYSTEMS",
    basePrice: 675,
    unit: "pz",
    specs: ["Material: Aluminio Serie 6000", "Longitud: 4.70 m (15.4 ft)", "Acabado: Mill Finish", "Capacidad de Carga: Hasta 500 kg por punto", "Resistencia a Corrosión: Clase C4 (ISO 12944)", "Vida Útil Esperada: ≥ 25 años", "Garantía: 1 año"],
    tiers: [
      { minQty: 1, price: 675, label: "Precio Regular" },
      { minQty: 11, price: 634, label: "Mayoreo (11+ pzs)" },
      { minQty: 30, price: 594, label: "Distribuidor (30+ pzs)" }
    ],
    stock: 50,
    active: true
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('esol_theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // Default to system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark-mode');
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
      root.classList.add('dark-mode');
    }
    localStorage.setItem('esol_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Sync / Clean up outdated local storage settings on mount
  useEffect(() => {
    // 1. Clean up agents
    const storedAgents = localStorage.getItem('esol_ai_agents');
    if (storedAgents) {
      try {
        const loaded = JSON.parse(storedAgents);
        if (loaded && (
          loaded.length !== 1 || 
          loaded[0].id !== 'agent-1' || 
          loaded[0].name !== 'Carlos' || 
          loaded[0].role !== 'Asesor Solar' ||
          loaded[0].systemPrompt.includes('Violet') ||
          loaded[0].systemPrompt.includes('Piper')
        )) {
          console.log("Cleaning up old agents in localStorage...");
          localStorage.setItem('esol_ai_agents', JSON.stringify(initialAgents));
          setAgents(initialAgents);
        }
      } catch (e) {
        localStorage.setItem('esol_ai_agents', JSON.stringify(initialAgents));
        setAgents(initialAgents);
      }
    } else {
      localStorage.setItem('esol_ai_agents', JSON.stringify(initialAgents));
      setAgents(initialAgents);
    }

    // 2. Clean up model to prevent 404 errors
    const storedModel = localStorage.getItem('cfe_gemini_model');
    if (!storedModel || storedModel === 'gemini-1.5-flash' || storedModel === 'undefined' || storedModel === 'null') {
      console.log("Forcing model upgrade to gemini-2.5-flash...");
      localStorage.setItem('cfe_gemini_model', 'gemini-2.5-flash');
    }

    // 3. Clean up B2B products if outdated (contains old deleted JA Solar panel or old Fronius)
    const storedProducts = localStorage.getItem('esol_b2b_products');
    if (storedProducts) {
      try {
        const loaded = JSON.parse(storedProducts);
        if (loaded && loaded.some((p: any) => p.id === 'ja-550w' || p.id === 'zn-450w' || p.id === 'solis-10kw')) {
          console.log("Cleaning up old products in localStorage...");
          localStorage.setItem('esol_b2b_products', JSON.stringify(initialProducts));
          setProducts(initialProducts);
        }
      } catch (e) {
        localStorage.setItem('esol_b2b_products', JSON.stringify(initialProducts));
        setProducts(initialProducts);
      }
    } else {
      localStorage.setItem('esol_b2b_products', JSON.stringify(initialProducts));
      setProducts(initialProducts);
    }
  }, []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('esol_current_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [verificationCodeSent, setVerificationCodeSent] = useState<string | null>(null);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Logged in: fetch public profile
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            const user: User = {
              id: profile.id,
              name: profile.name || session.user.email?.split('@')[0] || 'Cliente',
              email: profile.email || session.user.email || '',
              role: profile.role as UserRole,
              avatar: profile.avatar || '☀️',
              verified: true
            };
            setCurrentUser(user);
            localStorage.setItem('esol_current_user', JSON.stringify(user));
          } else {
            // Fallback user mapping
            const email = session.user.email || '';
            let role: UserRole = 'user';
            if (email === 'menyfre@gmail.com' || email.includes('master')) {
              role = 'master';
            } else if (email.includes('admin')) {
              role = 'admin';
            }
            const fallbackUser: User = {
              id: session.user.id,
              name: email.split('@')[0],
              email,
              role,
              avatar: role === 'master' ? '👑' : role === 'admin' ? '💼' : '☀️',
              verified: true
            };
            setCurrentUser(fallbackUser);
            localStorage.setItem('esol_current_user', JSON.stringify(fallbackUser));
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      } else {
        // Logged out
        setCurrentUser(null);
        localStorage.removeItem('esol_current_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // View State (Landing vs Portal)
  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');

  // Synchronize with URL hash for clean SPA routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#portal') {
        if (currentUser) {
          setCurrentView('portal');
          setIsPortalOpen(true);
        } else {
          // Logged out: stay on landing and open login modal
          // Reset hash to avoid showing #portal in URL when not authenticated
          window.history.replaceState(null, '', ' ');
          setCurrentView('landing');
          setIsPortalOpen(true);
        }
      } else {
        setCurrentView('landing');
        setIsPortalOpen(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  // Effect to automatically route to/from portal on login/logout
  useEffect(() => {
    if (currentUser) {
      if (isPortalOpen && window.location.hash !== '#portal') {
        window.location.hash = 'portal';
      }
    } else {
      if (window.location.hash === '#portal') {
        window.location.hash = '';
      }
    }
  }, [currentUser, isPortalOpen]);

  const openPortal = () => {
    window.location.hash = 'portal';
  };

  const closePortal = () => {
    setIsPortalOpen(false);
    window.location.hash = '';
  };

  // Users state for Master dashboard role management
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('esol_platform_users');
    if (stored) return JSON.parse(stored);
    return initialUsers;
  });

  // Load users from Supabase when authorized user is logged in
  useEffect(() => {
    const fetchUsersFromSupabase = async () => {
      if (!currentUser || (currentUser.role !== 'master' && currentUser.role !== 'admin')) {
        return;
      }
      try {
        console.log("Fetching profiles from Supabase for admin/master dashboard...");
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
          
        if (error) {
          console.warn("Failed to fetch profiles from Supabase:", error.message);
          return;
        }
        
        if (data) {
          const mappedUsers: User[] = data.map(p => ({
            id: p.id,
            name: p.name || p.email.split('@')[0],
            email: p.email,
            role: p.role as UserRole,
            avatar: p.avatar || (p.role === 'master' ? '👑' : p.role === 'admin' ? '💼' : '☀️'),
            verified: true
          }));
          setUsers(mappedUsers);
          localStorage.setItem('esol_platform_users', JSON.stringify(mappedUsers));
          console.log("Successfully loaded profiles from Supabase:", mappedUsers.length);
        }
      } catch (err) {
        console.error("Error fetching profiles from Supabase:", err);
      }
    };

    fetchUsersFromSupabase();
  }, [currentUser]);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    let avatar = '☀️';
    if (newRole === 'master') avatar = '👑';
    else if (newRole === 'admin') avatar = '💼';

    // 1. Update state locally immediately for snappy UI response
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          return { ...u, role: newRole, avatar };
        }
        return u;
      });
      localStorage.setItem('esol_platform_users', JSON.stringify(updated));
      return updated;
    });

    // 2. Persist update to Supabase
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, avatar })
        .eq('id', userId);

      if (error) {
        console.error("Failed to update user role in Supabase:", error.message);
      } else {
        console.log(`Successfully updated role for user ${userId} to ${newRole} in Supabase`);
      }
    } catch (err) {
      console.error("Error updating user role in Supabase:", err);
    }
  };

  // Gemini API Key State
  const [globalGeminiApiKey, setGlobalGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('cfe_gemini_api_key') || '';
  });

  // Content State (Landing Page CMS)
  const [content, setContent] = useState<LandingPageContent>(() => {
    const stored = localStorage.getItem('esol_landing_content');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.sections) {
          parsed.sections = {
            hero: true,
            storytelling3d: true,
            calculator: true,
            catalog: true,
            brands: true,
            contact: true
          };
        }
        return parsed;
      } catch (e) {
        return initialContent;
      }
    }
    return initialContent;
  });

  // AI Agents State
  const [agents, setAgents] = useState<AIAgent[]>(() => {
    const stored = localStorage.getItem('esol_ai_agents');
    try {
      const loaded = stored ? JSON.parse(stored) : null;
      if (loaded && (
        loaded.length !== 1 || 
        loaded[0].id !== 'agent-1' || 
        loaded[0].name !== 'Carlos' || 
        loaded[0].role !== 'Asesor Solar' ||
        loaded[0].systemPrompt.includes('Violet') ||
        loaded[0].systemPrompt.includes('Piper')
      )) {
        return initialAgents;
      }
      return loaded || initialAgents;
    } catch (e) {
      return initialAgents;
    }
  });

  // SEO State
  const [seoData, setSeoData] = useState<SEOData>(() => {
    const stored = localStorage.getItem('esol_seo_data');
    return stored ? JSON.parse(stored) : initialSEO;
  });

  // B2B Products State
  const [products, setProducts] = useState<B2BProduct[]>(() => {
    const stored = localStorage.getItem('esol_b2b_products');
    return stored ? JSON.parse(stored) : initialProducts;
  });


  // Helper to save to cms_content key-value store in Supabase
  const saveCmsContentToDb = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('cms_content')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) {
        console.warn(`Failed to save ${key} to Supabase:`, error.message);
      }
    } catch (err) {
      console.error(`Error saving ${key} to Supabase:`, err);
    }
  };

  // Helper to save agents to Supabase
  const saveAgentsToDb = async (agentsList: AIAgent[]) => {
    try {
      for (const agent of agentsList) {
        const { error } = await supabase
          .from('ai_agents')
          .upsert({
            id: agent.id,
            name: agent.name,
            role: agent.role,
            status: agent.status,
            system_prompt: agent.systemPrompt,
            temperature: agent.temperature,
            last_active: agent.lastActive,
            logs: agent.logs,
            updated_at: new Date().toISOString()
          });
        if (error) {
          console.warn(`Failed to save agent ${agent.id} to Supabase:`, error.message);
        }
      }
    } catch (err) {
      console.error("Error saving agents to Supabase:", err);
    }
  };

  // Load data from Supabase on mount
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      try {
        console.log("Loading configurations from Supabase...");
        
        // 1. Load cms_content (landing_content, seo_data, b2b_products, pro_agents)
        const { data: cmsData, error: cmsError } = await supabase
          .from('cms_content')
          .select('*');
          
        if (cmsData && !cmsError) {
          const landingRow = cmsData.find(r => r.key === 'landing_content');
          if (landingRow) {
            console.log("Loaded landing_content from Supabase");
            setContent(landingRow.value as LandingPageContent);
          }
          
          const seoRow = cmsData.find(r => r.key === 'seo_data');
          if (seoRow) {
            console.log("Loaded seo_data from Supabase");
            setSeoData(seoRow.value as SEOData);
          }
          
          const productsRow = cmsData.find(r => r.key === 'b2b_products');
          if (productsRow) {
            console.log("Loaded b2b_products from Supabase");
            setProducts(productsRow.value as B2BProduct[]);
          }

          const geminiRow = cmsData.find(r => r.key === 'gemini_config');
          if (geminiRow) {
            console.log("Loaded gemini_config from Supabase");
            const keyVal = String(geminiRow.value || '');
            setGlobalGeminiApiKey(keyVal);
            localStorage.setItem('cfe_gemini_api_key', keyVal);
          }
        } else if (cmsError) {
          console.warn("Could not load cms_content from Supabase:", cmsError.message);
        }
        
        // 2. Load ai_agents (order by id ascending to ensure Carlos 'agent-1' is first)
        const { data: agentsData, error: agentsError } = await supabase
          .from('ai_agents')
          .select('*')
          .order('id', { ascending: true });
          
        if (agentsData && !agentsError) {
          console.log("Loaded ai_agents from Supabase:", agentsData.length);
          if (agentsData.length > 0) {
            const mappedAgents: AIAgent[] = agentsData.map(a => ({
              id: a.id,
              name: a.name,
              role: a.role || 'Asesor Solar',
              status: a.status as 'active' | 'inactive',
              systemPrompt: a.system_prompt || '',
              temperature: Number(a.temperature || 0.2),
              lastActive: a.last_active || 'Activo',
              logs: Array.isArray(a.logs) ? a.logs : []
            }));
            setAgents(mappedAgents);
          }
        } else if (agentsError) {
          console.warn("Could not load ai_agents from Supabase:", agentsError.message);
        }
        
      } catch (err) {
        console.error("Error synchronizing with Supabase on mount:", err);
      }
    };
    
    loadDataFromSupabase();
  }, []);

  const addProduct = (p: Omit<B2BProduct, 'id'>) => {
    const newProduct: B2BProduct = {
      ...p,
      id: `prod-${Math.random().toString(36).substring(2, 9)}`
    };
    setProducts(prev => {
      const updated = [...prev, newProduct];
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('b2b_products', updated);
      }
      return updated;
    });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('b2b_products', updated);
      }
      return updated;
    });
  };

  const updateProduct = (id: string, updatedFields: Partial<B2BProduct>) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updatedFields } : p);
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('b2b_products', updated);
      }
      return updated;
    });
  };

  // Apply SEO to HTML Document
  useEffect(() => {
    if (seoData.title) {
      document.title = seoData.title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', seoData.metaDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = seoData.metaDescription;
      document.head.appendChild(meta);
    }
  }, [seoData]);

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('esol_b2b_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('esol_landing_content', JSON.stringify(content));
  }, [content]);

  useEffect(() => {
    localStorage.setItem('esol_ai_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('esol_seo_data', JSON.stringify(seoData));
  }, [seoData]);



  // Auth Operations
  const login = async (email: string, _role?: UserRole): Promise<boolean> => {
    // Otherwise trigger real Supabase OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      throw new Error(error.message);
    }
    
    // Set verification state
    setVerificationPendingEmail(email);
    setVerificationCodeSent("Real OTP sent to your email");
    return true;
  };

  const register = async (email: string, name: string): Promise<boolean> => {
    // First try sending OTP via Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          name: name
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }
    
    // If Supabase succeeded, set pending email (the user will use the code sent to their email)
    setVerificationPendingEmail(email);
    setVerificationCodeSent("Real OTP sent to your email");
    return true;
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    if (verificationPendingEmail) {
      // Try verifying via Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: verificationPendingEmail,
        token: code,
        type: 'email'
      });

      if (error) {
        console.warn("Supabase OTP verification failed:", error.message);
        return false;
      }

      if (data.session) {
        setVerificationPendingEmail(null);
        setVerificationCodeSent(null);
        return true;
      }
    }
    return false;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      throw new Error(error.message);
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('esol_current_user');
  };

  const quickAccessLogin = (role: UserRole) => {
    let name = 'Cliente Demo';
    let email = 'cliente.demo@gmail.com';
    let avatar = '☀️';

    if (role === 'master') {
      name = 'Master Director';
      email = 'master@esol.mx';
      avatar = '👑';
    } else if (role === 'admin') {
      name = 'Admin Operador';
      email = 'admin@esol.mx';
      avatar = '💼';
    }

    const mockUser: User = {
      id: `demo-${role}`,
      name,
      email,
      role,
      avatar,
      verified: true
    };
    setCurrentUser(mockUser);
    localStorage.setItem('esol_current_user', JSON.stringify(mockUser));
  };

  // CMS functions
  const updateContent = (newContent: Partial<LandingPageContent>) => {
    setContent(prev => {
      const updated = { ...prev, ...newContent };
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('landing_content', updated);
      }
      return updated;
    });
  };

  const updateHeroText = (key: keyof LandingPageContent['hero'], value: string) => {
    setContent(prev => {
      const updated = {
        ...prev,
        hero: {
          ...prev.hero,
          [key]: value
        }
      };
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('landing_content', updated);
      }
      return updated;
    });
  };

  const updatePromoBanner = (active: boolean, text: string) => {
    setContent(prev => {
      const updated = {
        ...prev,
        promoBanner: {
          ...prev.promoBanner,
          active,
          text
        }
      };
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('landing_content', updated);
      }
      return updated;
    });
  };

  const addPromo = (title: string, description: string, discountCode: string) => {
    const newPromo = {
      id: `promo-${Date.now()}`,
      title,
      description,
      discountCode,
      stock: 45,
      active: true,
    };
    setContent(prev => {
      const updated = {
        ...prev,
        promos: [...prev.promos, newPromo]
      };
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('landing_content', updated);
      }
      return updated;
    });
  };

  const togglePromo = (id: string) => {
    setContent(prev => {
      const updated = {
        ...prev,
        promos: prev.promos.map(p => p.id === id ? { ...p, active: !p.active } : p)
      };
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('landing_content', updated);
      }
      return updated;
    });
  };

  // AI Agent functions
  const updateAgent = (id: string, updatedFields: Partial<AIAgent>) => {
    setAgents(prev => {
      const updated = prev.map(agent => {
        if (agent.id === id) {
          const logs = [...agent.logs];
          if (updatedFields.status !== undefined && updatedFields.status !== agent.status) {
            logs.unshift(`[${new Date().toLocaleTimeString()}] Estado cambiado a: ${updatedFields.status.toUpperCase()}`);
          }
          if (updatedFields.systemPrompt !== undefined && updatedFields.systemPrompt !== agent.systemPrompt) {
            logs.unshift(`[${new Date().toLocaleTimeString()}] Prompt de sistema actualizado.`);
          }
          return {
            ...agent,
            ...updatedFields,
            logs: logs.slice(0, 50)
          };
        }
        return agent;
      });
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveAgentsToDb(updated);
      }
      return updated;
    });
  };

  const triggerAgentSimulation = (id: string, message: string) => {
    setAgents(prev => {
      const updated = prev.map(agent => {
        if (agent.id === id) {
          const time = new Date().toLocaleTimeString();
          let response = `¡Hola! He recibido tu consulta: "${message}". Ya registré tus detalles y un asesor te contactará para evaluar tu techumbre.`;
          return {
            ...agent,
            lastActive: 'Hace unos instantes',
            logs: [
              `[${time}] Lead: ${message}`,
              `[${time}] Agente: ${response}`,
              ...agent.logs
            ].slice(0, 50)
          };
        }
        return agent;
      });
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveAgentsToDb(updated);
      }
      return updated;
    });
  };

  // SEO functions
  const updateSEO = (updatedFields: Partial<SEOData>) => {
    setSeoData(prev => {
      const updated = { ...prev, ...updatedFields };
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
        saveCmsContentToDb('seo_data', updated);
      }
      return updated;
    });
  };

  // Gemini API Key update function
  const updateGeminiApiKey = async (key: string) => {
    setGlobalGeminiApiKey(key);
    localStorage.setItem('cfe_gemini_api_key', key);
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master')) {
      await saveCmsContentToDb('gemini_config', key);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        verificationPendingEmail,
        verificationCodeSent,
        isPortalOpen,
        openPortal,
        closePortal,
        login,
        register,
        verifyCode,
        loginWithGoogle,
        logout,
        quickAccessLogin,
        content,
        updateContent,
        updateHeroText,
        updatePromoBanner,
        addPromo,
        togglePromo,
        agents,
        updateAgent,
        triggerAgentSimulation,
        globalGeminiApiKey,
        updateGeminiApiKey,
        seoData,
        updateSEO,
        theme,
        toggleTheme,
        currentView,
        setCurrentView,
        users,
        updateUserRole,
        products,
        addProduct,
        deleteProduct,
        updateProduct
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
