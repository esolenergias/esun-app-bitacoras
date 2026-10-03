import type { PlantillaExpressPreset } from '../types/cotizadorExpress';

export const PLANTILLAS_EXPRESS: PlantillaExpressPreset[] = [
  {
    id: 'visita_tecnica',
    titulo: 'Visita de Inspección y Diagnóstico Técnico',
    subtitulo: 'Levantamiento en sitio, viabilidad solar, análisis de cubierta y acometida',
    asuntoDefault: 'PROPUESTA ECONÓMICA: VISITA TÉCNICA DE INSPECCIÓN Y LEVANTAMIENTO EN SITIO',
    tipo_servicio: 'visita_tecnica',
    alcanceDefault: `Por medio de la presente, nos dirigimos a usted con la finalidad de presentarle nuestra propuesta técnico-económica para la ejecución de los servicios de visita técnica de inspección, diagnóstico y levantamiento en las instalaciones del inmueble indicado.

Alcances del servicio:
• Inspección física y fotogramétrica de áreas de azotea/cubierta disponibles para instalación.
• Análisis de sombras, inclinación, orientación y condiciones estructurales preliminares.
• Revisión técnica del centro de carga principal, acometida eléctrica y transformador de suministro.
• Recopilación de parámetros eléctricos y análisis de factibilidad ante la normativa de CFE.
• Entrega de reporte técnico fotográfico de hallazgos y anteproyecto conceptual preliminar.`,
    tiempoEntregaDefault: '2 a 3 días hábiles posteriores a la visita',
    condicionesPagoDefault: '100% al agendar la visita de inspección técnica',
    partidasDefault: [
      {
        descripcion: 'Servicio integral de visita técnica de inspección, levantamiento dimensional y diagnóstico de infraestructura eléctrica en sitio',
        unidad: 'Visita',
        cantidad: 1,
        precio_unitario: 2500,
        importe: 2500,
        notas: 'Incluye traslados locales y entrega de reporte ejecutivo digital'
      }
    ]
  },
  {
    id: 'servicios_profesionales',
    titulo: 'Servicios Profesionales de Ingeniería y Gestoría',
    subtitulo: 'Memoria de cálculo, diagramas unifilares, trámites UVIE y CFE',
    asuntoDefault: 'PROPUESTA DE SERVICIOS PROFESIONALES DE INGENIERÍA ELÉCTRICA Y GESTORÍA',
    tipo_servicio: 'servicios_profesionales',
    alcanceDefault: `Por medio del presente documento ponemos a su consideración la propuesta formal de servicios profesionales de consultoría, ingeniería de detalle y gestión técnica ante las autoridades competentes.

Alcances del servicio:
• Elaboración de memoria de cálculo eléctrico bajo estricto cumplimiento de la NOM-001-SEDE-2012.
• Diseño de Diagrama Unifilar detallado y cuadro de cargas firmado por Ingeniero Especialista.
• Elaboración de planos ejecutivos en formato digital (DWG y PDF).
• Preparación del expediente técnico completo para trámite de interconexión en Generación Distribuida ante CFE Distribución.
• Asesoría y acompañamiento técnico durante la revisión de la Unidad de Inspección / Verificación (UVIE/UIE).`,
    tiempoEntregaDefault: '5 a 8 días hábiles a partir de la recepción de documentación completa',
    condicionesPagoDefault: '50% anticipo al iniciar trabajos y 50% contra entrega de expediente validado',
    partidasDefault: [
      {
        descripcion: 'Elaboración de ingeniería de detalle: Memoria técnica de cálculo eléctrico y Diagrama Unifilar oficial bajo NOM-001-SEDE-2012',
        unidad: 'Proyecto',
        cantidad: 1,
        precio_unitario: 8500,
        importe: 8500,
        notas: 'Validado con cédula profesional y firma de perito'
      },
      {
        descripcion: 'Gestoría técnica integral de solicitud de interconexión ante CFE Distribución hasta obtención de oficio resolutivo',
        unidad: 'Trámite',
        cantidad: 1,
        precio_unitario: 5000,
        importe: 5000,
        notas: 'No incluye derechos de inspección oficial de terceros'
      }
    ]
  },
  {
    id: 'suministro_insumos',
    titulo: 'Suministro de Insumos y Equipamiento Eléctrico',
    subtitulo: 'Venta de tableros, protecciones, inversores, cableado y canalizaciones',
    asuntoDefault: 'COTIZACIÓN DE SUMINISTRO DE EQUIPAMIENTO E INSUMOS ELÉCTRICOS',
    tipo_servicio: 'suministro_insumos',
    alcanceDefault: `Agradeciendo su preferencia, ponemos a su disposición la cotización formal para el suministro de materiales y equipos eléctricos de primera calidad para su proyecto fotovoltaico.

Especificaciones del suministro:
• Todos los materiales suministrados cuentan con certificación UL, NOM y garantía directa de fábrica.
• Entregas verificadas con empaque sellado y fichas técnicas correspondientes.
• Precios sujetos a vigencia establecida o hasta agotar existencias en almacén.`,
    tiempoEntregaDefault: 'Inmediata en almacén o 3 a 5 días hábiles según disponibilidad',
    condicionesPagoDefault: '100% previo al embarque / entrega de materiales',
    partidasDefault: [
      {
        descripcion: 'Gabinete de protecciones de corriente alterna (AC) con interruptor termomagnético e indicador LED para sistema solar',
        unidad: 'PZA',
        cantidad: 1,
        precio_unitario: 3850,
        importe: 3850,
        notas: 'Gabinete IP65 resistente a intemperie'
      },
      {
        descripcion: 'Supresor de picos transitorios (DPS) para corriente alterna clase II 20kA/40kA',
        unidad: 'PZA',
        cantidad: 1,
        precio_unitario: 1450,
        importe: 1450,
        notas: 'Protección contra descargas atmosféricas'
      },
      {
        descripcion: 'Cable fotovoltaico calibre 10 AWG 1000V/2000V con protección UV negro/rojo',
        unidad: 'ML',
        cantidad: 50,
        precio_unitario: 38,
        importe: 1900,
        notas: 'Conductor de cobre estañado 90°C'
      }
    ]
  },
  {
    id: 'mantenimiento',
    titulo: 'Póliza de Mantenimiento Preventivo y Limpieza',
    subtitulo: 'Termografía, reapriete con torque nominal, lavado especializado de módulos',
    asuntoDefault: 'PROPUESTA DE SERVICIO DE MANTENIMIENTO PREVENTIVO A SISTEMA FOTOVOLTAICO',
    tipo_servicio: 'mantenimiento',
    alcanceDefault: `Nos complace presentar nuestra propuesta para el servicio integral de mantenimiento preventivo y optimización de rendimiento de su sistema de energía solar.

El servicio incluye:
• Inspección termográfica con cámara infrarroja para detección de puntos calientes (hot-spots) en módulos e inversores.
• Reapriete de todas las conexiones mecánicas y bornes eléctricos bajo especificación de torque del fabricante.
• Medición de parámetros operativos: voltaje de circuito abierto (Voc), corriente de corto circuito (Isc) y resistencia de aislamiento.
• Limpieza y lavado especializado de módulos fotovoltaicos con agua tratada y cepillos de cerdas suaves no abrasivas.
• Emisión de reporte técnico fotográfico con comparativo antes/después y recomendaciones operativas.`,
    tiempoEntregaDefault: 'Fecha programada de común acuerdo (duración estimada: 1 jornada)',
    condicionesPagoDefault: '50% al programar servicio y 50% contra entrega del reporte final de mantenimiento',
    partidasDefault: [
      {
        descripcion: 'Mantenimiento preventivo integral, revisión eléctrica y termografía infrarroja para sistema solar fotovoltaico',
        unidad: 'Servicio',
        cantidad: 1,
        precio_unitario: 4200,
        importe: 4200,
        notas: 'Incluye equipo especializado y entrega de dictamen técnico'
      }
    ]
  }
];
