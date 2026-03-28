'use client'

import { useEffect, useState } from 'react'

// Tier 1: Passover symbols  |  Tier 2: Kibbutz / spring symbols
const EMOJIS = [
  '🍷','🫓','✡️','🕯️','🌿','🪻','🌸','🌺',
  '🚜','🌾','🐄','🐝','🦋','🌳','🐓','🫒','🌼','🐐','🌱','🌻',
]

interface Particle {
  emoji: string
  left: number
  sway: number
  dur: number
  delay: number
  size: number
}

function buildParticles(): Particle[] {
  return Array.from({ length: 36 }, (_, i) => ({
    emoji: EMOJIS[i % EMOJIS.length],
    left:  (i * 31 + 7) % 96,            // 1–95%
    sway:  ((i * 17) % 40) - 20,         // −20 to +20px lateral sway
    dur:   12 + (i * 11) % 12,           // 12–23s
    delay: -(i * 5) % 18,               // 0–(−17)s pre-offset
    size:  0.85 + (i % 4) * 0.25,       // 0.85–1.6rem
  }))
}

export default function PassoverParticles() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => { setParticles(buildParticles()) }, [])

  if (!particles.length) return null

  return (
    <div className="passover-particles" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left:      `${p.left}%`,
            '--dur':   `${p.dur}s`,
            '--delay': `${p.delay}s`,
            '--size':  `${p.size}rem`,
            '--sway':  `${p.sway}px`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
