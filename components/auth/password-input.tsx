'use client'

import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  name: string
}

export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`pr-11 ${className}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg"
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}
