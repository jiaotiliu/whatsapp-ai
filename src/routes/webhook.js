const { initialize, hasProcessedMessage, logMessage, markMessageProcessed } = require("../db");
const logger = require("../logger");
const config = require("../config");
const { analyzeImageWithVision, generateAssistantReply, synthesizeSpeech, transcribeAudioWithWhisper } = require("../services/openai");
const {
  downloadMedia,
  extractMessages,
  sendAudioMessage,
  sendTextMessage,
  uploadMedia
} = require("../services/whatsapp");
const { removeFileIfExists, writeBufferToTempFile } = require("../utils/media");

async function buildReplyForMessage(message) {
  if (message.type === "text") {
    return {
      assistantInput: message.text,
      summary: message.text,
      shouldSendAudio: false
    };
  }

  if (message.type === "audio") {
    const { buffer, mimeType } = await downloadMedia(message.audioId);
    const tempFile = await writeBufferToTempFile(buffer, mimeType, "audio-in");

    try {
      const transcript = await transcribeAudioWithWhisper(tempFile);
      return {
        assistantInput: `The user sent a voice note. Transcription:\n${transcript}`,
        summary: transcript || "(empty audio transcription)",
        shouldSendAudio: config.enableAudioReply
      };
    } finally {
      await removeFileIfExists(tempFile);
    }
  }

  if (message.type === "image") {
    const { buffer, mimeType } = await downloadMedia(message.imageId);
    const visionSummary = await analyzeImageWithVision({
      buffer,
      mimeType,
      caption: message.imageCaption
    });

    return {
      assistantInput: `The user sent an image. Caption: ${message.imageCaption || "(none)"}\nImage analysis:\n${visionSummary}`,
      summary: visionSummary,
      shouldSendAudio: false
    };
  }

  return {
    assistantInput: `The user sent an unsupported WhatsApp message type: ${message.type}`,
    summary: `Unsupported message type: ${message.type}`,
    shouldSendAudio: false,
    unsupported: true
  };
}

async function processSingleMessage(message) {
  if (!message.id || !message.from) {
    logger.warn("Skipping malformed WhatsApp message", { message });
    return;
  }

  if (await hasProcessedMessage(message.id)) {
    logger.info("Skipping duplicate WhatsApp message", { messageId: message.id });
    return;
  }

  const prepared = await buildReplyForMessage(message);

  await logMessage({
    messageId: message.id,
    from: message.from,
    direction: "inbound",
    type: message.type,
    content: prepared.summary
  });

  const replyText = prepared.unsupported
    ? "暂时仅支持文字、语音和图片消息。请发送文字、语音或图片继续对话。"
    : await generateAssistantReply({
        userInput: prepared.assistantInput,
        channelContext: `whatsapp:${message.type}`
      });

  await sendTextMessage(message.from, replyText, message.id);
  await logMessage({
    messageId: message.id,
    from: message.from,
    direction: "outbound",
    type: "text",
    content: replyText
  });

  if (prepared.shouldSendAudio) {
    const speechBuffer = await synthesizeSpeech(replyText);
    const mediaId = await uploadMedia(speechBuffer, "audio/mpeg", "reply.mp3");
    await sendAudioMessage(message.from, mediaId, message.id);
    await logMessage({
      messageId: message.id,
      from: message.from,
      direction: "outbound",
      type: "audio",
      content: `${config.audioReplyTextPrefix}${replyText}`
    });
  }

  await markMessageProcessed({
    messageId: message.id,
    from: message.from,
    type: message.type
  });
}

async function processWebhookPayload(payload) {
  await initialize();

  const messages = extractMessages(payload);

  if (!messages.length) {
    logger.info("Received WhatsApp webhook without processable messages");
    return;
  }

  for (const message of messages) {
    try {
      await processSingleMessage(message);
    } catch (error) {
      logger.error("Failed to process WhatsApp message", {
        error,
        messageId: message.id,
        messageType: message.type
      });

      if (message.from) {
        await sendTextMessage(
          message.from,
          "抱歉，系统当前处理这条消息时出现了问题，请稍后重试。",
          message.id
        ).catch((sendError) => {
          logger.error("Failed to send fallback WhatsApp message", {
            error: sendError,
            messageId: message.id
          });
        });
      }
    }
  }
}

module.exports = {
  processWebhookPayload
};
