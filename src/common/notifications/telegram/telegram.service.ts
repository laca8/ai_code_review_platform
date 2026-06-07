import axios from "axios";

interface TelegramMessage {
    chatId?: string;
    text: string;
    parseMode?: "HTML" | "Markdown";
}

class TelegramService {
    private readonly baseUrl: string;
    private readonly defaultChatId: string;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
        this.baseUrl = `https://api.telegram.org/bot${token}`;
        this.defaultChatId = process.env.TELEGRAM_CHAT_ID ?? "";
    }

    async send({ chatId, text, parseMode = "HTML" }: TelegramMessage): Promise<void> {
        const targetChat = chatId ?? this.defaultChatId;

        if (!targetChat) {
            console.warn("Telegram: no chat ID provided");
            return;
        }

        await axios.post(`${this.baseUrl}/sendMessage`, {
            chat_id: targetChat,
            text,
            parse_mode: parseMode,
        });
    }

    // ── Admin notifications (sent to the default admin chat) ─────────────────

    async notifyNewUser(name: string, email: string): Promise<void> {
        await this.send({
            text: `
👤 <b>New User Registered</b>
━━━━━━━━━━━━━━━
Name:  ${name}
Email: ${email}
Time:  ${new Date().toLocaleString()}
      `.trim(),
        });
    }

    async notifyAnalysisComplete(
        repoName: string,
        issuesCount: number,
        score: number,
        durationMs: number
    ): Promise<void> {
        const emoji = score >= 80 ? "✅" : score >= 50 ? "⚠️" : "🔴";
        await this.send({
            text: `
${emoji} <b>Analysis Complete</b>
━━━━━━━━━━━━━━━
Repo:     ${repoName}
Score:    ${score}/100
Issues:   ${issuesCount}
Duration: ${(durationMs / 1000).toFixed(1)}s
      `.trim(),
        });
    }

    async notifyError(context: string, error: string): Promise<void> {
        await this.send({
            text: `
🚨 <b>Error Alert</b>
━━━━━━━━━━━━━━━
Context: ${context}
Error:   ${error}
Time:    ${new Date().toLocaleString()}
      `.trim(),
        });
    }

    async notifyNewSubscription(
        userName: string,
        plan: string,
        amount: string
    ): Promise<void> {
        await this.send({
            text: `
💰 <b>New Subscription</b>
━━━━━━━━━━━━━━━
User:   ${userName}
Plan:   ${plan}
Amount: ${amount}
Time:   ${new Date().toLocaleString()}
      `.trim(),
        });
    }
}

export const telegramService = new TelegramService();
