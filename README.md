# WhatsApp AI Microservice

一个可生产部署的 WhatsApp AI 微服务，支持：

- 文本消息理解与自动回复
- 语音消息识别（由 OpenAI Whisper 处理）
- 语音消息自动语音回复（Text-to-Speech）
- 图片识别与图片内容理解（由 OpenAI Vision 处理）
- Webhook 签名校验
- 健康检查与就绪检查
- Docker 生产部署

## 功能特性

### 1. 文本消息
用户发送文字后，服务会调用 OpenAI 生成自然语言回复。

### 2. 语音消息
用户发送 WhatsApp 语音后，服务会：
1. 从 WhatsApp Cloud API 下载语音媒体
2. 使用 **OpenAI Whisper** 转写成文字
3. 将转写结果送入 OpenAI 对话模型生成回答
4. 返回文字 + AI 语音消息

### 3. 图片消息
用户发送图片后，服务会：
1. 从 WhatsApp Cloud API 下载图片媒体
2. 使用 **OpenAI Vision** 识别图片中的主体、文字与场景
3. 再把识别结果送入 OpenAI 对话模型生成文字回复

### 4. 职责划分
- **WhatsApp / Meta API**：只负责 webhook、媒体下载、消息发送
- **OpenAI**：负责文本生成、Whisper 语音识别、Vision 图片理解、TTS 语音合成

## 项目结构

```text
.
├── docs/
│   └── DEPLOYMENT.md
├── frontend/
│   └── index.html
├── src/
│   ├── config.js
│   ├── db.js
│   ├── logger.js
│   ├── routes/
│   │   └── webhook.js
│   ├── services/
│   │   ├── openai.js
│   │   └── whatsapp.js
│   └── utils/
│       └── media.js
├── test/
│   └── whatsapp.test.js
├── .env.example
├── Dockerfile
├── index.js
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
```

### 3. 启动服务
```bash
npm start
```

### 4. 健康检查
```bash
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/readyz
```

## 环境变量

详见 `.env.example`。核心字段如下：

- `OPENAI_API_KEY`：OpenAI API Key
- `OPENAI_WHISPER_MODEL`：语音识别模型，默认 `whisper-1`
- `OPENAI_VISION_MODEL`：图片理解模型
- `OPENAI_SPEECH_MODEL`：文本转语音模型
- `META_TOKEN`：Meta 访问令牌
- `PHONE_NUMBER_ID`：WhatsApp 电话号 ID
- `VERIFY_TOKEN`：Webhook 验证 token
- `APP_SECRET`：Meta App Secret，用于校验 webhook 签名
- `ENABLE_AUDIO_REPLY`：是否返回 AI 语音消息
- `MAX_MEDIA_BYTES`：允许下载的最大媒体大小

## 接口说明

### `GET /healthz`
用于存活检查。

### `GET /readyz`
用于就绪检查，会验证数据库是否可初始化。

### `GET /webhook`
用于 Meta Webhook 验证。

### `POST /webhook`
用于接收 WhatsApp 消息事件：
- text：直接交给 OpenAI 文本模型
- audio：下载媒体后交给 OpenAI Whisper
- image：下载媒体后交给 OpenAI Vision

## 测试

```bash
npm test
npm run check
```

## 生产部署文档

完整生产部署步骤见：[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
