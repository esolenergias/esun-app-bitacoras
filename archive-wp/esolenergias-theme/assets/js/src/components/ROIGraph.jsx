import React from 'react';

const ROIGraph = ({ investment, annualSaving }) => {
  const years = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const data = years.map(y => (y * annualSaving) - investment);
  const maxVal = Math.max(...data.map(Math.abs), investment);
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem', textAlign: 'center' }}>Proyección de Retorno (10 años)</p>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', paddingBottom: '20px' }}>
        {data.map((val, i) => {
          const height = (Math.abs(val) / maxVal) * 80; // Scale to 80% max
          const isPositive = val >= 0;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: `${height}%`, 
                  background: isPositive ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  transition: 'height 0.4s ease'
                }} 
                title={`Año ${i+1}: $${Math.round(val).toLocaleString()}`}
              />
              <small style={{ fontSize: '0.6rem', marginTop: '4px', opacity: 0.5 }}>{i+1}y</small>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '0.7rem', textAlign: 'center', opacity: 0.5 }}>El sistema se paga en aprox. <strong style={{ color: 'var(--tx)' }}>{Math.ceil(investment / annualSaving)} años</strong></p>
    </div>
  );
};

export default ROIGraph;
