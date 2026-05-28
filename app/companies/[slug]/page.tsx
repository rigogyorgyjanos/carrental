import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export const dynamic = "force-dynamic"

interface Props {
    params: Promise<{ slug: string }>
}

export default async function CompanyProfilePage({ params }: Props) {
    const { slug } = await params

    const company = await prisma.company.findUnique({
        where: { slug },
        include: {
            products: {
                where:   { active: true, approvalStatus: "APPROVED" },
                orderBy: { createdAt: "desc" },
                include: { images: { take: 1 } },
            },
        },
    })

    if (!company || company.status === "SUSPENDED") notFound()

    const avgRating = company.products
        .filter(p => p.rating != null)
        .reduce((sum, p, _, arr) => sum + (p.rating! / arr.length), 0)

    const totalReviews = company.products.reduce((s, p) => s + (p.reviewCount ?? 0), 0)

    return (
        <div className="bg-dark min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* Back */}
                <Link href="/cars" className="inline-flex items-center gap-1.5 text-muted hover:text-white-soft text-xs font-stats transition-colors mb-8">
                    ← All vehicles
                </Link>

                {/* Company header */}
                <div className="flex flex-col sm:flex-row items-start gap-6 mb-12">
                    {company.logoUrl?.startsWith("http") ? (
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-surface-3 shrink-0">
                            <Image src={company.logoUrl} alt={company.name} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center shrink-0">
                            <span className="text-gold font-heading text-2xl">
                                {company.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <p className="text-gold text-[11px] font-stats uppercase tracking-[0.25em] mb-2">
                            Fleet Operator
                        </p>
                        <h1 className="font-heading text-4xl md:text-5xl font-light text-white-soft mb-3">
                            {company.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm font-stats text-muted">
                            {avgRating > 0 && (
                                <span className="flex items-center gap-1">
                                    <span className="text-gold">★</span>
                                    <span className="text-white-soft font-semibold">{avgRating.toFixed(1)}</span>
                                    <span>({totalReviews} reviews)</span>
                                </span>
                            )}
                            <span>{company.products.length} vehicle{company.products.length !== 1 ? "s" : ""}</span>
                            {company.address && <span>📍 {company.address}</span>}
                            {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer"
                                    className="text-gold/80 hover:text-gold transition-colors">
                                    Website ↗
                                </a>
                            )}
                        </div>

                        {company.description && (
                            <p className="text-muted font-body text-sm leading-relaxed mt-4 max-w-2xl">
                                {company.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Fleet */}
                <div>
                    <h2 className="font-heading text-2xl text-white-soft mb-6">
                        Available Fleet
                        <span className="ml-2 text-sm font-stats text-muted font-normal">
                            ({company.products.length})
                        </span>
                    </h2>

                    {company.products.length === 0 ? (
                        <div className="bg-surface border border-surface-3 rounded-2xl px-6 py-16 text-center">
                            <p className="text-muted text-5xl mb-4">🚗</p>
                            <p className="text-white-soft font-heading text-xl">No vehicles available</p>
                            <p className="text-muted text-sm font-stats mt-2">Check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {company.products.map(car => (
                                <Link
                                    key={car.id}
                                    href={`/cars/${car.id}`}
                                    className="group bg-surface border border-surface-3 rounded-2xl overflow-hidden hover:border-gold/20 transition-colors duration-200"
                                >
                                    {/* Image */}
                                    <div className="relative h-44 bg-surface-2">
                                        {car.images[0]?.url?.startsWith("http") ? (
                                            <Image src={car.images[0].url} alt={car.name} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-muted text-4xl">🚗</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <p className="text-gold text-[10px] font-stats uppercase tracking-wider mb-1">
                                            {car.brand} · {car.category}
                                        </p>
                                        <h3 className="font-heading text-lg text-white-soft mb-2 group-hover:text-gold transition-colors">
                                            {car.name}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs font-stats text-muted">
                                                {(car.rating ?? 0) > 0 && (
                                                    <>
                                                        <span className="text-gold">★</span>
                                                        <span className="text-white-soft">{car.rating}</span>
                                                        <span>({car.reviewCount ?? 0})</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gold font-stats font-bold text-lg">€{car.pricePerDay}</span>
                                                <span className="text-muted text-xs font-stats">/day</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
