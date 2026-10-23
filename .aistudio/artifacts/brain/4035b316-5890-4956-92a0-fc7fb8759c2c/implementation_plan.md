# Google Gemini Workspace & Conversational AI Revamp

This plan outlines a complete visual and technical overhaul of the application to faithfully replicate the Google Gemini web interface (matching your reference screenshots), resolve the empty output streaming bug, and provide interactive workspace views for Collections, Media, Scheduled Tasks, Customization, and Notebooks.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core product decisions have been confirmed based on your preferences and reference screenshots:

- **Confirmed Decision 1 — Bilingual Interface (Indonesian Default + English Toggle)**: The UI defaults to Indonesian matching your reference screenshot (*"Sebaiknya kita mulai dari mana?"*, *"Percakapan baru"*, *"Minta Gemini"*, *"Koleksi"*, *"Gambar"*, *"Video"*), with a one-click language switch in the profile/settings bar to toggle between Indonesian (`ID`) and English (`EN`).
- **Confirmed Decision 2 — Functional Sidebar Navigation Views**: Clicking *Koleksi* (Collections/Saved Responses), *Gambar* (Image Gallery), *Video* (Video Prompts & Media), *Dijadwalkan* (Scheduled Tasks/Reminders), *Sesuaikan* (System Instructions & Persona Customization), or *Notebook Baru* opens dedicated, interactive views rather than static placeholders.
- **Confirmed Decision 3 — Resilient Streaming & Automatic Model Fallback**: When a selected model (such as `Gemini 4 Argon` / Pro) experiences API demand spikes, quota restrictions, or paid-key requirements, the backend automatically falls back to `gemini-3.8-flash` or `gemini-3.1-flash-lite` and fixes the client-side SSE error parser so responses never terminate with empty output.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an authentic Google Gemini dark-mode conversational workspace featuring a dynamically positioned prompt box (centered in empty state, floating at bottom center in active chats), borderless left-aligned message threads, multimodal file/image uploads, voice dictation, text-to-speech, and dedicated views for saved collections, generated/uploaded media, and notebooks.
- **Target Audience / Persona**: Developers, creators, and knowledge workers who want the clean, distraction-free Google Gemini aesthetic paired with multi-model resilience and structured workspace organization.
- **Key Value**: Eliminates visual clutter and rigid chat bubbles in favor of Gemini's signature radial-glow canvas and borderless typography, while guaranteeing 100% reliable response streaming without empty output errors.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Empty State ("Sebaiknya kita mulai dari mana?")**:
   - When opening the app or clicking *Percakapan baru* (New Chat), the viewport displays a deep obsidian canvas with a subtle radial navy-indigo glow in the center.
   - The greeting headline *"Sebaiknya kita mulai dari mana?"* (*"Where should we start?"*) sits directly above the centered pill-shaped prompt bar.
   - Below the prompt bar sit the mode selector pills (*Percakapan* / Chat and *Tugas* / Tasks) and optional quick-starter suggestions.
2. **Transition to Active Conversation**:
   - Submitting a prompt smoothly transitions the layout: the prompt box docks to the bottom center of the screen, and the main canvas becomes a clean, scrollable conversation thread.
   - Both User and Gemini messages render as clean, borderless, left-aligned blocks with distinct circular avatars (user profile badge vs. Gemini four-point star icon).
   - While awaiting the stream, a smooth shimmering *"Gemini sedang berpikir..."* (*"Gemini is thinking..."*) skeleton and animated star indicator appear.
3. **Sidebar Workspace & History Navigation**:
   - The collapsible 260px left sidebar features the Gemini sparkle brand header, quick search trigger, and collapse button at the top.
   - Below *"Percakapan baru"*, users can switch between *Koleksi* (bookmarked messages), *Gambar* (all uploaded/analyzed images across chats), *Dijadwalkan* (scheduled prompts & tasks), *Sesuaikan* (custom system instructions), *Video*, and *Notebook* (structured multi-note scratchpads).
   - The *Semua* (All Recent Conversations) list is scrollable with category filtering, inline rename, pin, and delete actions, anchored by the *RuangFokus (Pro)* user profile and language/settings trigger at the bottom.

### Visual Identity & Theme
- **Aesthetic Direction**: Authentic Google Gemini Dark Mode—minimalist, atmospheric, borderless prose, and pill-contoured interactive controls.
- **Color Palette & Mood**:
  - `--background`: `#0b0c10` (Deep obsidian primary canvas) with centered radial ambient glow `radial-gradient(circle at 50% 45%, rgba(29, 53, 135, 0.28), rgba(11, 12, 16, 0) 68%)`.
  - `--surface-sidebar`: `#131418` (Subtle elevated dark neutral for the collapsible left panel).
  - `--surface-input`: `#1e1f24` (Floating pill input dock with `#2d2f36` hairline border on focus).
  - `--primary-accent`: `#4c8df6` to `#8ab4f8` (Google Gemini signature blue/indigo sparkle gradient).
  - `--text-primary`: `#e3e3e3` (High-legibility off-white body prose) and `#8e918f` (Muted secondary labels).
- **Typography & Hierarchy**:
  - *Display & Greeting*: `Plus Jakarta Sans` (Medium 500, `clamp(1.75rem, 3vw, 2.5rem)`, balanced tracking for the centered greeting).
  - *Body Prose*: `Plus Jakarta Sans` (Regular 400, `15.5px`, `1.7` line-height, comfortable `68ch` measure).
  - *Code & Tabular Data*: `Fira Code` (`tabular-nums` for timestamps, token counters, and syntax-highlighted code blocks).
- **Interactive Feedback & Motion**:
  - Smooth `200ms` sidebar slide transitions (`transform` & `opacity`).
  - Shimmering gradient text and rotating Gemini star icon during thinking and streaming states.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Fixing the `(Response ended without text output)` Bug & Adding Auto-Fallback**
  - *Chosen Approach*: Refactor the server SSE pipeline and client stream reader, and implement automatic model fallback (`gemini-4-argon` $\rightarrow$ `gemini-3.8-flash` $\rightarrow$ `gemini-3.1-flash-lite`).
  - *Why*: In the previous version, selecting `Gemini 4 Argon` ("Pro") with `Think High` and `Search` could trigger an API error or return thought-only parts, and an inner `try/catch` block in the client SSE parser accidentally swallowed `{ type: "error" }` events—causing the stream loop to finish with an empty string and display `*(Response ended without text output)*`. By separating JSON parse errors from server error events and automatically falling back on the server when a model is unavailable or rate-limited, every prompt is guaranteed to produce a valid streamed response.
  - *Alternatives Considered*: Failing hard with an error banner when `gemini-4-argon` is unavailable was rejected because it interrupts the user's conversation flow.

- **Decision 2: Dynamic Input Box Positioning (Centered vs. Bottom Docked)**
  - *Chosen Approach*: Render the input box directly in the center of the viewport when the active chat has zero messages, and dock it at the bottom center once the first message is sent.
  - *Why*: Directly matches the Google Gemini empty-state layout shown in your first screenshot while preserving standard bottom-docked ergonomics during multi-turn reading.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Google Gemini Web Workspace (SPA)                     │
├──────────────────────┬───────────────────────────────────────────────────────┤
│ Collapsible Sidebar  │ Main Viewport Canvas                                  │
│                      │                                                       │
│ ┌──────────────────┐ │ ┌───────────────────────────────────────────────────┐ │
│ │ Brand + Search   │ │ │ Top Utility Bar (Sidebar Toggle, Download, Share) │ │
│ │ + Collapse Btn   │ │ └───────────────────────────────────────────────────┘ │
│ └──────────────────┘ │                                                       │
│ ┌──────────────────┐ │ ┌───────────────────────────────────────────────────┐ │
│ │ + Percakapan Baru│ │ │ View Router:                                      │ │
│ └──────────────────┘ │ │  • Empty Chat State (Radial Glow + Centered Input)│ │
│ ┌──────────────────┐ │ │  • Active Chat State (Borderless Left-Aligned)    │ │
│ │ Workspace Nav:   │ │ │  • Koleksi /Gambar /Video /Dijadwalkan /Notebook  │ │
│ │ • Koleksi        │ │ └───────────────────────────────────────────────────┘ │
│ │ • Gambar & Video │ │                                                       │
│ │ • Dijadwalkan    │ │ ┌───────────────────────────────────────────────────┐ │
│ │ • Sesuaikan      │ │ │ Gemini Pill Input Box (Center or Bottom-Docked)   │ │
│ │ • Notebook Baru  │ │ │  [+] Attachment | Auto-Grow Input | [Pro v] [Mic] │ │
│ └──────────────────┘ │ └───────────────────────────────────────────────────┘ │
│ ┌──────────────────┐ │                                                       │
│ │ Recent History   │ │                                                       │
│ │ (Semua + Filter) │ │                                                       │
│ └──────────────────┘ │                                                       │
│ ┌──────────────────┐ │                                                       │
│ │ User Profile     │ │                                                       │
│ │ RuangFokus (Pro) │ │                                                       │
│ └──────────────────┘ │                                                       │
└──────────────────────┴───────────────────────────┬───────────────────────────┘
                                                   │ POST /api/chat/stream (SSE)
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Express Backend Proxy & Model Router                     │
│  • Multi-Turn Content Normalizer (Text + Inline Base64 Images + Code Files)  │
│  • Resilient Model Executor:                                                 │
│      Primary Model (Pro / Flash / Fast) ──(On 400/403/429/503)──► Fallback   │
│  • Thought & Text Extractor (Guarantees non-empty output stream)             │
│  • Audio Endpoints: /api/tts (Voice Readout) & /api/transcribe (Dictation)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Conversations (`ChatSession[]`)**: Stored in `localStorage` with instant switching; tracks `id`, `title`, `messages`, `model` (`pro` | `flash` | `fast`), `mode` (`chat` | `task`), `pinned`, and `createdAt`/`updatedAt`.
- **Saved Collections (`CollectionItem[]`)**: Bookmarked AI responses or code snippets saved from any chat turn for quick reference in the *Koleksi* view.
- **Notebooks (`NotebookItem[]`)**: Structured scratchpad notes created via *+ Notebook baru* where users can draft long-form documents alongside AI assistance.
- **Scheduled Prompts (`ScheduledItem[]`)**: Prompts queued under *Dijadwalkan* that can be executed on demand or managed as tasks.
- **User Preferences**: Active language (`id` | `en`), custom instructions (*Sesuaikan*), and user display name (*RuangFokus*).

### Interactive Component & State Mapping
- **Input Box (`+` Attachment, Model Dropdown, Mic, Send)**:
  - Clicking `+` opens a file picker accepting images (`PNG`, `JPG`, `WebP`) and documents/code files, displaying removable thumbnail previews inside the pill container.
  - Selecting `Pro`, `Flash`, or `Fast` updates the active model tier.
  - Pressing `Enter` submits the message; `Shift + Enter` inserts a line break.
- **Active Chat Message Blocks**:
  - Both User and AI messages align to the left within a centered `768px` column without boxy background borders.
  - AI messages feature a shimmering thinking state while waiting, expandable reasoning trace if thoughts were emitted, and action buttons for Copy, Save to Collection (*Koleksi*), Listen (TTS), and Regenerate.
