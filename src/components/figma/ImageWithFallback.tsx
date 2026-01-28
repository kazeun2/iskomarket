import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [srcOverride, setSrcOverride] = useState<string | null>(null)
  const [attemptedRepair, setAttemptedRepair] = useState(false)

  const handleError = async () => {
    // Try a best-effort repair when the URL looks like a Supabase storage public URL
    try {
      if (!attemptedRepair && typeof props.src === 'string' && props.src.includes('/product-images/')) {
        setAttemptedRepair(true)
        // Extract path after '/product-images/'
        const match = (props.src as string).match(/product-images\/(.+)$/)
        const filePath = match ? decodeURIComponent(match[1]) : null
        if (filePath) {
          try {
            const { data: signedData, error } = await supabase.storage.from('product-images').createSignedUrl(filePath, 60 * 60 * 24)
            if (!error && signedData && signedData.signedUrl) {
              setSrcOverride(signedData.signedUrl)
              // Leave didError false so image will try to load again
              return
            }
          } catch (e) {
            console.debug('ImageWithFallback: createSignedUrl failed', e)
          }
        }
      }
    } catch (e) {
      console.debug('ImageWithFallback: repair attempt failed', e)
    }

    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props
  const currentSrc = srcOverride || (src as string)

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={currentSrc} />
      </div>
    </div>
  ) : (
    <img src={currentSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
