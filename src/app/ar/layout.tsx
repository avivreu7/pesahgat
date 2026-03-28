// AR page needs a bare layout — no spring background, no shared shell
export default function ARLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
