const axios = require("axios");
const config = require("../config");

async function sendMessage(to, text) {
  const url = `https://graph.facebook.com/v21.0/${config.whatsappPhoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.whatsappToken}`,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ WhatsApp Reply Sent:", response.data);
  } catch (error) {
    console.error(
      "❌ WhatsApp Send Error:",
      error.response?.data || error.message
    );
  }
}

module.exports = { sendMessage };
