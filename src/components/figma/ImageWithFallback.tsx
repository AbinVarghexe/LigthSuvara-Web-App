import React, { useState } from 'react'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../lib/utils'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const handleError = () => {
    setDidError(true)
    setIsLoaded(true)
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const { src, alt, style, className, ...rest } = props

  return (
    <div className={cn("relative overflow-hidden", className)} style={style}>
      {!isLoaded && !didError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {didError ? (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 text-center align-middle">
          <div className="flex items-center justify-center w-full h-full">
            <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} className="w-1/2 h-1/2 object-contain opacity-50" />
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full object-cover transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
          loading="lazy"
          {...rest}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
    </div>
  )
}
