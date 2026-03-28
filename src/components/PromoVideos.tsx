interface Promo {
  id: string
  title: string
  video_url: string
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function PromoVideos({ promos }: { promos: Promo[] }) {
  if (!promos.length) return null

  return (
    <section className="w-full max-w-3xl mx-auto mt-6 fade-in">
      <h2 className="heading-section text-center mb-5">
        🎬 בזמן שמחכים – תראו את אלה
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {promos.map(promo => {
          const vid = extractYoutubeId(promo.video_url)
          return (
            <div key={promo.id} className="glass overflow-hidden">
              {vid ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
                    title={promo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="bg-black/20 aspect-video flex items-center justify-center rounded-t-2xl">
                  <span className="text-(--text-muted) text-sm">קישור לא תקין</span>
                </div>
              )}
              <p className="px-4 py-3 font-semibold text-sm text-(--text-main)">{promo.title}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
