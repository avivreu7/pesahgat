'use client'

interface PricePoint {
  price: number
  recorded_at: string
}

interface Candle {
  open: number
  high: number
  low: number
  close: number
  time: number
}

function buildCandles(history: PricePoint[], bucketMs = 5 * 60_000): Candle[] {
  if (!history.length) return []
  const groups: Record<number, number[]> = {}
  for (const p of history) {
    const t = Math.floor(new Date(p.recorded_at).getTime() / bucketMs) * bucketMs
    if (!groups[t]) groups[t] = []
    groups[t].push(p.price)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .slice(-20)
    .map(([t, prices]) => ({
      open: prices[0],
      close: prices[prices.length - 1],
      high: Math.max(...prices),
      low: Math.min(...prices),
      time: Number(t),
    }))
}

export default function CandleChart({
  history,
  currentPrice,
}: {
  history: PricePoint[]
  currentPrice: number
}) {
  const W = 280
  const H = 110
  const PAD = { left: 8, right: 8, top: 8, bottom: 8 }

  // Add a synthetic "current" point
  const pts: PricePoint[] = [
    ...history,
    { price: currentPrice, recorded_at: new Date().toISOString() },
  ]
  const candles = buildCandles(pts)

  if (candles.length < 2) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="rgba(212,168,67,0.4)" fontSize="11">
          אין מספיק נתונים עדיין
        </text>
      </svg>
    )
  }

  const prices = candles.flatMap(c => [c.high, c.low])
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const range = maxP - minP || 1

  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const cw = Math.floor(chartW / candles.length)
  const bodyW = Math.max(2, cw - 4)

  function yOf(p: number) {
    return PAD.top + chartH - ((p - minP) / range) * chartH
  }

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block' }}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(frac => (
        <line
          key={frac}
          x1={PAD.left} x2={W - PAD.right}
          y1={PAD.top + chartH * frac} y2={PAD.top + chartH * frac}
          stroke="rgba(212,168,67,0.1)" strokeWidth="1"
        />
      ))}

      {candles.map((c, i) => {
        const x = PAD.left + i * cw + cw / 2
        const isGreen = c.close >= c.open
        const color = isGreen ? '#22c55e' : '#ef4444'
        const bodyTop = yOf(Math.max(c.open, c.close))
        const bodyBot = yOf(Math.min(c.open, c.close))
        const bodyH = Math.max(1, bodyBot - bodyTop)

        return (
          <g key={c.time}>
            {/* Wick */}
            <line
              x1={x} x2={x}
              y1={yOf(c.high)} y2={yOf(c.low)}
              stroke={color} strokeWidth="1.5"
            />
            {/* Body */}
            <rect
              x={x - bodyW / 2} y={bodyTop}
              width={bodyW} height={bodyH}
              fill={color} rx="1"
            />
          </g>
        )
      })}

      {/* Current price line */}
      <line
        x1={PAD.left} x2={W - PAD.right}
        y1={yOf(currentPrice)} y2={yOf(currentPrice)}
        stroke="rgba(212,168,67,0.6)" strokeWidth="1" strokeDasharray="3,3"
      />
    </svg>
  )
}
