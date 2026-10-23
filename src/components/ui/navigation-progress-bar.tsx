import * as React from 'react'
import { useRouterState } from '@tanstack/react-router'

export function NavigationProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  const [visible, setVisible] = React.useState(Boolean(isLoading))

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (isLoading) {
      setVisible(true)
    } else {
      timer = setTimeout(() => {
        setVisible(false)
      }, 250)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      role="progressbar"
      aria-label="Memuat navigasi halaman"
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden pointer-events-none bg-[#D2D2D2]/40"
    >
      <div className="h-full w-1/2 bg-[#CB2957] animate-navigation-progress" />
    </div>
  )
}
