const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,

  // OpenAI
  openaiKey: process.env.OPENAI_API_KEY,

  // ✅ WhatsApp Cloud API (FIXED)
  whatsappToken: process.env.META_TOKEN,
  whatsappPhoneNumberId: process.env.PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ID,

  // Webhook verification token
  verifyToken: process.env.VERIFY_TOKEN
};
