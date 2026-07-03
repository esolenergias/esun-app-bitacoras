import { create } from 'zustand';
import { CFERequest } from './types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

interface AppState {
  requests: CFERequest[];
  activeRequestId: string | null;
  fetchRequests: () => Promise<void>;
  addRequest: (request: Omit<CFERequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRequest: (id: string, request: Partial<CFERequest>) => Promise<void>;
  setActiveRequest: (id: string | null) => void;
  deleteRequest: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  requests: [],
  activeRequestId: null,

  fetchRequests: async () => {
    try {
      const { data, error } = await supabase
        .from('cfe_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: CFERequest[] = data.map((item: any) => ({
          id: item.id,
          status: item.status,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          client: item.client,
          location: item.location,
          cartaPoder: item.carta_poder,
          unifilar: item.unifilar,
          files: item.files
        }));
        set({ requests: mapped });
      } else {
        // Fallback mock request if Supabase table is empty
        set({
          requests: [
            {
              id: 'mock-1',
              status: 'PENDING_DOCS',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              client: {
                name: 'Juan Pérez',
                rpu: '123456789012',
                address: 'Av. Siempre Viva 742',
                zipCode: '12345',
              },
              location: {
                address: 'Av. Siempre Viva 742, Springfield',
                lat: 19.4326,
                lng: -99.1332,
              },
              cartaPoder: {
                grantedTo: 'Esol S.A. de C.V.',
                date: new Date().toISOString().split('T')[0],
              },
              unifilar: {
                panelBrand: 'Trina Solar',
                panelModel: 'Vertex 550W',
                panelPower: 550,
                panelVoc: 49.6,
                panelIsc: 14.0,
                panelVmp: 41.2,
                panelImp: 13.3,
                inverterBrand: 'Growatt',
                inverterModel: 'MIN 5000TL-X',
                inverterPower: 5000,
                inverterVmaxIn: 550,
                inverterVminIn: 100,
                inverterImaxIn: 13.5,
                inverterImaxOut: 22.7,
                inverterQuantity: 1,
                panelsPerString: 10,
                numberOfStrings: 1,
                dcWireGauge: '10 AWG',
                acWireGauge: '8 AWG',
                acBreakerCapacity: 30,
                mountingSolution: 'Coplanar sobre techo de losa',
              },
              files: {}
            }
          ]
        });
      }
    } catch (err) {
      console.warn('Error fetching requests from Supabase, loading mock:', err);
      // Fallback if Supabase fails or table not yet created
      set({
        requests: [
          {
            id: 'mock-1',
            status: 'PENDING_DOCS',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            client: {
              name: 'Juan Pérez (Mock Fallback)',
              rpu: '123456789012',
              address: 'Av. Siempre Viva 742',
              zipCode: '12345',
            },
            location: {
              address: 'Av. Siempre Viva 742, Springfield',
              lat: 19.4326,
              lng: -99.1332,
            },
            cartaPoder: {
              grantedTo: 'Esol S.A. de C.V.',
              date: new Date().toISOString().split('T')[0],
            },
            unifilar: {
              panelBrand: 'Trina Solar',
              panelModel: 'Vertex 550W',
              panelPower: 550,
              panelVoc: 49.6,
              panelIsc: 14.0,
              panelVmp: 41.2,
              panelImp: 13.3,
              inverterBrand: 'Growatt',
              inverterModel: 'MIN 5000TL-X',
              inverterPower: 5000,
              inverterVmaxIn: 550,
              inverterVminIn: 100,
              inverterImaxIn: 13.5,
              inverterImaxOut: 22.7,
              inverterQuantity: 1,
              panelsPerString: 10,
              numberOfStrings: 1,
              dcWireGauge: '10 AWG',
              acWireGauge: '8 AWG',
              acBreakerCapacity: 30,
              mountingSolution: 'Coplanar sobre techo de losa',
            },
            files: {}
          }
        ]
      });
    }
  },

  addRequest: async (req) => {
    const id = uuidv4();
    const newReq: CFERequest = {
      ...req,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    set((state) => ({
      requests: [newReq, ...state.requests],
      activeRequestId: newReq.id
    }));

    try {
      const { error } = await supabase
        .from('cfe_requests')
        .insert([{
          id: newReq.id,
          status: newReq.status,
          client: newReq.client,
          location: newReq.location,
          carta_poder: newReq.cartaPoder,
          unifilar: newReq.unifilar,
          files: newReq.files,
          created_at: newReq.createdAt,
          updated_at: newReq.updatedAt
        }]);

      if (error) throw error;
    } catch (err) {
      console.warn('Could not save request to Supabase:', err);
    }
  },

  updateRequest: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      requests: state.requests.map((req) => 
        req.id === id ? { ...req, ...updates, updatedAt: new Date().toISOString() } : req
      )
    }));

    try {
      const currentReq = get().requests.find(r => r.id === id);
      if (!currentReq) return;

      const supabaseUpdates: any = {
        status: currentReq.status,
        client: currentReq.client,
        location: currentReq.location,
        carta_poder: currentReq.cartaPoder,
        unifilar: currentReq.unifilar,
        files: currentReq.files,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cfe_requests')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Could not update request in Supabase:', err);
    }
  },

  setActiveRequest: (id) => set({ activeRequestId: id }),

  deleteRequest: async (id) => {
    // Optimistic update
    set((state) => ({
      requests: state.requests.filter(req => req.id !== id),
      activeRequestId: state.activeRequestId === id ? null : state.activeRequestId
    }));

    try {
      const { error } = await supabase
        .from('cfe_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Could not delete request from Supabase:', err);
    }
  }
}));
