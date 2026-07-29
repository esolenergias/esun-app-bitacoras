# Especificación de Diseño: División de Pagos por Entrega de Trámites y Acta de Conclusión CFE

**Fecha:** 2026-07-29  
**Módulo:** Dashboard Profesional • Legal Esol • Contratos Paneles (`src/components/legal/ContratosPanelesTab.tsx`)

---

## 1. Visión General y Objetivos

En la gestión de contratos de sistemas fotovoltaicos, no todos los clientes liquidan el 100% del saldo restante al concluir la instalación física. En diversos proyectos, la estructura financiera requiere dividir el saldo restante posterior al anticipo en dos hitos distintos:

1. **Anticipo Inicial** (ej. 70%)
2. **Pago a la Entrega del Sistema Instalado** (Acta de Entrega - Recepción física del sistema, ej. 20%)
3. **Pago Final a la Conclusión de Trámites y Puesta de Medidor CFE** (Acta de Conclusión de Trámites e Interconexión CFE, ej. 10%)

Además, el sistema debe ser capaz de:
- Generar un nuevo documento / anexo oficial: **Anexo 5 / Acta de Conclusión de Trámites e Interconexión CFE**.
- Filtrar y listar automáticamente del presupuesto base todos los conceptos asociados a **Trámites CFE, Interconexión, UVIE/UVEG, Dictámenes, Planos y Medidor**, omitiendo cualquier concepto de comisión.
- Permitir la exportación del contrato completo (con Anexo 5 incluido) o la exportación independiente del **Acta de Trámites CFE**.

---

## 2. Cambios en el Estado (`formData`)

Se añadirán los siguientes campos a `formData` en `ContratosPanelesTab.tsx`:

```typescript
// Estructura de Pagos por Hitos
esquemaTramitesActivo: boolean; // Alternar división de pago restante para Trámites CFE
porcentajeEntregaSistema: number; // % a la entrega física (ej. 20%)
porcentajeEntregaSistemaStr: string;
montoEntregaSistema: number;

porcentajePuestaMedidor: number; // % a la puesta de medidor CFE (ej. 10%)
porcentajePuestaMedidorStr: string;
montoPuestaMedidor: number;

// Detalle editable para Trámites CFE
descripcionTramitesCfe: string; // Conceptos de trámites extraídos o editados
```

---

## 3. Lógica de Cálculo Financiero

Cuando `esquemaTramitesActivo` está habilitado:
- `montoAnticipo` = `montoTotal * (porcentajeAnticipo / 100)`
- `montoRestante` = `montoTotal - montoAnticipo`
- `montoEntregaSistema` = `montoTotal * (porcentajeEntregaSistema / 100)`
- `montoPuestaMedidor` = `montoTotal - montoAnticipo - montoEntregaSistema` (o calculado según `% porcentajePuestaMedidor`)

Validación: `% porcentajeAnticipo + % porcentajeEntregaSistema + % porcentajePuestaMedidor = 100%`.

---

## 4. Filtrado Automático de Conceptos de Trámites CFE

Al seleccionar un presupuesto base en `handleBudgetSelection`:
1. Se buscan conceptos donde la descripción contenga palabras clave como:
   `trámite`, `tramite`, `interconexión`, `interconexion`, `cfe`, `medidor`, `dictamen`, `uvie`, `uveg`, `inspección`, `verificación`, `expediente`, `plano`, `gestión`.
2. Se excluyen conceptos con la palabra `comisión` / `comision` o contenedores de grupo (`type === 'group'`).
3. Si existen conceptos coincidentes, se genera una lista formateada en `formData.descripcionTramitesCfe`.
4. Si no existen conceptos explícitos de trámites en el presupuesto, se incluye una descripción técnica estándar predeterminada:
   - `- Gestión, integración de expediente técnico e ingeniería ante CFE`
   - `- Solicitud de interconexión y convenio de interconexión fotovoltaica CFE`
   - `- Verificación de requisitos de medición bidireccional y puesta en marcha`

---

## 5. Diseño del Documento: Acta / Anexo 5 de Conclusión de Trámites CFE

El nuevo documento constará de:
- **Encabezado Institucional**: Logo de ESOL Energías, fecha, folio de contrato y datos del suscriptor.
- **Declaraciones de Cumplimiento**: Declaración de entrega del expediente técnico completo ingresado ante CFE.
- **Desglose de Servicios de Trámites e Interconexión**: Lista de conceptos de trámites CFE y monto/porcentaje correspondiente al hito final.
- **Bloque de Firmas**: Firma de conformidad de EL CLIENTE y de EL PRESTADOR.

---

## 6. Opciones de Exportación

1. **Botón Principal**: `Generar y Exportar Contrato Completo (PDF)` — Incluye Carátula, Cláusulas y Anexos 1 al 5.
2. **Botón Secundario**: `Exportar Solo Acta de Trámites CFE (PDF)` — Genera exclusivamente el documento de Trámites CFE en 1 hoja limpia.
