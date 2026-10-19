import * as React from 'react'
import {
  FileText,
  Presentation,
  Loader2,
  AlertCircle,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { ReactPptxViewer } from '@extend-ai/react-pptx'
import '@extend-ai/react-pptx/styles.css'
import type { LearningMaterial } from '~/lib/admin-store'

interface DocumentPreviewViewerProps {
  material: LearningMaterial
}

export function DocumentPreviewViewer({ material }: DocumentPreviewViewerProps) {
  const [isIframeLoading, setIsIframeLoading] = React.useState(true)
  const [pptxError, setPptxError] = React.useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

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
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
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

  return (
    <div
      ref={containerRef}
      className={`bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-sm overflow-hidden flex flex-col transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0'
          : 'h-[calc(100vh-14rem)] min-h-[580px]'
      }`}
    >
      {/* Viewer Sub-toolbar */}
      <div className="px-4 py-2.5 bg-[#F6F6F6] border-b border-[#D2D2D2] flex items-center justify-between text-xs text-[#555555]">
        <div className="flex items-center gap-2">
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
          <span className="truncate max-w-xs sm:max-w-md">{material.title}</span>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Viewer Main Body */}
      <div className="flex-1 relative bg-[#F9F9F9] overflow-hidden">
        {/* Case 1: PDF Viewer */}
        {isPdf && (
          <div className="w-full h-full relative">
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
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
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
          <div className="w-full h-full relative">
            {pptxError ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#FFFFFF]">
                <div className="w-12 h-12 rounded-full bg-[#901B14]/10 text-[#901B14] flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Gagal Membuka Slide Presentasi
                </h3>
                <p className="text-xs text-[#555555] max-w-md">
                  {pptxError}
                </p>
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
              <div className="w-full h-full pptx-viewer-wrapper">
                <ReactPptxViewer
                  source={encodedUrl}
                  mode="slide"
                  defaultZoom="fit-width"
                  showThumbnails
                  showToolbar
                  className="w-full h-full"
                  onError={(err) => {
                    setPptxError(
                      err?.message ||
                        'Berkas PPTX tidak dapat diparsing di peramban. Silakan gunakan tombol unduh berkas.'
                    )
                  }}
                  renderLoading={() => (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F9F9F9] z-10 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#CB2957]" />
                      <p className="text-xs text-[#555555] font-medium">
                        Memuat slide presentasi PPTX...
                      </p>
                    </div>
                  )}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
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
