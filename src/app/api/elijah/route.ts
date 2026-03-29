/**
 * Elijah the Prophet Chat — Gemini API + Memory System
 *
 * Requires:
 * 1. GEMINI_API_KEY in .env.local
 * 2. Supabase tables:
 *    CREATE TABLE elijah_usage (
 *      date text PRIMARY KEY,
 *      count integer NOT NULL DEFAULT 0
 *    );
 *    CREATE TABLE elijah_memory (
 *      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *      question text NOT NULL,
 *      answer text NOT NULL,
 *      usage_count integer NOT NULL DEFAULT 1,
 *      created_at timestamptz DEFAULT now()
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

/** Find a relevant memory for the given question */
async function findMemory(question: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    // Extract significant words (length > 2) for keyword search
    const words = question
      .replace(/[^א-תa-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 6)

    if (words.length === 0) {
      // Random fallback from memory
      const { data } = await supabase
        .from('elijah_memory')
        .select('answer')
        .order('usage_count', { ascending: false })
        .limit(10)
      if (data && data.length > 0) {
        return data[Math.floor(Math.random() * data.length)].answer
      }
      return null
    }

    // Search for matching questions
    const orConditions = words.map(w => `question.ilike.%${w}%`).join(',')
    const { data } = await supabase
      .from('elijah_memory')
      .select('id, answer, usage_count')
      .or(orConditions)
      .order('usage_count', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      // Increment usage count
      await supabase
        .from('elijah_memory')
        .update({ usage_count: data[0].usage_count + 1 })
        .eq('id', data[0].id)
      return data[0].answer
    }
    return null
  } catch { return null }
}

/** Save a Gemini response to memory */
async function saveMemory(
  question: string,
  answer: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  try {
    await supabase.from('elijah_memory').insert({ question: question.slice(0, 300), answer })
  } catch { /* silent */ }
}

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: ChatMessage[] }

  const today = new Date().toISOString().slice(0, 10)
  const supabase = await createClient()

  // Check daily usage
  const { data: usage } = await supabase
    .from('elijah_usage')
    .select('count')
    .eq('date', today)
    .maybeSingle()

  const currentCount = usage?.count ?? 0
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content ?? ''

  // If limit reached — try memory first, then generic fallback
  if (currentCount >= DAILY_LIMIT) {
    const memoryReply = await findMemory(lastUserMsg, supabase)
    const reply = memoryReply ?? FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({ reply, limitReached: true })
  }

  // Call Gemini
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { reply: 'אני מצטער, אינני יכול לדבר כרגע. נסו שוב מאוחר יותר! 🙏', limitReached: false },
      { status: 200 },
    )
  }

  const geminiMessages = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini error:', errText)
      // Try memory before giving up
      const memoryReply = await findMemory(lastUserMsg, supabase)
      const reply = memoryReply ?? FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
      return NextResponse.json({ reply, limitReached: false })
    }

    const geminiData = await geminiRes.json()
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'שלום! חג פסח שמח! 🍷'

    // Save to memory + increment counter (fire and forget)
    void saveMemory(lastUserMsg, reply, supabase)
    if (usage) {
      void supabase.from('elijah_usage').update({ count: currentCount + 1 }).eq('date', today)
    } else {
      void supabase.from('elijah_usage').insert({ date: today, count: 1 })
    }

    return NextResponse.json({ reply, limitReached: false })
  } catch (err) {
    console.error('Elijah API error:', err)
    const reply = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({ reply, limitReached: false })
  }
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10)
  const supabase = await createClient()
  const { data } = await supabase.from('elijah_usage').select('count').eq('date', today).maybeSingle()
  const { count: memoryCount } = await supabase.from('elijah_memory').select('*', { count: 'exact', head: true })
  return NextResponse.json({ today, count: data?.count ?? 0, limit: DAILY_LIMIT, memoryCount: memoryCount ?? 0 })
}
