<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# AGENTS.md - CONTEXT MANIFESTO FOR "SKILLA" APPLICATION

## 1. PROJECT CRITICAL CONSTRAINTS (CRUNCH WINDOW)
- **Application Name:** SKILLA
- **Development Strategy:** Maximum Velocity, Component Reusability, Zero Scope Creep. 
- **AI Directives:** Do not invent secondary features. Build strictly what is listed within this file. Prioritize robust, compilable TypeScript configurations.

---

## 2. THE CHIEF OF STAFF TECH STACK STANDARDS
- **Framework:** Next.js 16 (App Router Core Architecture)
- **Language:** TypeScript (Strict Typing Engine; no implicit `any`)
- **Styling:** Tailwind CSS (Utility-First Responsive UI Layout)
- **Components:** shadcn/ui (Radix Primitives + Tailwind Layouts)
- **Database Engine:** MongoDB Atlas (Document-based Cloud Database)
- **Object-Relational Mapper:** Prisma v6.19 (Stable MongoDB Native Node Layer)
- **Authentication Engine:** Clerk Next.js App Router Client SDK

---

## 3. DESIGN SYSTEM & CLIENT THEME STRATEGY
Enforce the following design parameters globally. Do not use default blues, purples, or indigo components.
- **Base Background:** Dark Minimalist Neutral (Tailwind `bg-zinc-950` or `bg-neutral-950`)
- **Card Elements:** Deep Zinc Layouts (Tailwind `bg-zinc-900` or `bg-neutral-900`)
- **Accents & Highlights:** Mild Orange Tint (Tailwind `text-orange-500`, `bg-orange-500`, border color `#f97316`)
- **Typography:** Sleek Sans-Serif tracking, high scannability.

---

## 4. NEXT.JS INTERACTIVE FILE-SYSTEM PATHWAY
Execute and preserve this deterministic directory tree configuration:

```text
src/
├── app/
│   ├── layout.tsx             # Root Layout (ClerkProvider, Font definitions)
│   ├── page.tsx               # Redirect Middleware to /home or /sign-in
│   ├── (auth)/
│   │   ├── sign-in/page.tsx   # Login Interface
│   │   └── sign-up/page.tsx   # Initial Sign-Up Landing
│   ├── onboarding/
│   │   └── page.tsx           # Multi-Step Profile Wizard & Target Interceptor
│   └── (dashboard)/
│       ├── layout.tsx         # Golden Frame: Left Sidebar + Right Main Panel
│       ├── home/page.tsx      # Chronological Social Activity Scrollable Feed
│       ├── start/page.tsx     # Live Active Pomodoro Timer & Tasks Core
│       └── progress/page.tsx  # GitHub Intensity Contribution Calendar Heatmap
├── components/
│   ├── ui/                    # Standard shadcn primitive definitions
│   ├── sidebar.tsx            # Persistent Nav Layout Anchor
│   ├── floating-search.tsx    # Header Username Search Input Bar
│   ├── session-card.tsx       # Standard Social Activity Feed Card Component
│   └── pomodoro-timer.tsx     # Browser States Countdown Module
└── lib/
    └── prisma.ts              # High-IQ Singleton MongoDB Database Cache Client

---

5. DATABASE LAYER & PRISMA COMPILATION SCHEMAS
Inject this exact schema representation inside /prisma/schema.prisma. To preserve solo speed and minimize relation table compilation errors on MongoDB, we represent relationships natively using structural ObjectID primitive arrays.

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String         @id @default(auto()) @map("_id") @db.ObjectId
  clerkId      String         @unique
  username     String         @unique
  name         String
  profilePic   String?
  role         String         // Student, Working Professional, Other
  goals        String[]       // Minimum 1 mandatory profile target
  createdAt    DateTime       @default(now())
  
  // Facebook Style Flat Mutual Connection Array Pattern
  friendIds    String[]       @db.ObjectId
  
  studySessions StudySession[]
}

model StudySession {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  title       String   // Configured in post-session interface
  description String?  // Optional context log field
  duration    Int      // Aggregate total work runtime in minutes
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

---

6. SPECIFIC LAYER WORKFLOW IMPLEMENTATION GUIDE
A. Authentication & Onboarding Gateway
When user authenticates via Clerk, check if metadata/database row contains an explicit User mapping entry.

If fresh, redirect to /onboarding. Block entry to dashboard until completed.

Onboarding View Step 1: Collect structural metadata (Name, profile pic placeholder link, select role via dropdown: Student, Working Professional, Other).

Onboarding View Step 2: Goal selection input tracker. User must define and append at least 1 focus target array row string before form validation succeeds.

B. Dashboard Frame Layout Architecture
Every route nested inside (dashboard)/ implements a locked layout block:

Left Structural Sidebar: Locked width, fixed viewport side anchorage. Includes:

Top: Title branding typographical layout ("SKILLA").

Center Nav Stack: Vertical routing buttons [Home, start, Progress] utilizing active visual states accented with Mild Orange.

Bottom Profile Segment: Renders target profile picture avatar + explicit account Username. Clicking this area opens a local context Popover panel containing Profile link and Logout mechanism.

CRITICAL IMPLEMENTATION CONSTRAINT: Interacting with this bottom profile element must NEVER change or navigate away the central content panel structure unless explicitly picking a route link.

Right Main Panel Viewport: Responsive flex area with nested content parameters:

Top Segment: Centralized, layout floating search bar for searching distinct user entries via explicit Username queries.

Core Body Panel: Dedicated scroll container executing page layout operations.


C. Route Segment Specific Mechanics
Home Social Feed View (/home): Checks database for logged events from entries matching user friendIds. Renders vertical content scroll stack. If array matches null or empty states, show layout placeholder instructing user to utilize the top search interface bar. Every social activity item card component must elegantly reveal: Username, date/time string, duration elapsed metric, topic studied title, optional descriptive log, and distinct visual action buttons for [Like/Kudos, Comment, Share].

Start Timer View (/start):

Mode 1 (Active Clock): Implements functional Pomodoro countdown system alongside an inline dynamically editable list box tracker widget for daily target task notes. Bottom container hosts a clean execution button titled "Finish Session".

Mode 2 (Post Session State): Prompted immediately following interaction with the "Finish Session" toggle. Replaces timer display componentry with an explicit form card structure requesting user to: enter title and enter description (optional) linked to a prominent orange interactive submission action trigger called post. On confirmation, create StudySession database row item and cleanly navigate path layout context smoothly back to /home.

Progress Matrix View (/progress): Loads aggregate StudySession event timestamps tracking user historical records. Maps array into a distinct, responsive GitHub-style activity grid heatmap panel visualizing consistency metrics.

Dynamic Profile View Routing: Selecting the Profile navigation block updates workspace panel context to reveal a rich summary componentry layout matching old-school social paradigms: High-resolution background landscape panel canvas, overlapping circular foreground profile avatar frame, profile name info fields, total interactive mutual connection statistics ("Friend Count"), and a stream revealing exclusively the specific target user's personal activity logs history. System adheres strictly to mutual request parameters: No one-way asymmetrical follower structures allowed.

---

7. EXPLICIT AGENT GUARDRAILS & COPILOT RULES
Never Change DB Config Elements: Do not refactor Prisma Client caching hooks without direct architectural authorization.

No Mock Component Renders: Write full, clean functional typescript components. Avoid stubbing files with empty logic layers or standard placeholders.

State Preservation Directive: Ensure Next.js client layout wrappers manage local UI states explicitly inside client components while allowing data pipelines to execute over high-speed server layout contexts.

No Style Inventions: Adhere strictly to the defined dark Zinc/Mild Orange design ruleset. Use standard Tailwind config variables for layout design consistency.






<!-- END:nextjs-agent-rules -->


