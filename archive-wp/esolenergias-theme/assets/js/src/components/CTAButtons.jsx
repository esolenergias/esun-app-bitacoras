export function CTAButtons({
  primaryText = 'Anteproyecto 3D',
  primaryHref = '#anteproyecto',
  secondaryText = 'Ver Catálogo',
  secondaryHref = '#productos',
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      <a
        href={primaryHref}
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg,#E8C547,#C9A227)',
          color: '#060C06',
          border: 'none',
          padding: '13px 28px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          textDecoration: 'none',
          clipPath: 'polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(232,197,71,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {primaryText}
      </a>

      <a
        href={secondaryHref}
        style={{
          display: 'inline-block',
          background: 'transparent',
          color: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(255,255,255,0.18)',
          padding: '12px 28px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 400,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          textDecoration: 'none',
          clipPath: 'polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(232,197,71,0.5)';
          e.currentTarget.style.color = '#E8C547';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
        }}
      >
        {secondaryText}
      </a>
    </div>
  );
}
