'use client'

import { LogOut } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Sign out</span>
      </button>
    </form>
  )
}
