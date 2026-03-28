import { createClient } from '@/lib/supabase/server'
import CountdownTimer from '@/components/CountdownTimer'
import PromoVideos from '@/components/PromoVideos'
import GreetingsWall from '@/components/GreetingsWall'
import KneidlachCounter from '@/components/KneidlachCounter'

export const revalidate = 60

const FALLBACK_VIDEO = ''
const FALLBACK_TIME  = new Date(Date.now() + 48 * 3_600_000).toISOString()

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: settings },
    { data: promos },
    { data: greetings },
    { data: counter },
  ] = await Promise.all([
    supabase.from('settings').select('main_video_url, start_time').eq('id', 1).maybeSingle(),
    supabase.from('promo_videos').select('id, title, video_url').order('created_at', { ascending: false }),
    supabase.from('greetings').select('id, family_name, message, gif_url, created_at')
      .order('created_at', { ascending: false }).limit(80),
    supabase.from('counters').select('total_count').eq('name', 'kneidlach').maybeSingle(),
  ])

  const targetIso     = settings?.start_time     ?? FALLBACK_TIME
  const videoUrl      = settings?.main_video_url ?? FALLBACK_VIDEO
  const promoList     = promos    ?? []
  const greetingList  = greetings ?? []
  const kneidlachInit = counter?.total_count ?? 0

  return (
    <main className="min-h-dvh flex flex-col items-center px-4 py-10 pb-28 gap-12">

      {/* ── Hero ────────────────────────────────────────── */}
      <header className="w-full max-w-3xl text-center fade-in pt-4">
        {/* Seder plate row */}
        <p className="text-4xl mb-3 tracking-widest">🍷 🫓 🌿 ✡️ 🕯️</p>
        <h1 className="heading-hero hero-pulse mb-2">חג פסח שמח - קיבוץ גת</h1>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>ליל הסדר בקיבוץ גת - שנת 2026</p>
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-px w-16 bg-linear-to-r from-transparent to-(--gold)" />
          <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>✦</span>
          <div className="h-px w-16 bg-linear-to-l from-transparent to-(--gold)" />
        </div>
      </header>

      {/* ── Countdown + video ───────────────────────────── */}
      <div className="glass p-6 sm:p-10 w-full max-w-3xl fade-in">
        <CountdownTimer targetIso={targetIso} videoUrl={videoUrl} greetings={greetingList} />
      </div>

      {/* ── Promo videos ────────────────────────────────── */}
      <PromoVideos promos={promoList} />

      {/* ── Kids activity banners ───────────────────────── */}
      <section className="w-full max-w-3xl fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/afikoman"
          className="glass flex items-center gap-4 p-5 hover:scale-[1.02] transition-transform duration-200 no-underline"
        >
          <span className="text-4xl shrink-0">🫓</span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base mb-0.5" style={{ color: 'var(--gold)' }}>מצא את האפיקומן!</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>משחק כרטיסים לילדים 🎉</p>
          </div>
          <span className="btn-gold text-xs px-3 py-1.5 pointer-events-none shrink-0">שחק</span>
        </a>
        <a
          href="/ar"
          className="glass flex items-center gap-4 p-5 hover:scale-[1.02] transition-transform duration-200 no-underline"
        >
          <span className="text-4xl shrink-0">🐸</span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base mb-0.5" style={{ color: 'var(--gold)' }}>10 המכות – AR</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>חווית מציאות רבודה 📱</p>
          </div>
          <span className="btn-primary text-xs px-3 py-1.5 pointer-events-none shrink-0">הפעל</span>
        </a>
      </section>

      {/* ── Kneidlach counter ───────────────────────────── */}
      <section className="w-full max-w-3xl fade-in">
        <KneidlachCounter initial={kneidlachInit} />
      </section>

      {/* ── Greetings wall ──────────────────────────────── */}
      <section className="w-full max-w-3xl fade-in">
        <div className="text-center mb-6">
          <h2 className="heading-section mb-1">💌 קיר הברכות</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            שלח ברכת חג לכל הקיבוץ – עם GIF אם בא לך!
          </p>
        </div>
        <GreetingsWall initial={greetingList} />
      </section>

    </main>
  )
}
