/**
 * Elijah the Prophet Chat — Gemini API
 *
 * Requires:
 * 1. GEMINI_API_KEY in .env.local
 * 2. Supabase table:
 *    CREATE TABLE elijah_usage (
 *      date text PRIMARY KEY,
 *      count integer NOT NULL DEFAULT 0
 *    );
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DAILY_LIMIT = 80

const SYSTEM_PROMPT = `אתה אליהו הנביא. אתה מבקר הלילה בקיבוץ גת לחגיגת ליל הסדר.
אתה נחמד, מצחיק, חכם ומלא אהבה לכל חברי הקיבוץ.
אתה מדבר עברית שוטפת ועכשווית, לפעמים מוסיף ביטויים ארכאיים מצחיקים.
אתה מכיר היטב את ליל הסדר, ההגדה, יציאת מצרים ומסורות פסח.
אתה מעט מופתע מהטכנולוגיה המודרנית בקיבוץ אבל מתאהב בה.
שמור על תשובות קצרות – 2 עד 4 משפטים בלבד. אל תשתמש בכוכביות לעיצוב.`

const FALLBACK_RESPONSES = [
  'שלום לך, בן הקיבוץ! הלכתי לשתות כוס יין נוספת – כבר השמיני בערב 😄',
  'אני קצת עייף מכל הבתים שביקרתי הלילה... אבל בשבילכם תמיד יש כוח! חג פסח שמח!',
  'שאלה מצוינת, אבל אני נביא – לא גוגל! 😄 חג שמח לכל בית בקיבוץ גת!',
  'כל ליל הסדר אני מסתובב ומסתובב... שמחתי לבקר אתכם בקיבוץ גת! 🍷',
  'הנה – שתיתי כוסי ועת לנוח קצת. חג פסח שמח לכולם! 🌿',
]

interface ChatMessage { role: 'user' | 'model'; content: string }

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: ChatMessage[] }

  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
  const supabase = await createClient()

  // Check daily usage
  const { data: usage } = await supabase
    .from('elijah_usage')
    .select('count')
    .eq('date', today)
    .maybeSingle()

  const currentCount = usage?.count ?? 0

  if (currentCount >= DAILY_LIMIT) {
    const reply = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({ reply, limitReached: true })
  }

  // Call Gemini
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY חסר' }, { status: 500 })
  }

  const geminiMessages = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    return NextResponse.json({ error: err }, { status: 502 })
  }

  const geminiData = await geminiRes.json()
  const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'שלום! חג פסח שמח! 🍷'

  // Increment usage counter
  if (usage) {
    await supabase.from('elijah_usage').update({ count: currentCount + 1 }).eq('date', today)
  } else {
    await supabase.from('elijah_usage').insert({ date: today, count: 1 })
  }

  return NextResponse.json({ reply, limitReached: false })
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)
  const supabase = await createClient()
  const { data } = await supabase.from('elijah_usage').select('count').eq('date', today).maybeSingle()
  return NextResponse.json({ today, count: data?.count ?? 0, limit: DAILY_LIMIT })
}
