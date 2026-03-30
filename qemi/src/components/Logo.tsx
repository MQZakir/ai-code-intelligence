import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animate?: boolean;
  color?: string;
}

/**
 * QEMI Logo — a diamond (45° square) with the top-right corner notched,
 * creating a minimal geometric mark that reads as "Q" in abstraction.
 * Two weight lines cross through center — suggesting a debug crosshair.
 */
const Logo = ({ size = 32, animate = false, color = '#6366f1' }: LogoProps) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.38; // half-side of the rotated square

  // Diamond points: top, right, bottom, left — with top-right notched
  const notch = r * 0.38;
  // Standard diamond: top(cx,cy-r), right(cx+r,cy), bottom(cx,cy+r), left(cx-r,cy)
  // Notch top-right: instead of going straight from top to right,
  // we insert two points to cut the corner
  const pts = [
    [cx,        cy - r       ], // top
    [cx + r - notch, cy - r + notch * 0.1], // notch start (along top-right edge)
    [cx + r - notch * 0.1, cy - r + notch], // notch end
    [cx + r,    cy           ], // right
    [cx,        cy + r       ], // bottom
    [cx - r,    cy           ], // left
  ];
  const polygon = pts.map(p => p.join(',')).join(' ');

  // Small filled notch square to emphasize the cut corner
  const notchPts = [
    [cx + r - notch, cy - r + notch * 0.1],
    [cx + r,         cy - r + notch * 0.1 + (notch - notch * 0.1)],
    [cx + r - notch * 0.1, cy - r + notch],
    [cx + r - notch - notch * 0.05, cy - r + notch * 0.1 + notch * 0.4],
  ].map(p => p.join(',')).join(' ');

  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={animate ? { opacity: [1, 0.85, 1] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ flexShrink: 0 }}
    >
      {/* Main diamond outline */}
      <polygon
        points={polygon}
        fill="none"
        stroke={color}
        strokeWidth={s * 0.055}
        strokeLinejoin="miter"
      />

      {/* Notch fill — dark to show the cut */}
      <polygon
        points={notchPts}
        fill={color}
        opacity={0.9}
      />

      {/* Horizontal crosshair line — debug symbol */}
      <line
        x1={cx - r * 0.45}
        y1={cy}
        x2={cx + r * 0.45}
        y2={cy}
        stroke={color}
        strokeWidth={s * 0.04}
        opacity={0.5}
      />

      {/* Vertical crosshair line */}
      <line
        x1={cx}
        y1={cy - r * 0.45}
        x2={cx}
        y2={cy + r * 0.45}
        stroke={color}
        strokeWidth={s * 0.04}
        opacity={0.5}
      />

      {/* Center dot */}
      <circle
        cx={cx}
        cy={cy}
        r={s * 0.045}
        fill={color}
      />
    </motion.svg>
  );
};

export default Logo;