# FollowFlow

> AI-powered follow-up workspace for small businesses and creators. Single source of truth for leads, customers, and opportunities.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-cyan)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

FollowFlow is a clean, operational workspace designed for non-technical users and small teams managing customer relationships without expensive CRM infrastructure. Real-time AI provider orchestration, flexible multi-source lead management, and an intentionally minimal interface reduce cognitive overload while maintaining powerful underlying architecture.

## Features

- **Multi-Provider AI Orchestration** — Seamless switching between Ollama (local), OpenAI, Anthropic, Gemini, and Groq with live provider health monitoring
- **Lead & Customer Management** — Unified workspace for tracking opportunities, conversations, and follow-ups with rich metadata
- **Responsive Real-time UI** — Animated interactions powered by motion/react, Tailwind CSS, and Lucide icons
- **Dynamic Data Workspace** — Lead detail views, kanban-style boards, customer lists, and grant opportunity tracking
- **Type-Safe Implementation** — Full TypeScript strict mode with server-side rendering and client-side hydration support
- **Developer-Friendly** — Vite-powered hot reload, well-organized component structure, clean type definitions

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone and install
git clone <repository>
cd followflow
npm install

# Start development server
npm run dev
# → http://localhost:3000 (or `PORT` from `.env`)

# Type checking
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```text
followflow/
├── src/
│   ├── components/           # React components
│   │   ├── Sidebar.tsx       # Navigation and branding
│   │   ├── LeadDetail.tsx    # Lead information panel
│   │   ├── LeadList.tsx      # Leads workflow list
│   │   ├── LeadBoard.tsx     # Kanban board view
│   │   ├── LeadCard.tsx      # Individual lead cards
│   │   ├── CustomersList.tsx # Customer management
│   │   └── GrantsList.tsx    # Grant opportunities
│   ├── App.tsx               # Main application shell, modals, header
│   ├── main.tsx              # React entry point
│   ├── types.ts              # TypeScript interface definitions
│   ├── data.ts               # Mock/initial data and type factories
│   ├── utils.ts              # Utility functions
│   └── index.css             # Global styles
├── public/                   # Static assets
│   └── follow_flow_logo_3x.png
├── api/                      # Vercel API functions
│   ├── draft.ts              # POST /api/draft
│   └── llm-status.ts         # GET /api/llm-status
├── lib/
│   └── llm.ts                # Shared LLM/provider logic
├── server.ts                 # Local development server
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Architecture

### Core Technologies

| Layer | Technology | Purpose |
| ----- | ---------- | ------- |
| **Runtime** | TypeScript | Type-safe development and deployment |
| **UI Framework** | React 18 | Component-based reactive interface |
| **Build** | Vite | Fast dev server, optimized production builds |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Animation** | motion/react | Smooth, performant transitions |
| **Icons** | lucide-react | Consistent iconography system |
| **Server** | Express + Vercel Functions | Local dev server and deployed API routes |

### Data Flow

1. **Component Layer** — Sidebar, LeadDetail, LeadList, LeadBoard, CustomersList render UI
2. **State Management** — React hooks (`useState`, `useRef`) manage modal states, lead selection, AI provider status
3. **AI Orchestration** — Real-time provider health checks, fallback logic, multi-provider support
4. **Data Models** — Type-safe Lead, Customer, and Grant structures with immutable patterns

## Configuration

### AI Providers

FollowFlow supports multiple AI backends:

- **Ollama** — Local inference, no API key required
- **OpenAI** — Cloud-based, requires API key
- **Anthropic** — Cloud-based Claude models, requires API key
- **Gemini** — Google's Gemini API, requires API key
- **Groq** — Cloud-based fast inference, requires API key

Provider configuration and health status are monitored in real-time via the header status indicator.

### Groq setup (including Vercel deployment)

To run FollowFlow with Groq in a deployed environment:

1. Create a Groq API key in your Groq account.
2. Set these environment variables:
   - `GROQ_API_KEY` (required)
   - `GROQ_MODEL` (optional, default: `llama-3.1-8b-instant`)
   - `GROQ_TIMEOUT_MS` (optional, default: `30000`)
3. In Vercel, add the variables in **Project Settings → Environment Variables** for the environments you use (Preview/Production). Use the exact key name `GROQ_API_KEY`.
4. Vercel deploys the backend from `api/llm-status.ts` and `api/draft.ts`, so no separate long-running Express server is required in production.
5. Redeploy after saving env vars.
6. Verify `https://<your-domain>/api/llm-status` returns JSON and `groq.configured` is `true`.
7. In the app, choose **Groq (API)** from the LLM selector (or it will auto-default to Groq when no OpenAI/Anthropic/Gemini keys are set and `GROQ_API_KEY` is present).

### Vercel checklist

If you are deploying FollowFlow to Vercel, use this exact setup:

1. Go to **Project Settings → Environment Variables**.
2. Add `GROQ_API_KEY` for `Production`, `Preview`, and `Development`.
3. Optionally add `GROQ_MODEL` and `GROQ_TIMEOUT_MS` if you want to override defaults.
4. Redeploy the project after saving the variables.
5. Confirm the deployed app can load `/api/llm-status` and then generate a draft from the lead panel.

## Development

### Hot Module Replacement (HMR)

Changes to `.tsx`, `.ts`, and `.css` files trigger instant browser refresh:

```bash
npm run dev
```

### Type Checking

Run TypeScript compiler in check-only mode:

```bash
npm run lint
```

### Code Organization

- **Components** are isolated, testable units with clear prop interfaces
- **Types** are defined in `src/types.ts` with strict null-safety enabled
- **Utilities** provide reusable logic for data transformation and formatting
- **Styling** uses Tailwind's utility classes with custom sizing for responsive design

## Building

### Development Build

```bash
npm run build
```

Outputs optimized bundle to `dist/` with tree-shaking and code splitting.

### Production Server

```bash
npm run preview
```

Serves the production build locally for validation before deployment.

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Maintain TypeScript strict mode compliance
2. Keep components focused and testable
3. Follow existing naming conventions
4. Update types in `src/types.ts` for new data structures
5. Run `npm run lint` before committing

## License

MIT

---

**Built for small businesses, creators, and entrepreneurs.**  
*FollowFlow — Building relationships not complexity.*
