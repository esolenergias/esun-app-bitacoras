export type RequestStatus = 'DRAFT' | 'PENDING_DOCS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  mapScreenshot?: string;
}

export interface ClientData {
  name: string;
  rpu: string;
  address: string;
  municipality?: string;
  state?: string;
  zipCode: string;
}

export interface CartaPoder {
  grantedTo: string;
  date: string;
  location?: string;
  witness1Name?: string;
  witness2Name?: string;
  grantorSignature?: string;
  receiverSignature?: string;
  witness1Signature?: string;
  witness2Signature?: string;
}

export interface UnifilarData {
  // Panel
  panelQuantity: number;
  panelBrand: string;
  panelModel: string;
  panelPower: number; // W
  panelVoc: number;
  panelIsc: number;
  panelVmp: number;
  panelImp: number;
  
  // Inverter
  inverterBrand: string;
  inverterModel: string;
  inverterPower: number; // W
  inverterVmaxIn: number;
  inverterVminIn: number;
  inverterImaxIn: number;
  inverterImaxOut: number;

  // Configuration
  inverterQuantity: number;
  panelsPerString: number;
  numberOfStrings: number;
  
  // Wiring & Protection
  dcWireGauge: string;
  acWireGauge: string;
  acBreakerCapacity: number;
  
  // Additional
  mountingSolution: string;
}

export interface AttachedFiles {
  idContractor?: string;
  idReceiver?: string;
  idWitness1?: string;
  idWitness2?: string;
  electricBill?: string;
  systemPhoto?: string;
  panelLabelPhoto?: string;
  inverterLabelPhoto?: string;
  panelDatasheet?: string;
  inverterDatasheet?: string;
  inverterCertificate?: string;
}

export interface AnexoAData {
  rfc?: string;
  email?: string;
  phone?: string;
  tensionLevel?: string;
  tarifa?: string;
  phases?: number;
  wires?: number;
  distanceMeter?: number;
}

export interface CFERequest {
  id: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  client: ClientData;
  location: LocationData;
  cartaPoder: CartaPoder;
  unifilar: UnifilarData;
  files: AttachedFiles;
  anexoA?: AnexoAData;
}
