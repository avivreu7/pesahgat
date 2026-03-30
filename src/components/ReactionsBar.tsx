'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* ── Config ──────────────────────────────────────────── */
const REACTIONS = [
  { id: 'tractor', emoji: '🚜', label: 'טרקטור' },
  { id: 'cow',     emoji: '🐄', label: 'פרה'    },
  { id: 'wine',    emoji: '🍷', label: 'יין'     },
  { id: 'matzah',  emoji: '🫓', label: 'מצה'    },
  { id: 'frog',    emoji: '🐸', label: 'צפרדע'  },
  { id: 'party',   emoji: '🎉', label: 'חגיגה'  },
  { id: 'star',    emoji: '✡️',  label: 'דוד'    },
  { id: 'heart',   emoji: '❤️',  label: 'אהבה'   },
]

const CHANNEL = 'kibbutz-reactions'

/* ── Types ───────────────────────────────────────────── */
interface Floater {
  uid: string
  emoji: string
  left: number   // % from right edge (RTL-friendly)
}

/* ── Component ───────────────────────────────────────── */
export default function ReactionsBar() {
  const pathname    = usePathname()
  const supabase    = createClient()

  // Don't render on the AR page — it has its own full-screen camera UI
  if (pathname.startsWith('/ar')) return null
  const channelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [floaters, setFloaters]   = useState<Floater[]>([])
  const [pressed,  setPressed]    = useState<string | null>(null)
  const [recentCounts, setRecentCounts] = useState<Record<string, number>>({})

  /* Spawn a floater on screen */
  const spawnFloat = useCallback((emoji: string) => {
    const uid  = `${Date.now()}-${Math.random()}`
    const left = 10 + Math.random() * 80  // 10–90 % from left
    setFloaters(prev => [...prev, { uid, emoji, left }])
  }, [])

  /* Track recent counts (resets every 5 s) */
  const bumpCount = useCallback((id: string) => {
    setRecentCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }, [])

  useEffect(() => {
    const resetTimer = setInterval(
      () => setRecentCounts({}),
      5_000
    )
    return () => clearInterval(resetTimer)
  }, [])

  /* Subscribe to Realtime broadcast channel */
  useEffect(() => {
    const ch = supabase.channel(CHANNEL, {
      config: { broadcast: { self: true } },   // receive own broadcasts too
    })

    ch.on('broadcast', { event: 'reaction' }, ({ payload }) => {
      if (payload?.emoji) {
        spawnFloat(payload.emoji)
        bumpCount(payload.id)
      }
    }).subscribe()

    channelRef.current = ch
    return () => { ch.unsubscribe() }
  }, [supabase, spawnFloat, bumpCount])

  /* Send reaction */
  const sendReaction = (r: typeof REACTIONS[number]) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji: r.emoji, id: r.id },
    })
    // Tactile feedback
    setPressed(r.id)
    setTimeout(() => setPressed(null), 200)
  }

  /* Remove floater when animation ends */
  const removeFloat = (uid: string) =>
    setFloaters(prev => prev.filter(f => f.uid !== uid))

  return (
    <>
      {/* ── Floating emojis ──────────────────────────── */}
      {floaters.map(f => (
        <div
          key={f.uid}
          className="float-emoji"
          style={{ left: `${f.left}%` }}
          onAnimationEnd={() => removeFloat(f.uid)}
          aria-hidden="true"
        >
          {f.emoji}
        </div>
      ))}

      {/* ── Fixed bottom bar ─────────────────────────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 flex justify-center pb-4 px-4 pointer-events-none"
        aria-label="כפתורי תגובות"
      >
        <div className="glass-sm pointer-events-auto px-4 py-3 flex items-center gap-3 overflow-x-auto max-w-[95vw]" style={{ scrollbarWidth: 'none' }}>
          {REACTIONS.map(r => {
            const count = recentCounts[r.id] ?? 0
            return (
              <button
                key={r.id}
                onClick={() => sendReaction(r)}
                aria-label={r.label}
                className="relative flex flex-col items-center gap-0.5 select-none transition-transform duration-100 active:scale-90"
                style={{
                  transform: pressed === r.id ? 'scale(0.85)' : 'scale(1)',
                  transition: 'transform 0.12s ease',
                }}
              >
                {/* Reaction emoji */}
                <span className="text-3xl leading-none">{r.emoji}</span>

                {/* Count badge */}
                <span
                  className="text-[10px] font-bold text-(--text-muted) transition-all duration-300"
                  style={{ minWidth: '1ch', textAlign: 'center' }}
                >
                  {count > 0 ? count : r.label}
                </span>

                {/* Ripple ring on press */}
                {pressed === r.id && (
                  <span
                    className="absolute inset-0 rounded-full border-2 border-(--sage) animate-ping"
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 border-r border-(--glass-border) pl-4 ml-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-(--text-muted)">חי</span>
          </div>
        </div>
      </div>
    </>
  )
}
