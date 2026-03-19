const express = require("express");
const config = require("./src/config");
const logger = require("./src/logger");
const { initialize } = require("./src/db");
const { processWebhookPayload } = require("./src/routes/webhook");
const { verifySignature, verifyWebhookToken } = require("./src/services/whatsapp");

const app = express();

app.disable("x-powered-by");
app.use(
  express.json({
    limit: "20mb",
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    }
  })
);

app.get("/", (_req, res) => {
  res.json({
    service: "whatsapp-ai-microservice",
    status: "ok",
    features: ["text", "openai-whisper", "openai-tts", "openai-vision"]
  });
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/readyz", async (_req, res) => {
  try {
    await initialize();
    res.status(200).json({ status: "ready" });
  } catch (error) {
    logger.error("Readiness check failed", { error });
    res.status(500).json({ status: "error" });
  }
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (!verifyWebhookToken(mode, token)) {
    logger.warn("Webhook verification failed", { mode });
    res.sendStatus(403);
    return;
  }

  logger.info("Webhook verification succeeded");
  res.status(200).send(challenge);
});

app.post("/webhook", (req, res) => {
  const signature = req.header("x-hub-signature-256");

  if (!verifySignature(req.rawBody, signature)) {
    logger.warn("Rejected webhook due to invalid signature");
    res.sendStatus(403);
    return;
  }

  res.sendStatus(200);

  processWebhookPayload(req.body).catch((error) => {
    logger.error("Unhandled webhook processing error", { error });
  });
});

app.use((error, _req, res, _next) => {
  logger.error("Unhandled express error", { error });
  res.status(500).json({ error: "internal_server_error" });
});

async function start() {
  await initialize();

  const server = app.listen(config.port, () => {
    logger.info("Server started", {
      nodeEnv: config.nodeEnv,
      port: config.port
    });
  });

  const shutdown = (signal) => {
    logger.info("Received shutdown signal", { signal });
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((error) => {
  logger.error("Failed to boot service", { error });
  process.exit(1);
});
