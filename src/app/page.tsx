import { createClient } from '@/lib/supabase/server'
import CountdownTimer from '@/components/CountdownTimer'
import PromoVideos from '@/components/PromoVideos'
import PromoCarousel from '@/components/PromoCarousel'
import GreetingsWall from '@/components/GreetingsWall'

export const dynamic = 'force-dynamic'

const FALLBACK_VIDEO = ''
const FALLBACK_TIME  = new Date(Date.now() + 48 * 3_600_000).toISOString()

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: settings },
    { data: promos },
    { data: greetings },
    { data: images },
  ] = await Promise.all([
    supabase.from('settings').select('main_video_url, start_time').eq('id', 1).maybeSingle(),
    supabase.from('promo_videos').select('id, title, video_url').order('created_at', { ascending: false }),
    supabase.from('greetings').select('id, family_name, message, gif_url, created_at')
      .order('created_at', { ascending: false }).limit(80),
    supabase.from('promo_images').select('id, title, image_url').order('created_at', { ascending: true }),
  ])

  const targetIso    = settings?.start_time     ?? FALLBACK_TIME
  const videoUrl     = settings?.main_video_url ?? FALLBACK_VIDEO
  const promoList    = promos    ?? []
  const greetingList = greetings ?? []
  const imageList    = images    ?? []

  return (
    <main className="min-h-dvh flex flex-col items-center px-4 py-10 pb-28 gap-12">

      {/* ── Hero ────────────────────────────────────────── */}
      <header className="w-full max-w-3xl text-center fade-in pt-4">
        <p className="text-4xl mb-3 tracking-widest">🍷 🫓 🌿 ✡️ 🕯️</p>
        <h1 className="heading-hero hero-pulse mb-2">חג פסח שמח - קיבוץ גת</h1>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>ליל הסדר בקיבוץ גת - שנת 2026</p>
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

      {/* ── Photo carousel ──────────────────────────────── */}
      <PromoCarousel images={imageList} />

      {/* ── Promo videos ────────────────────────────────── */}
      <PromoVideos promos={promoList} />

      {/* ── Activity banners ────────────────────────────── */}
      <section className="w-full max-w-3xl fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: '/afikoman',   emoji: '🫓', title: 'מצא את האפיקומן!',   desc: 'משחק כרטיסים לילדים 🎉',      btn: 'שחק',    style: 'btn-gold' },
          { href: '/elijah',     emoji: '🧙‍♂️', title: 'אליהו הנביא',       desc: 'שוחח עם הנביא בליל הסדר 🍷',   btn: 'דבר',    style: 'btn-primary' },
          { href: '/photobooth', emoji: '📸', title: 'עמדת הצילום',         desc: 'סלפי + מסגרת חגיגית לגלריה',  btn: 'צלם',    style: 'btn-primary' },
          { href: '/quilt',      emoji: '🎨', title: 'שמיכת הטלאים',        desc: 'כל משפחה מציירת טלאי אחד',    btn: 'ציירו',  style: 'btn-gold' },
          { href: '/food',       emoji: '🍽', title: 'יד 2 של החג',          desc: 'הציעו מנות לחברי הקיבוץ 😄',  btn: 'כנסו',   style: 'btn-primary' },
          { href: '/kneidlach',  emoji: '🫕', title: 'קניידלך הקיבוץ',      desc: 'ספרו כמה קניידלך הכנתם 🏆',   btn: 'ספרו',   style: 'btn-gold' },
        ].map(b => (
          <a
            key={b.href}
            href={b.href}
            className="glass flex items-center gap-4 p-5 hover:scale-[1.02] transition-transform duration-200 no-underline"
          >
            <span className="text-4xl shrink-0">{b.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-base mb-0.5" style={{ color: 'var(--gold)' }}>{b.title}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.desc}</p>
            </div>
            <span className={`${b.style} text-xs px-3 py-1.5 pointer-events-none shrink-0`}>{b.btn}</span>
          </a>
        ))}
      </section>

      {/* ── Community galleries ─────────────────────────── */}
      <section className="w-full max-w-3xl fade-in">
        <h2 className="heading-section text-center mb-4">🖼 גלריות הקהילה</h2>
        <div className="grid grid-cols-2 gap-4">
          <a href="/photobooth" className="glass flex flex-col items-center gap-2 p-5 hover:scale-[1.03] transition-transform duration-200 no-underline text-center">
            <span className="text-4xl">📸</span>
            <p className="font-extrabold text-sm" style={{ color: 'var(--gold)' }}>גלריית הצילום</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>כל תמונות החג</p>
          </a>
          <a href="/quilt" className="glass flex flex-col items-center gap-2 p-5 hover:scale-[1.03] transition-transform duration-200 no-underline text-center">
            <span className="text-4xl">🎨</span>
            <p className="font-extrabold text-sm" style={{ color: 'var(--gold)' }}>שמיכת הטלאים</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ציורי כל המשפחות</p>
          </a>
        </div>
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
