import type { Metadata } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata: Metadata = {
  title: '관리자',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // data-admin-root="true" opts this subtree out of the global dark theme
  // (see globals.css "Admin area — light theme override"). Admin forms need
  // white backgrounds and dark text — the public site's dark palette makes
  // form inputs unreadable.
  return (
    <div
      data-admin-root="true"
      className="fixed inset-y-0 right-0 z-50 flex bg-gray-50 text-gray-800 transition-[left] duration-200"
      style={{ left: 'var(--ai-panel-width, 0px)' }}
    >
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 text-gray-800 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
