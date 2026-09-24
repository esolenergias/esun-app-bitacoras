import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY; // Aún no la tienes, pero la dejaremos preparada

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuración de la Búsqueda
const TARGET_QUERY = process.argv[2] || "Hoteles y Restaurantes en Nayarit y Puerto Vallarta";

console.log(`\n🤖 Iniciando Esol AI SDR...`);
console.log(`🎯 Objetivo de prospección: "${TARGET_QUERY}"`);

async function runAgent() {
  try {
    // PASO 1: Buscar Negocios (Google Places API o Fallback)
    let places = [];
    
    if (GOOGLE_PLACES_KEY) {
      console.log(`\n📍 Consultando Google Places API...`);
      const url = `https://places.googleapis.com/v1/places:searchText`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber'
        },
        body: JSON.stringify({ textQuery: TARGET_QUERY, pageSize: 5 })
      });
      const data = await response.json();
      
      if (data.places) {
        places = data.places.map(p => ({
          name: p.displayName?.text,
          address: p.formattedAddress,
          website: p.websiteUri || null,
          phone: p.nationalPhoneNumber || null
        }));
      }
    } else {
      console.log(`\n⚠️ No se encontró GOOGLE_PLACES_API_KEY en el .env.`);
      console.log(`📍 Usando buscador local simulado para "${TARGET_QUERY}"...`);
      // Fallback para que puedas probar la IA hoy mismo
      places = [
        { name: "Hotel Boutique Punta Mita", address: "Riviera Nayarit", website: "www.puntamita-boutique.com", phone: "322-123-4567" },
        { name: "Resort Los Arcos", address: "Puerto Vallarta, Jal.", website: "www.losarcos.com", phone: "322-987-6543" },
        { name: "Restaurante Vista al Mar", address: "Sayulita, Nayarit", website: null, phone: "322-555-4444" }
      ];
    }

    if (places.length === 0) {
      console.log("No se encontraron empresas.");
      return;
    }

    console.log(`✅ Se encontraron ${places.length} empresas. Analizando perfil energético con IA...\n`);

    // PASO 2: Procesamiento con Inteligencia Artificial (Gemini)
    const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const leadsToInsert = [];

    for (const place of places) {
      console.log(`🧠 Analizando: ${place.name}...`);
      
      const prompt = `
        Eres un experto asesor solar en EsolEnergias (empresa fotovoltaica B2B en México).
        Tengo este prospecto:
        Nombre: ${place.name}
        Dirección: ${place.address}
        
        Tu tarea es:
        1. Estimar cuánto pagan de luz a la CFE mensualmente en Pesos Mexicanos (MXN) basado en el tipo de negocio. Solo dame un número entero, sin símbolos ni comas, estimando a la baja. Ej: 35000.
        2. Redactar un mensaje muy corto (máximo 3 líneas) y persuasivo para enviar por WhatsApp al dueño. El mensaje debe mencionar su nombre de empresa, su posible dolor con CFE, y ofrecer que EsolEnergias lo baje a $0. No saludes, ve directo al punto de forma educada pero disruptiva.
        
        Devuelve tu respuesta EXACTAMENTE en este formato JSON, nada más:
        {
          "estimated_cfe": numero,
          "pitch": "texto del mensaje"
        }
      `;

      const aiResponse = await fetch(urlGemini, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const aiData = await aiResponse.json();
      
      let estimated_cfe = null;
      let pitch = "";

      try {
        const text = aiData.candidates[0].content.parts[0].text;
        // Limpiar backticks del json
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(cleanText);
        estimated_cfe = jsonResult.estimated_cfe;
        pitch = jsonResult.pitch;
        console.log(`   💰 Estimado CFE: $${estimated_cfe}`);
        console.log(`   ✍️ Pitch: "${pitch}"`);
      } catch (e) {
        console.log(`   ❌ Error analizando respuesta IA para ${place.name}`);
      }

      leadsToInsert.push({
        campaign_id: null, // Podríamos enlazarlo a una campaña luego
        company_name: place.name,
        website: place.website,
        email: null,
        phone: place.phone,
        estimated_cfe_cost: estimated_cfe,
        ai_generated_pitch: pitch,
        status: 'lead'
      });
      
      // Pequeña pausa para no saturar la API
      await new Promise(r => setTimeout(r, 1000));
    }

    // PASO 3: Guardar en la Base de Datos de Esol (Supabase)
    console.log(`\n💾 Guardando ${leadsToInsert.length} prospectos en el SDR Kanban...`);
    const { error } = await supabase.from('sdr_leads').insert(leadsToInsert);
    
    if (error) {
      console.error("Error guardando en Supabase:", error);
    } else {
      console.log(`✅ ¡Prospección finalizada con éxito! Revisa tu Dashboard en localhost.`);
    }

  } catch (error) {
    console.error("Error general en el Agente:", error);
  }
}

runAgent();
