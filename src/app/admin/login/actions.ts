'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const passcode = formData.get('passcode') as string
  const from = (formData.get('from') as string) || '/admin'

  if (passcode === process.env.ADMIN_PASSCODE) {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })
    redirect(from)
  }

  // Return error signal via searchParam redirect
  redirect(`/admin/login?error=1&from=${encodeURIComponent(from)}`)
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin/login')
}
