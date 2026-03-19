const crypto = require("node:crypto");
const axios = require("axios");
const { Blob } = require("node:buffer");
const config = require("../config");

const http = axios.create({
  baseURL: config.baseUrl,
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${config.metaAccessToken}`
  }
});

function verifyWebhookToken(mode, token) {
  return mode === "subscribe" && token === config.verifyToken;
}

function verifySignature(rawBody, signatureHeader) {
  if (!config.appSecret) {
    return true;
  }

  if (!rawBody || !signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", config.appSecret)
    .update(rawBody)
    .digest("hex");

  const received = signatureHeader.replace("sha256=", "");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function extractMessages(payload) {
  const results = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        results.push({
          id: message.id,
          from: message.from,
          timestamp: message.timestamp,
          type: message.type,
          text: message.text?.body || "",
          imageId: message.image?.id || null,
          imageMimeType: message.image?.mime_type || null,
          imageCaption: message.image?.caption || "",
          audioId: message.audio?.id || null,
          audioMimeType: message.audio?.mime_type || null
        });
      }
    }
  }

  return results;
}

async function getMediaMetadata(mediaId) {
  const response = await http.get(`/${mediaId}`);
  return response.data;
}

async function downloadMedia(mediaId) {
  const metadata = await getMediaMetadata(mediaId);

  if (metadata.file_size && metadata.file_size > config.maxMediaBytes) {
    throw new Error(`Media file exceeds size limit (${metadata.file_size} bytes).`);
  }

  const response = await axios.get(metadata.url, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${config.metaAccessToken}`
    }
  });

  const buffer = Buffer.from(response.data);

  if (buffer.length > config.maxMediaBytes) {
    throw new Error(`Downloaded media exceeds size limit (${buffer.length} bytes).`);
  }

  return {
    buffer,
    mimeType: metadata.mime_type || response.headers["content-type"] || "application/octet-stream"
  };
}

async function sendTextMessage(to, text, contextMessageId = null) {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: text
    }
  };

  if (contextMessageId) {
    payload.context = { message_id: contextMessageId };
  }

  const response = await http.post(`/${config.phoneNumberId}/messages`, payload);
  return response.data;
}

async function uploadMedia(buffer, mimeType, fileName) {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("messaging_product", "whatsapp");
  formData.append("file", blob, fileName);

  const response = await axios.post(`${config.baseUrl}/${config.phoneNumberId}/media`, formData, {
    headers: {
      Authorization: `Bearer ${config.metaAccessToken}`
    },
    timeout: 30000
  });

  return response.data.id;
}

async function sendAudioMessage(to, mediaId, contextMessageId = null) {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "audio",
    audio: { id: mediaId }
  };

  if (contextMessageId) {
    payload.context = { message_id: contextMessageId };
  }

  const response = await http.post(`/${config.phoneNumberId}/messages`, payload);
  return response.data;
}

module.exports = {
  downloadMedia,
  extractMessages,
  sendAudioMessage,
  sendTextMessage,
  uploadMedia,
  verifySignature,
  verifyWebhookToken
};
