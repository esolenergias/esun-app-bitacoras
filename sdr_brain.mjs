import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializar SDK
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// 1. Declaración de las Herramientas (El Menú del Bot)
const esolTools = {
  functionDeclarations: [
    {
      name: "analizar_recibo_cfe",
      description: "Extrae el consumo en kWh a partir del texto de un recibo CFE que mandó el cliente.",
      parameters: {
        type: "OBJECT",
        properties: {
          texto_recibo: {
            type: "STRING",
            description: "El texto completo que el cliente mandó de su recibo"
          }
        },
        required: ["texto_recibo"]
      }
    },
    {
      name: "generar_cotizacion_esun",
      description: "Genera una cotización usando el módulo Esun Solar con base en los kWh bimestrales.",
      parameters: {
        type: "OBJECT",
        properties: {
          kwh_bimestral: {
            type: "NUMBER",
            description: "Consumo bimestral del cliente en kWh"
          }
        },
        required: ["kwh_bimestral"]
      }
    },
    {
      name: "generar_link_esol_smart",
      description: "Genera un enlace de pago de Stripe para que el cliente se suscriba a Esol Smart (Recibo Cero).",
      parameters: {
        type: "OBJECT",
        properties: {
          nombre_cliente: {
            type: "STRING",
            description: "Nombre del cliente para personalizar el link"
          }
        },
        required: ["nombre_cliente"]
      }
    }
  ]
};

// 2. Funciones Reales (Las acciones del backend que se ejecutarán cuando el bot las pida)
const platformFunctions = {
  analizar_recibo_cfe: ({ texto_recibo }) => {
    console.log(`[CFE Manager] Analizando texto: ${texto_recibo}`);
    // Simulación de la IA Visual o OCR que ya tenemos
    return { consumo_kwh: 1250, tarifa: "DAC", mensaje_interno: "Es alto consumidor" };
  },
  generar_cotizacion_esun: ({ kwh_bimestral }) => {
    console.log(`[Esun Solar] Generando cotización para ${kwh_bimestral} kWh`);
    const paneles = Math.ceil(kwh_bimestral / 120);
    const costo_estimado = paneles * 12500;
    return { 
      paneles_recomendados: paneles, 
      costo_mxn: costo_estimado, 
      ahorro_mensual: 4500,
      link_pdf: "https://esolenergias.com/propuesta-generada.pdf" 
    };
  },
  generar_link_esol_smart: ({ nombre_cliente }) => {
    console.log(`[Esol Smart] Creando enlace de Stripe para ${nombre_cliente}`);
    // Aquí en la vida real llamaríamos a tu stripe_server.mjs real (ej. session.url)
    return { 
      link_pago: `https://checkout.stripe.com/c/pay/cs_test_simulate_12345?email=${nombre_cliente.replace(' ', '')}@mail.com`,
      precio_suscripcion: 399
    };
  }
};

// 3. Orquestador Principal
export async function chatConSDR(historialMensajes) {
  // Configurar el modelo con las herramientas permitidas
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [esolTools],
    systemInstruction: "Eres Carlos, el asesor virtual de Esol Energías. Eres persuasivo, directo y tu objetivo es usar tus herramientas (recibos, cotizaciones y links de pago) para cerrar ventas. Responde siempre de forma corta como en WhatsApp."
  });

  const chat = model.startChat({ history: historialMensajes });

  // Obtener el último mensaje del usuario
  const ultimoMensaje = historialMensajes[historialMensajes.length - 1].parts[0].text;
  
  try {
    // 1. Mandamos el mensaje a Gemini para ver qué decide hacer
    const result = await chat.sendMessage(ultimoMensaje);
    const call = result.response.functionCalls()?.[0];

    // 2. Si la IA decidió usar una herramienta...
    if (call) {
      console.log(`\n🤖 El SDR decidió usar la herramienta: [${call.name}] con argumentos:`, call.args);
      
      // Ejecutamos la función real en el servidor
      const apiResponse = platformFunctions[call.name](call.args);
      
      // Le devolvemos el resultado de la función a Gemini para que genere la respuesta final al humano
      const finalResult = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: apiResponse
        }
      }]);
      
      return finalResult.response.text();
    } 

    // 3. Si no usó herramientas, devolvemos su respuesta de texto normal
    return result.response.text();

  } catch (error) {
    console.error("Error en SDR Brain:", error);
    return "Ups, tuve un error interno al conectar con la plataforma Esol. Dame un momento.";
  }
}
