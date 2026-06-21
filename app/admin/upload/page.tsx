'use client'

import { useState } from 'react'
import { ImageUpload } from '@/components/admin/image-upload'
import Image from 'next/image'

export default function AdminUploadPage() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Image Upload</h1>
      <p className="text-muted-foreground mb-8">Upload images to Cloudinary CDN (WebP auto-optimized)</p>
      <div className="max-w-md bg-card rounded-2xl border p-6 space-y-4">
        <ImageUpload folder="phonics-club" onUpload={setUploadedUrl} />
        {uploadedUrl && (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image src={uploadedUrl} alt="Uploaded" fill className="object-cover" />
            </div>
            <input readOnly value={uploadedUrl} className="w-full text-xs rounded-xl border px-3 py-2 bg-muted" />
          </div>
        )}
      </div>
    </div>
  )
}
