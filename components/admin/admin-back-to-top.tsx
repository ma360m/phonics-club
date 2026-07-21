'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminBackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const root = document.getElementById('admin-scroll-root')
    if (!root) return

    const update = () => setVisible(root.scrollTop > 480)
    update()
    root.addEventListener('scroll', update, { passive: true })
    return () => root.removeEventListener('scroll', update)
  }, [])

  function scrollToTop() {
    document.getElementById('admin-scroll-root')?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!visible) return null

  return (
    <Button
      type="button"
      size="icon"
      className="fixed bottom-5 right-5 z-50 h-11 w-11 rounded-full bg-[#1D4ED8] shadow-lg hover:bg-[#1D4ED8]/90"
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </Button>
  )
}
