import { motion } from 'framer-motion';

/**
 * Animated Chemistry hero illustration:
 * - Large central beaker with bubbles
 * - Orbiting molecule/atom rings
 * - Floating periodic-table-style chips
 */
export default function ChemHero({ className = '' }) {
  return (
    <div className={`relative w-full aspect-[4/3] ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-500/15 via-violet2-500/10 to-fuchsia-400/10" />
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(124,58,237,0.18),transparent_60%)]" />

      {/* Orbit rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-8 rounded-full border-2 border-dashed border-brand-300/50"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-16 rounded-full border-2 border-dashed border-violet2-500/40"
      />

      {/* Central beaker SVG */}
      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <svg width="220" height="260" viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7c3aed" />
                <stop offset="1" stopColor="#3366ff" />
              </linearGradient>
              <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="1" stopColor="#e0e7ff" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Beaker body */}
            <path
              d="M70 30 H150 V90 L195 220 Q200 250 170 250 H50 Q20 250 25 220 L70 90 Z"
              fill="url(#glass)"
              stroke="#3366ff"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Liquid */}
            <path
              d="M40 180 L180 180 L195 220 Q200 250 170 250 H50 Q20 250 25 220 Z"
              fill="url(#liquid)"
              opacity="0.9"
            />
            {/* Liquid surface highlight */}
            <ellipse cx="110" cy="180" rx="70" ry="6" fill="#a78bfa" opacity="0.6" />
            {/* Measurement lines */}
            <line x1="55" y1="130" x2="70" y2="130" stroke="#3366ff" strokeWidth="2" />
            <line x1="50" y1="150" x2="70" y2="150" stroke="#3366ff" strokeWidth="2" />
            <line x1="55" y1="170" x2="70" y2="170" stroke="#3366ff" strokeWidth="2" />
            {/* Mouth */}
            <rect x="68" y="22" width="84" height="14" rx="4" fill="#fff" stroke="#3366ff" strokeWidth="3" />
          </svg>

          {/* Bubbles */}
          {[
            { x: 60, y: 200, d: 0, s: 8 },
            { x: 110, y: 210, d: 0.8, s: 12 },
            { x: 140, y: 195, d: 1.4, s: 6 },
            { x: 95, y: 220, d: 2.0, s: 10 },
          ].map((b, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/80"
              style={{ left: b.x, top: b.y, width: b.s, height: b.s }}
              animate={{ y: [-10, -120], opacity: [0.9, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: b.d, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      </div>

      {/* Floating molecule chips */}
      <FloatingChip
        symbol="H₂O"
        label="Aqueous"
        className="absolute top-8 left-2 sm:left-4 bg-white text-brand-700"
        delay={0}
      />
      <FloatingChip
        symbol="C₆H₆"
        label="Benzene"
        className="absolute top-20 right-2 sm:right-4 bg-violet2-500 text-white"
        delay={0.4}
      />
      <FloatingChip
        symbol="NaCl"
        label="Ionic"
        className="absolute bottom-24 left-0 sm:left-2 bg-amber-400 text-amber-900"
        delay={0.8}
      />
      <FloatingChip
        symbol="O₂"
        label="Diatomic"
        className="absolute bottom-10 right-0 sm:right-6 bg-emerald-500 text-white"
        delay={1.2}
      />
      <FloatingChip
        symbol="pH 7"
        label="Neutral"
        className="absolute top-1/2 -left-1 sm:left-2 bg-fuchsia-500 text-white"
        delay={1.6}
      />

      {/* Tiny atoms scattered */}
      {[
        { x: '15%', y: '25%', s: 14 },
        { x: '85%', y: '40%', s: 10 },
        { x: '20%', y: '75%', s: 12 },
        { x: '78%', y: '70%', s: 16 },
      ].map((a, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-brand shadow-glow"
          style={{ left: a.x, top: a.y, width: a.s, height: a.s }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}

function FloatingChip({ symbol, label, className, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
      className={`rounded-2xl px-3 py-2 shadow-xl backdrop-blur-sm flex items-center gap-2 ${className}`}
    >
      <div className="font-display font-extrabold text-sm leading-none">{symbol}</div>
      <div className="text-[10px] font-semibold opacity-80 leading-none">{label}</div>
    </motion.div>
  );
}
