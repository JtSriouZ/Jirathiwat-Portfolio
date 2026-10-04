const LEAVES = [
  { x: 262, y: 17, r: -28 },
  { x: 271, y: 14, r: -18 },
  { x: 280, y: 13, r: -8 },
  { x: 262, y: 23, r: 28 },
  { x: 271, y: 26, r: 18 },
  { x: 280, y: 27, r: 8 },
];

export default function Ornament({ className = "" }) {
  return (
    <div className={`ornament-rule ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 600 40" preserveAspectRatio="xMidYMid meet" fill="none">
        <path d="M0 20H238" pathLength="1" />
        <path d="M362 20H600" pathLength="1" />
        <path d="M232 20l6-6 6 6-6 6z" pathLength="1" />
        <path d="M356 20l6-6 6 6-6 6z" pathLength="1" />
        <path d="M250 20h32M318 20h32" pathLength="1" />
        {LEAVES.map((leaf) => (
          <g key={`${leaf.x}-${leaf.y}`}>
            <ellipse cx={leaf.x} cy={leaf.y} rx="5" ry="2" transform={`rotate(${leaf.r} ${leaf.x} ${leaf.y})`} pathLength="1" />
            <ellipse
              cx={600 - leaf.x}
              cy={leaf.y}
              rx="5"
              ry="2"
              transform={`rotate(${-leaf.r} ${600 - leaf.x} ${leaf.y})`}
              pathLength="1"
            />
          </g>
        ))}
        <circle cx="300" cy="20" r="13" pathLength="1" />
        <circle cx="300" cy="20" r="3.5" pathLength="1" />
        {Array.from({ length: 8 }, (_, index) => (
          <ellipse
            key={index}
            cx="300"
            cy="12.5"
            rx="2.4"
            ry="5.5"
            transform={`rotate(${index * 45} 300 20)`}
            pathLength="1"
          />
        ))}
      </svg>
    </div>
  );
}
