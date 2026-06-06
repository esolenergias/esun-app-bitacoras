export function ParticleSystem() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${(i * 37 + 5) % 95}%`,
    top: `${(i * 53 + 10) % 85}%`,
    animationDuration: `${4 + (i % 5) * 1.3}s`,
    animationDelay: `${(i * 0.38) % 3}s`,
    width: i % 3 === 0 ? '3px' : '2px',
    height: i % 3 === 0 ? '3px' : '2px',
  }));

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: '#E8C547',
            opacity: 0.4,
            animation: `floatUp linear infinite`,
            pointerEvents: 'none',
            ...p,
          }}
        />
      ))}
    </>
  );
}
