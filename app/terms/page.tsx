import Link from "next/link"

export const metadata = { title: "Terms of Service — AURUM" }

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-white-soft">{title}</h2>
        <div className="font-body text-muted text-sm leading-relaxed space-y-2">{children}</div>
    </div>
)

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

                <div>
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-2">Legal</p>
                    <h1 className="font-heading text-4xl font-light text-white-soft mb-2">Terms of Service</h1>
                    <p className="text-muted text-xs font-stats">Last updated: May 2026</p>
                </div>

                <div className="bg-surface border border-surface-3 rounded-2xl p-8 space-y-8">

                    <SECTION title="1. Acceptance">
                        <p>By creating an account or making a booking on AURUM you agree to these Terms. If you do not agree, do not use the platform.</p>
                    </SECTION>

                    <SECTION title="2. Eligibility">
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>You must be at least 18 years old (some vehicles require a higher minimum age)</li>
                            <li>You must hold a valid driving licence for the vehicle category booked</li>
                            <li>You must provide accurate personal information during registration</li>
                        </ul>
                    </SECTION>

                    <SECTION title="3. Bookings & Payments">
                        <p><span className="text-white-soft">Deposit:</span> A refundable deposit (typically 20% of total rental cost) is charged at the time of booking via Stripe. The deposit is returned after the vehicle is inspected at return.</p>
                        <p><span className="text-white-soft">Service fee:</span> A non-refundable €10 service fee is included in each booking to cover booking processing and customer support.</p>
                        <p><span className="text-white-soft">Cancellation:</span> Bookings in PENDING or CONFIRMED status may be cancelled. Cancellation policy and refund timelines depend on notice period and are communicated at checkout.</p>
                    </SECTION>

                    <SECTION title="4. Km Limits & Excess Fees">
                        <p>Many vehicles include a daily kilometre allowance. If you exceed the included km:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>An excess km charge (stated per vehicle) applies at the rate shown on the car detail page</li>
                            <li>You may purchase extra km packages during an active rental at a 30% discounted rate — these are <span className="text-white-soft font-semibold">non-refundable</span> if unused</li>
                        </ul>
                    </SECTION>

                    <SECTION title="5. Vehicle Condition">
                        <p>You are responsible for the vehicle during the rental period. Damage beyond normal wear, traffic violations, and fuel costs are your responsibility. A damage inspection is conducted at pickup and return.</p>
                    </SECTION>

                    <SECTION title="6. AURUM Loyalty Programme">
                        <p>XP, tiers, badges and discounts are provided as a courtesy. AURUM reserves the right to modify or discontinue the programme with 30 days notice. XP and rewards have no cash value.</p>
                    </SECTION>

                    <SECTION title="7. Limitation of Liability">
                        <p>AURUM is not liable for indirect or consequential losses. Our maximum liability is limited to the amount you paid for the specific rental giving rise to the claim.</p>
                    </SECTION>

                    <SECTION title="8. Governing Law">
                        <p>These terms are governed by the laws of Hungary. Disputes shall be resolved in the courts of Budapest.</p>
                    </SECTION>

                    <SECTION title="9. Changes">
                        <p>We may update these Terms. We will notify you by email for material changes. Continued use of the platform constitutes acceptance.</p>
                    </SECTION>

                    <SECTION title="10. Contact">
                        <p>For any questions: <span className="text-white-soft">legal@aurum-rental.com</span></p>
                    </SECTION>

                </div>

                <Link href="/" className="inline-flex items-center gap-2 text-muted text-xs font-stats hover:text-gold transition-colors">
                    ← Back to home
                </Link>
            </div>
        </div>
    )
}
