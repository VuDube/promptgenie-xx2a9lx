# PromptGenie - Local-First AI Architect

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/VuDube/promptgenie-local-first-ai-architect)

PromptGenie is a high-performance, local-first Progressive Web App (PWA) designed for advanced prompt engineering on rugged Android devices and desktops. Adhering to the 'Cyber Nocturne' aesthetic, it functions primarily offline using IndexedDB for persistence, utilizing the Cloudflare template solely for optional synchronization and heavy-duty inference.

## Key Features

- **Local-First Architecture**: Full offline functionality with Dexie.js-powered IndexedDB for conversations, prompt templates, and settings.
- **Pre-Loaded Prompt Library**: Curated templates using frameworks like CO-STAR, CRISPE, TCEF, APE, and Role-Based across categories (Research, Legal, Code, Creative).
- **Intelligent Model Router**: Routes prompts to Cloudflare Workers AI (@cf/meta/llama-3.3-70b-instruct-fp8-fast, @cf/deepseek-ai/deepseek-coder-7b-instruct-v1.5), user-provided API keys (OpenAI, Anthropic, Gemini), or local WebLLM fallback.
- **Cyber Nocturne UI**: Stunning dark-mode interface with glassmorphism, neon accents, smooth animations via Framer Motion, and responsive design.
- **Sync Engine**: Manual "Sync" button triggers batched synchronization to Cloudflare D1/KV/R2 via Service Worker background sync.
- **PWA Excellence**: Installable on Android (optimized for Oukitel WP18 Pro), offline caching, and standalone experience.
- **Chat Excellence**: Markdown rendering, code syntax highlighting, copy-to-clipboard, and tool integration.
- **Views**:
  - **Cyber Interface (Home)**: Chat stream, model selector, sync status.
  - **Prompt Library Drawer**: Categorized, searchable templates.
  - **Settings & Sync Dashboard**: API keys, storage usage, sync controls.

> **Note**: This project leverages Cloudflare AI capabilities, but there is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS 3, shadcn/ui, Framer Motion, Lucide React, React Markdown, React Syntax Highlighter, Zustand
- **State & Persistence**: Dexie.js (IndexedDB), IndexedDB sync queue
- **Backend**: Cloudflare Workers, Agents SDK, Durable Objects (CHAT_AGENT, APP_CONTROLLER), Hono, OpenAI SDK
- **PWA**: Service Worker, Manifest, Background Sync
- **Tools**: clsx, tailwind-merge, Zod, React Hook Form, React Router
- **Deployment**: Cloudflare Pages & Workers

## Quick Start

1. **Clone & Install**:
   ```bash
   git clone <your-repo-url>
   cd promptgenie
   bun install
   ```

2. **Environment Setup** (Cloudflare AI Gateway required):
   - Update `wrangler.jsonc` with your `CF_AI_BASE_URL` and `CF_AI_API_KEY`.
   - Run `bun run cf-typegen` to generate types.

3. **Development**:
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Build & Preview**:
   ```bash
   bun run build
   bun run preview
   ```

## Usage

- **Chat Interface**: Type prompts or inject from library drawer (toggle via button). Supports streaming responses.
- **Prompt Library**: Open drawer → Search/Browse categories → Click to populate input.
- **Model Selection**: Switch between local/cloud models in header. Free-tier counters auto-fallback.
- **Sync**: Press prominent "Sync" button to queue/push local data to Cloudflare backend (works offline via Service Worker).
- **Settings**: Manage API keys, view sync status, storage usage.
- **PWA Install**: Add to home screen on Android for standalone/offline use.

Example workflow:
1. Open library → Select "CO-STAR Legal Review" template.
2. Fill variables → Send.
3. Router selects optimal model → Response streams with copy button.
4. Click Sync → Data persists to cloud.

## Development

- **Hot Reload**: `bun run dev` with Vite HMR.
- **Linting**: `bun run lint`.
- **Type Generation**: `bun run cf-typegen` after env changes.
- **Adding Routes**: Extend `worker/userRoutes.ts` (do not modify `worker/index.ts`).
- **Custom Tools/MCP**: Update `worker/mcp-client.ts` and `worker/tools.ts`.
- **UI Customization**: Edit `src/pages/HomePage.tsx`, use shadcn/ui components from `@/components/ui/*`.
- **State Management**: Leverage Durable Objects via `/api/chat/:sessionId/*` APIs or Zustand for local state.
- **Pitfalls**:
  - IndexedDB schema versioning during dev.
  - Mobile virtual keyboard handling.
  - Sync conflicts: Last-Write-Wins.

**Do not modify**: `wrangler.jsonc`, `package.json`, `worker/index.ts`, shadcn/ui components.

## Deployment

1. **Push to GitHub**: Ensure repo is public/private as needed.
2. **Cloudflare Dashboard**:
   - Go to [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages).
   - Connect GitHub repo → Deploy.
3. **Configure Secrets**:
   - Pages → Settings → Environment Variables: Add `CF_AI_BASE_URL`, `CF_AI_API_KEY`.
4. **Database Migration**: Pages auto-handles Durable Objects.
5. **Deploy**:
   ```bash
   bun run build
   bun run deploy
   ```

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/VuDube/promptgenie-local-first-ai-architect)

Your app will be live at `https://<subdomain>.pages.dev`.

## Sessions & Persistence

- Conversations persist via Durable Objects (`/api/chat/:sessionId`).
- List/manage: `/api/sessions` endpoints.
- New session auto-creates on first message.

## Contributing

1. Fork & clone.
2. `bun install`.
3. Create feature branch.
4. `bun run dev` → Test.
5. PR with clear description.

## License

MIT License. See [LICENSE](LICENSE) for details.