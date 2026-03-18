import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export default async function LandingPage() {

  const session = await getServerSession(authOptions)
  const user = session?.user

  const featuredCars = await prisma.product.findMany({
    where: { featured: true },
    take: 3
  })

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">


      {/* HERO */}
      <section className="relative min-h-[85svh] flex items-center justify-center text-white overflow-hidden">

        {/* Background Image */}
        <img
          src="/hero-car.jpg"
          alt="Luxury car"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 w-150 h-150 bg-blue-500/20 blur-3xl -translate-x-1/2 -translate-y-1/2 z-0" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Drive Your
            <span className="text-blue-400"> Dream Car</span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Discover luxury vehicles, book instantly, and experience driving
            like never before.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

            <Link
              href="/cars"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transition"
            >
              Browse Cars
            </Link>

            <Link
              href="/login"
              className="border border-white/40 hover:bg-white/10 px-8 py-4 rounded-full text-lg transition"
            >
              Sign In
            </Link>

          </div>

          {/* Booking bar */}
          <div className="mt-16 mx-auto max-w-4xl bg-white/95 md:bg-white/90 rounded-2xl p-4 md:p-6 shadow-2xl text-gray-600">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <input
                type="text"
                placeholder="Pickup Location"
                className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none"
              />

              <input
                type="date"
                className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none"
              />

              <input
                type="date"
                className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none"
              />

              <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                Find Cars
              </button>

            </div>

          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 max-w-xl mx-auto text-white">

            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-white/70">Happy Drivers</p>
            </div>

            <div>
              <p className="text-3xl font-bold">120+</p>
              <p className="text-white/70">Premium Cars</p>
            </div>

            <div>
              <p className="text-3xl font-bold">4.9★</p>
              <p className="text-white/70">Customer Rating</p>
            </div>

          </div>

        </div>

      </section>


      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-28">

        <div className="grid md:grid-cols-3 gap-10">

          <div className="group bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition border">

            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-100 text-2xl mb-6 group-hover:scale-110 transition">
              ⚡
            </div>

            <h3 className="text-xl font-semibold mb-3">
              Instant Booking
            </h3>

            <p className="text-gray-600">
              Reserve your car in seconds with our seamless booking system.
            </p>

          </div>


          <div className="group bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition border">

            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-100 text-2xl mb-6 group-hover:scale-110 transition">
              🚗
            </div>

            <h3 className="text-xl font-semibold mb-3">
              Premium Vehicles
            </h3>

            <p className="text-gray-600">
              Choose from sport, luxury, and performance cars.
            </p>

          </div>


          <div className="group bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition border">

            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-blue-100 text-2xl mb-6 group-hover:scale-110 transition">
              🏆
            </div>

            <h3 className="text-xl font-semibold mb-3">
              XP Rewards
            </h3>

            <p className="text-gray-600">
              Earn XP and unlock exclusive rewards every time you drive.
            </p>

          </div>

        </div>

      </section>


      {/* FEATURED CARS */}
      <section className="py-28 bg-gray-50">

        <div className="max-w-7xl mx-auto px-6">

          {/* Section header */}
          <div className="text-center mb-16">

            <p className="text-blue-600 font-semibold mb-3">
              Premium Selection
            </p>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Featured Cars
            </h2>

            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Handpicked luxury and performance vehicles ready for your next ride.
            </p>

          </div>


          {/* Cars grid */}
          <div className="grid md:grid-cols-3 gap-10">

            {featuredCars.map((car) => (

              <div
                key={car.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300"
              >

                {/* Image */}
                <div className="relative overflow-hidden">

                  <img
                    src={car.image}
                    alt={car.name}
                    className="h-60 w-full object-cover group-hover:scale-110 transition duration-500"
                  />

                  {/* Price badge */}
                  <div className="absolute top-4 left-4 bg-white px-4 py-1.5 rounded-full text-sm font-semibold shadow">
                    €{car.pricePerDay}/day
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />

                </div>


                {/* Card content */}
                <div className="p-6">

                  <h3 className="text-xl font-semibold mb-1">
                    {car.brand} {car.name}
                  </h3>

                  <p className="text-gray-500 text-sm mb-6">
                    Premium performance vehicle
                  </p>


                  <div className="flex items-center justify-between">

                    <Link
                      href={`/cars/${car.id}`}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      View Details →
                    </Link>

                    <Link
                      href={`/cars/${car.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Rent
                    </Link>

                  </div>

                </div>

              </div>

            ))}

          </div>


          {/* Explore all cars */}
          <div className="text-center mt-16">

            <Link
              href="/cars"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg font-semibold shadow-lg transition"
            >
              Browse All Cars
            </Link>

          </div>

        </div>

      </section>


      {/* XP & BADGE SYSTEM */}
      <section className="py-32 bg-white">

        <div className="max-w-6xl mx-auto px-6 text-center">

          <p className="text-blue-600 font-semibold mb-3">
            Gamified Driving
          </p>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Level Up While Driving
          </h2>

          <p className="text-gray-600 text-lg mb-16 max-w-2xl mx-auto">
            Every rental earns you XP. Unlock achievements, increase your driver
            level and gain access to exclusive discounts and premium vehicles.
          </p>

          <div className="grid md:grid-cols-3 gap-10">


            {/* XP PROGRESS CARD */}
            <div className="bg-gray-50 rounded-3xl p-10 shadow-lg hover:shadow-xl transition text-left">

              <p className="text-sm text-gray-500 mb-2">
                Driver Level
              </p>

              <p className="text-2xl font-semibold mb-6">
                Level 3 Driver
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-600 h-3 w-2/3 rounded-full" />
              </div>

              <p className="text-sm text-gray-500 mt-3">
                220 / 300 XP
              </p>

              <p className="text-gray-600 mt-6 text-sm">
                Complete rentals to gain XP and reach the next level.
              </p>

            </div>


            {/* BADGES CARD */}
            <div className="bg-gray-50 rounded-3xl p-10 shadow-lg hover:shadow-xl transition">

              <p className="text-sm text-gray-500 mb-6">
                Unlock Badges
              </p>

              <div className="flex justify-center gap-6 text-4xl mb-6">

                <span title="First Ride" className="hover:scale-110 transition">🥉</span>
                <span title="Explorer" className="hover:scale-110 transition">🥈</span>
                <span title="Elite Driver" className="hover:scale-110 transition">🥇</span>

              </div>

              <p className="text-gray-600 text-sm">
                Achieve milestones and unlock exclusive driver badges.
              </p>

            </div>


            {/* BENEFITS CARD */}
            <div className="bg-gray-50 rounded-3xl p-10 shadow-lg hover:shadow-xl transition">

              <p className="text-sm text-gray-500 mb-4">
                Exclusive Benefits
              </p>

              <div className="text-4xl mb-4">
                💸
              </div>

              <p className="text-gray-600">
                Higher driver levels unlock
                <span className="font-semibold">
                  {" "}exclusive discounts, priority access,
                </span>
                and better rental deals.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* FINAL CTA */}
      <section className="relative py-32 overflow-hidden">

        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-white via-blue-50 to-blue-100" />

        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 w-150 h-150 bg-blue-500/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative max-w-4xl mx-auto text-center px-6">

          <p className="text-blue-600 font-semibold mb-3">
            Your Next Ride Awaits
          </p>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to Drive Something
            <span className="text-blue-600"> Extraordinary?</span>
          </h2>

          <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
            Explore our collection of premium vehicles and start earning
            rewards with every drive.
          </p>

          <Link
            href="/cars"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-full text-lg font-semibold shadow-xl transition"
          >
            Browse Luxury Cars
          </Link>

        </div>

      </section>


    </div>
  )
}