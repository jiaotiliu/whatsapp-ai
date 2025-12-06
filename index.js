process.env = {};
require("dotenv").config({ override: true });

const express = require("express");
const bodyParser = require("body-parser");
const config = require("./src/config");

const webhookRoutes = require("./src/routes/webhook");

const app = express();

/* ✅ IMPORTANT: Meta sends JSON with special signatures */
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

/* ✅ ROOT HEALTH CHECK */
app.get("/", (req, res) => {
  res.send("WhatsApp AI Microservice is running ✅");
});

/* ✅ META WEBHOOK VERIFICATION (THIS WAS FAILING) */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification attempt:", mode, token);

  if (mode === "subscribe" && token === "whatsapp123") {
    console.log("✅ Meta Webhook Verified!");
    return res.status(200).send(challenge);
  } else {
    console.log("❌ Meta Webhook Verification Failed");
    return res.sendStatus(403);
  }
});

/* ✅ INCOMING WHATSAPP MESSAGES */
app.use("/webhook", webhookRoutes);

/* ✅ SERVER START */
app.listen(config.port, () => {
  console.log(`✅ Server running on port ${config.port}`);
});
