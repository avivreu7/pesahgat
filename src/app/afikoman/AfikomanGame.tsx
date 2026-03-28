'use client'

import { useCallback, useEffect, useState } from 'react'

/* ── Riddle data ─────────────────────────────────────── */
const RIDDLES = [
  {
    id: 0, emoji: '🫓',
    riddle: 'אני לבן, דק ויבש – יצאו איתי ממצרים בחיפזון. מי אני?',
    correct: 'מצה',
    wrong: ['לחם', 'פיתה'],
    funFact: 'הבצק לא הספיק לתפוח לפני יציאת ישראל ממצרים. לכן אוכלים מצה כל שבעת ימי הפסח!',
  },
  {
    id: 1, emoji: '🍷',
    riddle: 'ארבע פעמים שותים אותי בסדר, כנגד ארבע לשונות גאולה. מה שמי?',
    correct: 'ארבע הכוסות',
    wrong: ['כוס אחת', 'שלוש כוסות'],
    funFact: 'ארבע הכוסות כנגד: הוצאתי, הצלתי, גאלתי, לקחתי – ארבע הבטחות שה׳ נתן לעם ישראל.',
  },
  {
    id: 2, emoji: '🌿',
    riddle: 'עשב מר אני, מזכיר את מרירות העבדות במצרים. מה שמי?',
    correct: 'מרור',
    wrong: ['כרפס', 'חסה'],
    funFact: 'נוהגים לאכול חזרת (חריין) כמרור. הטעם החריף מרגיש ממש! הוא מסמל את מרירות העבדות.',
  },
  {
    id: 3, emoji: '🥬',
    riddle: 'ירוק ורענן אני, טובלים אותי במי מלח בתחילת הסדר. מה שמי?',
    correct: 'כרפס',
    wrong: ['מרור', 'חרוסת'],
    funFact: 'מי המלח שבהם טובלים את הכרפס מסמלים את דמעות בני ישראל בימי העבדות במצרים.',
  },
  {
    id: 4, emoji: '📖',
    riddle: 'ספר אני שמספר את סיפור יציאת מצרים. קוראים בי כל ליל סדר. מה שמי?',
    correct: 'הגדה של פסח',
    wrong: ['ספר התורה', 'תהלים'],
    funFact: 'המילה "הגדה" מגיעה מהפסוק "והגדת לבנך". חובה לספר את סיפור יציאת מצרים לילדים!',
  },
  {
    id: 5, emoji: '🦴',
    riddle: 'זרוע צלויה אני, מונחת על קערת הסדר לזכר קרבן פסח. מה אני?',
    correct: 'זרוע',
    wrong: ['עצם', 'ביצה'],
    funFact: 'הזרוע מסמלת את "הזרוע הנטויה" בה הוציא ה׳ את ישראל ממצרים, ואת קרבן הפסח.',
  },
  {
    id: 6, emoji: '🥚',
    riddle: 'עגול ולבן, מבושל ושלם – מונח על קערת הסדר. מי אני?',
    correct: 'ביצה',
    wrong: ['כדור', 'חרוסת'],
    funFact: 'הביצה מסמלת שני דברים: את קרבן החגיגה שהקריבו בבית המקדש, ואת התחדשות החיים.',
  },
  {
    id: 7, emoji: '🍯',
    riddle: 'חום ומתוק, מלא פירות ואגוזים. דומה לטיט שבנו ממנו לבנים. מה שמי?',
    correct: 'חרוסת',
    wrong: ['ריבה', 'דבש'],
    funFact: 'כל קהילה יש לה מתכון שונה – תפוחים, תמרים, אגוזים ויין. הצבע החום מסמל את הטיט.',
  },
  {
    id: 8, emoji: '👦',
    riddle: 'ארבעה בנים בהגדה: חכם, רשע, תם, ו...?',
    correct: 'שאינו יודע לשאול',
    wrong: ['הטיפש', 'הקטן'],
    funFact: 'ארבעת הבנים מסמלים סוגים שונים של אנשים. לכל אחד עונים בצורה המתאימה לו.',
  },
  {
    id: 9, emoji: '🌊',
    riddle: 'קרעתי לשניים כדי שבני ישראל יעברו ביבשה. מה שמי?',
    correct: 'קריעת ים סוף',
    wrong: ['הנילוס', 'ים המלח'],
    funFact: 'לפי המדרש, נחשון בן עמינדב קפץ ראשון למים – ורק אז נקרע הים לשתי חלקים!',
  },
  {
    id: 10, emoji: '🫓',
    riddle: 'בסוף הסדר אוכלים אותי, בלעדי הסדר לא נגמר. הילדים גונבים אותי! מה שמי?',
    correct: 'האפיקומן',
    wrong: ['המצה הראשונה', 'כוס שלישית'],
    funFact: '"אפיקומן" ביוונית פירושו "קינוח". הוא חייב להיות הדבר האחרון שאוכלים בסדר הפסח.',
  },
  {
    id: 11, emoji: '🐸',
    riddle: 'עשר מכות הכה ה׳ את פרעה. מה הייתה המכה השנייה?',
    correct: 'צפרדע',
    wrong: ['כינים', 'דם'],
    funFact: 'צפרדעים כבשו כל פינה – הבתים, המיטות ואפילו התנורים! פרעה ביקש שיסירו אותן.',
  },
]

type Riddle = typeof RIDDLES[number]

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Card {
  riddle: Riddle
  isAfikoman: boolean
  answered: boolean   // correctly answered
  flipped: boolean    // currently showing back face
  wrongCount: number
}
interface Confetti {
  id: number; emoji: string; x: number; y: number; tx: number; ty: number; rot: number
}

function spawnConfetti(x: number, y: number): Confetti[] {
  const emojis = ['🎉', '🎊', '✨', '🫓', '🍷', '⭐', '🌟', '🎈']
  return Array.from({ length: 20 }, (_, i) => ({
    id: i, emoji: emojis[i % emojis.length], x, y,
    tx: (Math.random() - 0.5) * 380,
    ty: -(80 + Math.random() * 250),
    rot: (Math.random() - 0.5) * 720,
  }))
}

export default function AfikomanGame() {
  const [cards, setCards]           = useState<Card[] | null>(null)
  const [found, setFound]           = useState(false)
  const [attempts, setAttempts]     = useState(0)
  const [foundCount, setFoundCount] = useState(0)
  const [confetti, setConfetti]     = useState<Confetti[]>([])
  // Quiz state
  const [quizIdx, setQuizIdx]       = useState<number | null>(null)
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null)
  // Explanation overlay (shows funFact for an answered card)
  const [explainRiddle, setExplainRiddle] = useState<Riddle | null>(null)

  useEffect(() => {
    initGame()
    fetch('/api/afikoman')
      .then(r => r.json())
      .then(d => setFoundCount(d.count ?? 0))
      .catch(() => {})
  }, [])

  const initGame = () => {
    const seed = Math.floor(Math.random() * 1_000_000)
    const shuffled = seededShuffle(RIDDLES, seed)
    const afikomanIdx = Math.floor(Math.random() * shuffled.length)
    setCards(shuffled.map((r, i) => ({
      riddle: r, isAfikoman: i === afikomanIdx,
      answered: false, flipped: false, wrongCount: 0,
    })))
    setFound(false); setAttempts(0); setConfetti([])
    setQuizIdx(null); setQuizResult(null); setExplainRiddle(null)
  }

  /* Tap a card:
     - not answered → open quiz
     - answered     → toggle flip (re-view answer or close it) */
  const tapCard = (idx: number) => {
    if (!cards || found) return
    const card = cards[idx]
    if (!card.answered) {
      const opts = seededShuffle([card.riddle.correct, ...card.riddle.wrong], idx * 7 + Date.now() % 100)
      setQuizOptions(opts)
      setQuizIdx(idx)
      setQuizResult(null)
    } else {
      setCards(prev => prev && prev.map((c, i) => i === idx ? { ...c, flipped: !c.flipped } : c))
    }
  }

  /* Close a revealed card (flip back to front) */
  const closeCard = (idx: number) => {
    setCards(prev => prev && prev.map((c, i) => i === idx ? { ...c, flipped: false } : c))
  }

  /* Answer quiz */
  const answerQuiz = useCallback((answer: string, e: React.MouseEvent) => {
    if (quizIdx === null || quizResult !== null || !cards) return
    const card = cards[quizIdx]
    const isCorrect = answer === card.riddle.correct

    setAttempts(a => a + 1)

    if (isCorrect) {
      setQuizResult('correct')
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setTimeout(() => {
        setCards(prev => prev && prev.map((c, i) =>
          i === quizIdx ? { ...c, answered: true, flipped: true } : c
        ))
        if (card.isAfikoman) {
          setFound(true)
          setConfetti(spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2))
          setTimeout(() => setConfetti([]), 1800)
          fetch('/api/afikoman', { method: 'POST' })
            .then(r => r.json()).then(d => setFoundCount(d.count ?? 0)).catch(() => {})
        }
        setQuizIdx(null); setQuizResult(null)
      }, 650)
    } else {
      setQuizResult('wrong')
      setCards(prev => prev && prev.map((c, i) =>
        i === quizIdx ? { ...c, wrongCount: c.wrongCount + 1 } : c
      ))
    }
  }, [quizIdx, quizResult, cards])

  if (!cards) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <p className="text-lg font-bold animate-pulse" style={{ color: 'var(--wheat)' }}>טוען...</p>
      </main>
    )
  }

  const activeCard = quizIdx !== null ? cards[quizIdx] : null

  return (
    <main className="min-h-dvh flex flex-col items-center px-4 py-8 pb-24 gap-6" style={{ position: 'relative' }}>

      {/* Confetti */}
      {confetti.map(c => (
        <span key={c.id} className="confetti-piece"
          style={{ left: c.x, top: c.y, '--tx': `${c.tx}px`, '--ty': `${c.ty}px`, '--rot': `${c.rot}deg` } as React.CSSProperties}>
          {c.emoji}
        </span>
      ))}

      {/* ── Explanation overlay ──────────────────────────── */}
      {explainRiddle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(42,31,10,0.65)', backdropFilter: 'blur(6px)' }}>
          <div className="glass p-7 max-w-sm w-full text-center fade-in flex flex-col gap-4">
            <span style={{ fontSize: '3.5rem' }}>{explainRiddle.emoji}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                התשובה
              </p>
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--wine)' }}>
                {explainRiddle.correct}
              </h2>
            </div>
            <div className="rounded-xl p-4 text-sm leading-relaxed text-right"
              style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.28)', color: 'var(--text-card)' }}>
              <span className="font-bold" style={{ color: 'var(--wheat)' }}>💡 ידעת? </span>
              {explainRiddle.funFact}
            </div>
            <button onClick={() => setExplainRiddle(null)} className="btn-gold">
              הבנתי! ✓
            </button>
          </div>
        </div>
      )}

      {/* ── Quiz modal ───────────────────────────────────── */}
      {quizIdx !== null && activeCard && !found && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(42,31,10,0.65)', backdropFilter: 'blur(6px)' }}>
          <div className="glass p-6 max-w-sm w-full text-center fade-in flex flex-col gap-4">
            <span style={{ fontSize: '3rem' }}>{activeCard.riddle.emoji}</span>
            <p className="font-bold text-base leading-relaxed" style={{ color: 'var(--text-main)' }}>
              {activeCard.riddle.riddle}
            </p>
            <div className="flex flex-col gap-2">
              {quizOptions.map(opt => {
                const isCorrect = opt === activeCard.riddle.correct
                let bg = 'rgba(255,252,235,0.85)', border = '1.5px solid rgba(212,168,67,0.35)', color = 'var(--text-main)'
                if (quizResult === 'correct' && isCorrect) {
                  bg = 'rgba(34,197,94,0.2)'; border = '2px solid rgba(34,197,94,0.7)'; color = '#166534'
                }
                return (
                  <button key={opt} style={{
                    width: '100%', padding: '10px 16px', borderRadius: '0.75rem',
                    fontWeight: 700, fontSize: '0.95rem',
                    cursor: quizResult ? 'default' : 'pointer',
                    border, background: bg, color, transition: 'all 0.2s',
                  }}
                    onClick={e => answerQuiz(opt, e)}
                    disabled={quizResult !== null}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {quizResult === 'correct' && (
              <p className="text-sm font-bold fade-in" style={{ color: 'var(--grass)' }}>
                ✅ נכון! {activeCard.riddle.funFact}
              </p>
            )}
            {quizResult === 'wrong' && (
              <div className="fade-in flex flex-col gap-2">
                <p className="text-sm font-bold" style={{ color: 'var(--wine)' }}>❌ לא נכון! נסה שוב</p>
                {activeCard.wrongCount >= 2 && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    💡 רמז: {activeCard.riddle.funFact}
                  </p>
                )}
                <button onClick={() => setQuizResult(null)} className="btn-ghost text-sm">נסה שוב →</button>
              </div>
            )}
            {quizResult === null && (
              <button onClick={() => setQuizIdx(null)} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                ← דלג לעכשיו
              </button>
            )}
          </div>
        </div>
      )}

      <a href="/" className="self-start text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← חזרה</a>

      <header className="text-center fade-in w-full max-w-lg">
        <p className="text-5xl mb-2">🫓</p>
        <h1 className="heading-hero hero-pulse mb-1">מצא את האפיקומן!</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          פתור חידות פסח כדי לחשוף כרטיסים – אחד מהם מסתיר את האפיקומן!
        </p>
      </header>

      <div className="glass-sm px-6 py-3 flex gap-6 text-center">
        <div>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--wheat)' }}>{attempts}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ניסיונות</p>
        </div>
        <div className="w-px" style={{ background: 'rgba(212,168,67,0.25)' }} />
        <div>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--wheat)' }}>{foundCount}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ילדים מצאו היום</p>
        </div>
      </div>

      {found && (
        <div className="glass p-8 text-center fade-in max-w-sm w-full">
          <p className="text-6xl mb-3">🎉</p>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--wine)' }}>מצאת את האפיקומן!</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{attempts} ניסיונות 🌟</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>סה״כ {foundCount} ילדים מצאו היום</p>
          <button onClick={initGame} className="btn-gold">🔄 שחק שוב</button>
        </div>
      )}

      {!found && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg fade-in">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`flip-card ${card.flipped ? 'flipped' : ''}`}
              style={{ height: '140px', cursor: 'pointer' }}
              onClick={() => tapCard(idx)}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && tapCard(idx)}
            >
              <div className="flip-card-inner">
                {/* ── Front face ── */}
                <div className="flip-card-front" style={{
                  background: card.answered
                    ? 'rgba(90,138,60,0.12)'
                    : card.wrongCount > 0
                      ? 'rgba(139,38,53,0.08)'
                      : 'rgba(255,252,235,0.88)',
                  border: `1px solid ${card.answered ? 'rgba(90,138,60,0.4)' : card.wrongCount > 0 ? 'rgba(139,38,53,0.3)' : 'rgba(212,168,67,0.4)'}`,
                  padding: '10px 8px',
                  boxShadow: '0 4px 12px rgba(90,55,10,0.1)',
                }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{card.riddle.emoji}</span>
                  <p style={{
                    fontSize: '0.58rem', fontWeight: 600,
                    color: card.answered ? 'var(--grass)' : 'var(--text-muted)',
                    textAlign: 'center', lineHeight: 1.35, marginTop: '6px', padding: '0 2px',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {card.answered
                      ? `✓ ${card.riddle.correct}`
                      : card.wrongCount > 0
                        ? `❌ ${card.wrongCount} שגיאה${card.wrongCount > 1 ? 'ות' : ''}`
                        : 'לחץ לחידה 🤔'}
                  </p>
                </div>

                {/* ── Back face ── */}
                <div className="flip-card-back" style={{
                  background: card.isAfikoman
                    ? 'linear-gradient(135deg, rgba(212,168,67,0.45), rgba(212,168,67,0.2))'
                    : 'rgba(255,252,235,0.92)',
                  border: `2px solid ${card.isAfikoman ? 'rgba(212,168,67,0.8)' : 'rgba(90,138,60,0.45)'}`,
                  padding: '8px 6px',
                  boxShadow: card.isAfikoman ? '0 0 24px rgba(212,168,67,0.5)' : '0 4px 12px rgba(90,55,10,0.1)',
                }}>
                  {card.isAfikoman ? (
                    <>
                      <span style={{ fontSize: '2.6rem' }}>🫓</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--wine)', fontWeight: 800 }}>מצאת!</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{card.riddle.emoji}</span>
                      <span style={{
                        fontSize: '0.62rem', color: 'var(--grass)', fontWeight: 800,
                        textAlign: 'center', padding: '0 4px', lineHeight: 1.2,
                      }}>
                        {card.riddle.correct}
                      </span>

                      {/* Action buttons row */}
                      <div
                        style={{ display: 'flex', gap: '4px', marginTop: '4px' }}
                        onClick={e => e.stopPropagation()}  // prevent card tap from firing
                      >
                        {/* Explanation button */}
                        <button
                          onClick={() => setExplainRiddle(card.riddle)}
                          style={{
                            fontSize: '0.52rem', fontWeight: 700, padding: '3px 7px',
                            borderRadius: '0.5rem', border: '1px solid rgba(212,168,67,0.5)',
                            background: 'rgba(212,168,67,0.15)', color: 'var(--wheat)',
                            cursor: 'pointer',
                          }}
                        >
                          💡 הסבר
                        </button>
                        {/* Close / flip-back button */}
                        <button
                          onClick={() => closeCard(idx)}
                          style={{
                            fontSize: '0.52rem', fontWeight: 700, padding: '3px 7px',
                            borderRadius: '0.5rem', border: '1px solid rgba(90,138,60,0.5)',
                            background: 'rgba(90,138,60,0.15)', color: 'var(--grass)',
                            cursor: 'pointer',
                          }}
                        >
                          סגור ✕
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!found && attempts === 0 && (
        <p className="text-xs text-center fade-in" style={{ color: 'var(--text-muted)' }}>
          לחץ על כרטיס, ענה נכון לחידה – חשוף מה מתחתיו!
        </p>
      )}
    </main>
  )
}
