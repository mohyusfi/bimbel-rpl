import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { StudentSidebar } from '~/components/student/StudentSidebar'
import { StudentHeader } from '~/components/student/StudentHeader'

export const Route = createFileRoute('/student')({
  ssr: false,
  component: StudentLayout,
})

function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="app-wrapper flex min-h-screen bg-[#EEEEEE] text-neutral-900 font-sans">
      {/* Desktop/Laptop Sidebar (Permanent) */}
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      {/* Mobile & Tablet Drawer & Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={handleCloseSidebar}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <StudentSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      </div>

      {/* App Main Canvas */}
      <main className="app-main flex-1 flex flex-col min-w-0 min-h-screen">
        <StudentHeader onToggleSidebar={handleToggleSidebar} />
        <div className="app-content p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
