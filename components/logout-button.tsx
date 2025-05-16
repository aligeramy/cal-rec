"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-0"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Logout
    </Button>
  )
} 