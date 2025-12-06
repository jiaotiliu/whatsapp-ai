const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(userText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userText }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("⚠️ OpenAI Error:", error.code || error.message);

    // ✅ SAFE FALLBACK REPLY (prevents silence)
    return "⚠️ The AI service is currently unavailable. Please try again shortly.";
  }
}

module.exports = { generateReply };
