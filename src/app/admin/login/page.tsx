import { loginAction } from './actions'

interface Props {
  searchParams: Promise<{ error?: string; from?: string }>
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error, from } = await searchParams

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="glass p-8 w-full max-w-sm fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="heading-section">כניסת מנהל</h1>
          <p className="text-(--text-muted) text-sm mt-1">אזור מוגן – הכנס סיסמת גישה</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-100/70 border border-red-300 text-red-700 text-sm px-4 py-3 text-center font-semibold">
            סיסמה שגויה. נסה שוב.
          </div>
        )}

        {/* Login form */}
        <form action={loginAction} className="flex flex-col gap-4">
          <input type="hidden" name="from" value={from ?? '/admin'} />

          <div>
            <label htmlFor="passcode" className="block text-sm font-600 mb-1.5 text-(--text-main)">
              סיסמת גישה
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              autoComplete="current-password"
              required
              placeholder="הכנס סיסמה..."
              className="input"
              autoFocus
            />
          </div>

          <button type="submit" className="btn-primary mt-2 w-full">
            כניסה
          </button>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a href="/" className="text-(--text-muted) text-sm hover:text-(--sage) underline underline-offset-2 transition-colors">
            ← חזרה לדף הבית
          </a>
        </div>
      </div>
    </main>
  )
}
