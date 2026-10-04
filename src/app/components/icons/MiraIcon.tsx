/**
 * MIRA icon system — original, hand-built SVG icons (no emoji, no icon library).
 * ─────────────────────────────────────────────────────────────────────────────
 * Rules every icon follows, so the set reads as one brand:
 *   • Grid     48×48 artboard; the glyph stays inside 5–43. Rendered on a soft
 *              rounded tile (44×44, r14) tinted from the icon's tone.
 *   • Outline  one ink colour (#1F2A5C), 2.2 stroke, round caps + joins.
 *   • Fill     flat brand colours — cobalt, yellow, coral, pink, green, cream —
 *              at most three per icon, plus white. No gradients, no 3D.
 *   • Detail   one short white highlight on the main shape; optional tiny
 *              sparkle as the playful accent.
 *   • Character "Miri" — a periwinkle blob with a sprout — carries every
 *              feeling/attitude answer (buddy-*), instead of emoji faces.
 * E-wallet / PayLater brands use <BrandBadge>: monogram tiles in a brand-hint
 * colour, never the companies' logos.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { ReactNode } from 'react';

export const MIRA_ICON_COLORS = {
  ink: '#1F2A5C',
  blue: '#2D4BFF',
  blueLt: '#9AACFF',
  blueSoft: '#E6EAFF',
  sky: '#BFE6FF',
  yellow: '#FFC83D',
  yellowLt: '#FFE08A',
  yellowSoft: '#FFF2CC',
  coral: '#FF7A59',
  coralSoft: '#FFE3D9',
  pink: '#FF8FB8',
  pinkSoft: '#FFE4EE',
  green: '#2EC27E',
  greenLt: '#8DE2B8',
  greenSoft: '#DAF4E7',
  cream: '#FFF6E9',
  white: '#FFFFFF',
} as const;

const C = MIRA_ICON_COLORS;

type Tone = 'blue' | 'yellow' | 'coral' | 'pink' | 'green' | 'cream';
const TILE: Record<Tone, string> = {
  blue: C.blueSoft, yellow: C.yellowSoft, coral: C.coralSoft,
  pink: C.pinkSoft, green: C.greenSoft, cream: C.cream,
};

/* ── Building blocks ─────────────────────────────────────────────────────── */

const NO = { stroke: 'none' } as const;

/** White highlight stroke on a shape's lit side. */
const Shine = ({ d }: { d: string }) => <path d={d} stroke={C.white} strokeWidth={2} opacity={0.9} />;

/** Four-point sparkle. */
const Spark = ({ x, y, s = 4, c = C.yellow }: { x: number; y: number; s?: number; c?: string }) => (
  <path d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`} fill={c} {...NO} />
);

const Dot = ({ x, y, r = 1.6, c = C.ink }: { x: number; y: number; r?: number; c?: string }) => <circle cx={x} cy={y} r={r} fill={c} {...NO} />;

const Coin = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <>
    <circle cx={x} cy={y} r={r} fill={C.yellow} />
    <circle cx={x} cy={y} r={r * 0.55} strokeWidth={1.6} />
  </>
);

function starPath(cx: number, cy: number, R: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 ? r : R;
    d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return d + 'Z';
}

/** Calendar page with a coloured header band. */
const Calendar = ({ head }: { head: string }) => (
  <>
    <rect x={10} y={12} width={28} height={26} rx={4} fill={C.white} />
    <path d="M10 20V16a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v4Z" fill={head} />
    <path d="M17 9v6M31 9v6" />
  </>
);

const Card = ({ x = 8, y = 14, fill = C.blue }: { x?: number; y?: number; fill?: string }) => (
  <>
    <rect x={x} y={y} width={30} height={20} rx={3.5} fill={fill} />
    <path d={`M${x + 1.1} ${y + 6.5}H${x + 28.9}`} strokeWidth={3.4} />
    <rect x={x + 4} y={y + 11} width={6.5} height={4.5} rx={1.2} fill={C.yellow} />
  </>
);

const Pot = () => (
  <>
    <path d="M15 28h18l-2 10H17Z" fill={C.coral} />
    <rect x={13} y={25} width={22} height={4.5} rx={2} fill={C.coral} />
  </>
);

/* ── Miri, the MIRA buddy ────────────────────────────────────────────────── */

type Mood = 'angel' | 'shrug' | 'sweat' | 'grimace' | 'worried' | 'meh' | 'happy' | 'strong' | 'think' | 'grandpa';

const Drop = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x} ${y}c-1.6 2.4-2.2 3.7-2.2 4.6a2.2 2.2 0 0 0 4.4 0c0-.9-.6-2.2-2.2-4.6Z`} fill={C.sky} strokeWidth={1.6} />
);

function Buddy({ mood }: { mood: Mood }) {
  const eyesDots = <><Dot x={19.5} y={24} r={1.8} /><Dot x={28.5} y={24} r={1.8} /></>;
  const eyesHappy = <path d="M17.6 24.6q1.9-2.6 3.8 0M26.6 24.6q1.9-2.6 3.8 0" />;
  const smile = <path d="M20 29.2q4 3.6 8 0" />;
  return (
    <>
      {/* arms behind the body */}
      {mood === 'shrug' && <path d="M12 28c-3-.6-4.6-2.8-5-6M36 28c3-.6 4.6-2.8 5-6" />}
      {mood === 'strong' && <>
        <path d="M12.5 29H8.2a1.8 1.8 0 0 1-1.8-1.8V22.5M35.5 29h4.3a1.8 1.8 0 0 0 1.8-1.8V22.5" strokeWidth={2.6} />
        <circle cx={6.4} cy={20.4} r={2.7} fill={C.blueLt} />
        <circle cx={41.6} cy={20.4} r={2.7} fill={C.blueLt} />
      </>}
      {/* sprout (or halo) */}
      {mood === 'angel'
        ? <ellipse cx={24} cy={8.5} rx={7.5} ry={2.3} stroke={C.yellow} strokeWidth={2.6} />
        : <>
            <path d="M24 13.5V9" />
            <path d="M24 10c0-3 2.6-4.6 5.6-4.2 0 3-2.6 4.6-5.6 4.2Z" fill={C.green} />
          </>}
      <path d="M24 13c8.6 0 13 4.6 13 12.2C37 32.8 32 37 24 37s-13-4.2-13-11.8C11 17.6 15.4 13 24 13Z" fill={C.blueLt} />
      <Shine d="M15.5 21.5q1.2-3.6 4.6-5" />
      {mood !== 'grimace' && mood !== 'worried' && (
        <><Dot x={15.8} y={28.6} r={2.1} c={C.pink} /><Dot x={32.2} y={28.6} r={2.1} c={C.pink} /></>
      )}

      {mood === 'angel' && <>{eyesHappy}{smile}</>}
      {mood === 'happy' && <>{eyesHappy}<path d="M19.5 28.4q4.5 5.6 9 0Z" fill={C.coral} /></>}
      {mood === 'strong' && <>{eyesHappy}{smile}<Spark x={11} y={10} s={3.2} /></>}
      {mood === 'meh' && <>{eyesDots}<path d="M20.5 30.4h7" /></>}
      {mood === 'shrug' && <>{eyesDots}<path d="M20 30.6q4-1.6 8 0" /><path d="M17.5 20.2l3.2-.8M30.5 20.2l-3.2-.8" /></>}
      {mood === 'sweat' && <>{eyesDots}{smile}<Drop x={34.5} y={13.5} /></>}
      {mood === 'grimace' && <>
        {eyesDots}
        <rect x={18.5} y={28} width={11} height={5} rx={2.5} fill={C.white} />
        <path d="M22.2 28.2v4.6M25.8 28.2v4.6" strokeWidth={1.4} />
      </>}
      {mood === 'worried' && <>
        {eyesDots}
        <path d="M17.2 20.6l4.2-1.4M30.8 20.6l-4.2-1.4" />
        <path d="M19.5 31.2q2.25-2 4.5 0t4.5 0" />
        <Drop x={35} y={14} />
      </>}
      {mood === 'think' && <>
        <Dot x={20.4} y={23} r={1.8} /><Dot x={29.4} y={23} r={1.8} />
        <circle cx={25} cy={30.2} r={1.6} fill={C.ink} {...NO} />
        <circle cx={36.5} cy={12} r={1.8} fill={C.white} strokeWidth={1.6} />
        <circle cx={40.5} cy={7.5} r={2.6} fill={C.white} strokeWidth={1.6} />
      </>}
      {mood === 'grandpa' && <>
        <circle cx={19.5} cy={24} r={3.4} fill={C.white} strokeWidth={1.8} />
        <circle cx={28.5} cy={24} r={3.4} fill={C.white} strokeWidth={1.8} />
        <path d="M22.9 24h2.2" strokeWidth={1.8} />
        <Dot x={19.5} y={24} r={1.2} /><Dot x={28.5} y={24} r={1.2} />
        <path d="M19 30.2q2.6-2.4 5 0 2.4-2.4 5 0-2.4 1.8-5 .4-2.6 1.4-5-.4Z" fill={C.white} strokeWidth={1.8} />
      </>}
    </>
  );
}

/* ── The set ─────────────────────────────────────────────────────────────── */

const ICONS = {
  /* money & income */
  cash: { tone: 'green', draw: () => <>
    <rect x={8} y={14} width={26} height={16} rx={3} fill={C.greenLt} />
    <rect x={12} y={19} width={26} height={16} rx={3} fill={C.green} />
    <circle cx={25} cy={27} r={3.6} fill={C.greenLt} />
    <Dot x={16} y={23} r={1.2} /><Dot x={34} y={31} r={1.2} />
    <Shine d="M15.5 22h4" />
    <Coin x={36} y={34} r={6.2} />
  </> },
  'calendar-coin': { tone: 'blue', draw: () => <>
    <Calendar head={C.blue} />
    <Coin x={24} y={29.5} r={5.5} />
  </> },
  'calendar-star': { tone: 'yellow', draw: () => <>
    <Calendar head={C.coral} />
    <path d={starPath(24, 29.5, 6.4, 3)} fill={C.yellow} />
  </> },
  'calendar-check': { tone: 'green', draw: () => <>
    <Calendar head={C.green} />
    <path d="M18.5 29l4 4 7.5-8" strokeWidth={2.8} />
  </> },
  'calendar-pin': { tone: 'coral', draw: () => <>
    <Calendar head={C.blue} />
    <rect x={14} y={24} width={4} height={4} rx={1} fill={C.blueSoft} {...NO} />
    <rect x={14} y={31} width={4} height={4} rx={1} fill={C.blueSoft} {...NO} />
    <path d="M29 38.5s-5.5-6-5.5-9.5a5.5 5.5 0 0 1 11 0c0 3.5-5.5 9.5-5.5 9.5Z" fill={C.coral} />
    <circle cx={29} cy={29} r={2} fill={C.white} />
  </> },
  laptop: { tone: 'blue', draw: () => <>
    <rect x={11} y={12} width={26} height={18} rx={3} fill={C.sky} />
    <path d="M7 32h34l-2.5 5h-29Z" fill={C.white} />
    <Coin x={24} y={21} r={4.6} />
    <Spark x={40} y={10} s={3.6} c={C.coral} />
  </> },
  'cycle-coin': { tone: 'pink', draw: () => <>
    <path d="M11.5 22A12.5 12.5 0 0 1 33 14" stroke={C.pink} strokeWidth={3.4} />
    <path d="M36.5 26A12.5 12.5 0 0 1 15 34" stroke={C.pink} strokeWidth={3.4} />
    <path d="M34.6 9.4l-.8 5.6-5.4-1.4Z" fill={C.pink} {...NO} />
    <path d="M13.4 38.6l.8-5.6 5.4 1.4Z" fill={C.pink} {...NO} />
    <Coin x={24} y={24} r={6.4} />
  </> },
  dice: { tone: 'pink', draw: () => <>
    <g transform="rotate(-10 24 24)">
      <rect x={11} y={11} width={26} height={26} rx={7} fill={C.white} />
      <Dot x={17.5} y={17.5} r={2.4} c={C.pink} /><Dot x={30.5} y={17.5} r={2.4} c={C.pink} />
      <Dot x={24} y={24} r={2.4} c={C.coral} />
      <Dot x={17.5} y={30.5} r={2.4} c={C.pink} /><Dot x={30.5} y={30.5} r={2.4} c={C.pink} />
    </g>
    <path d="M40 31.5h3M41 36h2.2" />
  </> },
  'coin-drops': { tone: 'yellow', draw: () => <>
    <path d="M17.5 19.5l3 2.6M27.6 29.4l2.6 2.2" strokeDasharray="1 3.2" />
    <Coin x={14} y={14} r={4.4} />
    <Coin x={24} y={24.5} r={5.4} />
    <Coin x={34.5} y={35} r={6.4} />
  </> },

  /* home & obligations */
  house: { tone: 'coral', draw: () => <>
    <rect x={30} y={11} width={4.5} height={8} rx={1} fill={C.coral} />
    <rect x={12} y={22} width={24} height={16} rx={2} fill={C.white} />
    <path d="M8.5 24.5L24 11l15.5 13.5" fill={C.coral} />
    <rect x={20.5} y={29} width={7} height={9} rx={1.6} fill={C.blue} />
    <rect x={29.5} y={26} width={4.5} height={4.5} rx={1} fill={C.sky} />
  </> },
  'dream-house': { tone: 'pink', draw: () => <>
    <rect x={12} y={22} width={24} height={16} rx={2} fill={C.white} />
    <path d="M8.5 24.5L24 11l15.5 13.5" fill={C.blue} />
    <path d="M24 35c-4.6-3.2-6-5.4-6-7.4a3.1 3.1 0 0 1 6-1.2 3.1 3.1 0 0 1 6 1.2c0 2-1.4 4.2-6 7.4Z" fill={C.pink} />
    <Spark x={40} y={9} s={3.8} />
    <Spark x={8} y={13} s={2.6} c={C.pink} />
  </> },
  bulb: { tone: 'yellow', draw: () => <>
    <path d="M10 13l-2.6-1.8M38 13l2.6-1.8M8.5 22H5M39.5 22H43M24 5.5V3" stroke={C.coral} strokeWidth={2.4} />
    <path d="M24 9a10.5 10.5 0 0 0-6.2 19c1.2.9 2 2.2 2 3.6h8.4c0-1.4.8-2.7 2-3.6A10.5 10.5 0 0 0 24 9Z" fill={C.yellow} />
    <rect x={19.6} y={31.5} width={8.8} height={6} rx={2} fill={C.blueLt} />
    <path d="M20 34.5h8" strokeWidth={1.6} />
    <path d="M21.2 22.5l2.8 3.2 2.8-3.2" strokeWidth={1.8} />
    <Shine d="M18.6 17.6a6.4 6.4 0 0 1 3.6-3.4" />
  </> },
  scooter: { tone: 'blue', draw: () => <>
    <path d="M30 31l3-15M30.5 16h5.5" />
    <path d="M8.5 31c0-4.5 3-7 8-7h9.5l4 7Z" fill={C.blue} />
    <rect x={11.5} y={19.5} width={11} height={4} rx={2} fill={C.coral} />
    <circle cx={34.6} cy={19.6} r={2} fill={C.yellow} />
    <circle cx={14} cy={33} r={4.6} fill={C.white} />
    <circle cx={34} cy={33} r={4.6} fill={C.white} />
    <Dot x={14} y={33} r={1.5} /><Dot x={34} y={33} r={1.5} />
    <Shine d="M12.5 27.5q1-1.6 3.5-1.9" />
  </> },
  shield: { tone: 'blue', draw: () => <>
    <path d="M24 8l12 4.5V22c0 8-5.5 13.5-12 16.5C17.5 35.5 12 30 12 22v-9.5Z" fill={C.blue} />
    <path d="M24 29.5c-4.8-3.4-6.4-5.8-6.4-7.8a3.3 3.3 0 0 1 6.4-1.1 3.3 3.3 0 0 1 6.4 1.1c0 2-1.6 4.4-6.4 7.8Z" fill={C.pink} />
    <Shine d="M15.6 14.8v5" />
  </> },
  'card-clock': { tone: 'pink', draw: () => <>
    <Card x={6} y={11} />
    <circle cx={34} cy={32} r={7.5} fill={C.white} />
    <path d="M34 28.2V32l2.8 1.8" />
  </> },
  family: { tone: 'yellow', draw: () => <>
    <path d="M7.5 37v-5.5a7 7 0 0 1 14 0V37Z" fill={C.blue} />
    <circle cx={14.5} cy={17} r={5.2} fill={C.blueLt} />
    <path d="M26.5 37v-5.5a7 7 0 0 1 14 0V37Z" fill={C.coral} />
    <circle cx={33.5} cy={17} r={5.2} fill={C.pink} />
    <path d="M18.5 39v-3.5a5.5 5.5 0 0 1 11 0V39Z" fill={C.green} />
    <circle cx={24} cy={26} r={4.4} fill={C.yellow} />
    <Dot x={12.8} y={17} r={1.1} /><Dot x={16.2} y={17} r={1.1} />
    <Dot x={31.8} y={17} r={1.1} /><Dot x={35.2} y={17} r={1.1} />
    <Dot x={22.6} y={26} r={1} /><Dot x={25.4} y={26} r={1} />
  </> },

  /* spending */
  noodles: { tone: 'coral', draw: () => <>
    <path d="M27 8l9 13M31.5 7l8 12" strokeWidth={2.4} />
    <path d="M12 24c0-4 3-5 5-3 1-3 5-3 6 0 2-3 6-3 7 0 2-2 6-1 6 3" fill={C.yellow} />
    <path d="M8.5 24h31c0 8-6.6 13.5-15.5 13.5S8.5 32 8.5 24Z" fill={C.coral} />
    <Shine d="M13.5 28.5q1.5 3 4.5 4.4" />
  </> },
  'iced-drink': { tone: 'yellow', draw: () => <>
    <path d="M26 15l3.6-9.5 3 1-3 8.5" fill={C.pink} />
    <path d="M14.5 18h19l-2.4 20H16.9Z" fill={C.white} />
    <path d="M15.4 25.5h17.2l-1.5 12.5H16.9Z" fill={C.yellow} />
    <rect x={12.5} y={14} width={23} height={4.5} rx={2.2} fill={C.blue} />
    <Dot x={20} y={34.5} r={1.6} /><Dot x={24.5} y={35.5} r={1.6} /><Dot x={28.5} y={34} r={1.6} />
    <Shine d="M17.6 21.6l.8 9" />
  </> },
  'shopping-bag': { tone: 'pink', draw: () => <>
    <path d="M18.5 17v-3a5.5 5.5 0 0 1 11 0v3" />
    <path d="M11.5 17h25l1.8 21H9.7Z" fill={C.pink} />
    <path d="M24 31c-3.6-2.4-4.6-4.2-4.6-5.6a2.4 2.4 0 0 1 4.6-.9 2.4 2.4 0 0 1 4.6.9c0 1.4-1 3.2-4.6 5.6Z" fill={C.white} />
    <path d="M32 29.5l8.5 4-3.6 1.4-1.6 3.6Z" fill={C.blue} />
  </> },
  'leaky-wallet': { tone: 'blue', draw: () => <>
    <rect x={8} y={12} width={30} height={21} rx={4.5} fill={C.blue} />
    <path d="M29 18h11v9H29a4.5 4.5 0 0 1 0-9Z" fill={C.blueLt} />
    <Dot x={30} y={22.5} r={1.6} />
    <Shine d="M12 16.5h6" />
    <circle cx={15} cy={38} r={2.4} fill={C.yellow} strokeWidth={1.6} />
    <circle cx={22} cy={42} r={1.9} fill={C.yellow} strokeWidth={1.6} />
    <path d="M15 33.8v.8M22 37v1" strokeDasharray="0.5 2" />
  </> },
  cart: { tone: 'coral', draw: () => <>
    <rect x={18} y={10} width={7} height={7} rx={1.5} fill={C.yellow} />
    <rect x={26.5} y={12.5} width={6.5} height={4.5} rx={1.4} fill={C.pink} />
    <path d="M7 11h4.5l4 19h20" />
    <path d="M13 17h26l-3 11H15.4Z" fill={C.coral} />
    <circle cx={18} cy={35} r={2.6} fill={C.ink} {...NO} />
    <circle cx={32} cy={35} r={2.6} fill={C.ink} {...NO} />
    <Spark x={41} y={8.5} s={3.8} />
  </> },

  /* saving & goals */
  scale: { tone: 'blue', draw: () => <>
    <path d="M24 11v25M16 38h16M9.5 14.5h29" />
    <path d="M9.5 14.5L5.5 25M9.5 14.5l4 10.5M38.5 14.5L34.5 25M38.5 14.5l4 10.5" strokeWidth={1.8} />
    <path d="M4.5 25h10a5 5 0 0 1-10 0Z" fill={C.coral} />
    <path d="M33.5 25h10a5 5 0 0 1-10 0Z" fill={C.green} />
    <circle cx={24} cy={10.5} r={2.4} fill={C.yellow} />
  </> },
  target: { tone: 'coral', draw: () => <>
    <circle cx={21} cy={27} r={13} fill={C.coral} />
    <circle cx={21} cy={27} r={8.4} fill={C.white} />
    <circle cx={21} cy={27} r={3.9} fill={C.coral} />
    <path d="M21 27L38 10" strokeWidth={2.4} />
    <path d="M35.5 7.5l5.5-.5-.5 5.5-3-2Z" fill={C.blue} />
  </> },
  siren: { tone: 'coral', draw: () => <>
    <path d="M24 4.5V8M10.5 10.5l2.4 2.4M37.5 10.5l-2.4 2.4M6 21h3.4M42 21h-3.4" stroke={C.yellow} strokeWidth={2.8} />
    <path d="M14 30v-8a10 10 0 0 1 20 0v8Z" fill={C.coral} />
    <rect x={10.5} y={30} width={27} height={6.5} rx={2.4} fill={C.blue} />
    <Shine d="M18.4 22.4a6 6 0 0 1 4-5" />
  </> },
  car: { tone: 'blue', draw: () => <>
    <path d="M6.5 30v-5c0-1.6 1-2.6 2.6-3l4.9-1.2 4-5.4c.9-1.1 2-1.6 3.4-1.6H29c1.4 0 2.6.7 3.3 1.8l3.2 5.2 3.6 1c1.4.4 2.4 1.6 2.4 3V30Z" fill={C.blue} />
    <path d="M19.5 21l2.6-4.6H27V21ZM29.5 21v-4.6h.9l2.4 4.6Z" fill={C.sky} />
    <rect x={37} y={24.4} width={3} height={2.6} rx={1} fill={C.yellow} {...NO} />
    <circle cx={15} cy={31} r={4.4} fill={C.white} />
    <circle cx={33} cy={31} r={4.4} fill={C.white} />
    <Dot x={15} y={31} r={1.5} /><Dot x={33} y={31} r={1.5} />
  </> },
  ring: { tone: 'yellow', draw: () => <>
    <path fillRule="evenodd" d="M14.5 29.5a9.5 9.5 0 1 0 19 0 9.5 9.5 0 1 0-19 0ZM18.2 29.5a5.8 5.8 0 1 0 11.6 0 5.8 5.8 0 1 0-11.6 0Z" fill={C.yellow} />
    <path d="M18.5 14.5l3-4h5l3 4-5.5 6.5Z" fill={C.sky} />
    <path d="M18.5 14.5h11M22.5 10.5l1.5 4" strokeWidth={1.6} />
    <Spark x={37} y={11} s={3.4} c={C.pink} />
    <Spark x={11} y={16} s={2.4} c={C.pink} />
  </> },
  'grad-cap': { tone: 'blue', draw: () => <>
    <path d="M14 22.5V30c0 3 5 5 10 5s10-2 10-5v-7.5L24 27Z" fill={C.blueLt} />
    <path d="M5 19L24 11l19 8-19 8Z" fill={C.blue} />
    <path d="M24 19l12 3.4V31" strokeWidth={1.8} />
    <circle cx={36} cy={32.5} r={2.2} fill={C.yellow} />
    <circle cx={24} cy={19} r={1.6} fill={C.yellow} />
  </> },
  plane: { tone: 'blue', draw: () => <>
    <path d="M7 38.5a3.2 3.2 0 0 1 5.6-2.2 4 4 0 0 1 7.2 1.2c1.6 0 2.4 1 2.4 2H7Z" fill={C.white} strokeWidth={1.8} />
    <g transform="rotate(-28 25 22)">
      <path d="M20 19l-5-9.5h4.6L28 19Z" fill={C.blue} />
      <path d="M20 25l-5 9.5h4.6L28 25Z" fill={C.blue} />
      <path d="M8 22c0-2 1.5-3 4-3h24c3.5 0 6 1.5 6 3s-2.5 3-6 3H12c-2.5 0-4-1-4-3Z" fill={C.white} />
      <path d="M10 19l-2-5.5h3l4 5.5Z" fill={C.coral} />
      <Dot x={30} y={22} r={1.1} c={C.blue} /><Dot x={34} y={22} r={1.1} c={C.blue} />
    </g>
  </> },
  shop: { tone: 'coral', draw: () => <>
    <rect x={10} y={19} width={28} height={19} rx={1.5} fill={C.white} />
    <path d="M8 19l3-8.5h26l3 8.5Z" fill={C.coral} />
    <path d="M17.5 10.5l-1.5 8.5M24 10.5v8.5M30.5 10.5l1.5 8.5" strokeWidth={1.8} />
    <rect x={14.5} y={26} width={7.5} height={12} rx={1.4} fill={C.blue} />
    <rect x={25.5} y={25} width={9} height={7} rx={1.4} fill={C.sky} />
  </> },
  gadget: { tone: 'pink', draw: () => <>
    <rect x={15} y={7} width={18} height={33} rx={4.2} fill={C.blue} />
    <rect x={18} y={11} width={12} height={23} rx={1.6} fill={C.white} {...NO} />
    <path d="M24 26.8c-3.4-2.3-4.4-4-4.4-5.3a2.3 2.3 0 0 1 4.4-.8 2.3 2.3 0 0 1 4.4.8c0 1.3-1 3-4.4 5.3Z" fill={C.pink} />
    <Dot x={24} y={37} r={1.3} c={C.white} />
    <Spark x={39} y={12} s={3.8} />
    <Spark x={9} y={30} s={2.6} c={C.coral} />
  </> },
  'empty-jar': { tone: 'cream', draw: () => <>
    <path d="M14 16h20v18.5c0 2.5-2 4-4.5 4h-11c-2.5 0-4.5-1.5-4.5-4Z" fill={C.white} />
    <rect x={12.5} y={10} width={23} height={6.5} rx={2.2} fill={C.coral} />
    <circle cx={24} cy={28} r={4.6} strokeDasharray="2.2 2.6" strokeWidth={1.8} />
    <Shine d="M17.5 20v9" />
  </> },

  /* investing */
  growth: { tone: 'green', draw: () => <>
    <rect x={9} y={29} width={7} height={9} rx={1.6} fill={C.blueLt} />
    <rect x={19} y={24} width={7} height={14} rx={1.6} fill={C.blue} />
    <rect x={29} y={18} width={7} height={20} rx={1.6} fill={C.green} />
    <path d="M8 22l8-7 6 4 13-10.5" strokeWidth={2.4} />
    <path d="M29.5 8.5H35V14" strokeWidth={2.4} />
  </> },
  seed: { tone: 'cream', draw: () => <>
    <Pot />
    <ellipse cx={24} cy={21.5} rx={4} ry={3} fill={C.yellow} />
    <path d="M30 12h4l-4 4h4M36 6.5h3l-3 3h3" stroke={C.blue} strokeWidth={1.8} />
  </> },
  sprout: { tone: 'green', draw: () => <>
    <path d="M24 25v-9" />
    <path d="M24 18c-1-4.5-4.5-6.5-9-6 .4 4.4 4 6.8 9 6Z" fill={C.green} />
    <path d="M24 15.5c1-4.5 4.5-6.5 9-6-.4 4.4-4 6.8-9 6Z" fill={C.greenLt} />
    <Pot />
  </> },
  'coin-tree': { tone: 'green', draw: () => <>
    <path d="M24 25v-5" strokeWidth={2.6} />
    <circle cx={24} cy={14.5} r={9.5} fill={C.green} />
    <Coin x={20} y={13} r={2.8} />
    <Coin x={28.5} y={12} r={2.8} />
    <Coin x={24.5} y={19.5} r={2.8} />
    <Pot />
  </> },
  briefcase: { tone: 'blue', draw: () => <>
    <path d="M18 16v-3.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V16" />
    <rect x={8} y={16} width={32} height={21} rx={4} fill={C.blue} />
    <path d="M8.6 25.5h30.8" strokeWidth={1.8} />
    <rect x={21} y={23} width={6} height={5} rx={1.2} fill={C.yellow} />
    <Shine d="M12 20h5" />
  </> },
  pie: { tone: 'blue', draw: () => <>
    <path d="M25 27V14a13 13 0 0 1 11.26 19.5Z" fill={C.blue} />
    <path d="M25 27l11.26 6.5A13 13 0 0 1 18.5 38.26Z" fill={C.pink} />
    <path d="M25 27l-6.5 11.26A13 13 0 0 1 12 27Z" fill={C.blueLt} />
    <path d="M22 24H9a13 13 0 0 1 13-13Z" fill={C.yellow} />
  </> },
  candles: { tone: 'green', draw: () => <>
    <path d="M15 12v24M24 18v20M33 6v24" />
    <rect x={12} y={16} width={6} height={13} rx={1.4} fill={C.green} />
    <rect x={21} y={22} width={6} height={11} rx={1.4} fill={C.coral} />
    <rect x={30} y={10} width={6} height={15} rx={1.4} fill={C.green} />
    <Spark x={41} y={9} s={3.2} />
  </> },
  gold: { tone: 'yellow', draw: () => <>
    <path d="M7 38l3-8.5h11.5L24.5 38Z" fill={C.yellow} />
    <path d="M23.5 38l3-8.5H38L41 38Z" fill={C.yellow} />
    <path d="M15.5 29.5l3-8.5H30l3 8.5Z" fill={C.yellowLt} />
    <Shine d="M20.5 23.5h6" />
    <Spark x={36} y={13} s={4} c={C.coral} />
    <Spark x={11} y={17} s={2.6} c={C.coral} />
  </> },
  crypto: { tone: 'coral', draw: () => <>
    <path d="M24 9.5l12.6 7.3v14.4L24 38.5l-12.6-7.3V16.8Z" fill={C.coral} />
    <path d="M24 16l6.9 4v8L24 32l-6.9-4v-8Z" fill={C.white} />
    <path d="M24 24v-8M24 24l6.9 4M24 24l-6.9 4" strokeWidth={1.6} />
    <Dot x={24} y={24} r={2} c={C.blue} />
  </> },
  building: { tone: 'blue', draw: () => <>
    <rect x={28} y={18} width={11} height={20} rx={1.4} fill={C.blueLt} />
    <rect x={12} y={8} width={17} height={30} rx={1.6} fill={C.blue} />
    {[12.5, 18.5, 24.5].map((y) => (
      <g key={y}>
        <rect x={15.5} y={y} width={3.6} height={3.6} rx={0.8} fill={C.sky} {...NO} />
        <rect x={22} y={y} width={3.6} height={3.6} rx={0.8} fill={C.yellow} {...NO} />
      </g>
    ))}
    <rect x={18.2} y={31} width={4.6} height={7} rx={1} fill={C.yellow} />
    <path d="M7 38h34" />
  </> },
  'empty-box': { tone: 'cream', draw: () => <>
    <path d="M9 20l15 6v13L9 33Z" fill={C.yellow} />
    <path d="M24 26l15-6v13l-15 6Z" fill={C.yellowLt} />
    <path d="M9 20l15-6 15 6-15 6Z" fill={C.coralSoft} />
    <path d="M9 20l-3.5-5.5L20.5 9 24 14M39 20l3.5-5.5L27.5 9 24 14" fill={C.yellowLt} />
  </> },

  /* debt & credit */
  card: { tone: 'blue', draw: () => <>
    <Card />
    <Shine d="M30 28.5h4" />
    <Spark x={41} y={11} s={3.4} />
  </> },
  'card-zzz': { tone: 'green', draw: () => <>
    <Card y={18} fill={C.blueLt} />
    <path d="M29 8h4.5l-4.5 4.5h4.5M36.5 4h3l-3 3h3" stroke={C.blue} strokeWidth={1.9} />
  </> },
  'card-shield': { tone: 'green', draw: () => <>
    <Card x={5} y={10} />
    <path d="M34 22l7 2.6v5.2c0 4.5-3.2 7.6-7 9.2-3.8-1.6-7-4.7-7-9.2v-5.2Z" fill={C.green} />
    <path d="M30.8 30.4l2.4 2.4 4.2-4.6" stroke={C.white} strokeWidth={2.2} />
  </> },
  'card-stack': { tone: 'coral', draw: () => <>
    <rect x={14} y={7} width={28} height={18} rx={3.4} fill={C.pink} />
    <rect x={10} y={13} width={28} height={18} rx={3.4} fill={C.coral} />
    <Card x={6} y={19} />
    <Drop x={41} y={30} />
  </> },
  feather: { tone: 'green', draw: () => <>
    <path d="M36 8C25 9.5 14.5 19.5 13.5 33.5 25 33 35 23.5 36 8Z" fill={C.green} />
    <path d="M10.5 38.5L31 14" />
    <path d="M18 27.5l5.5.5M21.5 23l5 .2M25.5 18.5l4-.2" stroke={C.white} strokeWidth={1.6} />
    <Spark x={40} y={22} s={2.8} c={C.yellow} />
  </> },
  kettlebell: { tone: 'coral', draw: () => <>
    <path d="M17.5 19c-1-7 2.4-10 6.5-10s7.5 3 6.5 10" strokeWidth={3.4} />
    <path d="M17.5 19c-1-7 2.4-10 6.5-10s7.5 3 6.5 10" stroke={C.coral} strokeWidth={1.2} />
    <circle cx={24} cy={28} r={11} fill={C.coral} />
    <Shine d="M16.5 25a8 8 0 0 1 4-4.6" />
    <path d="M8 39.5h32" />
  </> },
  bank: { tone: 'blue', draw: () => <>
    <path d="M7 17.5L24 8l17 9.5Z" fill={C.blue} />
    <rect x={9} y={17.5} width={30} height={3.6} rx={1} fill={C.blueLt} />
    <rect x={12} y={21} width={4} height={13} fill={C.white} />
    <rect x={22} y={21} width={4} height={13} fill={C.white} />
    <rect x={32} y={21} width={4} height={13} fill={C.white} />
    <rect x={7.5} y={34} width={33} height={4.5} rx={1.2} fill={C.blue} />
    <circle cx={24} cy={13.6} r={2.3} fill={C.yellow} />
  </> },
  'bank-syariah': { tone: 'green', draw: () => <>
    <path d="M24 10.5V8" strokeWidth={1.8} />
    <path d="M25.6 1.8a3.4 3.4 0 1 0 1.2 5.6 4.2 4.2 0 0 1-1.2-5.6Z" fill={C.yellow} strokeWidth={1.5} />
    <path d="M11 18.5c0-6 5.6-8.5 13-8.5s13 2.5 13 8.5Z" fill={C.green} />
    <rect x={9} y={18.5} width={30} height={3.6} rx={1} fill={C.greenLt} />
    <rect x={12} y={22} width={4} height={12} fill={C.white} />
    <rect x={22} y={22} width={4} height={12} fill={C.white} />
    <rect x={32} y={22} width={4} height={12} fill={C.white} />
    <rect x={7.5} y={34} width={33} height={4.5} rx={1.2} fill={C.green} />
  </> },
  'bank-digital': { tone: 'blue', draw: () => <>
    <rect x={14} y={6} width={20} height={36} rx={4.4} fill={C.blue} />
    <rect x={17} y={10} width={14} height={26} rx={1.6} fill={C.white} {...NO} />
    <path d="M18.6 20.5L24 16.5l5.4 4Z" fill={C.blue} strokeWidth={1.6} />
    <path d="M20.2 22v6.5M24 22v6.5M27.8 22v6.5M18.6 30h10.8" strokeWidth={1.6} />
    <Dot x={24} y={39} r={1.2} c={C.white} />
    <Spark x={39} y={10} s={3.4} />
  </> },
  'phone-wallet': { tone: 'blue', draw: () => <>
    <rect x={9} y={6} width={20} height={34} rx={4.2} fill={C.blueLt} />
    <rect x={12} y={10} width={14} height={20} rx={1.6} fill={C.white} {...NO} />
    <Coin x={27} y={22} r={3.8} />
    <rect x={19} y={23} width={22} height={16} rx={3.6} fill={C.blue} />
    <path d="M32 27.5h9v7h-9a3.5 3.5 0 0 1 0-7Z" fill={C.blueLt} />
    <Dot x={33} y={31} r={1.3} />
  </> },
  plus: { tone: 'cream', draw: () => <>
    <rect x={10} y={10} width={28} height={28} rx={9} fill={C.white} strokeDasharray="3.4 3" />
    <path d="M24 17.5v13M17.5 24h13" stroke={C.blue} strokeWidth={3.2} />
  </> },
  ranking: { tone: 'yellow', draw: () => <>
    <rect x={7.5} y={25} width={11} height={13} rx={1.6} fill={C.blueLt} />
    <rect x={18.5} y={19} width={11} height={19} rx={1.6} fill={C.blue} />
    <rect x={29.5} y={29} width={11} height={9} rx={1.6} fill={C.coral} />
    <path d={starPath(24, 11.5, 5.4, 2.5)} fill={C.yellow} />
  </> },

  duo: { tone: 'pink', draw: () => <>
    <path d="M24 13.5c-2.6-1.8-3.4-3.2-3.4-4.3a1.9 1.9 0 0 1 3.4-.7 1.9 1.9 0 0 1 3.4.7c0 1.1-.8 2.5-3.4 4.3Z" fill={C.coral} strokeWidth={1.6} />
    <path d="M16 17c5.4 0 8.2 3.2 8.2 8.8 0 5.6-3.4 8.8-8.2 8.8s-8.2-3.2-8.2-8.8c0-5.6 2.8-8.8 8.2-8.8Z" fill={C.blueLt} />
    <path d="M32 17c5.4 0 8.2 3.2 8.2 8.8 0 5.6-3.4 8.8-8.2 8.8s-8.2-3.2-8.2-8.8c0-5.6 2.8-8.8 8.2-8.8Z" fill={C.pink} />
    <Dot x={13.8} y={25} r={1.4} /><Dot x={18.2} y={25} r={1.4} />
    <Dot x={29.8} y={25} r={1.4} /><Dot x={34.2} y={25} r={1.4} />
    <path d="M14 28.8q2 1.8 4 0M30 28.8q2 1.8 4 0" />
  </> },
  tag: { tone: 'pink', draw: () => <>
    <path d="M8.5 25.5L24 10h13a2 2 0 0 1 2 2v13L23.5 40.5a2 2 0 0 1-2.8 0L8.5 28.3a2 2 0 0 1 0-2.8Z" fill={C.pink} />
    <circle cx={32} cy={17} r={2.6} fill={C.white} />
    <path d="M18 26.5l6.5 6.5M21.5 23l6.5 6.5" stroke={C.white} strokeWidth={2} />
    <path d="M34 14.5c3-4 6.5-5 8-3.5" strokeWidth={1.8} />
  </> },

  /* status & results */
  'check-badge': { tone: 'green', draw: () => <>
    <circle cx={24} cy={24} r={13.5} fill={C.green} />
    <path d="M17.8 24.5l4.3 4.3 8.2-8.6" stroke={C.white} strokeWidth={3.2} />
    <Shine d="M14.6 19.4a10 10 0 0 1 3.4-4.2" />
  </> },
  warn: { tone: 'yellow', draw: () => <>
    <path d="M24 8.5l16 28.5H8Z" fill={C.yellow} strokeWidth={2.4} />
    <path d="M24 19v8" strokeWidth={2.8} />
    <Dot x={24} y={31.6} r={1.8} />
  </> },
  alert: { tone: 'coral', draw: () => <>
    <circle cx={24} cy={24} r={13.5} fill={C.coral} />
    <path d="M24 16.5v9" stroke={C.white} strokeWidth={3.2} />
    <Dot x={24} y={31} r={2} c={C.white} />
  </> },
  gem: { tone: 'blue', draw: () => <>
    <path d="M10.5 18.5L17 10h14l6.5 8.5L24 38.5Z" fill={C.blueLt} />
    <path d="M10.5 18.5h27" />
    <path d="M17 10l3.5 8.5L24 38.5 27.5 18.5 31 10" strokeWidth={1.7} />
    <path d="M17.5 10h13l-2.5 8.5h-8Z" fill={C.sky} strokeWidth={1.7} />
    <Spark x={40} y={9} s={3.6} c={C.yellow} />
  </> },
  trophy: { tone: 'yellow', draw: () => <>
    <path d="M16 12h-4.5v2.5c0 3.6 2 5.8 5 6.2M32 12h4.5v2.5c0 3.6-2 5.8-5 6.2" />
    <path d="M16 9h16v8c0 5.5-3.5 9-8 9s-8-3.5-8-9Z" fill={C.yellow} />
    <rect x={22} y={26} width={4} height={5} fill={C.yellow} />
    <rect x={16} y={31} width={16} height={6.5} rx={1.6} fill={C.blue} />
    <Shine d="M19.6 13v4.4" />
    <Spark x={40} y={26} s={3} c={C.pink} />
  </> },
  'money-bag': { tone: 'yellow', draw: () => <>
    <path d="M17 15c-4 4-8 9.5-8 15.5S15 39 24 39s15-2.5 15-8.5S35 19 31 15Z" fill={C.yellow} />
    <path d="M18 15l-3-6.5c4 1.4 6 0 9-1 3 1 5 2.4 9 1L30 15Z" fill={C.yellowLt} />
    <path d="M17.5 15h13" strokeWidth={2.6} />
    <circle cx={24} cy={28} r={5.2} fill={C.white} strokeWidth={1.8} />
    <path d="M24 25.2v5.6" strokeWidth={1.8} />
  </> },
  piggy: { tone: 'pink', draw: () => <>
    <path d="M14.5 33v4.5M29 33.5v4" strokeWidth={3.4} />
    <path d="M17 18.5l1.4-6 4.6 4" fill={C.pink} />
    <ellipse cx={23} cy={26} rx={13.5} ry={10} fill={C.pink} />
    <ellipse cx={36.5} cy={26.5} rx={3.2} ry={3.8} fill={C.pinkSoft} />
    <Dot x={35.6} y={26} r={0.9} /><Dot x={37.6} y={26} r={0.9} />
    <Dot x={29.5} y={22} r={1.4} />
    <path d="M19 18.5h7" strokeWidth={2.4} />
    <Coin x={22.5} y={10} r={3.6} />
    <path d="M9.6 24.5q-3-.4-3 2.4" />
  </> },
  chat: { tone: 'blue', draw: () => <>
    <path d="M9 14a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H20l-7 6v-6a5 5 0 0 1-4-5Z" fill={C.blue} />
    <Dot x={17} y={20.5} r={2} c={C.white} /><Dot x={24} y={20.5} r={2} c={C.white} /><Dot x={31} y={20.5} r={2} c={C.white} />
  </> },
  report: { tone: 'green', draw: () => <>
    <path d="M12 7.5h17l7 7v25.5H12Z" fill={C.white} />
    <path d="M29 7.5v7h7" fill={C.greenSoft} />
    <path d="M16.5 15h8" strokeWidth={1.8} />
    <rect x={16} y={27} width={4} height={8} rx={1} fill={C.blueLt} strokeWidth={1.6} />
    <rect x={22} y={23} width={4} height={12} rx={1} fill={C.blue} strokeWidth={1.6} />
    <rect x={28} y={20} width={4} height={15} rx={1} fill={C.green} strokeWidth={1.6} />
  </> },
  bell: { tone: 'yellow', draw: () => <>
    <path d="M7 15q-1.6 4 0 8M41 15q1.6 4 0 8" stroke={C.coral} strokeWidth={2.4} />
    <circle cx={24} cy={35} r={3.2} fill={C.coral} />
    <path d="M24 9c-6.8 0-10 5.4-10 11v7l-3.5 5h27L34 27v-7c0-5.6-3.2-11-10-11Z" fill={C.yellow} />
    <circle cx={24} cy={7.6} r={1.9} fill={C.yellow} />
    <Shine d="M18.4 16.4a6 6 0 0 1 3.4-3.2" />
  </> },
  dashboard: { tone: 'blue', draw: () => <>
    <rect x={7} y={10} width={34} height={28} rx={4} fill={C.white} />
    <path d="M7 17v-3a4 4 0 0 1 4-4h26a4 4 0 0 1 4 4v3Z" fill={C.blue} />
    <Dot x={11.5} y={13.5} r={1.1} c={C.white} /><Dot x={15} y={13.5} r={1.1} c={C.white} />
    <path d="M12 31l6-6 5 4 8-8" stroke={C.green} strokeWidth={2.6} />
    <rect x={32} y={27} width={4} height={7} rx={1} fill={C.yellow} strokeWidth={1.6} />
  </> },
  lock: { tone: 'blue', draw: () => <>
    <path d="M16.5 21v-5a7.5 7.5 0 0 1 15 0v5" strokeWidth={2.8} />
    <rect x={12} y={20} width={24} height={18} rx={4.5} fill={C.blue} />
    <circle cx={24} cy={27.5} r={2.6} fill={C.white} {...NO} />
    <path d="M24 29.5v3.6" stroke={C.white} strokeWidth={2.6} />
  </> },
  mail: { tone: 'blue', draw: () => <>
    <rect x={7} y={12} width={34} height={24} rx={4.5} fill={C.blueLt} />
    <path d="M8.5 14.5L24 26l15.5-11.5" fill={C.white} />
    <Spark x={41} y={9} s={3.4} c={C.yellow} />
  </> },
  sparkle: { tone: 'yellow', draw: () => <>
    <path d="M21 9q1.6 11.5 13 13-11.4 1.6-13 13-1.6-11.4-13-13 11.4-1.5 13-13Z" fill={C.yellow} />
    <Spark x={36} y={11} s={4.4} c={C.pink} />
    <Dot x={37} y={35} r={1.8} c={C.blue} />
  </> },

  /* Miri — attitudes & feelings */
  'buddy-angel': { tone: 'blue', draw: () => <Buddy mood="angel" /> },
  'buddy-shrug': { tone: 'cream', draw: () => <Buddy mood="shrug" /> },
  'buddy-sweat': { tone: 'yellow', draw: () => <Buddy mood="sweat" /> },
  'buddy-grimace': { tone: 'coral', draw: () => <Buddy mood="grimace" /> },
  'buddy-worried': { tone: 'coral', draw: () => <Buddy mood="worried" /> },
  'buddy-meh': { tone: 'yellow', draw: () => <Buddy mood="meh" /> },
  'buddy-happy': { tone: 'green', draw: () => <Buddy mood="happy" /> },
  'buddy-strong': { tone: 'green', draw: () => <Buddy mood="strong" /> },
  'buddy-think': { tone: 'blue', draw: () => <Buddy mood="think" /> },
  'buddy-grandpa': { tone: 'green', draw: () => <Buddy mood="grandpa" /> },
} satisfies Record<string, { tone: Tone; draw: () => ReactNode }>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

interface MiraIconProps {
  name: IconName;
  /** Rendered size in px (square). */
  size?: number;
  /** Soft tinted tile behind the glyph (default on). */
  tile?: boolean;
  className?: string;
}

export function MiraIcon({ name, size = 40, tile = true, className }: MiraIconProps) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      {tile && <rect x={2} y={2} width={44} height={44} rx={14} fill={TILE[icon.tone]} />}
      <g fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {icon.draw()}
      </g>
    </svg>
  );
}

/* ── Brand monograms (e-wallets, PayLater) ───────────────────────────────── */

export const BRANDS = {
  gopay: { text: 'Go', bg: '#00AA5B' },
  ovo: { text: 'OVO', bg: '#4C3494' },
  dana: { text: 'DANA', bg: '#118EEA' },
  shopeepay: { text: 'SP', bg: '#EE4D2D' },
  linkaja: { text: 'LA', bg: '#E82529' },
  astrapay: { text: 'AP', bg: '#1C4DA1' },
  kredivo: { text: 'K', bg: '#1C6EE8' },
  akulaku: { text: 'AK', bg: '#E8432F' },
  spaylater: { text: 'SPL', bg: '#EE4D2D' },
  gopaylater: { text: 'GPL', bg: '#00AA5B' },
  traveloka: { text: 'TL', bg: '#0194F3' },
} as const;

export type BrandKey = keyof typeof BRANDS;

export function BrandBadge({ brand, size = 40 }: { brand: BrandKey; size?: number }) {
  const b = BRANDS[brand];
  const fs = b.text.length <= 1 ? 20 : b.text.length === 2 ? 16 : b.text.length === 3 ? 13 : 11;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      <rect x={2} y={2} width={44} height={44} rx={14} fill={b.bg} />
      <rect x={2} y={2} width={44} height={44} rx={14} fill="none" stroke={C.ink} strokeOpacity={0.18} strokeWidth={1.5} />
      <path d="M10 14.5q2-4.5 7-5.5" stroke={C.white} strokeWidth={2} strokeLinecap="round" opacity={0.55} fill="none" />
      <text x={24} y={24} dy="0.36em" textAnchor="middle" fill={C.white} fontFamily="Sora, 'DM Sans', sans-serif" fontWeight={800} fontSize={fs} letterSpacing={-0.3}>
        {b.text}
      </text>
    </svg>
  );
}

/** Option icon: a MIRA icon or a brand monogram. */
export function OptionIcon({ icon, brand, size = 36 }: { icon?: IconName; brand?: BrandKey; size?: number }) {
  if (brand) return <BrandBadge brand={brand} size={size} />;
  if (icon) return <MiraIcon name={icon} size={size} />;
  return null;
}
