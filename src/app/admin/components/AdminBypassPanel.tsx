'use client'

import { useTransition, useState } from 'react'
import { forceVideoNowAction } from '../actions'

export default function AdminBypassPanel() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleForce = () => {
    if (!confirm('האם להפעיל את הסרט עכשיו? הספירה לאחור תבוטל לכל הצופים בזמן אמת.')) return
    startTransition(async () => {
      await forceVideoNowAction()
      setDone(true)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        כפתור זה מאפשר לעקוף את הספירה לאחור ולהפעיל את הסרט מיד לכל הצופים – ללא צורך ברענון דף.
        שמור לשימוש ביום האירוע אם יש צורך.
      </p>
      <button
        onClick={handleForce}
        disabled={isPending || done}
        className="btn-primary self-start"
        style={{ background: done ? 'rgba(34,197,94,0.8)' : undefined }}
      >
        {done ? '✅ הסרט הופעל לכולם!' : isPending ? '...מפעיל' : '▶ הפעל סרט עכשיו'}
      </button>
      {done && (
        <p className="text-xs font-semibold" style={{ color: 'var(--grass)' }}>
          הגדרת הזמן עודכנה. הסרט יופיע אוטומטית לכל הצופים תוך 15 שניות.
        </p>
      )}
    </div>
  )
}
