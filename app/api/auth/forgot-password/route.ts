import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendMail } from "@/lib/nodemailer";

export async function POST(req: Request) {
    const { email } = await req.json();

    if (!email) return new Response("Email required", { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return new Response("If account exists, email sent", { status: 200 }); // hide existence

    // create token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1h

    await prisma.passwordReset.create({
        data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/login?token=${token}`;


    try {
        await sendMail({
            from: `"Car Rental" <${process.env.ETHEREAL_USER}>`,
            to: user.email,
            subject: "Password reset request",
            html: `<p>Click the link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
        });
    } catch (err) {
        console.error("[forgot-password] Email send failed:", err);
    }

    return new Response("If account exists, email sent", { status: 200 });
}