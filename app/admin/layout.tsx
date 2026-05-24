import AdminNavbar from "./components/AdminNavbar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-dark">
            <AdminNavbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
