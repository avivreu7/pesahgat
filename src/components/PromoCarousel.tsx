'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface PromoImage {
  id: string
  title: string
  image_url: string
}

const INTERVAL_MS = 4_000

export default function PromoCarousel({ images: initial }: { images: PromoImage[] }) {
  const [images,  setImages]  = useState<PromoImage[]>(initial)
  const [idx,     setIdx]     = useState(0)
  const [paused,  setPaused]  = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* Fetch fresh data on mount so new images appear without waiting for page cache */
  useEffect(() => {
    fetch('/api/promo-images', { cache: 'no-store' })
      .then(r => r.json())
      .then((data: PromoImage[]) => { if (Array.isArray(data) && data.length > 0) setImages(data) })
      .catch(() => {/* silent */})
  }, [])

  const go = useCallback((next: number) => {
    setIdx((next + images.length) % images.length)
  }, [images.length])

  /* Auto-advance */
  useEffect(() => {
    if (images.length <= 1 || paused) return
    timerRef.current = setInterval(() => setIdx(prev => (prev + 1) % images.length), INTERVAL_MS)
    return () => clearInterval(timerRef.current!)
  }, [paused, images.length])

  /* Reset index if images shrink */
  useEffect(() => {
    setIdx(prev => (images.length > 0 ? prev % images.length : 0))
  }, [images.length])

  if (images.length === 0) return null

  const single = images.length === 1

  return (
    <section className="w-full max-w-3xl mx-auto fade-in">
      <h2 className="heading-section text-center mb-4">📸 גלריית הקיבוץ</h2>

      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ boxShadow: '0 8px 32px rgba(90,55,10,0.18)' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slides */}
        <div
          style={{
            display: 'flex',
            transform: `translateX(-${idx * 100}%)`,
            transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            direction: 'ltr',
          }}
        >
          {images.map((img, i) => (
            <div key={img.id} style={{ minWidth: '100%', position: 'relative' }}>
              <img
                src={img.image_url}
                alt={img.title || `תמונה ${i + 1}`}
                style={{
                  width: '100%',
                  height: 'clamp(200px, 50vw, 420px)',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {img.title && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '10px 16px',
                  background: 'linear-gradient(transparent, rgba(30,18,4,0.72))',
                  color: 'white', fontSize: '0.9rem', fontWeight: 700,
                  textAlign: 'right',
                }}>
                  {img.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Arrows */}
        {!single && (
          <>
            <button
              onClick={() => go(idx - 1)}
              aria-label="הקודם"
              style={{
                position: 'absolute', top: '50%', right: 10,
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                color: 'white', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '50%', width: 40, height: 40,
                fontSize: 20, cursor: 'pointer', lineHeight: 1,
              }}
            >›</button>
            <button
              onClick={() => go(idx + 1)}
              aria-label="הבא"
              style={{
                position: 'absolute', top: '50%', left: 10,
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                color: 'white', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '50%', width: 40, height: 40,
                fontSize: 20, cursor: 'pointer', lineHeight: 1,
              }}
            >‹</button>
          </>
        )}
      </div>

      {/* Dots */}
      {!single && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`תמונה ${i + 1}`}
              style={{
                width: idx === i ? 20 : 8, height: 8,
                borderRadius: 9999,
                background: idx === i ? 'var(--wheat)' : 'rgba(90,55,10,0.22)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
