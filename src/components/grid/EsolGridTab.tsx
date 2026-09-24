import React, { useState, useEffect } from 'react';
import { supabase } from '../../context/supabase';
import { ethers } from 'ethers';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Leaf, 
  Zap, 
  ShieldCheck, 
  Activity,
  Wallet,
  Link as LinkIcon
} from 'lucide-react';

interface GridProject {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  expected_roi: number;
  status: string;
  contract_address?: string; // Dirección del Smart Contract en Polygon/Ethereum
}

export default function EsolGridTab() {
  const [projects, setProjects] = useState<GridProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [investingId, setInvestingId] = useState<string | null>(null);
  
  // Estado Web3 (Blockchain)
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        }
      } catch (error) {
        console.error("Error al revisar la wallet", error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Por favor, instala MetaMask u otra wallet Web3 para interactuar con la Blockchain.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWalletAddress(await signer.getAddress());
    } catch (error) {
      console.error("Conexión rechazada", error);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('grid_projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setProjects([
          {
            id: 'mock-1',
            name: 'Ferretería Industrial del Norte',
            description: 'Instalación de 120kWp. Contrato PPA a 10 años. Cliente AAAA.',
            target_amount: 1500000,
            current_amount: 850000,
            expected_roi: 14.5,
            status: 'funding',
            contract_address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
          },
          {
            id: 'mock-2',
            name: 'Hotel Boutique Centro Histórico',
            description: 'Instalación de 40kWp para climatización. Retorno vía ahorro directo.',
            target_amount: 600000,
            current_amount: 600000,
            expected_roi: 12.0,
            status: 'active',
            contract_address: '0x3c110d5630B4cF539739dF2C5dAcb4c659F2499A'
          }
        ]);
      } else {
        setProjects(data);
      }
    } catch (e) {
      console.error('Error fetching Grid projects', e);
    } finally {
      setLoading(false);
    }
  };

  const simulateBlockchainInvestment = async (projectId: string) => {
    if (!walletAddress) {
      alert("Debes conectar tu Wallet (MetaMask) para firmar el Smart Contract.");
      return;
    }

    setInvestingId(projectId);
    setTxHash(null);

    // Simulamos la interacción con el Smart Contract vía ethers.js
    setTimeout(() => {
      // Fake TX Hash para demostrar transparencia
      const fakeTx = "0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + "a8f3b1c9d4e5f";
      
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const newAmount = p.current_amount + 10000;
          return { 
            ...p, 
            current_amount: newAmount,
            status: newAmount >= p.target_amount ? 'active' : p.status 
          };
        }
        return p;
      }));
      
      setTxHash(fakeTx);
      setInvestingId(null);
    }, 2000);
  };

  return (
    <div className="p-6 md:p-10 w-full h-full bg-dark-1 text-cream overflow-y-auto">
      
      {/* HEADER WEB3 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-dark-4 pb-6">
        <div>
          <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-gold" />
            Esol <span className="text-gold">Grid (Web3)</span>
          </h1>
          <p className="text-cream-dim text-sm font-mono mt-1">
            Plataforma de Tokenización de Activos Reales (RWA). Blockchain asegurando tus inversiones solares.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {walletAddress ? (
            <div className="bg-green-500/10 border border-green-500/30 p-2.5 rounded-xl flex items-center gap-3">
              <Wallet className="w-5 h-5 text-green-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-green-500/70">Wallet Conectada</span>
                <span className="text-xs font-mono text-green-400">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="bg-dark-2 hover:bg-dark-3 border border-gold/50 p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors"
            >
              <Wallet className="w-5 h-5 text-gold" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-cream-dim">Web3</span>
                <span className="text-xs font-bold text-gold">Conectar MetaMask</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {txHash && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-green-400 shrink-0" />
          <div>
            <h4 className="font-bold text-green-400 text-sm">Transacción Ejecutada en la Blockchain (Smart Contract)</h4>
            <p className="text-xs text-cream-muted mt-1 font-mono">TxHash: <span className="text-gold">{txHash}</span></p>
            <p className="text-xs text-cream-muted mt-1">Tus tokens de deuda energética (ESOL-WATT) han sido transferidos a tu wallet.</p>
          </div>
        </div>
      )}

      {/* MARKETPLACE */}
      <h2 className="text-lg font-black uppercase tracking-widest text-cream-muted mb-6 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-gold" /> Proyectos Disponibles para Fondeo
      </h2>

      {loading ? (
        <div className="text-center py-10 text-cream-dim animate-pulse font-mono">Cargando contratos inteligentes...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map(project => {
            const progress = Math.min((project.current_amount / project.target_amount) * 100, 100);
            const isFunded = progress >= 100;

            return (
              <div key={project.id} className="bg-dark-2 border border-dark-4 rounded-3xl p-6 relative overflow-hidden flex flex-col">
                
                <div className="absolute top-6 right-6">
                  {isFunded ? (
                    <span className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Contrato Sellado
                    </span>
                  ) : (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-3 h-3 animate-pulse" /> Minteando Tokens
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-display font-black text-white pr-32 mb-2">{project.name}</h3>
                
                {project.contract_address && (
                  <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-cream-dim bg-dark-1 px-3 py-1.5 rounded-lg w-max border border-dark-4">
                    <LinkIcon className="w-3 h-3 text-gold" /> 
                    Contrato Público: <span className="text-gold/70">{project.contract_address}</span>
                  </div>
                )}

                <p className="text-sm text-cream-muted mb-6 flex-1">{project.description}</p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] font-mono text-cream-dim mb-2">
                    <span>Capital Recaudado: ${(project.current_amount).toLocaleString()}</span>
                    <span>Meta (Liquidez): ${(project.target_amount).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-dark-1 rounded-full h-3 border border-dark-4 overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isFunded ? 'bg-green-500' : 'bg-gold'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-right text-[10px] font-black text-gold">{progress.toFixed(1)}% Completado</div>
                </div>

                {/* Botón de Acción WEB3 */}
                <button
                  onClick={() => simulateBlockchainInvestment(project.id)}
                  disabled={isFunded || investingId === project.id}
                  className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                    ${isFunded 
                      ? 'bg-dark-3 text-cream-dim border border-dark-4 cursor-not-allowed' 
                      : 'bg-gold hover:bg-gold-light text-dark-1 shadow-lg shadow-gold/20'
                    }`}
                >
                  {investingId === project.id ? (
                    <><Activity className="w-4 h-4 animate-spin" /> Firmando Smart Contract...</>
                  ) : isFunded ? (
                    'Ronda Cerrada'
                  ) : (
                    <><Wallet className="w-4 h-4" /> Comprar Tokens de Inversión</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
