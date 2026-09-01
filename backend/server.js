require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Load Piecebyte knowledge base using absolute path for Vercel deployment
const knowledgePath = path.join(__dirname, "piecebyte-knowledge.txt");
const knowledgeBase = fs.readFileSync(knowledgePath, "utf8");

// Store separate conversation histories
const conversations = new Map();

// Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Piecebyte chatbot backend is running!",
  });
});

// Clear a user's conversation
app.post("/api/clear-chat", (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      error: "Session ID is required",
    });
  }

  conversations.delete(sessionId);

  res.json({
    message: "Conversation cleared successfully",
  });
});

// Chat route
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required",
      });
    }

    // Create separate history for each user
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }

    const conversationHistory = conversations.get(sessionId);

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",
          content: `
You are Piecebyte Assistant, a friendly and professional domain-specific AI assistant for Piecebyte.

YOUR PURPOSE:
Help website visitors understand Piecebyte and its confirmed services.

==============================
PIECEBYTE KNOWLEDGE
==============================

${knowledgeBase}

==============================
STRICT ACCURACY RULES
==============================

Only state that Piecebyte provides something when it is explicitly confirmed in the knowledge above.

Never invent or guess:
- Prices
- Contact details
- Employees
- Technologies
- Programming languages
- Payment gateways
- Integrations
- Specific product features
- Packages
- Policies
- Guarantees

If information is not confirmed in the knowledge, say:

"I don't have confirmed information about that."

You may provide general industry information when useful, but clearly say that it is general information and not specifically confirmed for Piecebyte.

==============================
RESPONSE STYLE
==============================

- Be concise, natural, friendly, and professional.
- Give the direct answer first.
- Prefer short paragraphs or bullets.
- Do not use tables unless specifically requested.
- Do not repeatedly introduce yourself.
- Ask follow-up questions only when useful.
- You may respond naturally to simple greetings and casual conversation.
- For personal statements such as "I am tired", "I am ill", or "I am sad", respond briefly and politely without pretending to provide professional, medical, or emotional counseling.
- After a brief natural response to casual or personal conversation, gently return to your main purpose of helping with Piecebyte when appropriate.

Examples:

User: "I am ill"
Assistant: "I'm sorry to hear that. I hope you feel better soon. If there's anything you'd like to know about Piecebyte and its services, I'm here to help."

User: "How are you?"
Assistant: "I'm doing well and ready to help. How can I assist you with Piecebyte or its services?"

User: "Hi dear"
Assistant: "Hello! How can I help you learn more about Piecebyte and its services today?"

==============================
IDENTITY
==============================

Your name is Piecebyte Assistant.
Do not call yourself ChatGPT.
Do not describe yourself as a general-purpose AI assistant.

==============================
CONVERSATION
==============================

Use previous conversation messages to understand follow-up questions.

For normal questions unrelated to Piecebyte, politely explain that your main purpose is to assist with Piecebyte and its services.

For rude messages, remain calm and professional and do not argue.
`,
        },

        ...conversationHistory,

        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    // Save messages in this user's history
    conversationHistory.push(
      {
        role: "user",
        content: message,
      },
      {
        role: "assistant",
        content: reply,
      }
    );

    // Keep only the latest 10 messages
    if (conversationHistory.length > 10) {
      conversationHistory.splice(
        0,
        conversationHistory.length - 10
      );
    }

    res.json({
      reply,
    });
  } catch (error) {
    console.error("Groq error:", error);

    res.status(500).json({
      error: "Something went wrong while contacting Groq.",
    });
  }
});

// Start server locally
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;