import nodemailer from "nodemailer";

export const createTransporter = async () => {
    // Ha nincs .env beállítás, generálunk egy teszt fiókot
    if (!process.env.ETHEREAL_USER || !process.env.ETHEREAL_PASS) {
        const testAccount = await nodemailer.createTestAccount();
        process.env.ETHEREAL_USER = testAccount.user;
        process.env.ETHEREAL_PASS = testAccount.pass;
        console.log("Generated Ethereal test account:");
        console.log("User:", testAccount.user);
        console.log("Pass:", testAccount.pass);
    }

    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS,
        },
    });
};

export const sendMail = async (options: nodemailer.SendMailOptions) => {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(options);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log("Preview email URL:", previewUrl);
    return info;
};