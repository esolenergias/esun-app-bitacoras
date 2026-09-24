# Agente de Ventas Autónomo (AI SDR) - Esol Energías

El **SDR (Sales Development Representative) Autónomo** es un empleado digital diseñado para Esol Energías. Su objetivo es realizar prospección activa, perfilamiento energético y redacción de propuestas en frío (Cold Outreach) sin intervención humana.

---

## 🧠 Capacidades Principales

1. **Búsqueda Hiper-Segmentada:** 
   Se conecta a la API de Google Places para buscar empresas por giro comercial y región geográfica (ej. "Hoteles boutique en Mérida, Yucatán").
2. **Perfilamiento Energético Predictivo:** 
   Utiliza el modelo LLM `gemini-2.5-flash` para analizar el nombre y ubicación del negocio y estimar algorítmicamente cuánto pagan de luz bimestralmente a CFE.
3. **Copywriting Persuasivo:** 
   Redacta mensajes de WhatsApp (Pitches) extremadamente cortos, directos y altamente persuasivos, diseñados específicamente para romper el hielo y prometer la reducción de su tarifa a $0 MXN.
4. **Almacenamiento en la Nube:** 
   Clasifica y guarda automáticamente todos los prospectos calificados en la base de datos de Supabase, inyectándolos en tu embudo de ventas (Kanban).
5. **Autonomía Total (Cron):** 
   Se ejecuta a las 6:00 AM todos los días desde los servidores de Hostinger, asegurando que cuando el equipo humano de ventas despierte, ya tengan nuevos prospectos listos para cerrar.

---

## 🔄 Diagrama de Flujo (Workflow)

```mermaid
graph TD
    %% Estilos
    classDef trigger fill:#1A1B1E,stroke:#C49825,stroke-width:2px,color:#E4E0D9;
    classDef api fill:#2D2F36,stroke:#3D3F47,stroke-width:2px,color:#E4E0D9;
    classDef ai fill:#2D2F36,stroke:#C49825,stroke-width:2px,color:#E4E0D9;
    classDef db fill:#1A1B1E,stroke:#4CAF50,stroke-width:2px,color:#E4E0D9;

    %% Nodos
    A((6:00 AM<br/>Hostinger Cron Job)):::trigger
    B[Descargar Dependencias<br/>'npm install']:::api
    C[Iniciar Script SDR<br/>'run_sdr_agent.mjs']:::trigger
    D[Llamada a Google Places API<br/>'Hoteles en Mérida']:::api
    E{¿Encontró Empresas?}:::api
    F[Fin del proceso temporal]:::trigger
    G[Bucle por cada Empresa<br/>Extraer Nombre, Tel, Web]:::api
    H[Enviar Contexto a<br/>Google Gemini 2.5]:::ai
    I[Gemini deduce Gasto CFE<br/>ej. $35,000 MXN]:::ai
    J[Gemini redacta Pitch<br/>Mensaje de WhatsApp corto]:::ai
    K[Insertar en Supabase<br/>Tabla 'sdr_leads']:::db
    L((Leads listos en el<br/>Portal Esol)):::db

    %% Conexiones
    A --> B
    B --> C
    C --> D
    D --> E
    E -- No --> F
    E -- Sí --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    K -- Siguiente Empresa --> G
```

---

## 🛠️ Stack Tecnológico Involucrado

- **Infraestructura:** Hostinger (cPanel / hPanel Cron Jobs).
- **Lenguaje:** Node.js (EcmaScript Modules).
- **Extracción de Datos:** Google Places API (REST).
- **Inteligencia Artificial:** Google Gemini AI Studio (Prompt Engineering estructurado JSON).
- **Base de Datos:** Supabase PostgreSQL (`@supabase/supabase-js`).
- **Interfaz Humana:** React + Vite + TailwindCSS (El Portal de Esol).

## 🚀 Posibles Futuras Expansiones
Dado que la arquitectura es modular, en el futuro se podrían agregar las siguientes capacidades:
1. **Envío Automático:** Conectar el script con la API de Twilio o WhatsApp Business para que el bot no solo redacte el mensaje, sino que lo envíe automáticamente a las 6:30 AM.
2. **Scraping Web:** Que el bot entre a la página web del prospecto (si la tiene) para leer su sección "Sobre Nosotros" y hacer el pitch de ventas aún más personalizado.
