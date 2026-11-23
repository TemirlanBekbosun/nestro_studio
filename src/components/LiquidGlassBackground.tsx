export function LiquidGlassBackground() {
  return (
    <div className="liquid-glass-background" aria-hidden="true">
      <div className="liquid-orb liquid-orb-one" />
      <div className="liquid-orb liquid-orb-two" />
      <div className="liquid-orb liquid-orb-three" />
      <div className="liquid-arc liquid-arc-one" />
      <div className="liquid-arc liquid-arc-two" />
      <svg className="liquid-grid" viewBox="0 0 1440 900" fill="none">
        <defs>
          <linearGradient id="liquid-line" x1="0" y1="0" x2="1440" y2="900">
            <stop stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#C7CDCC" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-80 250C220 110 410 470 760 260C1060 80 1250 210 1520 90" stroke="url(#liquid-line)" />
        <path d="M-100 620C240 470 420 760 830 590C1130 465 1260 610 1540 430" stroke="url(#liquid-line)" />
        <circle cx="1120" cy="170" r="170" stroke="url(#liquid-line)" />
        <circle cx="1120" cy="170" r="230" stroke="url(#liquid-line)" />
      </svg>
      <div className="liquid-noise" />
    </div>
  );
}
