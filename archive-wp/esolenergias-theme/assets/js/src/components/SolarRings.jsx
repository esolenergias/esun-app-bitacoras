export function SolarRings() {
  return (
    <div
      style={{
        position: 'absolute',
        right: '-6%',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 'clamp(260px,42vw,620px)',
        height: 'clamp(260px,42vw,620px)',
        pointerEvents: 'none',
      }}
    >
      {/* Outer rotating ring with marker dots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(232,197,71,0.07)',
          animation: 'rotateSlow 55s linear infinite',
        }}
      >
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#E8C547',
              opacity: 0.22,
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateX(calc(clamp(130px, 21vw, 310px))) translateY(-50%)`,
            }}
          />
        ))}
      </div>

      {/* Middle counter-rotating ring */}
      <div
        style={{
          position: 'absolute',
          inset: '12%',
          borderRadius: '50%',
          border: '1px solid rgba(232,197,71,0.04)',
          animation: 'rotateSlow 38s linear infinite reverse',
        }}
      />

      {/* Inner gradient fill */}
      <div
        style={{
          position: 'absolute',
          inset: '28%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,197,71,0.06) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
