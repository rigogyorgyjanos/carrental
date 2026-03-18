// app/admin/layout.tsx
import AdminNavbar from "./components/AdminNavbar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar minden admin oldalon */}
            <AdminNavbar />
            {/* Oldal tartalom */}
            <main className="flex-1 p-6 bg-gray-100">
                {children}
            </main>
        </div>
    )
}