const dotenv = require("dotenv");

dotenv.config();

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optional(name, fallback) {
  return process.env[name] || fallback;
}

function optionalNumber(name, fallback) {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
}

function optionalBoolean(name, fallback) {
  const raw = process.env[name];

  if (raw === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

const config = {
  nodeEnv: optional("NODE_ENV", "production"),
  port: optionalNumber("PORT", 3000),
  baseUrl: optional("WHATSAPP_API_URL", "https://graph.facebook.com/v21.0"),
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiChatModel: optional("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
  openaiVisionModel: optional("OPENAI_VISION_MODEL", "gpt-4o-mini"),
  openaiWhisperModel: optional("OPENAI_WHISPER_MODEL", "whisper-1"),
  openaiSpeechModel: optional("OPENAI_SPEECH_MODEL", "tts-1"),
  openaiSpeechVoice: optional("OPENAI_SPEECH_VOICE", "alloy"),
  metaAccessToken: required("META_TOKEN"),
  phoneNumberId: required("PHONE_NUMBER_ID"),
  businessAccountId: optional("WHATSAPP_BUSINESS_ID", ""),
  verifyToken: required("VERIFY_TOKEN"),
  appSecret: optional("APP_SECRET", ""),
  assistantSystemPrompt: optional(
    "ASSISTANT_SYSTEM_PROMPT",
    "You are a professional WhatsApp assistant. Reply in the same language as the user. Be concise, accurate, and action-oriented."
  ),
  enableAudioReply: optionalBoolean("ENABLE_AUDIO_REPLY", true),
  audioReplyTextPrefix: optional("AUDIO_REPLY_TEXT_PREFIX", "语音回复："),
  maxMediaBytes: optionalNumber("MAX_MEDIA_BYTES", 15 * 1024 * 1024),
  mediaStorageDir: optional("MEDIA_STORAGE_DIR", ".runtime/media"),
  databasePath: optional("DATABASE_PATH", ".runtime/app.db")
};

module.exports = config;
