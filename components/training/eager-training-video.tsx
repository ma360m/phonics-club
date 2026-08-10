'use client'

import { useEffect, useRef, type VideoHTMLAttributes } from 'react'

type EagerTrainingVideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  src: string
}

export function EagerTrainingVideo({ src, ...props }: EagerTrainingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.load()

    const playVideo = () => {
      if (!document.hidden) {
        void video.play().catch(() => {})
      }
    }

    playVideo()
    document.addEventListener('visibilitychange', playVideo)
    return () => document.removeEventListener('visibilitychange', playVideo)
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      {...props}
    />
  )
}
