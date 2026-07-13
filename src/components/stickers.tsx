/**
 * Stickers de flash art — SVG desenhados no estilo tatuagem tradicional.
 * Traço preto grosso + cores chapadas da paleta INK.system.
 * Uso: <Sticker.Rosa size={40} />
 */

const INK = "#211b15"
const RED = "#ce2c2c"
const RED_DEEP = "#a01f26"
const TEAL = "#1e7f5c"
const GOLD = "#e0a32e"
const PAPER = "#f4ecd9"

type Props = { size?: number; className?: string; style?: React.CSSProperties }

function base(size: number): React.SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  }
}

/** 🌹 Rosa tradicional */
function Rosa({ size = 44, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <path d="M20 44 Q14 54 10 60" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 48 Q30 46 30 38" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
      <path d="M24 52 L16 50 Q12 54 18 56 Q24 56 24 52Z" fill={TEAL} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 10 Q46 12 46 26 Q46 42 32 46 Q18 42 18 26 Q18 12 32 10Z" fill={RED} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 16 Q40 18 40 26 Q40 34 32 38 Q24 34 24 26 Q24 18 32 16Z" fill={RED_DEEP} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 22 Q36 24 36 28 Q36 32 32 33 Q28 32 28 28 Q28 24 32 22Z" fill={RED} stroke={INK} strokeWidth="1.6" />
    </svg>
  )
}

/** 🗡️ Adaga */
function Adaga({ size = 44, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <path d="M32 4 L37 34 L32 40 L27 34 Z" fill={PAPER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 4 L32 40" stroke={INK} strokeWidth="1.5" />
      <path d="M20 40 L44 40 L44 45 L20 45 Z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="29" y="45" width="6" height="12" fill={GOLD} stroke={INK} strokeWidth="2.5" />
      <circle cx="32" cy="60" r="4" fill={RED} stroke={INK} strokeWidth="2.5" />
    </svg>
  )
}

/** 🐦 Andorinha */
function Andorinha({ size = 44, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <path d="M8 30 Q22 16 34 26 Q30 30 24 30 Q34 34 40 28 Q52 20 58 30 Q46 34 40 38 L44 50 L34 42 L30 50 L28 40 Q16 40 8 30Z"
        fill={TEAL} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="15" cy="29" r="2" fill={INK} />
    </svg>
  )
}

/** ❤️ Coração com faixa */
function Coracao({ size = 44, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <path d="M32 20 Q28 10 18 12 Q8 15 12 27 Q16 38 32 48 Q48 38 52 27 Q56 15 46 12 Q36 10 32 20Z"
        fill={RED} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M22 18 Q26 15 28 20" stroke={PAPER} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 42 L58 38 L56 48 L8 52 Z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

/** 🐍 Cobra */
function Cobra({ size = 44, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <path d="M12 54 Q6 44 16 40 Q30 34 20 26 Q12 20 24 14 Q34 10 44 16"
        stroke={GOLD} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M12 54 Q6 44 16 40 Q30 34 20 26 Q12 20 24 14 Q34 10 44 16"
        stroke={INK} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.001" />
      <path d="M44 12 Q54 12 54 20 Q54 26 46 24 Q40 22 44 12Z" fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="49" cy="18" r="1.6" fill={INK} />
      <path d="M54 20 L60 22 M54 22 L60 24" stroke={RED} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** 🔫 Máquina de tatuar */
function Maquina({ size = 44, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <rect x="20" y="10" width="20" height="20" rx="3" fill={RED} stroke={INK} strokeWidth="2.5" />
      <circle cx="30" cy="20" r="5" fill={GOLD} stroke={INK} strokeWidth="2" />
      <path d="M40 16 L52 22 Q56 24 54 28 L48 30" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="26" y="30" width="8" height="10" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M30 40 L30 58" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 30 L14 46" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** ⭐ Estrela náutica (filler) */
function Estrela({ size = 28, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <path d="M32 6 L38 28 L58 32 L38 36 L32 58 L26 36 L6 32 L26 28 Z"
        fill={GOLD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 6 L32 58 M6 32 L58 32" stroke={INK} strokeWidth="1.2" opacity="0.5" />
    </svg>
  )
}

/** ⚓ Âncora */
function Ancora({ size = 44, className, style }: Props) {
  return (
    <svg {...base(size)} className={className} style={style} aria-hidden="true">
      <circle cx="32" cy="12" r="5" fill="none" stroke={INK} strokeWidth="3" />
      <path d="M32 17 L32 52" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M22 26 L42 26" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M14 40 Q16 54 32 54 Q48 54 50 40" stroke={RED} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M14 40 L10 36 M14 40 L18 44 M50 40 L54 36 M50 40 L46 44" stroke={RED} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

export const Sticker = { Rosa, Adaga, Andorinha, Coracao, Cobra, Maquina, Estrela, Ancora }
