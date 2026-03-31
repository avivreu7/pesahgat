'use client'

import { useTransition, useState } from 'react'
import { forceVideoNowAction, setStartTimeAction } from '../actions'

export default function AdminBypassPanel() {
  const [isPending,     startTransition]  = useTransition()
  const [isSetPending,  startSetTransition] = useTransition()
  const [done,        setDone]        = useState(false)
  const [timeSaved,   setTimeSaved]   = useState(false)
  const [timeInput, setTimeInput] = useState('21:45')

  const handleForce = () => {
    if (!confirm('האם להפעיל את הסרט עכשיו? הספירה לאחור תבוטל לכל הצופים בזמן אמת.')) return
    startTransition(async () => {
      await forceVideoNowAction()
      setDone(true)
    })
  }

  const handleSetTime = () => {
    const [h, m] = timeInput.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return
    // Today in Israel time (UTC+3)
    const now = new Date()
    const israelDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
    const isoTime = `${israelDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00+03:00`
    startSetTransition(async () => {
      await setStartTimeAction(isoTime)
      setTimeSaved(true)
      setTimeout(() => setTimeSaved(false), 4000)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Quick time setter */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>שנה שעת התחלה (היום):</p>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="time"
            value={timeInput}
            onChange={e => setTimeInput(e.target.value)}
            className="input text-center"
            style={{ width: 120 }}
          />
          <button
            onClick={handleSetTime}
            disabled={isSetPending}
            className="btn-gold px-5 py-2 text-sm"
          >
            {isSetPending ? '...שומר' : '⏰ הגדר שעה'}
          </button>
          {timeSaved && <span className="text-sm font-bold" style={{ color: 'var(--grass)' }}>✅ נשמר!</span>}
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(212,168,67,0.2)' }} />

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
