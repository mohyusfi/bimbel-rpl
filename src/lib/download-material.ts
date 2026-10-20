import { supabase } from '~/lib/supabase/client'
import type { LearningMaterial } from '~/lib/admin-store'

/**
 * Downloads the original physical file of a learning material.
 * Prioritizes direct Supabase Storage download if storage_path is present,
 * with graceful fallback to fetch blob and direct anchor download.
 */
export async function downloadMaterialFile(
  material: Pick<LearningMaterial, 'title' | 'fileUrl' | 'storage_path' | 'storagePath'>
): Promise<void> {
  const storagePath = material.storage_path || material.storagePath
  const fileName = material.title || 'dokumen-materi'

  // Strategy 1: Supabase Storage direct download API
  if (storagePath) {
    try {
      const { data, error } = await supabase.storage
        .from('learning-materials')
        .download(storagePath)

      if (!error && data) {
        triggerBlobDownload(data, fileName)
        return
      }
    } catch (err) {
      console.warn('Supabase storage download API warning, trying URL fallback:', err)
    }
  }

  // Strategy 2: Fetch blob from fileUrl to trigger real file download
  if (material.fileUrl && material.fileUrl !== '#') {
    try {
      const response = await fetch(material.fileUrl)
      if (response.ok) {
        const blob = await response.blob()
        triggerBlobDownload(blob, fileName)
        return
      }
    } catch (err) {
      console.warn('Fetch blob download warning, falling back to anchor trigger:', err)
    }

    // Strategy 3: Standard anchor download
    triggerAnchorDownload(material.fileUrl, fileName)
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob)
  triggerAnchorDownload(blobUrl, fileName)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

function triggerAnchorDownload(url: string, fileName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link)
    }
  }, 150)
}
