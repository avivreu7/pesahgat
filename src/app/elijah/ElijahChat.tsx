'use client'

import { useEffect, useRef, useState } from 'react'

interface Message { role: 'user' | 'model'; content: string }

const WELCOME: Message = {
  role: 'model',
  content: 'שלום שלום! אני אליהו הנביא, ובאתי לבקר אתכם בקיבוץ גת לליל הסדר! 🍷 שאלו אותי כל שאלה – על פסח, על החיים, על הכנדלך... רק אל תשאלו מה מחיר הדירות! 😄',
}

export default function ElijahChat() {
  const [messages,  setMessages]  = useState<Message[]>([WELCOME])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [limited,   setLimited]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const newUser: Message = { role: 'user', content: text }
    const history = [...messages, newUser]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/elijah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.filter(m => m.role !== 'model' || m !== WELCOME) }),
      })
      const { reply, limitReached } = await res.json()
      setMessages(prev => [...prev, { role: 'model', content: reply }])
      if (limitReached) setLimited(true)
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'אוי! משהו השתבש... נסה שוב בעוד רגע 🙏' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 220px)', minHeight: 400 }}>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-2" style={{ scrollbarWidth: 'thin' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {m.role === 'model' && (
              <div style={{
                width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--wheat), var(--wine))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
              }}>🧙‍♂️</div>
            )}
            <div style={{
              maxWidth: '75%',
              background: m.role === 'user'
                ? 'rgba(139,38,53,0.88)'
                : 'rgba(255,252,235,0.9)',
              color: m.role === 'user' ? 'white' : 'var(--text-main)',
              borderRadius: m.role === 'user' ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
              padding: '10px 14px',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              border: m.role === 'model' ? '1px solid rgba(212,168,67,0.3)' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--wheat), var(--wine))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            }}>🧙‍♂️</div>
            <div style={{
              background: 'rgba(255,252,235,0.9)',
              borderRadius: '1.2rem', padding: '10px 18px',
              border: '1px solid rgba(212,168,67,0.3)',
            }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(j => (
                  <span key={j} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--wheat)',
                    animation: `dotBounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                    display: 'inline-block',
                  }} />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Limit warning */}
      {limited && (
        <p className="text-center text-sm py-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
          🙏 הגעתי למגבלת השיחות להיום – תבואו לבקר אותי מחר!
        </p>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(212,168,67,0.2)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="שאל את אליהו..."
          className="input flex-1"
          disabled={loading || limited}
          maxLength={300}
        />
        <button
          type="submit"
          disabled={loading || limited || !input.trim()}
          className="btn-primary px-5"
        >
          {loading ? '...' : 'שלח'}
        </button>
      </form>
    </div>
  )
}
