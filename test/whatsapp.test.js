const test = require("node:test");
const assert = require("node:assert/strict");

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-key";
process.env.META_TOKEN = process.env.META_TOKEN || "meta-token";
process.env.PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || "phone-id";
process.env.VERIFY_TOKEN = process.env.VERIFY_TOKEN || "verify-token";
process.env.APP_SECRET = "app-secret";

const crypto = require("node:crypto");
const { extractMessages, verifySignature, verifyWebhookToken } = require("../src/services/whatsapp");

test("verifyWebhookToken validates mode and token", () => {
  assert.equal(verifyWebhookToken("subscribe", "verify-token"), true);
  assert.equal(verifyWebhookToken("subscribe", "wrong"), false);
});

test("verifySignature validates sha256 signatures", () => {
  const body = Buffer.from(JSON.stringify({ ok: true }));
  const digest = crypto.createHmac("sha256", "app-secret").update(body).digest("hex");

  assert.equal(verifySignature(body, `sha256=${digest}`), true);
  assert.equal(verifySignature(body, "sha256=bad"), false);
});

test("extractMessages flattens text, audio, and image messages", () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  id: "wamid-1",
                  from: "10001",
                  timestamp: "1",
                  type: "text",
                  text: { body: "hello" }
                },
                {
                  id: "wamid-2",
                  from: "10001",
                  timestamp: "2",
                  type: "audio",
                  audio: { id: "audio-1", mime_type: "audio/ogg" }
                },
                {
                  id: "wamid-3",
                  from: "10001",
                  timestamp: "3",
                  type: "image",
                  image: { id: "image-1", mime_type: "image/jpeg", caption: "receipt" }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const messages = extractMessages(payload);

  assert.deepEqual(messages, [
    {
      id: "wamid-1",
      from: "10001",
      timestamp: "1",
      type: "text",
      text: "hello",
      imageId: null,
      imageMimeType: null,
      imageCaption: "",
      audioId: null,
      audioMimeType: null
    },
    {
      id: "wamid-2",
      from: "10001",
      timestamp: "2",
      type: "audio",
      text: "",
      imageId: null,
      imageMimeType: null,
      imageCaption: "",
      audioId: "audio-1",
      audioMimeType: "audio/ogg"
    },
    {
      id: "wamid-3",
      from: "10001",
      timestamp: "3",
      type: "image",
      text: "",
      imageId: "image-1",
      imageMimeType: "image/jpeg",
      imageCaption: "receipt",
      audioId: null,
      audioMimeType: null
    }
  ]);
});
