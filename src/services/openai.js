const fs = require("node:fs");
const OpenAI = require("openai");
const config = require("../config");

const openai = new OpenAI({ apiKey: config.openaiApiKey });

function toDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function generateAssistantReply({ userInput, channelContext }) {
  const completion = await openai.chat.completions.create({
    model: config.openaiChatModel,
    temperature: 0.4,
    messages: [
      { role: "system", content: config.assistantSystemPrompt },
      {
        role: "user",
        content: `Channel context: ${channelContext}\n\nUser request:\n${userInput}`
      }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() || "抱歉，我暂时无法生成回复。";
}

async function transcribeAudioWithWhisper(filePath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: config.openaiWhisperModel
  });

  return transcription.text?.trim() || "";
}

async function analyzeImageWithVision({ buffer, mimeType, caption = "" }) {
  const completion = await openai.chat.completions.create({
    model: config.openaiVisionModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an OpenAI vision assistant. Describe the image, identify important objects/text, and infer user intent conservatively."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Caption from the sender: ${caption || "(none)"}. Please describe what is in the image and note any visible text.`
          },
          {
            type: "image_url",
            image_url: {
              url: toDataUrl(buffer, mimeType)
            }
          }
        ]
      }
    ]
  });

  return completion.choices[0]?.message?.content?.trim() || "未能识别图片内容。";
}

async function synthesizeSpeech(text) {
  const speechResponse = await openai.audio.speech.create({
    model: config.openaiSpeechModel,
    voice: config.openaiSpeechVoice,
    input: text,
    format: "mp3"
  });

  const arrayBuffer = await speechResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  analyzeImageWithVision,
  generateAssistantReply,
  synthesizeSpeech,
  transcribeAudioWithWhisper
};
