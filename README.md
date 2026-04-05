# Seller Agent

Upload a product photo and get a complete, marketplace-ready ecommerce listing in seconds — no typing required.

Built with Next.js 14 (App Router). Uses a two-step AI pipeline:
1. **Gemini Vision** — analyses the product image
2. **Groq** (Llama 3.3 70B) — generates the full structured listing from the description

Both services have generous free tiers, making this a $0 MVP stack.

---

## What it does

1. You upload a product photo
2. Gemini analyses the image and describes the product
3. Groq converts that description into a structured listing
4. You get: title, descriptions, bullet points, specs, price estimate, tags, and platform tips for Facebook Marketplace, Shopee, Lazada, TikTok Shop, and Shopify

---

## Requirements

- Node.js 18.17 or later
- A Groq API key — free at https://console.groq.com
- A Gemini API key — get at https://console.cloud.google.com

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in both keys:

```
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
```

Both keys are used server-side only — never exposed to the browser.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable         | Required | Description |
|---|---|---|
| `GROQ_API_KEY`    | Yes | Groq API key from console.groq.com |
| `GEMINI_API_KEY`  | Yes | Gemini API key from console.cloud.google.com |

---

## Architecture

```
Browser → POST /api/generate-listing
  → Step 1: Gemini Vision API → product description string
  → Step 2: Groq API (Llama 3.3 70B, JSON mode) → ListingDraft JSON
  → NextResponse.json({ listing })
```

The API route lives at `src/app/api/generate-listing/route.ts`. The frontend
never calls any AI API directly — all keys stay on the server.

---

## Project structure

```
seller-agent/
├── src/
│   ├── app/
│   │   ├── api/generate-listing/route.ts  ← Two-step AI pipeline
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── page.module.css
│   ├── components/
│   │   ├── UploadZone.tsx
│   │   ├── ProgressSteps.tsx
│   │   ├── ErrorBox.tsx
│   │   └── ListingPreview.tsx
│   ├── lib/
│   │   └── prompt.ts          ← VISION_PROMPT + buildListingPrompt()
│   └── types/
│       └── listing.ts         ← ListingDraft interface
├── .env.example
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Build for production

```bash
npm run build
npm start
```

---

## Deploying to Vercel

1. Push to GitHub
2. Import at vercel.com
3. Add `GROQ_API_KEY` and `GEMINI_API_KEY` in Vercel environment variables
4. Deploy

---

## Troubleshooting

**"GROQ_API_KEY is not set"**
Add the key to `.env.local` and restart the dev server.

**"GEMINI_API_KEY is not set"**
Add the key to `.env.local` and restart the dev server.

**"Gemini service temporarily unavailable"**
The model is loading (cold start). Wait 10 seconds and retry — the route sets `X-Wait-For-Model: true` which helps, but very occasionally a second request is needed.

**Listing quality issues**
Use a well-lit photo with the product as the clear subject. The quality of the Gemini vision description directly determines the quality of the Groq listing.
