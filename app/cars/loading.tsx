function SkeletonCard() {
    return (
        <div className="relative bg-surface rounded-2xl overflow-hidden h-[360px] border border-surface-3 animate-pulse">
            <div className="absolute inset-0 bg-surface-2" />
            <div className="absolute top-3 right-3 h-6 w-20 bg-surface-3 rounded-full" />
            <div className="absolute bottom-5 left-5 right-5 space-y-2">
                <div className="h-2 w-10 bg-surface-3 rounded" />
                <div className="h-5 w-32 bg-surface-3 rounded" />
            </div>
        </div>
    )
}

export default function CarsLoading() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-8">

            {/* Filter bar skeleton */}
            <div className="flex justify-center mb-8">
                <div className="h-[52px] w-full max-w-2xl bg-surface animate-pulse rounded-xl" />
            </div>

            {/* Page header skeleton */}
            <div className="mb-6 space-y-2">
                <div className="h-8 w-48 bg-surface rounded-lg animate-pulse" />
                <div className="h-3 w-28 bg-surface-2 rounded animate-pulse" />
            </div>

            {/* Cards grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>

        </div>
    )
}
