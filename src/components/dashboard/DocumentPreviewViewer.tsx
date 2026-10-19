import * as React from 'react'
import {
  FileText,
  Presentation,
  Loader2,
  AlertCircle,
  Download,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { ReactPptxViewer, type PptxViewerController } from '@extend-ai/react-pptx'
import '@extend-ai/react-pptx/styles.css'
import type { LearningMaterial } from '~/lib/admin-store'

interface DocumentPreviewViewerProps {
  material: LearningMaterial
}

export function DocumentPreviewViewer({ material }: DocumentPreviewViewerProps) {
  const [isIframeLoading, setIsIframeLoading] = React.useState(true)
  const [pptxError, setPptxError] = React.useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [currentSlide, setCurrentSlide] = React.useState<number>(0)
  const [totalSlides, setTotalSlides] = React.useState<number>(0)
  const [showThumbnails, setShowThumbnails] = React.useState<boolean>(true)
  const [zoomLevel, setZoomLevel] = React.useState<number>(100)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const controllerRef = React.useRef<PptxViewerController | null>(null)

  const isPdf = material.fileType === 'PDF'
  const isPptx = material.fileType === 'PPTX'

  const encodedUrl = React.useMemo(() => {
    if (!material.fileUrl || material.fileUrl === '#') return ''
    return encodeURI(material.fileUrl)
  }, [material.fileUrl])

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current
          .requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(() => setIsFullscreen(true))
      } else {
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(() => setIsFullscreen(false))
      } else {
        setIsFullscreen(false)
      }
    }
  }

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const [inputSlideValue, setInputSlideValue] = React.useState<string>('1')

  // Slide navigation
  const handleJumpToSlide = React.useCallback(
    (targetIndex: number) => {
      if (totalSlides === 0) return
      const clamped = Math.max(0, Math.min(totalSlides - 1, targetIndex))
      setCurrentSlide(clamped)
      controllerRef.current?.goToSlide(clamped)
    },
    [totalSlides]
  )

  // Sync input value with current active slide
  React.useEffect(() => {
    setInputSlideValue(String(currentSlide + 1))
  }, [currentSlide])

  // Commit typed slide number
  const handleInputCommit = () => {
    const parsed = parseInt(inputSlideValue, 10)
    if (isNaN(parsed) || parsed < 1) {
      setInputSlideValue(String(currentSlide + 1))
      return
    }
    const target = Math.max(1, Math.min(totalSlides, parsed))
    handleJumpToSlide(target - 1)
    setInputSlideValue(String(target))
  }

  // Zoom handlers
  const handleZoomIn = () => {
    const next = Math.min(250, zoomLevel + 15)
    setZoomLevel(next)
    controllerRef.current?.setZoom(next)
  }

  const handleZoomOut = () => {
    const next = Math.max(50, zoomLevel - 15)
    setZoomLevel(next)
    controllerRef.current?.setZoom(next)
  }

  // Keyboard navigation
  React.useEffect(() => {
    if (!isPptx || totalSlides === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        handleJumpToSlide(currentSlide + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        handleJumpToSlide(currentSlide - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPptx, totalSlides, currentSlide, handleJumpToSlide])

  return (
    <div
      ref={containerRef}
      className={`bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-sm overflow-hidden flex flex-col transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0 w-screen h-screen bg-[#121212]'
          : 'h-[calc(100vh-14rem)] min-h-[580px]'
      }`}
    >
      {/* Viewer Sub-toolbar (Hidden in Fullscreen for PPTX to maximize presentation area) */}
      {(!isFullscreen || isPdf) && (
        <div className="px-4 py-2.5 bg-[#F6F6F6] border-b border-[#D2D2D2] flex flex-wrap items-center justify-between gap-3 text-xs text-[#555555] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isPdf ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#000000]">
                <FileText className="w-3.5 h-3.5 text-[#901B14]" />
                <span>Pratinjau Dokumen PDF</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#000000]">
                <Presentation className="w-3.5 h-3.5 text-[#CB2957]" />
                <span>Pratinjau Slide Presentasi PPTX</span>
              </span>
            )}
            <span className="text-[#D2D2D2]">|</span>
            <span className="truncate max-w-xs">{material.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* PPTX-specific controls in normal mode */}
            {isPptx && totalSlides > 0 && (
              <>
                {/* Toggle Sidebar Thumbnail */}
                <button
                  type="button"
                  onClick={() => setShowThumbnails((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[6px] border transition-colors cursor-pointer ${
                    showThumbnails
                      ? 'bg-[#FFFFFF] border-[#D2D2D2] text-[#000000]'
                      : 'bg-[#EAEAEA] border-[#D2D2D2] text-[#777777]'
                  }`}
                  title={
                    showThumbnails
                      ? 'Sembunyikan Panel Slide Samping'
                      : 'Tampilkan Panel Slide Samping'
                  }
                >
                  {showThumbnails ? (
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  ) : (
                    <PanelLeftOpen className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Panel Slide</span>
                </button>

                {/* Direct Jump Slide Selector */}
                <div className="flex items-center gap-1 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleJumpToSlide(currentSlide - 1)}
                    disabled={currentSlide === 0}
                    className="p-1 text-[#555555] hover:text-[#000000] disabled:opacity-30 cursor-pointer"
                    title="Slide Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={inputSlideValue}
                      onChange={(e) => setInputSlideValue(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                      onBlur={handleInputCommit}
                      className="w-8 h-6 text-center font-mono text-xs font-bold text-[#000000] bg-[#F6F6F6] border border-[#D2D2D2] rounded-[4px] focus:outline-none focus:border-[#000000] focus:bg-[#FFFFFF] transition-colors"
                      title="Ketik nomor slide lalu tekan Enter"
                    />
                    <span className="text-xs font-semibold text-[#555555]">
                      / {totalSlides}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJumpToSlide(currentSlide + 1)}
                    disabled={currentSlide >= totalSlides - 1}
                    className="p-1 text-[#555555] hover:text-[#000000] disabled:opacity-30 cursor-pointer"
                    title="Slide Berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom buttons */}
                <div className="hidden md:flex items-center gap-0.5 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] p-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1 text-[#555555] hover:text-[#000000] rounded cursor-pointer"
                    title="Perkecil Zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1 min-w-[36px] text-center text-[#555555]">
                    {Math.round(zoomLevel)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1 text-[#555555] hover:text-[#000000] rounded cursor-pointer"
                    title="Perbesar Zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#555555] hover:text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] transition-colors cursor-pointer"
              title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Mode Layar Penuh'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kecilkan</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Viewer Main Body */}
      <div className="flex-1 relative bg-[#18181b] overflow-hidden flex flex-col min-h-0 w-full h-full">
        {/* Case 1: PDF Viewer */}
        {isPdf && (
          <div className="w-full h-full relative flex-1 min-h-0">
            {isIframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F9F9F9] z-10 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#CB2957]" />
                <p className="text-xs text-[#555555] font-medium">
                  Memuat dokumen PDF...
                </p>
              </div>
            )}
            {encodedUrl ? (
              <iframe
                src={`${encodedUrl}#toolbar=1&navpanes=1`}
                title={material.title}
                onLoad={() => setIsIframeLoading(false)}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FFFFFF]">
                <AlertCircle className="w-8 h-8 text-[#901B14]" />
                <p className="text-xs font-semibold text-[#000000]">
                  URL Berkas PDF Belum Ditetapkan
                </p>
              </div>
            )}
          </div>
        )}

        {/* Case 2: PPTX Slide Viewer */}
        {isPptx && (
          <div className="w-full h-full relative flex-1 min-h-0 flex flex-col">
            {pptxError ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#FFFFFF]">
                <div className="w-12 h-12 rounded-full bg-[#901B14]/10 text-[#901B14] flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Gagal Membuka Slide Presentasi
                </h3>
                <p className="text-xs text-[#555555] max-w-md">{pptxError}</p>
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={encodedUrl}
                    download={material.title}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#000000] text-[#FFFFFF] rounded-[8px] text-xs font-semibold hover:bg-[#222222] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Berkas PPTX</span>
                  </a>
                </div>
              </div>
            ) : encodedUrl ? (
              <div className="pptx-viewer-container flex-1 min-h-0 w-full h-full relative">
                <ReactPptxViewer
                  source={encodedUrl}
                  mode="slide"
                  slideIndex={currentSlide}
                  defaultZoom="fit-width"
                  showThumbnails={showThumbnails}
                  showToolbar={false}
                  height="100%"
                  className="w-full h-full"
                  onReady={(ctrl) => {
                    controllerRef.current = ctrl
                  }}
                  onLoad={(parsed) => {
                    setTotalSlides(parsed.document.slides.length)
                  }}
                  onSlideChange={(newIndex) => {
                    setCurrentSlide(newIndex)
                  }}
                  onZoomChange={(state) => {
                    setZoomLevel(state.resolvedZoom)
                  }}
                  onError={(err) => {
                    setPptxError(
                      err?.message ||
                        'Berkas PPTX tidak dapat diparsing di peramban. Silakan gunakan tombol unduh berkas.'
                    )
                  }}
                  renderLoading={() => (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18181b] z-10 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#CB2957]" />
                      <p className="text-xs text-[#EAEAEA] font-medium">
                        Memuat slide presentasi PPTX...
                      </p>
                    </div>
                  )}
                />

                {/* Floating Centered Bottom Navigation Bar in Fullscreen Mode */}
                {isFullscreen && totalSlides > 0 && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-[#18181b]/95 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5">
                    {/* Previous slide */}
                    <button
                      type="button"
                      onClick={() => handleJumpToSlide(currentSlide - 1)}
                      disabled={currentSlide === 0}
                      className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors cursor-pointer"
                      title="Slide Sebelumnya (Panah Kiri)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Compact Slide Numeric Input */}
                    <div className="flex items-center gap-1.5 px-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={inputSlideValue}
                        onChange={(e) => setInputSlideValue(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur()
                          }
                        }}
                        onBlur={handleInputCommit}
                        className="w-9 h-7 text-center font-mono text-xs font-bold text-white bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/25 rounded-[6px] focus:outline-none transition-colors"
                        title="Ketik nomor slide lalu tekan Enter"
                      />
                      <span className="text-xs font-semibold text-white/80">
                        / {totalSlides}
                      </span>
                    </div>

                    {/* Next slide */}
                    <button
                      type="button"
                      onClick={() => handleJumpToSlide(currentSlide + 1)}
                      disabled={currentSlide >= totalSlides - 1}
                      className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors cursor-pointer"
                      title="Slide Berikutnya (Panah Kanan / Spasi)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="h-4 w-px bg-white/20 mx-1" />

                    {/* Toggle Thumbnail Sidebar */}
                    <button
                      type="button"
                      onClick={() => setShowThumbnails((prev) => !prev)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        showThumbnails
                          ? 'bg-white/25 text-white'
                          : 'hover:bg-white/10 text-white/70'
                      }`}
                      title={
                        showThumbnails
                          ? 'Sembunyikan Panel Slide Samping'
                          : 'Tampilkan Panel Slide Samping'
                      }
                    >
                      {showThumbnails ? (
                        <PanelLeftClose className="w-4 h-4" />
                      ) : (
                        <PanelLeftOpen className="w-4 h-4" />
                      )}
                    </button>

                    {/* Exit Fullscreen Button */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-colors cursor-pointer"
                      title="Keluar Layar Penuh (Esc)"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FFFFFF]">
                <AlertCircle className="w-8 h-8 text-[#901B14]" />
                <p className="text-xs font-semibold text-[#000000]">
                  URL Berkas PPTX Belum Ditetapkan
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
