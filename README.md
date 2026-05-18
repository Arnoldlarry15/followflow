# FollowFlow

FollowFlow is an AI-assisted follow-up and opportunity tracking app designed to help small businesses manage leads, maintain communication, and keep important opportunities from falling through the cracks.

The platform combines a lightweight React dashboard with flexible multi-provider AI integrations for generating context-aware follow-up drafts across sales, customer outreach, grants, and loan workflows.

## Features
AI-generated follow-up drafting
Lead and opportunity tracking
Multi-provider AI support
Local-first fallback support with Ollama
Lightweight business workflow interface
Fast setup with minimal configuration
Providers

FollowFlow can generate drafts using one of four providers:

Ollama running locally with Qwen (default fallback)
OpenAI via OPENAI_API_KEY
Anthropic via ANTHROPIC_API_KEY
Gemini via GEMINI_API_KEY

If no cloud API keys are configured, FollowFlow automatically falls back to a local Ollama-powered Qwen 2.5; 7B model.

## Tech stack
React
TypeScript
Vite
Tailwind CSS
Express
Ollama
OpenAI API
Anthropic API
Google Gemini API
Setup

Install dependencies:

npm install

Start the development server:

npm run dev
Local Ollama setup

Install Ollama and pull the default local model:

ollama pull qwen2.5:7b

Make sure Ollama is running before starting FollowFlow.

## Environment variables

Create a .env.local file in the project root to override defaults or configure cloud providers.

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b

OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini

ANTHROPIC_API_KEY=your_anthropic_key_here
ANTHROPIC_MODEL=claude-3-5-haiku-latest

GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash

## How it works
Open a lead or opportunity in the app.
Select an AI provider from the header.
Generate a follow-up draft from the detail panel.
The server constructs a contextual prompt using lead data.
The selected provider returns a generated draft.
If no cloud provider is configured, the app falls back to local Ollama inference.

## Troubleshooting
Ollama not detected
Confirm Ollama is installed and running
Verify OLLAMA_BASE_URL
Test locally:
ollama list
API provider issues
Confirm the relevant API key is present in .env.local
Restart the app after changing environment variables
Model errors

Ensure the configured model exists locally:

ollama pull qwen2.5:7b

## Vision

FollowFlow is built around a simple idea:

Small businesses often lose opportunities because follow-up becomes fragmented across inboxes, spreadsheets, notes, and disconnected tools.

FollowFlow aims to simplify that process through AI-assisted communication, centralized opportunity visibility, and accessible automation workflows without requiring enterprise software complexity.