import { logoutAction } from './login/actions'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top bar */}
      <header className="glass-sm sticky top-0 z-50 mx-3 mt-3 px-5 py-3 flex items-center justify-between rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-(--text-main) text-base">פאנל ניהול – פסח בקיבוץ</span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-ghost text-sm px-4 py-2">
            התנתקות
          </button>
        </form>
      </header>

      {/* Page content */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
