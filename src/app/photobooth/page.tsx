import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PhotoBooth, { PhotoGallery } from './PhotoBooth'

export const metadata: Metadata = { title: 'עמדת צילום 📸 | פסח בקיבוץ' }

export default async function PhotoBoothPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('photobooth_photos')
    .select('id, family_name, photo_url, frame_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const photos = data ?? []

  return (
    <main className="min-h-dvh flex flex-col max-w-2xl mx-auto px-4 py-6 gap-8">
      <a href="/" className="self-start text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        ← חזרה לדף הבית
      </a>

      <header className="text-center fade-in">
        <p className="text-5xl mb-2">📸</p>
        <h1 className="heading-hero mb-1">עמדת הצילום</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          צלמו סלפי משפחתי עם מסגרת חגיגית ועלו לגלריה הקהילתית!
        </p>
      </header>

      <PhotoBooth />

      <section className="fade-in">
        <h2 className="heading-section text-center mb-5">
          🖼 גלריית הקיבוץ
        </h2>
        <PhotoGallery photos={photos} />
      </section>
    </main>
  )
}
