import { useCountUp } from '../hooks/useCountUp';

export function StatItem({ value, suffix, label, started, index }) {
  const count = useCountUp(value, 1800 + index * 200, started);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: started ? 1 : 0,
        transform: started ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${0.8 + index * 0.15}s, transform 0.6s ease ${0.8 + index * 0.15}s`,
      }}
    >
      <span
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2.8rem',
          color: '#E8C547',
          lineHeight: 1,
          letterSpacing: '0.04em',
        }}
      >
        {count}
        {suffix}
      </span>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.65rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          marginTop: '4px',
        }}
      >
        {label}
      </span>
    </div>
  );
}
