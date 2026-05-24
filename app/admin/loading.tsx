export default function AdminLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="space-y-2">
                <div className="h-3 w-24 bg-surface-3 rounded-full" />
                <div className="h-9 w-48 bg-surface-3 rounded-xl" />
            </div>

            {/* KPI cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-surface border border-surface-3 rounded-2xl p-5 space-y-3">
                        <div className="h-3 w-20 bg-surface-3 rounded-full" />
                        <div className="h-8 w-28 bg-surface-3 rounded-lg" />
                        <div className="h-2 w-16 bg-surface-3 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-surface border border-surface-3 rounded-2xl overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-surface-3 last:border-0">
                        <div className="h-4 w-40 bg-surface-3 rounded-full" />
                        <div className="h-4 w-24 bg-surface-3 rounded-full" />
                        <div className="ml-auto h-6 w-16 bg-surface-3 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
