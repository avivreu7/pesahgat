'use client'

import { useActionState } from 'react'
import { saveSettingsAction } from '../actions'

interface Settings {
  main_video_url?: string
  start_time?: string
}

interface Props {
  settings: Settings | null
}

type FormState = { ok: boolean; error?: string } | null

async function wrappedAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await saveSettingsAction(formData)
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'שגיאה' }
  }
}

/** Convert a UTC ISO string back to 'YYYY-MM-DDTHH:MM' in Israel time (Asia/Jerusalem). */
function toIsraelDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d)
    const p: Record<string, string> = {}
    parts.forEach(x => { p[x.type] = x.value })
    // hour '24' can appear for midnight in some locales — clamp
    const hh = p.hour === '24' ? '00' : p.hour
    return `${p.year}-${p.month}-${p.day}T${hh}:${p.minute}`
  } catch {
    return new Date(iso).toISOString().slice(0, 16)
  }
}

export default function AdminSettingsForm({ settings }: Props) {
  const [state, formAction, pending] = useActionState(wrappedAction, null)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          🔗 קישור YouTube ראשי
        </label>
        <input
          name="main_video_url"
          type="url"
          defaultValue={settings?.main_video_url ?? ''}
          placeholder="https://www.youtube.com/watch?v=..."
          className="input"
          required
        />
        <p className="text-xs text-(--text-muted) mt-1">
          הסרטון שיופיע אוטומטית בסיום הספירה לאחור
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5">
          ⏱ זמן התחלה (ספירה לאחור)
        </label>
        <input
          name="start_time"
          type="datetime-local"
          defaultValue={
            settings?.start_time ? toIsraelDatetimeLocal(settings.start_time) : ''
          }
          className="input"
          required
        />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          שעון ישראל (UTC+3) – מועד האירוע
        </p>
      </div>

      {state?.ok && (
        <p className="text-green-700 text-sm font-semibold bg-green-100/60 rounded-xl px-4 py-2">
          ✅ הגדרות נשמרו בהצלחה!
        </p>
      )}
      {state?.error && (
        <p className="text-red-700 text-sm font-semibold bg-red-100/60 rounded-xl px-4 py-2">
          ❌ שגיאה: {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? '...שומר' : '💾 שמור הגדרות'}
      </button>
    </form>
  )
}
