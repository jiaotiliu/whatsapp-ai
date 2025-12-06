const express = require("express");
const router = express.Router();

const { generateReply } = require("../services/ai");
const { sendMessage } = require("../services/bsp");

/* ------------------------------------------------------------------
✅ POST /webhook — Handle ALL Incoming WhatsApp Events SAFELY
------------------------------------------------------------------ */
router.post("/", async (req, res) => {
  try {
    // ✅ ALWAYS acknowledge Meta immediately
    res.sendStatus(200);

    const entry = req.body.entry;

    if (!entry || !entry.length) {
      console.log("ℹ️ Webhook event with no entry (ignored)");
      return;
    }

    for (const change of entry[0].changes || []) {
      const value = change.value;

      if (!value.messages || !value.messages.length) {
        console.log("ℹ️ Non-message webhook event received");
        return;
      }

      for (const msg of value.messages) {
        if (msg.type !== "text") {
          console.log("ℹ️ Non-text message ignored");
          continue;
        }

        const from = msg.from;
        const text = msg.text.body;

        console.log("✅ Incoming WhatsApp message:", from, text);

        const reply = await generateReply(text);
        await sendMessage(from, reply);

        console.log("✅ AI Reply Sent Successfully");
      }
    }

  } catch (err) {
    console.error("❌ Webhook processing error:", err);
  }
});

module.exports = router;
