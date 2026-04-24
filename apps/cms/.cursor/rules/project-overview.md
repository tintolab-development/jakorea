---
priority: high
always_include: true
category: overview
---

# CMS project overview

Guide for the **JAKorea CMS** frontend (`apps/cms`).

## What it is

A web app for running education programs: applications, matching, settlements, and admin operations.

## Principles

- **Feature-Sliced Design (FSD)**  
- **Ant Design 5** UI  
- **Strict TypeScript**  
- **Zustand** for client state  
- **React Hook Form + Zod** for forms  

## Where rules live

| Folder | Topics |
|--------|--------|
| [architecture](./architecture/) | FSD, routing |
| [coding](./coding/) | Style, components, hooks |
| [libraries](./libraries/) | Ant Design, shared packages |
| [state](./state/) | Zustand |
| [data](./data/) | Mock data, API notes |
| [forms](./forms/) | Validation |
| [tables](./tables/) | Tables & filters |
| [environment](./environment/) | Browser, pnpm, stack |
| [process](./process/) | Workflow, personas, feature specs |

## Commands

```bash
pnpm --filter cms dev
pnpm --filter cms build
pnpm --filter cms typecheck
pnpm --filter cms lint
```

## Docs (repo)

- [Requirements progress](../../docs/requirements-specification/progress.md)  
- [Requirements](../../docs/requirements-specification/requirements.md)  
- [Roadmap V4](../../docs/roadmap/MVP_ROADMAP_V4_DETAILED.md)  

---

**Last updated:** 2026-04-21
