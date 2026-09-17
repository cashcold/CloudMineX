import axios from 'axios';
import { db } from '../config/dbStore';

export interface WithdrawalNotificationData {
  username?: string;
  userId?: string;
  userEmail?: string;
  amount: number | string;
  currency?: string;
  method?: string;
  destination?: string;
  walletAddress?: string;
  reference?: string;
  createdAt?: string;
}

export const DEFAULT_TELEGRAM_BOT_TOKEN = '8755123580:AAHFP1Zr-YUivo1Mm9iy-wavlXambFTM0rY';
export const DEFAULT_TELEGRAM_ADMIN_CHAT_ID = '6336803190';

/**
 * Retrieves the current configured Telegram Bot Token.
 */
export function getTelegramBotToken(): string {
  return (
    process.env.TELEGRAM_BOT_TOKEN ||
    db.settings?.telegramBotToken ||
    DEFAULT_TELEGRAM_BOT_TOKEN
  ).trim();
}

/**
 * Retrieves the current configured Telegram Admin Chat ID.
 */
export function getTelegramAdminChatId(): string {
  return (
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    db.settings?.telegramAdminChatId ||
    DEFAULT_TELEGRAM_ADMIN_CHAT_ID
  ).trim();
}

/**
 * Escapes characters for Telegram Markdown v1 safely outside of code blocks.
 */
function escapeMarkdownText(text: string): string {
  if (!text) return '';
  return text.replace(/([_*`\[\]])/g, '\\$1');
}

/**
 * Sends an instant withdrawal notification to the admin via Telegram Bot.
 */
export async function sendWithdrawalNotification(data: WithdrawalNotificationData): Promise<{
  success: boolean;
  messageId?: number;
  error?: string;
}> {
  const token = getTelegramBotToken();
  const chatId = getTelegramAdminChatId();

  if (!token || !chatId) {
    console.warn('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID. Notification skipped.');
    return { success: false, error: 'Telegram credentials missing' };
  }

  const rawUsername = data.username || data.userEmail || 'CloudMineX User';
  const username = escapeMarkdownText(rawUsername);
  const amount = data.amount;
  const currency = data.currency || 'GHS';
  const rawMethod = data.method || data.destination || 'Mobile Money';
  const method = escapeMarkdownText(rawMethod);
  const walletAddress = (data.walletAddress || data.destination || 'Not Specified').replace(/[`\\]/g, '');
  const reference = (data.reference || `WD-${Date.now().toString().slice(-6)}`).replace(/[`\\]/g, '');
  const time = data.createdAt
    ? new Date(data.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Accra' }) + ' (GMT)'
    : new Date().toLocaleString();

  const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
  const amountDisplay = currency === 'USD' || currency === '$' ? `$${formattedAmount}` : `${currency} ${formattedAmount}`;

  const message =
    `🚨 *NEW WITHDRAWAL REQUEST*\n\n` +
    `🆔 *Ref:* \`${reference}\`\n` +
    `👤 *User:* ${username}\n` +
    `💰 *Amount:* ${amountDisplay}\n` +
    `💳 *Method:* ${method}\n` +
    `📌 *Address:* \`${walletAddress}\`\n\n` +
    `⏰ *Time:* ${time}`;

  console.log(`[Telegram] Sending withdrawal notification (${reference}) to chat ID ${chatId}...`);

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      },
      { timeout: 10000 }
    );

    if (response.data && response.data.ok) {
      console.log(`✅ [Telegram] Alert delivered successfully (Message ID: ${response.data.result?.message_id})`);
      return { success: true, messageId: response.data.result?.message_id };
    } else {
      console.warn('[Telegram] Telegram API responded with failure:', response.data);
      return { success: false, error: response.data?.description || 'Failed to deliver' };
    }
  } catch (error: any) {
    const errDesc = error.response?.data?.description || error.response?.data || error.message;
    console.error('Telegram notification error:', errDesc);

    // If markdown parse failed, retry with plain text format
    if (error.response?.data?.description?.includes('can\'t parse entities')) {
      try {
        const plainMessage =
          `🚨 NEW WITHDRAWAL REQUEST\n\n` +
          `Ref: ${reference}\n` +
          `User: ${rawUsername}\n` +
          `Amount: ${amountDisplay}\n` +
          `Method: ${rawMethod}\n` +
          `Address: ${walletAddress}\n\n` +
          `Time: ${time}`;

        await axios.post(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            chat_id: chatId,
            text: plainMessage,
          },
          { timeout: 10000 }
        );
        console.log(`✅ [Telegram] Fallback plain-text alert delivered successfully.`);
        return { success: true };
      } catch (fallbackErr: any) {
        console.error('Telegram fallback notification error:', fallbackErr.message);
      }
    }

    return { success: false, error: typeof errDesc === 'string' ? errDesc : JSON.stringify(errDesc) };
  }
}

/**
 * Sends a test notification to verify Telegram connectivity.
 */
export async function sendTelegramTestAlert(customChatId?: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const token = getTelegramBotToken();
  const chatId = (customChatId || getTelegramAdminChatId()).trim();

  const message =
    `🚀 *CloudMineX Telegram Alert System Connected!*\n\n` +
    `✅ *Status:* Online & Active\n` +
    `🤖 *Bot:* @cloudMineXBot\n` +
    `📱 *Admin Chat ID:* \`${chatId}\`\n` +
    `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
    `You will receive instant alerts for every new user withdrawal request on your phone.`;

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      },
      { timeout: 10000 }
    );

    if (response.data && response.data.ok) {
      return {
        success: true,
        message: `Test alert sent successfully to Telegram chat ${chatId}! Check your Telegram.`,
        data: response.data.result,
      };
    } else {
      return {
        success: false,
        message: response.data?.description || 'Telegram notification failed.',
      };
    }
  } catch (error: any) {
    const desc = error.response?.data?.description || error.message;
    console.error('Telegram test alert error:', desc);
    return {
      success: false,
      message: `Telegram Error: ${desc}`,
    };
  }
}
