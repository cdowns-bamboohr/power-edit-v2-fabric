# Ad Astra — Complete Package Index

## What This Is

This is the full AI-native design system infrastructure for BambooHR's Fabric design system. It transforms Claude Code from a generic code assistant into a design system–aware builder that enforces Fabric compliance, automates contribution workflows, and scales a 4-person Design Ops team to support a 90-person product organization across 13 product teams.

---

## File Inventory

### Core Configuration

| File | Purpose | Install Location |
|------|---------|-----------------|
| **CLAUDE.md** | The master context file. Loaded by Claude Code on every session. Contains all rules, patterns, component guidance, microcopy standards, and skill references that govern how Claude builds UI. This is the single most important file — it's what makes Claude "design-system-aware." | Project root (`.claude/CLAUDE.md` or repo root) |
| **figma-to-fabric-props.md** | Lookup table mapping every Figma component's property variants (Type, Size, State, Theme) to the correct Fabric React props. Used by `/launch` when translating Figma designs to code. | `docs/figma-to-fabric-props.md` |
| **ad-astra-mission-control-architecture.md** | Strategic architecture document. Explains the Ad Astra metaphor, skill naming rationale, phased rollout plan, and how the skills create autonomous workflows. This is the "why" document for leadership and team onboarding — not loaded by Claude Code at runtime. | Team docs / wiki |

### Skills (`.claude/skills/`)

Each skill is a Claude Code slash command that automates a multi-step workflow. Skills are invoked with `/` prefix (e.g., `/launch`, `/orbit`).

#### Phase 1: Build & Verify

| File | Skill | What It Does | Who Uses It |
|------|-------|-------------|-------------|
| **launch.md** | `/launch [Figma URL]` | Builds production-ready pages from Figma using Fabric components. Decomposes Figma designs, maps elements to Fabric components, spawns parallel build agents, assembles into page. `--nebula` flag builds raw React for early exploration. | Every designer |
| **orbit.md** | `/orbit [URL]` | Full QA suite: takes visual screenshots (light/dark mode), compares against Figma, scans code for 19 compliance violations across CRITICAL/WARNING/COPY severity levels. `--scan` flag runs code-only audit without browser. | Every designer, Design Ops |

#### Phase 2: Contribute & Govern

| File | Skill | What It Does | Who Uses It |
|------|-------|-------------|-------------|
| **beacon.md** | `/beacon [path]` | Packages components/patterns for system contribution. Runs compliance gate, generates docs (inventory, props, screenshots, usage examples), prepares git commit. `--pattern` for experience patterns, `--update` for Fabric component proposals. | Designers contributing to the system |
| **survey.md** | `/survey` | Repo-wide compliance scan. Parallel agents scan all files, aggregates: overall score, violation frequency, worst offenders, Fabric usage map, custom component inventory, promotion candidates. `--team`, `--since`, `--diff` for scoping. | Design Ops |
| **dock.md** | `/dock [path]` | Converts nebula prototypes to production Fabric. Analyzes custom elements, maps to Fabric equivalents, generates migration plan, runs parallel migration, validates with `/orbit --scan`. `--plan-only` previews without changes. | Designers productionizing prototypes |
| **relay.md** | `/relay [path]` | Generates handoff documentation. Analyzes component tree, state management, data shapes. `--for-eng` produces API specs and integration points. `--for-design` produces pattern rationale and extension points. | Designers handing off to engineering |

#### Phase 3: Intelligence & Guidance

| File | Skill | What It Does | Who Uses It |
|------|-------|-------------|-------------|
| **compass.md** | `/compass "description"` | Pattern recommendation engine. Parses what you're building, matches to page archetype, recommends layout + components + reference prototypes + microcopy reminders. `--scaffold` generates starter files. | Designers starting new work |
| **telemetry.md** | `/telemetry` | System adoption analytics. Scans codebase for: component frequency, unused components, co-occurrence patterns, page archetype detection, promotion candidates. Calculates health scores. Saves JSON for trend tracking. | Design Ops |
| **countdown.md** | `/countdown` | Pre-merge checklist with 30 checks across: branch hygiene, file structure, Fabric compliance, data integrity, accessibility, microcopy, build verification. `--fix` auto-repairs deterministic issues. | Every designer before PR |
| **basecamp.md** | `/basecamp` | New designer onboarding. Verifies environment, tours project structure, introduces all skills, creates first branch, scaffolds first page. `--verify` for environment check only. | New team members |

---

## What's in CLAUDE.md and Why

The CLAUDE.md is 670 lines structured into sections that serve distinct purposes for a 90-person team:

| Section | Lines | Purpose | Critical For |
|---------|-------|---------|-------------|
| **Identity & Purpose** | ~10 | Sets Claude's role as design-system-aware builder, not generic assistant. Establishes priority order. | Every session |
| **Skills — Ad Astra** | ~40 | Quick reference for all 10 skills with commands and descriptions. The entry point for "what can I do?" | Discoverability |
| **Resources** | ~10 | Links to Storybook, Weave, Figma, docs. Prevents Claude from guessing when it should look things up. | Accuracy |
| **Prototype Pages** | ~15 | Index of existing working prototypes. Prevents rebuilding what exists and provides real implementation examples. | Consistency |
| **Critical Rules (12)** | ~40 | Non-negotiable constraints that prevent the most common Fabric violations. These are the rules `/orbit` checks. | Compliance |
| **Microcopy & Capitalization** | ~45 | BambooHR voice, capitalization rules (Title Case vs sentence case per element), date formatting, error message philosophy. From Weave's official guidelines. | Copy quality |
| **Component Selection** | ~30 | Decision tables: which component for which need (messaging, forms, buttons). Eliminates wrong-component mistakes. | Speed |
| **Layout Patterns** | ~20 | Standard page and modal structure templates. | Consistency |
| **Component Usage Guidance** | ~100 | Per-component do's and don'ts from Weave: Tabs, Section, PageHeader, Modal, Accordion, Messages, Pills, Radio, Wizard, DatePicker, Buttons, Spacing. The design judgment layer. | Quality |
| **Component API Gotchas** | ~60 | The exact prop traps that catch people: icon vs startIcon, AI theming, Gridlet.Body wrapper, className, prop names. From real build experience. | Debugging |
| **Typography + Icons + Colors + Spacing** | ~35 | Quick reference for type scale, icon conventions, token prefixes, 4px grid. | Implementation |
| **Experience Architecture** | ~30 | Page archetypes (Dashboard, List, Detail, Settings, Wizard, Inbox), navigation patterns, permission-aware patterns, AI integration patterns. | Strategic consistency |
| **Contribution Pipeline** | ~30 | File structure conventions, naming rules, validation steps, branch naming, status tracking. The workflow every designer follows. | Process |
| **Prototype Mode + When You Don't Know** | ~15 | Safety valve for exploration + escalation path when Claude is uncertain. | Edge cases |

### What's NOT in CLAUDE.md (by design)

- **Full token hex values** — Too verbose (~1,500 lines). Fabric components handle tokens internally. The CLAUDE.md tells Claude to use tokens; the component library enforces which ones.
- **Individual Storybook/Figma links per component** — Lives in `docs/fabric-components-links.md` (separate file, referenced by CLAUDE.md).
- **Full component API reference** — Lives in `docs/fabric-component-reference.md` (separate file, referenced by CLAUDE.md).
- **Figma property tables** — Lives in `docs/figma-to-fabric-props.md` (separate file, referenced by `/launch`).
- **Weave raw documentation** — The 9,300-line export contains voice/tone philosophy, atomic design explanation, email templates, and detailed component narratives. CLAUDE.md extracts only the actionable rules. The raw Weave docs remain at weave.bamboohr.net for human reference.
- **Skill implementation details** — Each skill file contains its own full workflow. CLAUDE.md only has the command reference table.

### Design Principles Behind the Structure

1. **Rules Claude checks > explanations Claude reads.** Every line in CLAUDE.md should either constrain a decision or resolve an ambiguity. Philosophy is cut; checklists stay.

2. **Layered depth.** CLAUDE.md is the fast context (loaded every session). Docs files are the deep reference (loaded on demand by skills). Weave/Storybook are the exhaustive source (fetched when uncertain).

3. **Fail toward the system.** When in doubt, Claude uses a Fabric component. When uncertain about a component, Claude checks documentation. When documentation is ambiguous, Claude asks in #pathfinder-design. The CLAUDE.md encodes this escalation path.

4. **One truth, many consumers.** The same CLAUDE.md serves: individual designers (build), Design Ops (audit), new hires (onboard), and engineering (handoff). Skills customize the context for each use case.

---

## Installation

### Quick Start (CLAUDE.md only)
```
cp CLAUDE.md [your-repo]/.claude/CLAUDE.md
```
This alone makes Claude Code design-system-aware for your Fabric project.

### Full Installation (Skills + Docs)
```
# Core context
cp CLAUDE.md [your-repo]/.claude/CLAUDE.md

# Skills
mkdir -p [your-repo]/.claude/skills
cp skills/*.md [your-repo]/.claude/skills/

# Reference docs
mkdir -p [your-repo]/docs
cp figma-to-fabric-props.md [your-repo]/docs/

# Architecture docs (for team wiki, not loaded by Claude)
cp ad-astra-mission-control-architecture.md [your-team-wiki]/
```

### Recommended Rollout Order
1. **CLAUDE.md** → Immediate value for every designer using Claude Code
2. **`/basecamp`** → Onboard the next new designer
3. **`/countdown`** → Quality gate for every PR
4. **`/launch` + `/orbit`** → Core build/verify loop
5. **`/beacon`** → Removes contribution bottleneck
6. **`/compass` + `/dock` + `/relay`** → Workflow acceleration
7. **`/survey` + `/telemetry`** → Design Ops analytics

---

## Superseded Files

These files from earlier sessions are **replaced** by the Ad Astra package:

| Old File | Replaced By |
|----------|-------------|
| `skill-alloy.md` | `skills/beacon.md` (contribution workflow) |
| `skill-anneal.md` | `skills/dock.md` (prototype → production) |
| `skill-quench.md` | Built into CLAUDE.md + `/orbit` (rules hardening) |
| `skill-smelt.md` | `skills/telemetry.md` + `skills/survey.md` (pattern extraction + scanning) |
| `skill-ecosystem-overview.md` | This README + `ad-astra-mission-control-architecture.md` |

These old files can be safely deleted.
