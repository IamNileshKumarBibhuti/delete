import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/analyze", (_req, res) => {
  res.json({
    probability: 0.87,
    verdict: "Likely Deepfake",
    confidence: 0.91,
    explanation:
      "Inconsistent eye reflections and facial boundary artifacts suggest generative manipulation in multiple frames.",
    suspiciousRegions: [
      { x: 0.35, y: 0.3, width: 0.2, height: 0.25 },
      { x: 0.55, y: 0.55, width: 0.15, height: 0.18 },
    ],
  });
});

app.post("/assistant", async (req, res) => {
  const { messages } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.json({
      reply:
        "I'm running in demo mode. A deepfake is AI-generated or altered media that can convincingly mimic real people. Upload a file on the Upload page and I'll guide you through the analysis.",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are DeepGuard Assist, a friendly professional assistant that explains deepfakes simply, gives safety tips, and guides users on uploading media.",
          },
          ...(messages || []),
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    res.json({ reply: reply || "I'm here to help with anything about deepfake detection." });
  } catch (error) {
    res.status(500).json({ reply: "Sorry, I couldn't reach the assistant service. Please try again." });
  }
});

app.listen(port, () => {
  console.log(`DeepGuard backend running on port ${port}`);
});
