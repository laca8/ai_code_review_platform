import nodemailer, { Transporter } from "nodemailer";

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

class EmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    async send(options: SendEmailOptions): Promise<void> {
        await this.transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: Array.isArray(options.to) ? options.to.join(",") : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
    }

    // ── Templates ────────────────────────────────────────────────────────────

    async sendWelcome(to: string, name: string): Promise<void> {
        await this.send({
            to,
            subject: "Welcome to AI Code Review",
            html: `
        <h2>Welcome, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Start by connecting your GitHub account and running your first analysis.</p>
      `,
        });
    }

    async sendEmailVerification(to: string, token: string): Promise<void> {
        const url = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
        await this.send({
            to,
            subject: "Verify your email",
            html: `
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${url}" style="
          display:inline-block;padding:12px 24px;background:#2E5090;
          color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;
        ">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `,
        });
    }

    async sendAnalysisComplete(
        to: string,
        repoName: string,
        reportId: string,
        issuesCount: number
    ): Promise<void> {
        const url = `${process.env.APP_URL}/reports/${reportId}`;
        await this.send({
            to,
            subject: `Analysis complete — ${repoName}`,
            html: `
        <h2>Analysis Complete</h2>
        <p>Your repository <strong>${repoName}</strong> has been analyzed.</p>
        <p>Found <strong>${issuesCount}</strong> issues.</p>
        <a href="${url}" style="
          display:inline-block;padding:12px 24px;background:#2E5090;
          color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;
        ">View Report</a>
      `,
        });
    }

    async sendPasswordReset(to: string, token: string): Promise<void> {
        const url = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
        await this.send({
            to,
            subject: "Reset your password",
            html: `
        <h2>Reset Password</h2>
        <p>Click the button below to reset your password.</p>
        <a href="${url}" style="
          display:inline-block;padding:12px 24px;background:#C0392B;
          color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;
        ">Reset Password</a>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      `,
        });
    }
}

export const emailService = new EmailService();
