import { createClient } from '@/lib/supabase/server'
import AdminSettingsForm    from './components/AdminSettingsForm'
import AdminPromosPanel     from './components/AdminPromosPanel'
import AdminImagesPanel     from './components/AdminImagesPanel'
import AdminTickerPanel     from './components/AdminTickerPanel'
import AdminResetPanel      from './components/AdminResetPanel'
import AdminBypassPanel     from './components/AdminBypassPanel'
import AdminLockPanel       from './components/AdminLockPanel'
import AdminQuiltPanel      from './components/AdminQuiltPanel'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { data: settings },
    { data: promos },
    { data: images },
    { data: ticker },
    { data: elijahUsage },
    { data: boothCount },
    { data: quiltDrawings },
    { data: foodCount },
  ] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('promo_videos').select('*').order('created_at', { ascending: false }),
    supabase.from('promo_images').select('id, title, image_url').order('created_at', { ascending: true }),
    supabase.from('news_ticker').select('id, text, active').order('created_at', { ascending: true }),
    supabase.from('elijah_usage').select('count').eq('date', new Date().toISOString().slice(0,10)).maybeSingle(),
    supabase.from('photobooth_photos').select('id', { count: 'exact', head: true }),
    supabase.from('quilt_drawings').select('id, family_name, image_url').order('created_at', { ascending: true }),
    supabase.from('food_items').select('id', { count: 'exact', head: true }),
  ])

  const quiltList = quiltDrawings ?? []

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-16">
      <div className="fade-in">
        <h1 className="heading-section mb-1">שלום מנהל 👋</h1>
        <p className="text-(--text-muted) text-sm">ניהול כלל תכני האתר</p>
      </div>

      {/* Settings */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><span>🎬</span> הגדרות ראשיות</h2>
        <AdminSettingsForm settings={settings} />
      </section>

      {/* News ticker */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><span>📰</span> מבזק חדשות</h2>
        <AdminTickerPanel items={ticker ?? []} />
      </section>

      {/* Promo videos */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><span>📹</span> סרטוני פרומו / טיזר</h2>
        <AdminPromosPanel promos={promos ?? []} />
      </section>

      {/* Photo carousel */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><span>🖼</span> קרוסלת תמונות</h2>
        <AdminImagesPanel images={images ?? []} />
      </section>

      {/* Stats row */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>📊</span> סטטיסטיקות היום</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'שיחות אליהו היום', value: elijahUsage?.count ?? 0, emoji: '🧙‍♂️', max: 80 },
            { label: 'תמונות בוץ',         value: (boothCount as { count: number } | null)?.count ?? 0, emoji: '📸' },
            { label: 'טלאי שמיכה',          value: quiltList.length, emoji: '🎨' },
            { label: 'מנות יד 2',           value: (foodCount  as { count: number } | null)?.count ?? 0, emoji: '🍽' },
          ].map(s => (
            <div key={s.label} className="glass-sm rounded-xl p-3 text-center">
              <p style={{ fontSize: '1.8rem' }}>{s.emoji}</p>
              <p className="font-extrabold text-2xl" style={{ color: 'var(--wheat)' }}>{s.value}{s.max ? `/${s.max}` : ''}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quilt management */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🎨</span> שמיכת טלאים ({quiltList.length} טלאים)</h2>
        <AdminQuiltPanel drawings={quiltList} />
      </section>

      {/* Bypass */}
      <section className="glass p-6 fade-in" style={{ border: '1px solid rgba(212,168,67,0.45)' }}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--wine)' }}>
          <span>▶</span> עוקף ספירה לאחור
        </h2>
        <AdminBypassPanel />
      </section>

      {/* Lock mode */}
      <section className="glass p-6 fade-in" style={{ border: '1px solid rgba(212,168,67,0.4)' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔒</span> מצב תצוגה מקדימה
        </h2>
        <AdminLockPanel initialLocked={!!(settings as { site_locked?: boolean } | null)?.site_locked} />
      </section>

      {/* Reset */}
      <section className="glass p-6 fade-in" style={{ border: '1px solid rgba(139,38,53,0.4)' }}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#f87171' }}>
          <span>🗑️</span> איפוס נתונים
        </h2>
        <AdminResetPanel />
      </section>
    </div>
  )
}
