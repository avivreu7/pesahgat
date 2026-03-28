'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface GifResult {
  id: string
  url: string        // display (fixed_height_small)
  original: string   // stored in DB (fixed_height)
  title: string
}

interface Props {
  onSelect: (gif: GifResult) => void
  selected: GifResult | null
  onClear: () => void
}

const API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? ''

export default function GiphyPicker({ onSelect, selected, onClear }: Props) {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState<GifResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]     = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    if (!API_KEY || API_KEY === 'your_giphy_api_key_here') {
      // Demo mode: show placeholder when key not set
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(q)}&limit=12&rating=g&lang=iw`
      )
      const json = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setResults((json.data ?? []).map((g: any) => ({
        id:       g.id,
        url:      g.images.fixed_height_small.url,
        original: g.images.fixed_height.url,
        title:    g.title,
      })))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  /* Debounce search */
  useEffect(() => {
    clearTimeout(debounceRef.current!)
    debounceRef.current = setTimeout(() => search(query), 450)
    return () => clearTimeout(debounceRef.current!)
  }, [query, search])

  /* ── Already selected: show preview + change button ── */
  if (selected) {
    return (
      <div className="flex items-center gap-3 glass-sm p-2">
        <img src={selected.url} alt={selected.title} className="h-16 w-auto rounded-lg object-cover" />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-xs font-semibold text-(--text-muted) truncate">{selected.title}</p>
          <button type="button" onClick={onClear} className="btn-ghost text-xs px-3 py-1 self-start">
            ✕ הסר GIF
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="btn-ghost text-sm self-start"
      >
        {open ? '▲ סגור חיפוש GIF' : '🎞 הוסף GIF (אופציונלי)'}
      </button>

      {open && (
        <div className="glass-sm p-3 flex flex-col gap-3">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש GIF... (באנגלית לתוצאות טובות יותר)"
            className="input text-sm"
            autoFocus
          />

          {!API_KEY || API_KEY === 'your_giphy_api_key_here' ? (
            <p className="text-xs text-(--text-muted) text-center py-2">
              הגדר NEXT_PUBLIC_GIPHY_API_KEY ב-.env.local כדי להפעיל GIF
            </p>
          ) : loading ? (
            <p className="text-xs text-(--text-muted) text-center py-3 animate-pulse">מחפש...</p>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {results.map(gif => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => { onSelect(gif); setOpen(false); setQuery(''); setResults([]) }}
                  className="rounded-lg overflow-hidden border-2 border-transparent hover:border-[var(--sage)] transition-all duration-150 focus:outline-none focus:border-[var(--sage)]"
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-20 object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <p className="text-xs text-(--text-muted) text-center py-2">לא נמצאו תוצאות</p>
          ) : (
            <p className="text-xs text-(--text-muted) text-center py-2">הקלד כדי לחפש GIF</p>
          )}

          {/* Giphy attribution */}
          {results.length > 0 && (
            <p className="text-[10px] text-(--text-muted) text-center opacity-60">
              Powered by GIPHY
            </p>
          )}
        </div>
      )}
    </div>
  )
}
