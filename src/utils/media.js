const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const config = require("../config");

const extensionMap = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/ogg": ".ogg",
  "audio/opus": ".ogg",
  "audio/aac": ".aac",
  "audio/amr": ".amr",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

async function ensureMediaDir() {
  await fs.mkdir(config.mediaStorageDir, { recursive: true });
}

function extensionForMime(mimeType) {
  return extensionMap[mimeType] || "";
}

async function writeBufferToTempFile(buffer, mimeType, prefix) {
  await ensureMediaDir();
  const extension = extensionForMime(mimeType);
  const filePath = path.join(config.mediaStorageDir, `${prefix}-${randomUUID()}${extension}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function removeFileIfExists(filePath) {
  if (!filePath) {
    return;
  }

  await fs.rm(filePath, { force: true });
}

module.exports = {
  extensionForMime,
  writeBufferToTempFile,
  removeFileIfExists
};
