export const metadata = {
  hideSidebar: true, // Sidebar akan dinonaktifkan
}

export default function SidebarFalse() {
  return (
    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
      <h1>Halaman Tanpa Sidebar</h1>
    </div>
  )
}
