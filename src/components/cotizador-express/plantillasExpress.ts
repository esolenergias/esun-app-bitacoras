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
    condicionesServicioDefault: `1. ALCANCE Y ESPECIFICACIONES DEL SERVICIO:
• El servicio comprende la inspección visual, medición geométrica y revisión de parámetros eléctricos en las instalaciones designadas por el cliente.
• Los análisis se ejecutan conforme al marco normativo vigente (NOM-001-SEDE-2012 y especificaciones de CFE Distribución).
• La entrega de entregables se realizará en formato digital PDF de alta resolución en un plazo no mayor a 3 días hábiles posteriores a la visita.

2. CONFIDENCIALIDAD Y RESPALDO TÉCNICO:
• Toda la información técnica, fotográfica y documental recabada durante el levantamiento será tratada con estricta confidencialidad profesional.
• El dictamen preliminar emitido tiene carácter orientativo y sirve como base técnica firme para el dimensionamiento del anteproyecto definitivo.`,
    metodologiaServicioDefault: `• Fase 1: Coordinación y confirmación de agenda con el contacto designado por el cliente.
• Fase 2: Recorrido pericial en sitio, toma de medidas, inspección de cubiertas y gabinete eléctrico principal.
• Fase 3: Procesamiento en gabinete, modelado preliminar y emisión del Dictamen Técnico Ejecutivo.`,
    condicionesTrabajoDefault: `1. REQUISITOS EN SITIO Y SEGURIDAD INDUSTRIAL:
• El personal de ESOL Energías se presentará debidamente identificado y provisto con Equipo de Protección Personal (EPP) completo: calzado dieléctrico, casco de seguridad, chaleco reflejante y arnés con línea de vida cuando se requieran trabajos en altura.
• El personal de ESOL se apegará a los protocolos internos de seguridad y salud en el trabajo del inmueble visitado.

2. HORARIOS DE TRABAJO:
• Los trabajos en sitio se programarán en jornada diurna de común acuerdo (lunes a viernes de 8:00 a 17:00 hrs, o sábados de 8:00 a 13:00 hrs). Horarios especiales o nocturnos deberán convenirse previamente.`,
    responsabilidadesClienteDefault: `• Otorgar acceso expedito y seguro a las áreas de azotea, cuartos eléctricos, tableros y subestación.
• Designar un enlace o responsable en sitio que acompañe el recorrido y brinde facilidades de acceso a interruptores.
• Facilitar recibo de energía eléctrica CFE reciente y datos generales de la cuenta contratada.`,
    exclusionesGarantiasDefault: `• No incluye maniobras en alturas superiores a 12 metros que requieran grúa articulada o andamios especiales no convenidos.
• No incluye aperturas de zanjas, perforaciones destructivas ni desmontaje de plafones o acabados.
• La visita técnica no constituye dictamen pericial UVIE/UIIE certificado hasta la contratación de la gestoría correspondiente.`,
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
    condicionesServicioDefault: `1. VALIDEZ NORMATIVA Y ALCANCE PROFESIONAL:
• Los entregables de ingeniería son desarrollados y avalados por Ingeniero Eléctrico con Cédula Profesional y registro técnico vigente.
• Todos los cálculos satisfacen las especificaciones de la NOM-001-SEDE-2012, Código de Red 2.0 y resolutivos de la Comisión Reguladora de Energía (CRE).
• La gestoría comprende el armado del expediente, ingreso de solicitud y seguimiento hasta la resolución correspondiente de CFE Distribución.

2. DERECHOS DE AUTOR Y PROPIEDAD INTELECTUAL:
• Los planos, memorias de cálculo y archivos de diseño digital entregados son para uso exclusivo del proyecto especificado en la presente cotización.`,
    metodologiaServicioDefault: `• Fase 1: Recepción de documentación del cliente y revisión de parámetros de red local.
• Fase 2: Modelado eléctrico, balance de fases, cálculo de alimentadores y confección de unifilar.
• Fase 3: Integración del expediente, firma pericial e ingreso formal ante ventanilla de CFE/UVIE.`,
    condicionesTrabajoDefault: `1. COORDINACIÓN TÉCNICA:
• El desarrollo del proyecto se ejecutará de forma remota en gabinete de ingeniería, manteniendo juntas periódicas de seguimiento virtual o presencial con los directores de obra del cliente.
• En caso de requerirse visitas de campo complementarias con inspectores de UVIE o CFE, se programarán con 48 horas de anticipación.

2. CUMPLIMIENTO LEGAL:
• ESOL Energías asume total responsabilidad técnica sobre la exactitud de los cálculos y memorias entregadas.`,
    responsabilidadesClienteDefault: `• Proporcionar copia legible del último recibo CFE pagado, escrituras o contrato de arrendamiento del predio, e identificación oficial del titular.
• Brindar planos arquitectónicos o estructurales actualizados del predio en caso de contar con ellos.
• Cubrir de manera directa los pagos de derechos gubernamentales, aranceles de UVIE o depósitos en garantía que CFE requiera formalmente.`,
    exclusionesGarantiasDefault: `• No incluye pagos oficiales de derechos de inspección UVIE ni cargos de estudio de red que CFE determine por saturación de circuito.
• No incluye obra civil, adecuaciones físicas de acometida ni suministro de transformador salvo que se coticen expresamente por separado.
• Los tiempos de respuesta de CFE Distribución dependen de sus cargas administrativas oficiales ajenas al control directo de ESOL.`,
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
    condicionesServicioDefault: `1. ESPECIFICACIONES Y CONDICIONES DE SUMINISTRO:
• Todos los insumos y equipos cotizados son 100% nuevos, de primera calidad, certificados bajo normas NOM, UL o IEC aplicables.
• La cotización ampara exclusivamente las marcas, modelos y capacidades detalladas en la tabla de partidas económicas.
• Las cotizaciones en moneda nacional se basan en la paridad cambiaria vigente al momento de emisión; fluctuaciones extraordinarias podrían requerir actualización.

2. GARANTÍAS DE EQUIPAMIENTO:
• Garantía directa de fabricante en equipos principales (inversores, gabinetes, interruptores y supresores) contra defectos de manufactura.
• ESOL gestionará de manera directa el soporte técnico inicial y trámite de garantías ante las marcas representadas.`,
    metodologiaServicioDefault: `• Fase 1: Confirmación de pedido mediante anticipo o pago convenido.
• Fase 2: Inspección de calidad, consolidación y embalaje en bodega central de ESOL.
• Fase 3: Entrega en sitio pactado con acta de entrega-recepción de insumos firmada.`,
    condicionesTrabajoDefault: `1. LOGÍSTICA Y DESCARGA:
• Las entregas en sitio se programarán en horario hábil convenido con el cliente.
• El transporte incluye maniobra de descarga a pie de camión o en almacén del cliente en planta baja. Maniobras a azotea o niveles superiores deberán convenirse previamente.

2. INSPECCIÓN DE MATERIALES:
• Al momento de la entrega, el cliente o su representante autorizado deberá cotejar las cantidades y el estado físico de los empaques firmando de conformidad.`,
    responsabilidadesClienteDefault: `• Designar a la persona autorizada con facultades para la recepción y firma del remito de entrega.
• Disponer de área limpia, techada y segura para el resguardo de los insumos una vez entregados a pie de camión.
• Proporcionar acceso vehicular adecuado y libre de obstáculos para la unidad de transporte de carga.`,
    exclusionesGarantiasDefault: `• No incluye mano de obra de instalación o conexión eléctrica salvo que se contrate en paquete integral de obra.
• La garantía no cubre daños ocasionados por almacenamiento indebido en intemperie, vandalismo, descargas atmosféricas directas o negligencia en el manejo por terceros.`,
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
    condicionesServicioDefault: `1. ESPECIFICACIONES TÉCNICAS DEL MANTENIMIENTO:
• Los trabajos son ejecutados por técnicos especializados en energía solar fotovoltaica con certificación en trabajo seguro en alturas (DC-3).
• El lavado de módulos se efectúa exclusivamente con agua de bajo contenido mineral, sin químicos abrasivos ni hidrolavadoras de alta presión que dañen el recubrimiento antirreflejante.
• El diagnóstico termográfico se apega a directrices internacionales para la identificación oportuna de fallas y pérdida de rendimiento.

2. ENTREGABLE TÉCNICO:
• Al concluir la intervención se expedirá un Informe Técnico de Mantenimiento con curvas de rendimiento antes/después, bitácora fotográfica y dictamen de estado operativo.`,
    metodologiaServicioDefault: `• Fase 1: Desconexión y aseguramiento de circuitos (procedimiento de bloqueo y etiquetado LOTO).
• Fase 2: Pruebas eléctricas, reapriete calibrado, termografía y limpieza especializada.
• Fase 3: Puesta en marcha, verificación de parámetros nominales y cierre de reporte técnico.`,
    condicionesTrabajoDefault: `1. PROTOCOLOS DE SEGURIDAD INDUSTRIAL:
• Cuadrilla técnica equipada con EPP completo, líneas de vida, arneses certificados y detectores de ausencia de tensión.
• Se señalizarán las zonas de maniobra en piso y azotea durante las labores de lavado y revisión eléctrica.

2. MANEJO DE SUMINISTROS:
• Los residuos generados durante el servicio serán clasificados y retirados en su totalidad, entregando el área de trabajo en perfecto orden y limpieza.`,
    responsabilidadesClienteDefault: `• Facilitar toma de agua con presión regular para las tareas de limpieza de módulos fotovoltaicos.
• Suministrar acceso fluido a la azotea y cuartos de inversores/tableros durante la jornada pactada.
• Notificar con al menos 48 horas de anticipación cualquier restricción operativa o cambio de fecha.`,
    exclusionesGarantiasDefault: `• El mantenimiento preventivo no incluye reemplazo de módulos dañados por impacto previo, cambio de inversores averiados ni corrección de cableado defectuoso preexistente (estos se cotizarán por separado si se detectan).
• No incluye reparaciones a impermeabilizaciones deterioradas ajenas a la estructura de soporte.`,
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
