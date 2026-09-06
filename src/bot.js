import http from 'http';
import axios from 'axios';
import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { processPdfDocument } from './pdfProcessor.js';
import {
  getUserSettings,
  toggleWatermark,
  setAwaitingAction,
  setCustomWatermark,
  setCustomEndingPdf,
  resetUserSettings
} from './userSettings.js';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is missing!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

function getSettingsKeyboard(userId) {
  const settings = getUserSettings(userId);
  const wmStatus = settings.watermarkEnabled ? '🟢 ON' : '🔴 OFF';
  const customWmStatus = settings.customWatermark ? 'Custom 🖼️' : 'Default 🌟';
  const customEndingStatus = settings.customEndingPdf ? 'Custom 📄' : 'Default 🌟';

  return Markup.inlineKeyboard([
    [Markup.button.callback(`Watermark: ${wmStatus}`, 'toggle_watermark')],
    [
      Markup.button.callback(`Watermark: ${customWmStatus}`, 'change_watermark'),
      Markup.button.callback(`Ending PDF: ${customEndingStatus}`, 'change_ending')
    ],
    [Markup.button.callback('🔄 Reset to Defaults', 'reset_defaults')]
  ]);
}

function getSettingsMessage(userId) {
  const settings = getUserSettings(userId);
  return (
    `⚙️ *PDF Refiner Bot Settings*\n\n` +
    `• *Watermark Status:* ${settings.watermarkEnabled ? '🟢 Enabled' : '🔴 Disabled'}\n` +
    `• *Watermark Image:* ${settings.customWatermark ? 'Custom Uploaded' : 'Default (UPSCFILE)'}\n` +
    `• *Ending Page:* ${settings.customEndingPdf ? 'Custom Uploaded' : 'Default UPSC Page'}\n\n` +
    `_Tap buttons below to change or upload new ones:_`
  );
}

bot.start((ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.first_name || 'there';

  ctx.replyWithMarkdown(
    `👋 Hello *${name}*! Welcome to the *PDF Refiner Bot*.\n\n` +
    `📥 *How it works:*\n` +
    `1. Just send me any *PDF document*.\n` +
    `2. I'll automatically embed the bottom watermark on every page.\n` +
    `3. I'll append the clean ending page to the end.\n` +
    `4. You'll receive your refined \`filename_planned.pdf\` in seconds!\n\n` +
    getSettingsMessage(userId),
    getSettingsKeyboard(userId)
  );
});

bot.command('settings', (ctx) => {
  const userId = ctx.from.id;
  ctx.replyWithMarkdown(getSettingsMessage(userId), getSettingsKeyboard(userId));
});

bot.command('help', (ctx) => {
  ctx.replyWithMarkdown(
    `📖 *PDF Refiner Bot Help:*\n\n` +
    `• *Process a PDF:* Simply upload any PDF document.\n` +
    `• *Toggle Watermark:* Use /settings to turn watermark ON/OFF.\n` +
    `• *Custom Watermark:* Tap "Watermark" in /settings, then send an image.\n` +
    `• *Custom Ending Page:* Tap "Ending PDF" in /settings, then send a PDF.\n` +
    `• *Reset:* Tap "Reset to Defaults" to restore original settings.\n`
  );
});

bot.action('toggle_watermark', async (ctx) => {
  const userId = ctx.from.id;
  toggleWatermark(userId);
  try {
    await ctx.editMessageText(getSettingsMessage(userId), {
      parse_mode: 'Markdown',
      ...getSettingsKeyboard(userId)
    });
    await ctx.answerCbQuery('Watermark setting updated!');
  } catch (err) {
    await ctx.answerCbQuery();
  }
});

bot.action('change_watermark', async (ctx) => {
  const userId = ctx.from.id;
  setAwaitingAction(userId, 'upload_watermark');
  await ctx.answerCbQuery();
  await ctx.reply('🖼️ Send the new PNG/JPG watermark image.\nOr send /cancel to keep current settings.');
});

bot.action('change_ending', async (ctx) => {
  const userId = ctx.from.id;
  setAwaitingAction(userId, 'upload_ending');
  await ctx.answerCbQuery();
  await ctx.reply('📄 Send the new PDF ending file.\nOr send /cancel to keep current settings.');
});

bot.action('reset_defaults', async (ctx) => {
  const userId = ctx.from.id;
  resetUserSettings(userId);
  try {
    await ctx.editMessageText(getSettingsMessage(userId), {
      parse_mode: 'Markdown',
      ...getSettingsKeyboard(userId)
    });
    await ctx.answerCbQuery('Reset to default UPSCFILE watermark & ending page!');
  } catch (err) {
    await ctx.answerCbQuery();
  }
});

bot.command('cancel', (ctx) => {
  const userId = ctx.from.id;
  setAwaitingAction(userId, null);
  ctx.reply('Action cancelled. You can send your PDFs anytime!');
});

bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const settings = getUserSettings(userId);

  if (settings.awaitingAction === 'upload_watermark') {
    try {
      const photos = ctx.message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      setCustomWatermark(userId, Buffer.from(response.data));
      return ctx.reply('✅ Custom watermark image saved successfully!');
    } catch (err) {
      console.error('Error saving photo watermark:', err);
      return ctx.reply('❌ Failed to save watermark image. Please try sending it as an uncompressed file/document.');
    }
  }

  ctx.reply('To update your watermark, use /settings first and choose "Watermark".');
});

bot.on('document', async (ctx) => {
  const userId = ctx.from.id;
  const settings = getUserSettings(userId);
  const doc = ctx.message.document;
  const fileName = doc.file_name || 'document.pdf';
  const isPdf = fileName.toLowerCase().endsWith('.pdf') || doc.mime_type === 'application/pdf';
  const isImage = doc.mime_type?.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(fileName);

  if (settings.awaitingAction === 'upload_watermark' && isImage) {
    try {
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      setCustomWatermark(userId, Buffer.from(response.data));
      return ctx.reply('✅ Custom watermark saved! Future PDFs will use this watermark.');
    } catch (err) {
      console.error('Failed to download custom watermark:', err);
      return ctx.reply('❌ Error saving watermark image. Please try again.');
    }
  }

  if (settings.awaitingAction === 'upload_ending' && isPdf) {
    try {
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      setCustomEndingPdf(userId, Buffer.from(response.data));
      return ctx.reply('✅ Custom ending PDF saved! Future PDFs will append this file to the end.');
    } catch (err) {
      console.error('Failed to download ending PDF:', err);
      return ctx.reply('❌ Error saving ending PDF. Please try again.');
    }
  }

  if (!isPdf) {
    return ctx.reply('⚠️ Please send a PDF file (.pdf).');
  }

  try {
    await ctx.sendChatAction('upload_document');
    const fileLink = await ctx.telegram.getFileLink(doc.file_id);
    const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
    const inputPdfBuffer = Buffer.from(response.data);

    const processedBuffer = await processPdfDocument(inputPdfBuffer, {
      watermarkEnabled: settings.watermarkEnabled,
      customWatermark: settings.customWatermark,
      customEndingPdf: settings.customEndingPdf
    });

    const baseName = fileName.replace(/\.pdf$/i, '');
    const outFileName = `${baseName}_planned.pdf`;
    await ctx.replyWithDocument({ source: processedBuffer, filename: outFileName });
  } catch (err) {
    console.error('Error processing PDF for user', userId, err);
    ctx.reply(`❌ Failed to process PDF: ${err.message || 'Unknown error'}`);
  }
});

bot.launch().then(() => {
  console.log('🤖 Telegram PDF Bot started successfully and listening for messages!');
}).catch((err) => {
  console.error('Failed to launch bot:', err);
});

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Telegram PDF Bot health check is OK.\n');
}).listen(PORT, () => {
  console.log(`🌐 HTTP health-check server running on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
