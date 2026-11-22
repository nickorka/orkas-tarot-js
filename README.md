# orkas-tarot-js

Orka's Tarot — a web tarot reader built with Next.js, React, Tailwind and shadcn/ui.

## Features

- Spreads: One Card, Three Card, Horseshoe, Celtic Cross, Mirror
- Shuffle, pick cards from the strip, reveal them, reshuffle & redeal
- Full reading summary once all cards are revealed
- Deck browser
- **Interpretation** — after a reading is complete, the button next to the question opens a popup that asks a Snowflake Cortex Agent for an interpretation of the reading (each card's role in the spread and its description), with a progress indicator while it waits

## Getting started

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/components/tarot/` | App UI (spread flow, board, summary, interpretation popup) |
| `src/lib/tarot/` | Tarot domain: cards, spreads, store, summary, interpretation prompt |
| `src/lib/snowflake/mcp.ts` | Server-side MCP client with key-pair JWT auth |
| `src/app/api/interpretation/` | API route forwarding the prompt to the MCP server |
| `tarot_agent/` | Snowflake DCM project for the agent and MCP server |

## Scripts

- `npm run dev` — development server
- `npm run build` / `npm start` — production build and serve
- `npm run lint` — lint
