'use client'

import { useState } from 'react'

interface Promo { id: string; title: string; video_url: string }

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

function VideoCard({ promo }: { promo: Promo }) {
  const [playing, setPlaying] = useState(false)
  const ytId = extractYoutubeId(promo.video_url)
  const direct = isDirectVideo(promo.video_url)

  return (
    <div className="glass overflow-hidden rounded-2xl">
      {ytId ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
            title={promo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : direct ? (
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          {playing ? (
            <video
              src={promo.video_url}
              controls autoPlay
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <span style={{ fontSize: '3.5rem' }}>▶️</span>
              <span className="text-white font-bold text-sm">{promo.title}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <a href={promo.video_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm px-5 py-2">
            ▶ פתח סרטון
          </a>
        </div>
      )}
      <p className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{promo.title}</p>
    </div>
  )
}

export default function PromoVideos({ promos }: { promos: Promo[] }) {
  if (!promos.length) return null

  return (
    <section className="w-full max-w-3xl mx-auto mt-6 fade-in">
      <h2 className="heading-section text-center mb-5">
        🎬 בזמן שמחכים – תראו את אלה
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {promos.map(promo => <VideoCard key={promo.id} promo={promo} />)}
      </div>
    </section>
  )
}
