import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MapPin, Send, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

const CHAT_SUGGESTIONS = [
  '¿Qué paneles solares tienen?',
  'Información del mapa 3D con dron',
  '¿Cómo pido una cotización?',
  '¿Dónde los contacto?'
];

const getGeminiApiKey = (): string => {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    apiKey = localStorage.getItem('cfe_gemini_api_key') || '';
  }
  return apiKey.trim().replace(/^["']|["']$/g, '');
};

const getGeminiModel = (): string => {
  let model = localStorage.getItem('cfe_gemini_model') || '';
  if (!model || model === 'undefined' || model === 'null') {
    model = 'gemini-2.5-flash';
  }
  return model.trim().replace(/^["']|["']$/g, '');
};

const fetchGeminiWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if ((res.status === 503 || res.status === 429) && retries > 0) {
      console.warn(`Gemini API returned transient status ${res.status}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchGeminiWithRetry(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Network error contacting Gemini. Retrying in ${delay}ms...`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchGeminiWithRetry(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
};

export function Contact() {
  const { agents, products, content } = useApp();

  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeAgent = agents[0] || { id: 'agent-1', name: 'Carlos', role: 'Asesor Solar' };

  // Chat conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Session lead tracking (to update the same lead in CRM)
  const [leadId] = useState(() => `lead-chat-${Date.now()}`);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [quoteDetails, setQuoteDetails] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');

  const getPageContentContext = () => {
    let text = "INFORMACIÓN DE LA PÁGINA ACTUAL DE ESOL ENERGÍAS:\n\n";
    
    // 1. Hero & Banner info
    if (content) {
      if (content.promoBanner?.active) {
        text += `Anuncio Promocional Activo: "${content.promoBanner.text}"\n`;
      }
      if (content.hero) {
        text += `Título Principal de la Web: "${content.hero.title}"\n`;
        text += `Subtítulo: "${content.hero.subtitle}"\n`;
        text += `Estadísticas: ${content.hero.statProjects} Proyectos, ${content.hero.statBrands} Marcas, ${content.hero.statCapacity} Capacidad Instalada.\n\n`;
      }
      
      // 2. Active Promos
      const activePromos = content.promos?.filter(p => p.active) || [];
      if (activePromos.length > 0) {
        text += "PROMOCIONES ACTIVAS:\n";
        activePromos.forEach(p => {
          text += `- ${p.title}: ${p.description} (Código de descuento: ${p.discountCode})\n`;
        });
        text += "\n";
      }
    }

    // 3. Servicios Generales
    text += "SERVICIOS:\n";
    text += "- 1. Anteproyecto Solar 3D: Diseñado para instaladores, convierte fotografías aéreas tomadas con dron en un modelo 3D fotorrealista de alta precisión del sistema propuesto sobre la propiedad, ideal para calcular sombras.\n";
    text += "- 2. Distribución B2B: Suministro a nivel nacional de módulos solares, inversores, microinversores, cable, baterías y estructuras de aluminio.\n\n";

    // 4. Products Catalog
    const activeProducts = products?.filter(p => p.active) || [];
    if (activeProducts.length > 0) {
      text += "PRODUCTOS EN CATÁLOGO Y PRECIOS REALES:\n";
      activeProducts.forEach(p => {
        text += `- ${p.name} (${p.brand}) [Categoría: ${p.category}]\n`;
        text += `  * Precio Base: $${p.basePrice} MXN por ${p.unit}\n`;
        text += `  * Stock Disponible: ${p.stock} unidades\n`;
        if (p.specs && p.specs.length > 0) {
          text += `  * Especificaciones: ${p.specs.join(', ')}\n`;
        }
        if (p.tiers && p.tiers.length > 0) {
          text += "  * Precios por volumen:\n";
          p.tiers.forEach(t => {
            text += `    - A partir de ${t.minQty} unidades: $${t.price} MXN (${t.label})\n`;
          });
        }
        text += "\n";
      });
    }
    
    return text;
  };

  // Auto scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load welcome message dynamically from Gemini on mount or agent switch
  // Load welcome message statically on mount/agent change to prevent API saturation
  useEffect(() => {
    setMessages([
      {
        id: 'init-ok',
        text: `¡Hola! Bienvenido a eSol Energías. Soy ${activeAgent.name}, tu ${activeAgent.role}. ¿Cómo te puedo ayudar hoy? ☀️`,
        sender: 'bot',
        timestamp: getFormattedTime()
      }
    ]);
  }, [activeAgent]);

  // Save/Update lead in local storage CRM (esol_leads)
  const saveLeadToCRM = (name: string, phone: string, details: string, amount: string, history: Message[]) => {
    try {
      const savedLeads = localStorage.getItem('esol_leads');
      const currentLeads = savedLeads ? JSON.parse(savedLeads) : [];
      
      const existingIndex = currentLeads.findIndex((l: any) => l.id === leadId);
      
      const leadData = {
        id: leadId,
        name: name || 'Cliente del Chat',
        email: phone || 'Sin teléfono aún',
        phone: phone || '',
        tariff: 'Cotización Chat B2B',
        consumption: amount || 'Cotización por Chat',
        panelReq: details || 'Consulta general de componentes',
        status: 'Pendiente de Envío',
        date: new Date().toLocaleDateString('es-MX'),
        source: 'chatbot',
        chatHistory: JSON.stringify(history)
      };

      if (existingIndex !== -1) {
        currentLeads[existingIndex] = leadData;
      } else {
        currentLeads.unshift(leadData);
      }

      localStorage.setItem('esol_leads', JSON.stringify(currentLeads));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error("Error saving lead locally:", err);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: textToSend,
      sender: 'user',
      timestamp: getFormattedTime()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // Exact 1-second delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const apiKey = getGeminiApiKey();
      
      if (!apiKey) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            text: 'Hola, disculpa la molestia. En este momento nuestro canal de consulta inteligente está en mantenimiento técnico. Con gusto te apoyamos de inmediato por WhatsApp al 3112343034 o al correo energiasesol@gmail.com. ☀️',
            sender: 'bot',
            timestamp: getFormattedTime()
          }
        ]);
        setIsTyping(false);
        return;
      }

      const model = getGeminiModel();
      
      // Context Variables to inject
      const currentContext = {
        name: clientName || 'No proporcionado aún',
        phone: clientPhone || 'No proporcionado aún',
        details: quoteDetails || 'Aún no detallada',
        amount: quoteAmount || 'No calculada aún'
      };

      // Dynamically load the active agent prompt and inject context variables & live page content
      const systemPromptText = `${activeAgent.systemPrompt}

[INFORMACIÓN EN TIEMPO REAL DEL SITIO WEB (CATÁLOGO, PRECIOS, SERVICIOS, PROMOS)]
${getPageContentContext()}

[CONTEXTO DE ESTA SESIÓN]
- Nombre del Cliente: ${currentContext.name}
- Teléfono del Cliente: ${currentContext.phone}
- Cotización en Curso: ${currentContext.details} (${currentContext.amount})`;

      // Format alternating history. Must start with 'user' role
      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      const userStartIndex = updatedMessages.findIndex(m => m.sender === 'user');
      
      if (userStartIndex !== -1) {
        const chatHistoryToSend = updatedMessages.slice(userStartIndex);
        for (const m of chatHistoryToSend) {
          const role = m.sender === 'user' ? 'user' : 'model';
          if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
            // Combine consecutive messages of the same sender to avoid Gemini validation errors
            formattedContents[formattedContents.length - 1].parts[0].text += "\n" + m.text;
          } else {
            formattedContents.push({
              role: role,
              parts: [{ text: m.text }]
            });
          }
        }
      }

      const payload = {
        systemInstruction: {
          parts: [{ text: systemPromptText }]
        },
        contents: formattedContents
      };

      let geminiRes = await fetchGeminiWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (geminiRes.ok) {
        const resultJson = await geminiRes.json();
        const rawReply = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        let replyText = '';
        // Parse response and metadata
        if (rawReply.includes('[METADATA]')) {
          const parts = rawReply.split('[METADATA]');
          replyText = parts[0].trim();
          
          // Extract fields from metadata
          const metadataStr = parts[1] || '';
          const nameMatch = metadataStr.match(/Nombre:\s*(.*)/i);
          const phoneMatch = metadataStr.match(/Teléfono:\s*(.*)/i);
          const detailMatch = metadataStr.match(/Detalle:\s*(.*)/i);
          const amountMatch = metadataStr.match(/Monto:\s*(.*)/i);

          let extName = clientName;
          let extPhone = clientPhone;
          let extDetail = quoteDetails;
          let extAmount = quoteAmount;

          if (nameMatch && nameMatch[1]?.trim()) extName = nameMatch[1].trim();
          if (phoneMatch && phoneMatch[1]?.trim()) extPhone = phoneMatch[1].replace(/\D/g, '').trim();
          if (detailMatch && detailMatch[1]?.trim()) extDetail = detailMatch[1].trim();
          if (amountMatch && amountMatch[1]?.trim()) extAmount = amountMatch[1].trim();

          // Additional direct parsing fallback if Gemini misses
          const directPhone = textToSend.replace(/\D/g, '');
          if (directPhone.length >= 8 && directPhone.length <= 15) {
            extPhone = directPhone;
          }

          setClientName(extName);
          setClientPhone(extPhone);
          setQuoteDetails(extDetail);
          setQuoteAmount(extAmount);

          // Sync lead in background
          if (extPhone || (extName && extDetail)) {
            saveLeadToCRM(extName, extPhone, extDetail, extAmount, [...updatedMessages, { id: 'bot-temp', text: replyText, sender: 'bot', timestamp: getFormattedTime() }]);
          }
        } else {
          replyText = rawReply.trim();
          
          // Background heuristics fallback
          const directPhone = textToSend.replace(/\D/g, '');
          let finalPhone = clientPhone;
          if (directPhone.length >= 8 && directPhone.length <= 15) {
            finalPhone = directPhone;
            setClientPhone(finalPhone);
          }
          
          if (finalPhone || clientName) {
            saveLeadToCRM(clientName, finalPhone, quoteDetails, quoteAmount, [...updatedMessages, { id: 'bot-temp', text: replyText, sender: 'bot', timestamp: getFormattedTime() }]);
          }
        }

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          text: replyText.trim(),
          sender: 'bot',
          timestamp: getFormattedTime()
        };
        setMessages(prev => [...prev, botMsg]);

      } else {
        const errStatus = geminiRes.status;
        console.error(`Gemini API returned error status ${errStatus}`);
        
        let userMessageText = 'Disculpa, en este momento el canal de consulta inteligente está recibiendo una gran cantidad de mensajes. ☀️ Por favor, intenta de nuevo en unos segundos, o si prefieres, con gusto te atenderemos directamente por WhatsApp al 3112343034.';
        
        if (errStatus === 403 || errStatus === 400) {
          userMessageText = 'Hola, disculpa. Parece que hay un inconveniente temporal de configuración con nuestro servicio de asesoría. Si gustas, puedes contactarnos directamente por WhatsApp al 3112343034 para ayudarte de inmediato.';
        }
        
        const botMsg: Message = {
          id: `bot-err-${Date.now()}`,
          text: userMessageText,
          sender: 'bot',
          timestamp: getFormattedTime()
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.error("Chatbot Error: ", err);
      const errMsg: Message = {
        id: `bot-err-${Date.now()}`,
        text: 'Parece que hay un retraso temporal en la conexión de red. ☀️ ¿Podrías intentar enviar tu mensaje de nuevo? O con gusto te apoyamos directamente por WhatsApp al 3112343034.',
        sender: 'bot',
        timestamp: getFormattedTime()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSendMessage(inputText);
  };

  return (
    <section id="contacto" className="relative py-28 px-6 lg:px-12 bg-dark-2 topo-bg">
      {/* Backlight spots */}
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gold/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Side: Contact Information */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
                Canales de Atención
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
                Iniciemos tu
                <br />
                <span className="shimmer-text font-black text-white">Proyecto Solar</span>
              </h2>
              <p className="font-body text-cream-muted text-sm md:text-base leading-relaxed tracking-wide">
                Cotiza un anteproyecto, solicita precios especiales de componentes o resuelve dudas de ingeniería. Respondemos de manera inmediata.
              </p>
            </div>

            {/* Coordinates */}
            <div className="space-y-6">
              <a
                href="https://wa.me/523112343034"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-5 p-5 rounded-xl border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-1/80 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-dark-1 transition-all duration-300">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-cream-dim">
                    WhatsApp / Teléfono
                  </h4>
                  <p className="text-sm font-bold text-cream font-mono mt-0.5 group-hover:text-gold-light transition-colors">
                    +52 (311) 234-3034
                  </p>
                </div>
              </a>

              <a
                href="mailto:energiasesol@gmail.com"
                className="flex items-center gap-5 p-5 rounded-xl border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-1/80 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-dark-1 transition-all duration-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-cream-dim">
                    Correo Electrónico
                  </h4>
                  <p className="text-sm font-bold text-cream font-mono mt-0.5 group-hover:text-gold-light transition-colors">
                    energiasesol@gmail.com
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-5 p-5 rounded-xl border border-dark-4 bg-dark-1">
                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-cream-dim">
                    Ubicación Principal
                  </h4>
                  <p className="text-sm font-bold text-cream font-mono mt-0.5">
                    Insurgentes 60A, Centro, Tepic, Nayarit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Chatbot Widget */}
          <div className="lg:col-span-7 relative">
            <div className="rounded-2xl border border-dark-4 bg-dark-1 shadow-2xl relative overflow-hidden flex flex-col h-[550px]">
              
              {/* Header */}
              <div className="bg-dark-2 border-b border-dark-4 px-5 py-4 flex items-center justify-between z-10 shrink-0 select-none">
                <div className="flex items-center gap-3.5">
                  {/* Highly Legible green WhatsApp logo / Profile Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md select-none transition-all duration-300">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M12.012 3c-4.968 0-9.011 4.043-9.011 9.01 0 1.587.413 3.134 1.2 4.495L3 21l4.636-1.216a8.96 8.96 0 0 0 4.376 1.13c4.968 0 9.02-4.05 9.02-9.017c0-2.406-.935-4.666-2.637-6.37C16.677 3.93 14.417 3 12.012 3zm4.686 12.484c-.256.712-1.5 1.305-2.062 1.393-.562.088-1.258.125-2.062-.132a10.02 10.02 0 0 1-5.183-4.526c-.462-.782-.775-1.688-.775-2.627 0-1.844 1.131-2.9 2.062-2.9.231 0 .438.012.607.025.181.012.35.025.5.337.181.381.65 1.581.706 1.693.056.113.094.244.019.394-.075.15-.15.281-.225.375-.075.093-.162.2-.244.275-.094.093-.193.193-.081.387.112.193.5.819 1.075 1.331.737.656 1.356.862 1.55.956.193.094.306.081.418-.05.113-.131.5-1.575.632-1.787.131-.213.262-.181.443-.113.181.069 1.156.544 1.356.644.2.1.331.15.381.237.05.088.05.506-.206 1.219z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-cream text-xs md:text-sm">
                        {activeAgent.name}
                      </span>
                      <span className="inline-flex items-center justify-center bg-[#25D366]/15 text-[#25D366] text-[8px] font-black rounded-full px-1.5 py-0.5 uppercase tracking-wide border border-[#25D366]/25 select-none font-mono">
                        WhatsApp
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[9.5px] text-green-400 font-medium truncate max-w-[200px] md:max-w-[320px]">
                        {activeAgent.role}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Chat Area */}
              <div 
                ref={chatContainerRef} 
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-[#0a0d0f] bg-opacity-[0.98] bg-[radial-gradient(rgba(212,175,55,0.02)_1.5px,transparent_1.5px)] bg-[size:22px_22px] scrollbar-thin"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.25s_ease-out]`}
                  >
                    <div 
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-gold text-dark-1 rounded-tr-none shadow-md font-semibold' 
                          : 'bg-dark-2 text-cream rounded-tl-none border border-dark-4/60 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line font-sans font-normal tracking-wide text-cream-light">
                        {msg.text.split('\n').map((line, li) => {
                          const parts = line.split(/\*\*?([^*]+)\*\*?/g);
                          return (
                            <span key={li}>
                              {parts.map((part, pi) =>
                                pi % 2 === 1
                                  ? <strong key={pi} className="font-bold text-white">{part}</strong>
                                  : <span key={pi}>{part}</span>
                              )}
                              {li < msg.text.split('\n').length - 1 && <br />}
                            </span>
                          );
                        })}
                      </p>
                      
                      <div className={`flex items-center justify-end gap-1 mt-1.5 select-none text-[9px] font-mono ${
                        msg.sender === 'user' ? 'text-dark-1/70' : 'text-cream-dim/60'
                      }`}>
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'user' && (
                          <CheckCheck className="w-3.5 h-3.5 text-dark-1/80" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-dark-2 border border-dark-4/60 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-cream flex items-center gap-2">
                      <span className="text-[10px] text-cream-dim font-medium italic">Escribiendo</span>
                      <div className="flex gap-1">
                        <span className="w-1 h-1 rounded-full bg-cream animate-bounce"></span>
                        <span className="w-1 h-1 rounded-full bg-cream animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1 h-1 rounded-full bg-cream animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="bg-[#0a0d0f]/95 px-5 py-2.5 flex gap-2 overflow-x-auto scrollbar-none border-t border-dark-4/30 shrink-0">
                {CHAT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sug)}
                    disabled={isTyping}
                    className="flex-none bg-dark-2 hover:bg-dark-3 border border-dark-4 hover:border-gold/30 text-[10px] font-sans font-medium text-cream px-3 py-2 rounded-full cursor-pointer transition-all duration-200 disabled:opacity-50 select-none"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form 
                onSubmit={handleFormSubmit}
                className="bg-dark-2 px-4 py-3.5 flex items-center gap-3 border-t border-dark-4 shrink-0"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={isTyping}
                    className="w-full bg-dark-1 text-xs text-cream px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold/30 placeholder:text-cream-dim/50 border border-dark-4 focus:border-gold/45 transition-all"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isTyping || !inputText.trim()}
                  className="w-10 h-10 rounded-full bg-gold hover:bg-gold-light text-dark-1 flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4.5 h-4.5 fill-dark-1 text-dark-1" />
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
