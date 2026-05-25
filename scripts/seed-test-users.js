/**
 * AURUM — Test User Seeder
 * Creates 10 realistic user personas with full booking history, XP, badges, and reviews.
 * Run: node scripts/seed-test-users.js
 */

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

function getLevel(xp) { return Math.floor(xp / 200) + 1 }
function getXpPerDay(category) {
    const c = category.toLowerCase()
    if (c.includes("super") || c.includes("hyper"))  return 30
    if (c.includes("luxury") || c.includes("sport")) return 20
    if (c.includes("premium"))                        return 15
    return 10
}

// ── Product IDs (from live DB) ─────────────────────────────────────────────
const CARS = {
    polo:       { id: "cmpk3co4f0000i0a0uujkp6uc", name: "VW Polo GTI",         category: "Compact",  price: 55  },
    clio:       { id: "cmpk3coc10003i0a017nnb57h", name: "Renault Clio RS",      category: "Compact",  price: 48  },
    bmw3:       { id: "cmpk3cogq0006i0a08wdhs9kd", name: "BMW 3 Series",         category: "Sedan",    price: 120 },
    mercc:      { id: "cmpk3cold0009i0a0l1qbyhzq", name: "Mercedes C-Class",     category: "Sedan",    price: 130 },
    audia4:     { id: "cmpk3copu000ci0a0acmj1ywe", name: "Audi A4",              category: "Sedan",    price: 115 },
    bmwx5:      { id: "cmpk3cou9000fi0a0yfkq07l2", name: "BMW X5",               category: "SUV",      price: 180 },
    mersuv:     { id: "cmpk3coyp000ii0a0crnbz9ra", name: "Mercedes GLE",         category: "SUV",      price: 195 },
    bmwm4:      { id: "cmpk3cp7k000oi0a0ct8xpi8p", name: "BMW M4 Competition",   category: "Sport",    price: 280 },
    amgc63:     { id: "cmpk3cpcu000ri0a0e9hsa6w2", name: "Mercedes AMG C63 S",   category: "Sport",    price: 295 },
    audirs5:    { id: "cmpk3cpha000ui0a0o8ux4x65", name: "Audi RS5 Sportback",   category: "Sport",    price: 270 },
    bmw7:       { id: "cmpk3cplp000xi0a0tlvvsuks", name: "BMW 7 Series",         category: "Premium",  price: 320 },
    mercs:      { id: "cmpk3cpq50010i0a02mw34e5c", name: "Mercedes S-Class",     category: "Premium",  price: 380 },
    ghost:      { id: "cmpk3cpuk0013i0a0crvalcdn", name: "Rolls-Royce Ghost",    category: "Luxury",   price: 1200},
    bentley:    { id: "cmpk3cpz00016i0a0d9pzfulp", name: "Bentley Continental",  category: "Luxury",   price: 950 },
    panamera:   { id: "cmpk3cq3f0019i0a0ikgsa8u4", name: "Porsche Panamera",     category: "Luxury",   price: 750 },
    porsche911: { id: "cmpk3cq7u001ci0a0w4pu8tfv", name: "Porsche 911 Turbo S",  category: "Supercar", price: 890 },
    huracan:    { id: "cmpk3cqcb001fi0a0mn726ei1", name: "Lamborghini Huracan",  category: "Supercar", price: 1100},
    f8:         { id: "cmpk3cqgq001ii0a0yuvnql4e", name: "Ferrari F8 Tributo",   category: "Supercar", price: 1250},
    sf90:       { id: "cmpk3cqpq001oi0a0f7o4sym6", name: "Ferrari SF90 Stradale",category: "Hypercar", price: 2500},
    revuelto:   { id: "cmpk3cqu5001ri0a09qlxgwcj", name: "Lamborghini Revuelto", category: "Hypercar", price: 3200},
}

// ── Badge IDs ─────────────────────────────────────────────────────────────
const BADGES = {
    first_ride:    "cmpk3rdb60000i6048if2ad25",
    road_warrior_5:"cmpk3rdfy0001i604mt4jwi3g",
    loyal_10:      "cmpk3rdi80002i604m9mp7ahj",
    supercar_club: "cmpk3rdki0003i604ybatlo58",
    long_haul:     "cmpk3rdms0004i6045sfhuol7",
    road_explorer: "cmpk3rdp20005i604v4yxz3df",
    elite_driver:  "cmpk3rdrc0006i604r9j1twd7",
    vip_member:    "cmpk3rdtm0007i6042v72j7eg",
    dubai_legend:  "cmpk3rdvw0008i604b0hb7i28",
    first_review:  "cmpk3rdy60009i604llvdfgsz",
}

// ── Booking helper: creates a COMPLETED transaction in the past ───────────
function makeTx(userId, car, days, daysAgoStart, id) {
    const xp       = getXpPerDay(car.category) * days
    const start    = new Date()
    start.setDate(start.getDate() - daysAgoStart - days)
    const end      = new Date(start)
    end.setDate(end.getDate() + days - 1)
    const total    = car.price * days
    const deposit  = Math.round(total * 0.2)

    return {
        id,
        userId,
        productId: car.id,
        status:    "COMPLETED",
        startDate: start,
        endDate:   end,
        totalDays: days,
        pricePerDay: car.price,
        totalPrice: total,
        deposit,
        xpAwarded: xp,
        createdAt: start,
        updatedAt: end,
    }
}

// ── Award badges helper ───────────────────────────────────────────────────
async function awardBadges(userId, slugs) {
    for (const slug of slugs) {
        const badgeId = BADGES[slug]
        if (!badgeId) continue
        await prisma.userBadge.upsert({
            where:  { userId_badgeId: { userId, badgeId } },
            create: { userId, badgeId },
            update: {},
        })
    }
}

// ── Create review ─────────────────────────────────────────────────────────
async function createReview(userId, productId, rating, comment) {
    await prisma.review.upsert({
        where:  { userId_productId: { userId, productId } },
        create: { userId, productId, rating, comment },
        update: { rating, comment },
    })
}

// ── XP log helper ─────────────────────────────────────────────────────────
async function logXp(userId, xpAmount, txId) {
    await prisma.xpTransaction.create({
        data: { userId, xpAmount, transactionId: txId },
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONAS
// ═══════════════════════════════════════════════════════════════════════════

const PERSONAS = [
    {
        name:     "Ahmed Al-Rashidi",
        email:    "ahmed.alrashidi@aurum-test.com",
        targetXp: 3200,
        // 8x SF90 5-day=1200xp, 6x Revuelto 5-day=900xp, 5x Ferrari F8 7-day=1050xp, 3x Sport 5-day=300xp → 3450xp
        bookings: [
            ...Array(8).fill(null).map((_,i)  => ({ car: CARS.sf90,      days: 5,  daysAgo: 300 - i*12 })),
            ...Array(6).fill(null).map((_,i)  => ({ car: CARS.revuelto,  days: 5,  daysAgo: 200 - i*10 })),
            ...Array(5).fill(null).map((_,i)  => ({ car: CARS.f8,        days: 7,  daysAgo: 140 - i*12 })),
            ...Array(3).fill(null).map((_,i)  => ({ car: CARS.bmwm4,     days: 5,  daysAgo:  60 - i*15 })),
        ],
        badges:  ["first_ride","road_warrior_5","loyal_10","supercar_club","long_haul","road_explorer","elite_driver","vip_member","dubai_legend","first_review"],
        review:  { rating: 5, comment: "Absolutely phenomenal experience. The SF90 is a beast. AURUM service is flawless — 10/10 would rent again." },
        showOnLeaderboard: true,
    },
    {
        name:     "James Blackwood",
        email:    "james.blackwood@aurum-test.com",
        targetXp: 2750,
        // 6x Revuelto 5-day=900, 5x Huracan 5-day=750, 5x Ghost 7-day=700, 4x Sport 5-day=400 → 2750xp
        bookings: [
            ...Array(6).fill(null).map((_,i)  => ({ car: CARS.revuelto,  days: 5,  daysAgo: 320 - i*14 })),
            ...Array(5).fill(null).map((_,i)  => ({ car: CARS.huracan,   days: 5,  daysAgo: 230 - i*12 })),
            ...Array(5).fill(null).map((_,i)  => ({ car: CARS.ghost,     days: 7,  daysAgo: 150 - i*15 })),
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.amgc63,    days: 5,  daysAgo:  60 - i*12 })),
        ],
        badges:  ["first_ride","road_warrior_5","loyal_10","supercar_club","long_haul","road_explorer","elite_driver","vip_member","dubai_legend","first_review"],
        review:  { rating: 5, comment: "The Revuelto is on another level. James Blackwood approved. Best supercar rental service in Dubai." },
        showOnLeaderboard: true,
    },
    {
        name:     "Layla Hassan",
        email:    "layla.hassan@aurum-test.com",
        targetXp: 2100,
        // 5x Ghost 7-day=700, 5x Bentley 7-day=700, 4x Sport 7-day=560, 3x Sedan 7-day=210 → 2170xp
        bookings: [
            ...Array(5).fill(null).map((_,i)  => ({ car: CARS.ghost,     days: 7,  daysAgo: 280 - i*16 })),
            ...Array(5).fill(null).map((_,i)  => ({ car: CARS.bentley,   days: 7,  daysAgo: 180 - i*14 })),
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.audirs5,   days: 7,  daysAgo:  90 - i*16 })),
            ...Array(3).fill(null).map((_,i)  => ({ car: CARS.bmw3,      days: 7,  daysAgo:  25 - i*8  })),
        ],
        badges:  ["first_ride","road_warrior_5","loyal_10","long_haul","road_explorer","elite_driver","vip_member","dubai_legend","first_review"],
        review:  { rating: 5, comment: "The Bentley Continental is pure luxury. Layla absolutely loves AURUM — always my go-to for premium rentals." },
        showOnLeaderboard: true,
    },
    {
        name:     "Sofia Reeves",
        email:    "sofia.reeves@aurum-test.com",
        targetXp: 1800,
        // 7x M4 7-day=980, 6x RS5 5-day=600, 4x Sedan 5-day=200 → 1780xp
        bookings: [
            ...Array(7).fill(null).map((_,i)  => ({ car: CARS.bmwm4,    days: 7,  daysAgo: 250 - i*14 })),
            ...Array(6).fill(null).map((_,i)  => ({ car: CARS.audirs5,  days: 5,  daysAgo: 140 - i*10 })),
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.mercc,    days: 5,  daysAgo:  50 - i*10 })),
        ],
        badges:  ["first_ride","road_warrior_5","loyal_10","long_haul","road_explorer","elite_driver","vip_member","first_review"],
        review:  { rating: 4, comment: "The BMW M4 is incredible on the track. Sofia recommends AURUM for any sports car enthusiast." },
        showOnLeaderboard: true,
    },
    {
        name:     "Isabella Ferrari",
        email:    "isabella.ferrari@aurum-test.com",
        targetXp: 1380,
        // 4x Panamera 7-day=420, 4x AMG C63 5-day=400, 4x Porsche 911 3-day=360, 4x Sedan 5-day=200 → 1380xp
        bookings: [
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.panamera,  days: 7,  daysAgo: 200 - i*14 })),
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.amgc63,    days: 5,  daysAgo: 130 - i*12 })),
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.porsche911,days: 3,  daysAgo:  70 - i*12 })),
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.audia4,    days: 5,  daysAgo:  20 - i*6  })),
        ],
        badges:  ["first_ride","road_warrior_5","loyal_10","long_haul","supercar_club","road_explorer","elite_driver","vip_member","first_review"],
        review:  { rating: 5, comment: "La Porsche 911 est magnifique. AURUM — simply the finest rental experience in the region." },
        showOnLeaderboard: true,
    },
    {
        name:     "Priya Sharma",
        email:    "priya.sharma@aurum-test.com",
        targetXp: 1060,
        // 4x AMG C63 5-day=400, 3x BMW 7 Series 7-day=315, 4x Sedan 7-day=280, 3x Compact 3-day=90 → 1085xp (close enough)
        bookings: [
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.amgc63,   days: 5,  daysAgo: 200 - i*15 })),
            ...Array(3).fill(null).map((_,i)  => ({ car: CARS.bmw7,     days: 7,  daysAgo: 130 - i*15 })),
            ...Array(4).fill(null).map((_,i)  => ({ car: CARS.bmw3,     days: 7,  daysAgo:  60 - i*12 })),
            ...Array(3).fill(null).map((_,i)  => ({ car: CARS.clio,     days: 3,  daysAgo:  12 - i*4  })),
        ],
        badges:  ["first_ride","road_warrior_5","loyal_10","long_haul","road_explorer","elite_driver","vip_member","first_review"],
        review:  { rating: 5, comment: "Priya is thrilled — the S-Class and BMW 7 are perfect for business travel. AURUM never disappoints." },
        showOnLeaderboard: true,
    },
    {
        name:     "Marcus Chen",
        email:    "marcus.chen@aurum-test.com",
        targetXp: 720,
        // 3x Porsche 911 5-day=450, 2x Sedan 7-day=140, 2x Sport 5-day=200 → 790 (a bit over, fine)
        // adjust: 2x 911 5-day=300, 2x sport 5-day=200, 3x sedan 7-day=210 → 710
        bookings: [
            ...Array(2).fill(null).map((_,i)  => ({ car: CARS.porsche911, days: 5,  daysAgo: 150 - i*20 })),
            ...Array(2).fill(null).map((_,i)  => ({ car: CARS.bmwm4,      days: 5,  daysAgo:  90 - i*18 })),
            ...Array(3).fill(null).map((_,i)  => ({ car: CARS.bmw3,       days: 7,  daysAgo:  40 - i*12 })),
        ],
        badges:  ["first_ride","road_warrior_5","long_haul","supercar_club","road_explorer","elite_driver","first_review"],
        review:  { rating: 5, comment: "Marcus here — the Porsche 911 Turbo S is a masterpiece. AURUM made the rental process effortless." },
        showOnLeaderboard: true,
    },
    {
        name:     "Oscar Müller",
        email:    "oscar.muller@aurum-test.com",
        targetXp: 520,
        // 2x RS5 5-day=200, 3x BMW 3 Series 7-day=210, 2x Compact 5-day=100 → 510
        bookings: [
            ...Array(2).fill(null).map((_,i)  => ({ car: CARS.audirs5,   days: 5,  daysAgo: 120 - i*20 })),
            ...Array(3).fill(null).map((_,i)  => ({ car: CARS.bmw3,      days: 7,  daysAgo:  70 - i*15 })),
            ...Array(2).fill(null).map((_,i)  => ({ car: CARS.polo,      days: 5,  daysAgo:  15 - i*7  })),
        ],
        badges:  ["first_ride","road_warrior_5","long_haul","road_explorer","elite_driver"],
        showOnLeaderboard: true,
    },
    {
        name:     "Kai Nakamura",
        email:    "kai.nakamura@aurum-test.com",
        targetXp: 300,
        // 1x Sport 5-day=100, 2x Sedan 5-day=100, 1x Sedan 7-day=70, 1x Compact 3-day=30 → 300
        bookings: [
            { car: CARS.amgc63,  days: 5,  daysAgo: 90 },
            { car: CARS.bmw3,    days: 5,  daysAgo: 60 },
            { car: CARS.mercc,   days: 5,  daysAgo: 35 },
            { car: CARS.bmw3,    days: 7,  daysAgo: 15 },
            { car: CARS.clio,    days: 3,  daysAgo:  4 },
        ],
        badges:  ["first_ride","road_warrior_5","long_haul","road_explorer","first_review"],
        review:  { rating: 4, comment: "Kai's first supercar experience with AURUM — absolutely loved it. Will definitely be back." },
        showOnLeaderboard: true,
    },
    {
        name:     "Emma Laurent",
        email:    "emma.laurent@aurum-test.com",
        targetXp: 210,
        // 3x Compact 7-day=210
        bookings: [
            { car: CARS.polo,    days: 7,  daysAgo: 60 },
            { car: CARS.clio,    days: 7,  daysAgo: 35 },
            { car: CARS.polo,    days: 7,  daysAgo:  9 },
        ],
        badges:  ["first_ride","road_explorer"],
        showOnLeaderboard: true,
    },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    console.log("🚀 AURUM Test User Seeder starting...\n")
    const hashedPw = await bcrypt.hash("AurumTest2024!", 10)
    const results  = []

    for (const persona of PERSONAS) {
        process.stdout.write(`  Creating ${persona.name}...`)

        // 1. Upsert user
        const user = await prisma.user.upsert({
            where:  { email: persona.email },
            update: {
                xp:    persona.targetXp,
                level: getLevel(persona.targetXp),
                showOnLeaderboard: persona.showOnLeaderboard,
            },
            create: {
                name:              persona.name,
                email:             persona.email,
                password:          hashedPw,
                xp:                persona.targetXp,
                level:             getLevel(persona.targetXp),
                showOnLeaderboard: persona.showOnLeaderboard,
                receivePromotionalEmails: true,
            },
        })

        // 2. Delete previous test transactions for this user (clean re-run)
        await prisma.transaction.deleteMany({ where: { userId: user.id } })
        await prisma.review.deleteMany({ where: { userId: user.id } })
        await prisma.xpTransaction.deleteMany({ where: { userId: user.id } })
        await prisma.userBadge.deleteMany({ where: { userId: user.id } })

        // 3. Create bookings
        let txOffset = 0
        const txIds = []
        for (const b of persona.bookings) {
            const { createId } = await import("@paralleldrive/cuid2").catch(() => null) || {}
            // Fallback ID generation using crypto
            const txId = `tx_${user.id.slice(0,8)}_${txOffset++}_${Date.now()}`
            const txData = makeTx(user.id, b.car, b.days, b.daysAgo, txId)
            txIds.push({ txId, productId: b.car.id, xp: txData.xpAwarded })
            await prisma.transaction.create({ data: txData })
            await logXp(user.id, txData.xpAwarded, txId)
        }

        // 4. Create review (first eligible transaction that has a product matching review)
        if (persona.review && txIds.length > 0) {
            const firstTx = txIds[0]
            await createReview(user.id, firstTx.productId, persona.review.rating, persona.review.comment)
        }

        // 5. Award badges
        await awardBadges(user.id, persona.badges)

        const totalXp    = persona.bookings.reduce((s, b) => s + getXpPerDay(b.car.category) * b.days, 0)
        const totalTx    = persona.bookings.length
        const earnedBadges = persona.badges.length

        results.push({ name: persona.name, xp: persona.targetXp, level: getLevel(persona.targetXp), bookings: totalTx, badges: earnedBadges })
        console.log(` ✓  ${persona.targetXp} XP  |  Lv.${getLevel(persona.targetXp)}  |  ${totalTx} bookings  |  ${earnedBadges} badges`)
    }

    console.log("\n═══════════════════════════════════════════")
    console.log("  LEADERBOARD PREVIEW (sorted by XP)")
    console.log("═══════════════════════════════════════════")
    results
        .sort((a, b) => b.xp - a.xp)
        .forEach((r, i) => {
            const medal = ["🥇","🥈","🥉"][i] || `#${i+1}`
            console.log(`  ${medal}  ${r.name.padEnd(22)} ${String(r.xp).padStart(5)} XP  Lv.${r.level}  ${r.badges} badges`)
        })
    console.log("═══════════════════════════════════════════")
    console.log(`\n✅ Done! All ${PERSONAS.length} users created. Visit /leaderboard to see them.\n`)
    console.log("  Login credentials for all test users:")
    PERSONAS.forEach(p => console.log(`  • ${p.email.padEnd(38)} password: AurumTest2024!`))
    console.log("")
}

main()
    .catch(e => { console.error("\n❌ Error:", e.message); process.exit(1) })
    .finally(() => prisma.$disconnect())
