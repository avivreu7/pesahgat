'use client'

import { useState, useTransition } from 'react'
import { setSiteLockAction } from '../actions'

export default function AdminLockPanel({ initialLocked }: { initialLocked: boolean }) {
  const [locked,    setLocked]    = useState(initialLocked)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = !locked
    startTransition(async () => {
      await setSiteLockAction(next)
      setLocked(next)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        במצב נעילה — המבקרים רואים את האתר אבל לא יכולים לבצע פעולות (ברכות, קניידלך, צילום, שמיכה, יד 2, אליהו).
        מתאים לתצוגת טרום-פרסום.
      </p>

      <div
        className="glass-sm rounded-2xl p-5 flex items-center justify-between"
        style={{ border: `2px solid ${locked ? 'rgba(212,168,67,0.6)' : 'rgba(90,138,60,0.5)'}` }}
      >
        <div>
          <p className="font-extrabold text-base" style={{ color: locked ? 'var(--wheat)' : 'var(--grass)' }}>
            {locked ? '🔒 האתר נעול – מצב תצוגה בלבד' : '🔓 האתר פעיל – כל הפעילויות זמינות'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {locked ? 'כפתורים ופורמים מושבתים לכל המבקרים' : 'המבקרים יכולים לבצע את כל הפעילויות'}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={isPending}
          className={locked ? 'btn-primary px-5 py-2' : 'btn-ghost px-5 py-2'}
          style={locked ? {} : { border: '1.5px solid rgba(90,138,60,0.6)', color: 'var(--grass)' }}
        >
          {isPending ? '...' : locked ? '🔓 שחרר' : '🔒 נעל'}
        </button>
      </div>
    </div>
  )
}
