import { createClient } from '@/lib/supabase/server'
import AdminSettingsForm from './components/AdminSettingsForm'
import AdminPromosPanel from './components/AdminPromosPanel'
import AdminResetPanel from './components/AdminResetPanel'
import AdminBypassPanel from './components/AdminBypassPanel'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [{ data: settings }, { data: promos }] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('promo_videos').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-16">
      <div className="fade-in">
        <h1 className="heading-section mb-1">שלום מנהל 👋</h1>
        <p className="text-(--text-muted) text-sm">ניהול הגדרות האירוע וסרטוני הפרומו</p>
      </div>

      {/* Settings card */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <span>🎬</span> הגדרות ראשיות
        </h2>
        <AdminSettingsForm settings={settings} />
      </section>

      {/* Promo videos card */}
      <section className="glass p-6 fade-in">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <span>📹</span> סרטוני פרומו / טיזר
        </h2>
        <AdminPromosPanel promos={promos ?? []} />
      </section>

      {/* Bypass panel */}
      <section className="glass p-6 fade-in" style={{ border: '1px solid rgba(212,168,67,0.45)' }}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--wine)' }}>
          <span>▶</span> עוקף ספירה לאחור
        </h2>
        <AdminBypassPanel />
      </section>

      {/* Reset panel */}
      <section className="glass p-6 fade-in" style={{ border: '1px solid rgba(139,38,53,0.4)' }}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#f87171' }}>
          <span>🗑️</span> איפוס נתונים
        </h2>
        <AdminResetPanel />
      </section>
    </div>
  )
}
