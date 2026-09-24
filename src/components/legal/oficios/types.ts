export interface OficioData {
  id?: string;
  folio: string;
  fecha: string;
  lugar: string;
  
  // Vinculación con obra / presupuesto
  presupuestoId?: string;
  nombreObra: string;
  ubicacionObra: string;
  clienteFinal: string;
  
  // Plantilla / Categoría
  tipoOficio: string;
  
  // Destinatario
  destinatarioTitulo: string; // Ing., Arq., Lic., C., A Quien Corresponda
  destinatarioNombre: string;
  destinatarioCargo: string;
  destinatarioEmpresa: string;
  destinatarioAtencion?: string;
  
  // Encabezado del documento
  asunto: string;
  referencia: string;
  vocativo: string;
  
  // Contenido / Estructura del oficio
  antecedentes?: string;
  cuerpo: string;
  fundamentacion?: string;
  peticion?: string;
  despedida: string;
  
  // Datos del remitente / Empresa emisora
  remitenteNombre: string;
  remitenteCargo: string;
  remitenteCedula?: string;
  empresaRazonSocial: string;
  empresaRFC: string;
  empresaDomicilio: string;
  empresaTelefono: string;
  empresaEmail: string;
  
  // Elementos finales
  ccp: string[]; // Con copia para
  anexos: string[]; // Documentos adjuntos
  
  // Firma Digital Precargada
  firmaDigital?: string; // Data URL Base64 o URL de imagen de firma
  incluirFirmaDigital?: boolean; // Activar firma digital en documento
  
  // Control de estado y Drive
  estado?: 'borrador' | 'emitido' | 'entregado' | 'firmado';
  drive_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OficioTemplate {
  id: string;
  titulo: string;
  categoria: string;
  icono: string;
  descripcion: string;
  asuntoDefault: string;
  vocativoDefault: string;
  antecedentesDefault: string;
  cuerpoDefault: string;
  fundamentacionDefault: string;
  peticionDefault: string;
  despedidaDefault: string;
  ccpDefault: string[];
  anexosDefault: string[];
}
