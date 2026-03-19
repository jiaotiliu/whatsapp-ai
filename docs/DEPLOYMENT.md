# 生产部署指南

本文档给出一个可直接执行的生产部署方案，适用于单实例 Docker 部署（推荐先用该方案上线）。

## 1. 准备条件

### 1.1 Meta / WhatsApp Business Platform
1. 在 Meta for Developers 中创建应用并启用 WhatsApp Business Platform。
2. 获取以下参数：
   - `META_TOKEN`
   - `PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ID`
   - `APP_SECRET`
3. 在 Webhook 配置中把回调地址设置为：
   - `https://your-domain.com/webhook`
4. 把验证 token 设置为与你 `.env.production` 中的 `VERIFY_TOKEN` 完全一致。
5. 订阅消息事件，至少开启 `messages` 字段。

### 1.2 OpenAI
1. 创建 OpenAI API Key。
2. 确保账号已开通：
   - 文本模型调用权限
   - **OpenAI Whisper** 语音转文字权限
   - OpenAI 文本转语音权限
   - **OpenAI Vision** 图像理解权限

### 1.3 服务器要求
- Linux 主机 2C / 4G 起步
- 已安装 Docker Engine 26+
- 已安装 Docker Compose 插件
- 已配置公网域名与 HTTPS 证书

## 2. 代码部署

### 2.1 拉取代码
```bash
git clone <your-repo-url>
cd whatsapp-ai
```

### 2.2 创建生产环境变量文件
```bash
cp .env.example .env.production
```

按实际情况填写 `.env.production`，至少需要以下字段：

```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=.runtime/app.db
MEDIA_STORAGE_DIR=.runtime/media
MAX_MEDIA_BYTES=15728640
ENABLE_AUDIO_REPLY=true
AUDIO_REPLY_TEXT_PREFIX=语音回复：

OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_SPEECH_MODEL=tts-1
OPENAI_SPEECH_VOICE=alloy
ASSISTANT_SYSTEM_PROMPT=You are a professional WhatsApp assistant. Reply in the user's language and keep responses concise.

META_TOKEN=...
PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ID=...
VERIFY_TOKEN=...
APP_SECRET=...
WHATSAPP_API_URL=https://graph.facebook.com/v21.0
```

## 3. 消息处理链路

### 3.1 文本消息
1. Meta webhook 推送文本消息到 `/webhook`
2. 服务提取文本内容
3. 文本直接发送到 OpenAI 对话模型
4. 回复通过 WhatsApp Cloud API 返回给用户

### 3.2 语音消息
1. Meta webhook 推送语音消息 ID 到 `/webhook`
2. 服务通过 WhatsApp Cloud API 下载语音媒体
3. 语音文件交给 **OpenAI Whisper** 转写
4. 转写结果交给 OpenAI 对话模型生成回复
5. 回复文本返回给用户
6. 如果启用了 `ENABLE_AUDIO_REPLY=true`，再使用 OpenAI TTS 生成语音并通过 WhatsApp 发回

### 3.3 图片消息
1. Meta webhook 推送图片消息 ID 到 `/webhook`
2. 服务通过 WhatsApp Cloud API 下载图片媒体
3. 图片交给 **OpenAI Vision** 做识别与理解
4. 识别结果交给 OpenAI 对话模型生成回复
5. 回复文本通过 WhatsApp 返回给用户

## 4. 使用 Docker 部署

### 4.1 构建镜像
```bash
docker build -t whatsapp-ai:prod .
```

### 4.2 运行容器
```bash
docker run -d \
  --name whatsapp-ai \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  -v $(pwd)/.runtime:/app/.runtime \
  whatsapp-ai:prod
```

### 4.3 检查服务状态
```bash
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/readyz
```

## 5. 配置 Nginx 反向代理

示例站点配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 6. Meta Webhook 验证

将以下地址配置到 Meta：

- Callback URL：`https://your-domain.com/webhook`
- Verify Token：与你的 `.env.production` 中 `VERIFY_TOKEN` 一致

平台验证时，请求示例：

```text
GET /webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=123456
```

服务会返回 `hub.challenge`。

## 7. 上线后的验证步骤

### 7.1 健康检查
```bash
curl -fsS https://your-domain.com/healthz
curl -fsS https://your-domain.com/readyz
```

### 7.2 查看日志
```bash
docker logs -f whatsapp-ai
```

### 7.3 功能回归
使用真实 WhatsApp 号码发送：
1. 一条文本消息，确认文本回复正常。
2. 一条语音消息，确认收到文本回复与语音回复，并确认转写来自 Whisper。
3. 一张图片，确认收到图片内容理解后的文字回复。

## 8. 生产运维建议

1. **务必启用 HTTPS**，Meta Webhook 回调必须使用公网 HTTPS。
2. **务必配置 `APP_SECRET`**，这样服务才能校验 `x-hub-signature-256`，防止伪造请求。
3. **持久化 `.runtime` 目录**，防止容器重启后 SQLite 数据丢失。
4. 如果未来要横向扩容，请升级数据库到 PostgreSQL，并把 webhook 去重逻辑迁移到共享数据库。
5. 建议为 OpenAI 和 Meta API 分别设置预算告警。
6. 建议配合外部监控（Prometheus / Grafana / Sentry / ELK）使用。

## 9. 常见问题

### 9.1 Meta 验证失败
- 检查 `VERIFY_TOKEN` 是否与 Meta 平台完全一致。
- 检查 Nginx 是否正确转发 `/webhook`。

### 9.2 语音无法回复
- 检查 `ENABLE_AUDIO_REPLY=true`。
- 检查 OpenAI Whisper 与文本转语音能力是否已开通。
- 检查 Docker 日志是否有上传媒体失败信息。

### 9.3 图片无法识别
- 检查 OpenAI Vision 模型是否可用。
- 检查图片大小是否超过 `MAX_MEDIA_BYTES`。

## 10. 零停机升级

```bash
git pull

docker build -t whatsapp-ai:prod .

docker stop whatsapp-ai && docker rm whatsapp-ai

docker run -d \
  --name whatsapp-ai \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  -v $(pwd)/.runtime:/app/.runtime \
  whatsapp-ai:prod
```
