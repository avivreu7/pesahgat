'use client'

import { useTransition, useState } from 'react'
import {
  resetGreetingsAction,
  resetCounterAction,
  resetPhotoboothAction,
  resetQuiltAction,
  resetFoodAction,
  resetElijahMemoryAction,
  resetAllDataAction,
} from '../actions'

type Status = { ok: boolean; msg: string } | null

export default function AdminResetPanel() {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<Status>(null)

  const run = (label: string, fn: () => Promise<void>) => {
    if (!confirm(`בטוח? פעולה זו תמחק: ${label}`)) return
    startTransition(async () => {
      try {
        await fn()
        setStatus({ ok: true, msg: `✅ ${label} – אופס בהצלחה!` })
      } catch (e: unknown) {
        setStatus({ ok: false, msg: `❌ שגיאה: ${e instanceof Error ? e.message : 'לא ידוע'}` })
      }
      setTimeout(() => setStatus(null), 4000)
    })
  }

  const ACTIONS = [
    { label: '🗑 מחק ברכות',         desc: 'כל הברכות בקיר',             danger: false, fn: () => resetGreetingsAction() },
    { label: '🫕 אפס קניידלך',        desc: 'מונה הקניידלך חוזר ל-0',    danger: false, fn: () => resetCounterAction('kneidlach') },
    { label: '🫓 אפס אפיקומן',        desc: 'מונה האפיקומן חוזר ל-0',    danger: false, fn: () => resetCounterAction('afikoman') },
    { label: '📸 מחק גלריית צילום',   desc: 'כל תמונות הפוטובוות',       danger: false, fn: () => resetPhotoboothAction() },
    { label: '🎨 מחק שמיכת טלאים',    desc: 'כל ציורי המשפחות',           danger: false, fn: () => resetQuiltAction() },
    { label: '🍽 מחק יד 2',           desc: 'כל מנות האוכל',              danger: false, fn: () => resetFoodAction() },
    { label: '🧙 מחק זיכרון אליהו',   desc: 'זיכרון התשובות של אליהו',   danger: false, fn: () => resetElijahMemoryAction() },
    { label: '💣 אפס הכל',            desc: 'ברכות + מוני קניידלך ואפיקומן', danger: true, fn: () => resetAllDataAction() },
  ]

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        השתמש בכפתורים אלה לניסויים ולאיפוס נתוני הערב. הפעולות בלתי הפיכות.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACTIONS.map(a => (
          <button
            key={a.label}
            onClick={() => run(a.desc, a.fn)}
            disabled={isPending}
            className={a.danger ? 'btn-danger' : 'btn-ghost'}
            style={{ justifyContent: 'flex-start', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}
          >
            <span className="flex flex-col items-start gap-0.5">
              <span className="font-bold text-sm">{a.label}</span>
              <span className="text-xs opacity-70">{a.desc}</span>
            </span>
          </button>
        ))}
      </div>

      {status && (
        <p
          className="text-sm font-semibold rounded-xl px-4 py-2 fade-in"
          style={{
            background: status.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color:      status.ok ? '#4ade80' : '#f87171',
            border:    `1px solid ${status.ok ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}
        >
          {status.msg}
        </p>
      )}

      {isPending && (
        <p className="text-xs animate-pulse" style={{ color: 'var(--text-muted)' }}>...מבצע איפוס</p>
      )}
    </div>
  )
}
