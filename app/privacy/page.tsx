import Link from "next/link"

export const metadata = { title: "Privacy Policy — AURUM" }

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-white-soft">{title}</h2>
        <div className="font-body text-muted text-sm leading-relaxed space-y-2">{children}</div>
    </div>
)

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

                <div>
                    <p className="text-gold text-[11px] font-stats uppercase tracking-[0.2em] mb-2">Legal</p>
                    <h1 className="font-heading text-4xl font-light text-white-soft mb-2">Privacy Policy</h1>
                    <p className="text-muted text-xs font-stats">Last updated: May 2026</p>
                </div>

                <div className="bg-surface border border-surface-3 rounded-2xl p-8 space-y-8">

                    <SECTION title="1. Who We Are">
                        <p>AURUM ("we", "us", "our") operates a premium car rental platform. Our registered address and data controller contact: <span className="text-white-soft">privacy@aurum-rental.com</span>.</p>
                    </SECTION>

                    <SECTION title="2. Data We Collect">
                        <p>We collect the following personal data:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><span className="text-white-soft">Account data:</span> name, email address, password (hashed, never stored in plain text)</li>
                            <li><span className="text-white-soft">Booking data:</span> rental dates, vehicle selected, payment records, mileage at pickup and return</li>
                            <li><span className="text-white-soft">Usage data:</span> XP earned, tier status, badges, reviews you submit</li>
                            <li><span className="text-white-soft">Payment data:</span> processed exclusively by Stripe — we never store card numbers</li>
                            <li><span className="text-white-soft">OAuth data:</span> if you sign in with Google, we receive your name, email, and profile picture from Google</li>
                        </ul>
                    </SECTION>

                    <SECTION title="3. How We Use Your Data">
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>To process and manage your car rental bookings</li>
                            <li>To send booking confirmation and transactional emails</li>
                            <li>To operate the AURUM loyalty programme (XP, tiers, badges)</li>
                            <li>To comply with legal and tax obligations (we retain transaction records for 7 years)</li>
                            <li>To improve our service through anonymised usage analytics</li>
                        </ul>
                        <p>We do <span className="text-white-soft font-semibold">not</span> sell your data to third parties or use it for unsolicited marketing.</p>
                    </SECTION>

                    <SECTION title="4. Third-Party Services">
                        <p>We share data with the following processors:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><span className="text-white-soft">Stripe</span> — payment processing. <a href="https://stripe.com/privacy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy →</a></li>
                            <li><span className="text-white-soft">Google OAuth</span> — optional sign-in. <a href="https://policies.google.com/privacy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy →</a></li>
                            <li><span className="text-white-soft">Email provider (SMTP)</span> — transactional emails only</li>
                        </ul>
                    </SECTION>

                    <SECTION title="5. Cookies">
                        <p>We use the following cookies:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><span className="text-white-soft">Session cookie</span> — strictly necessary for login and authentication (NextAuth.js)</li>
                            <li><span className="text-white-soft">Consent cookie</span> — remembers your cookie preference</li>
                        </ul>
                        <p>We do not use advertising or analytics tracking cookies. You can manage cookie preferences via the banner shown on your first visit.</p>
                    </SECTION>

                    <SECTION title="6. Your Rights (GDPR)">
                        <p>Under GDPR you have the right to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><span className="text-white-soft">Access</span> — request a copy of your personal data</li>
                            <li><span className="text-white-soft">Rectification</span> — correct inaccurate data</li>
                            <li><span className="text-white-soft">Erasure</span> — delete your account and personal data (see your Profile page)</li>
                            <li><span className="text-white-soft">Portability</span> — receive your data in a machine-readable format</li>
                            <li><span className="text-white-soft">Objection</span> — object to processing based on legitimate interests</li>
                        </ul>
                        <p>To exercise any right, email us at <span className="text-white-soft">privacy@aurum-rental.com</span>. We will respond within 30 days.</p>
                        <p>Note: transaction records required by tax law (7 years) are retained in anonymised form even after account deletion.</p>
                    </SECTION>

                    <SECTION title="7. Data Retention">
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Account data: retained until you delete your account</li>
                            <li>Transaction records: 7 years (legal obligation)</li>
                            <li>Application logs: 90 days</li>
                        </ul>
                    </SECTION>

                    <SECTION title="8. Contact">
                        <p>For privacy enquiries or to exercise your rights: <span className="text-white-soft">privacy@aurum-rental.com</span></p>
                        <p>You also have the right to lodge a complaint with your national data protection authority.</p>
                    </SECTION>

                </div>

                <Link href="/" className="inline-flex items-center gap-2 text-muted text-xs font-stats hover:text-gold transition-colors">
                    ← Back to home
                </Link>
            </div>
        </div>
    )
}
