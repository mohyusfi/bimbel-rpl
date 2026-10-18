import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  User,
  Clock,
  FileText,
  Download,
  Eye,
} from 'lucide-react'
import {
  STUDENT_PROFILE,
  SCHEDULE_SESSIONS,
  STUDY_MATERIALS,
  type StudyMaterial,
} from '~/lib/mock-student-data'
import { MaterialPreviewModal } from '~/components/student/MaterialPreviewModal'

export const Route = createFileRoute('/student/')({
  ssr: false,
  component: StudentDashboardPage,
})

function StudentDashboardPage() {
  const [selectedMaterial, setSelectedMaterial] = React.useState<StudyMaterial | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [downloadNotice, setDownloadNotice] = React.useState<string | null>(null)

  // Ambil 3 jadwal sesi bimbingan les minggu ini sesuai prototipe
  const weeklySessions = SCHEDULE_SESSIONS.slice(0, 3)

  // Ambil modul digital untuk dashboard
  const displayMaterials = STUDY_MATERIALS.slice(0, 3)

  const handleOpenPreview = (material: StudyMaterial) => {
    setSelectedMaterial(material)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setSelectedMaterial(null)
  }

  const handleDownload = (material: StudyMaterial) => {
    setDownloadNotice(`Mengunduh ${material.fileName}...`)
    const link = document.createElement('a')
    link.href = '#'
    link.setAttribute('download', material.fileName)
    document.body.appendChild(link)
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)

    setTimeout(() => {
      setDownloadNotice(null)
    }, 4000)
  }

  return (
    <>
      {/* 1. Editorial Page Header */}
      <div className="dash-page-header">
        <div className="dash-title-group">
          <h1>Portal Siswa — Ruang Belajar Mandiri</h1>
          <p>
            Akses jadwal belajar bimbingan, unduh materi modul digital, dan pantau nilai rapor.
          </p>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-white text-black border border-[#D2D2D2]">
            <User className="w-3.5 h-3.5 text-[#CB2957]" />
            <span>Akun Siswa: {STUDENT_PROFILE.name} ({STUDENT_PROFILE.grade.replace(' SMA', '')})</span>
          </div>
        </div>
      </div>

      {/* Download notice feedback banner jika aktif */}
      {downloadNotice && (
        <div className="mb-4 p-3 bg-white border-l-4 border-l-[#CB2957] border border-[#D2D2D2] rounded-md text-xs font-semibold text-black flex items-center justify-between shadow-xs">
          <span>{downloadNotice}</span>
          <button
            type="button"
            onClick={() => setDownloadNotice(null)}
            className="text-neutral-500 hover:text-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Clean Editorial KPI Metrics (No Slop Badges) */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Tingkat Kehadiran</div>
          <div className="metric-val num-tabular text-black">96%</div>
          <div className="metric-sub">24 dari 25 sesi bimbingan dihadiri</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Rata-rata Skor Try Out</div>
          <div className="metric-val num-tabular">
            88 <span style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>/ 100</span>
          </div>
          <div className="metric-sub text-neutral-600">+12 poin dibandingkan bulan lalu</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Modul Digital Tersedia</div>
          <div className="metric-val num-tabular">14 Modul</div>
          <div className="metric-sub">Bisa diunduh bebas kapan saja</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Status SPP Maret</div>
          <div className="metric-val text-black" style={{ fontSize: '1.6rem' }}>
            Terverifikasi
          </div>
          <div className="metric-sub">Kwitansi resmi tersedia</div>
        </div>
      </div>

      {/* 3. Jadwal Sesi Bimbingan Les Minggu Ini */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div className="dash-card-title">Jadwal Sesi Bimbingan Les Minggu Ini</div>
          <span className="status-tag status-neutral">
            <Clock className="lucide" /> Zona WITA
          </span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hari &amp; waktu</th>
                <th>Mata pelajaran</th>
                <th>Tutor pengajar</th>
                <th>Ruang kelas</th>
                <th>Status pertemuan</th>
              </tr>
            </thead>
            <tbody>
              {weeklySessions.map((session) => (
                <tr key={session.id}>
                  <td className="font-semibold">{session.day}, {session.time}</td>
                  <td>{session.subject} ({session.topic.split('&')[0].trim()})</td>
                  <td>{session.tutor}</td>
                  <td>{session.room}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black">
                      <Clock className="w-3.5 h-3.5 text-black" />
                      <span>{session.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modul Digital & Lembar Latihan Mandiri */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div className="dash-card-title">Modul Digital &amp; Lembar Latihan Mandiri</div>
          <span className="status-tag status-neutral">Maks. 20 MB / Dokumen</span>
        </div>
        <div className="dash-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {displayMaterials.map((mat) => (
              <div
                key={mat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--surface)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--destructive-bg)',
                      color: 'var(--destructive)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText className="icon-lg" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-black">{mat.fileName}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Diunggah oleh {mat.uploadedBy} <span className="meta-divider" /> Ukuran: {mat.size}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleOpenPreview(mat)}
                  >
                    <Eye className="lucide" /> Lihat Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDownload(mat)}
                  >
                    <Download className="lucide" /> Unduh Modul
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Material Preview Modal */}
      <MaterialPreviewModal
        material={selectedMaterial}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
      />
    </>
  )
}
