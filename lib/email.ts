import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = process.env.SMTP_SECURE === "true";

const fromEmail = process.env.SMTP_FROM_EMAIL;
const fromName = process.env.SMTP_FROM_NAME;

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
    if (transporter) {
        return transporter;
    }

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
        throw new Error("Missing SMTP configuration.");
    }

    transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    return transporter;
};

export const sendForgotPasswordCodeEmail = async (to: string, code: string) => {
    const mailer = getTransporter();

    await mailer.sendMail({
        from: `\"${fromName}\" <${fromEmail}>`,
        to,
        subject: "Mã xác nhận đặt lại mật khẩu PizzaPalace",
        text: [
            "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản PizzaPalace.",
            "",
            `Mã xác nhận của bạn là: ${code}`,
            "Mã có hiệu lực trong 10 phút.",
            "",
            "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.",
        ].join("\n"),
    });
};
