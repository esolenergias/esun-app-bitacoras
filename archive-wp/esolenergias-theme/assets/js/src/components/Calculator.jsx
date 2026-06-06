import React, { useState, useMemo } from 'react';
import ROIGraph from './ROIGraph';

const Calculator = () => {
  const config = window.esolCalcData || { dacThreshold: 3000, kwhRegular: 1.5, kwhDac: 6.5, panelW: 550, sunHours: 5.2, installationCostPerW: 1.2 };
  
  const [bill, setBill] = useState(2500);

  const stats = useMemo(() => {
    const isDac = bill >= config.dacThreshold;
    const rate = isDac ? config.kwhDac : config.kwhRegular;
    const kwhPerMonth = bill / rate;
    const kwpNeeded = kwhPerMonth / (30 * config.sunHours);
    const panelsNeeded = Math.ceil((kwpNeeded * 1000) / config.panelW);
    const investment = kwpNeeded * 1000 * config.installationCostPerW;
    const monthlySaving = bill * 0.95; 
    const paybackYears = monthlySaving > 0 ? investment / (monthlySaving * 12) : 0;

    return { isDac, panelsNeeded, monthlySaving, paybackYears, investment };
  }, [bill, config]);

  return (
    <div className="calc-container" style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid var(--bgborder)', backdropFilter: 'blur(10px)' }}>
      <h3 style={{ fontFamily: 'var(--display-font)', color: 'var(--gold)', marginBottom: '1.5rem' }}>Calcula tu Ahorro Solar</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Tu Pago Mensual CFE: <strong style={{ color: 'var(--tx)' }}>${bill.toLocaleString()} MXN</strong></label>
          <input 
            type="range" 
            min="500" max="15000" step="100" 
            value={bill} 
            onChange={e => setBill(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }}
          />
          
          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block' }}>Paneles Sugeridos</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--tx)' }}>{stats.panelsNeeded}</strong>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block' }}>Ahorro Mensual</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--gold-light)' }}>${Math.round(stats.monthlySaving).toLocaleString()}</strong>
            </div>
          </div>
          
          {stats.isDac && (
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--gold)', background: 'rgba(196,152,37,0.1)', padding: '0.5rem', borderRadius: '0.4rem', textAlign: 'center' }}>
              ⚠️ Detectada Tarifa DAC (Alto Consumo). Tu ahorro será máximo.
            </p>
          )}
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.8rem', padding: '1.5rem', minHeight: '200px' }}>
          <ROIGraph investment={stats.investment} annualSaving={stats.monthlySaving * 12} />
        </div>
      </div>
    </div>
  );
};

export default Calculator;
