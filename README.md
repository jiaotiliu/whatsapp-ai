# WhatsApp AI Microservice 🤖💬

A production-ready **WhatsApp AI Microservice** built with **Node.js, Meta WhatsApp Cloud API, and OpenAI**. This service receives incoming WhatsApp messages via webhooks, generates intelligent AI replies using OpenAI, and sends responses back to users automatically.

> Built for real-world use
> Works with Meta WhatsApp Cloud API
> AI-powered using OpenAI
> Ngrok-enabled for local webhook testing

---

## 🚀 Features

* Real-time WhatsApp message handling
* AI-generated replies using OpenAI
* Meta Cloud API integration (no 3rd-party BSP)
* Secure webhook verification
* Production-grade Express server
* Ngrok support for local development
* Environment-based secret management

---

## 🧠 Tech Stack

* **Backend:** Node.js, Express
* **AI Engine:** OpenAI API
* **Messaging:** Meta WhatsApp Cloud API
* **Tunneling:** Ngrok
* **Config & Secrets:** dotenv
* **Version Control:** Git + GitHub

---

## 📁 Project Structure

```
whatsapp-ai-microservice/
├── index.js
├── package.json
├── .env.example
├── .gitignore
├── src/
│   ├── config.js
│   ├── db.js
│   ├── routes/
│   │   └── webhook.js
│   └── services/
│       ├── ai.js
│       └── bsp.js
└── frontend/
    └── index.html
```

---

## Environment Variables

Create a `.env` file using the template below:

```
PORT=3000

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Meta WhatsApp Cloud API
META_TOKEN=your_meta_access_token_here
PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ID=your_business_id_here

# Webhook Verification
VERIFY_TOKEN=your_custom_verify_token
```

> Never commit your real `.env` file to GitHub.

---

## 🛠️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/codewithaustin1/whatsapp-ai-microservice.git
cd whatsapp-ai-microservice
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create `.env` and insert your credentials.

### 4️⃣ Start the Server

```bash
node index.js
```

You should see:

```
✅ Server running on port 3000
```

---

## 🌍 Exposing Webhook with Ngrok

```bash
ngrok http 3000
```

Copy the HTTPS forwarding URL and use it inside the Meta Developer Dashboard.

---

## Webhook Verification Endpoint

**GET:**

```
/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=1234
```

Expected response: `1234`

---

## Incoming Message Handling

When a WhatsApp user sends a message:

1. Meta sends the webhook event
2. Your server receives it
3. OpenAI generates a reply
4. The message is sent back to the user

You should see logs like:

```
Incoming WhatsApp message: 2547XXXXXXX Hello
WhatsApp Reply Sent
```

---

## 🧪 Testing

You can test using:

* WhatsApp real messaging
* Ngrok request inspector at:

```
http://127.0.0.1:4040
```

---

## ⚠️ Common Issues & Fixes

| Problem               | Cause          | Fix                       |
| --------------------- | -------------- | ------------------------- |
| OpenAI quota error    | No balance     | Add billing on OpenAI     |
| Invalid OAuth token   | Expired token  | Generate a new Meta token |
| Webhook not verifying | Token mismatch | Match VERIFY_TOKEN        |

---

## 📌 Roadmap

* ✅ WhatsApp AI bot
* ✅ cloud API integration
* 🔜 User management
* 🔜 Chat history storage
* 🔜 SaaS dashboard
* 🔜 Subscription billing

---

👨‍💻 Author

Austin Makachola
Full-Stack Developer | AI Systems Builder
GitHub: [https://github.com/codewithaustin1](https://github.com/codewithaustin1)

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

> ⭐ If you find this project useful, star the repo and share it!
