# DeepGuard

DeepGuard is a production-ready AI-powered deepfake detection platform with a premium, accessible UI and a companion Express API for detection and virtual assistance.

## Project Structure

```
.
├── backend
│   ├── package.json
│   └── server.js
├── frontend
│   ├── app
│   ├── components
│   ├── lib
│   ├── public
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Frontend Setup (Next.js + Tailwind + Framer Motion)

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Backend Setup (Node.js + Express)

```bash
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:4000`.

### Environment Variables

Create a `.env` file in `backend/`:

```
OPENAI_API_KEY=your_key_here
PORT=4000
```

If the OpenAI key is missing, the assistant will respond with a friendly demo response.

## API Endpoints

### `POST /analyze` (mock deepfake detection)

**Sample Response**

```json
{
  "probability": 0.87,
  "verdict": "Likely Deepfake",
  "confidence": 0.91,
  "explanation": "Inconsistent eye reflections and facial boundary artifacts suggest generative manipulation in multiple frames.",
  "suspiciousRegions": [
    { "x": 0.35, "y": 0.3, "width": 0.2, "height": 0.25 },
    { "x": 0.55, "y": 0.55, "width": 0.15, "height": 0.18 }
  ]
}
```

### `POST /assistant` (OpenAI-powered virtual assistant)

**Sample Response**

```json
{
  "reply": "I'm running in demo mode. A deepfake is AI-generated or altered media that can convincingly mimic real people."
}
```

## Design Highlights

- Glassmorphism cards, soft shadows, and micro-interactions
- Dark/light mode toggle with system preference support
- Responsive layouts optimized for mobile, tablet, and desktop
- Accessible components with ARIA labels and clear contrast

## Notes

- Deepfake model integration is mocked and ready for a real endpoint.
- Charts are powered by Recharts and can be wired to real analytics data.
