---
priority: low
always_include: false
category: process
---

# Progress tracking

## Source of truth

Track delivery against requirements in `apps/cms/docs/requirements-specification/progress.md`. Optional role-specific logs may live elsewhere but must stay aligned with `progress.md`.

## Entry template

```markdown
### [YYYY-MM-DD] — [Title]

**Request**: …

**Outcome**:
- ✅ …

**By role**: Designer / Planner / PM / Developer (brief)

**Notes**: …
```

## What to log

- **Include**: meaningful prompts and outcomes (not trivial debug/typos).  
- **Exclude**: pure debugging noise.

## Role shorthand

- **Designer** — UI/UX, design system.  
- **Planner** — requirements, specs, scenarios.  
- **PM** — schedule, priorities, decisions.  
- **Developer** — implementation, architecture.

## When to update

- End of phase, major milestones, or when a meaningful chunk of work finishes.

## Phase kickoff (optional)

Before each phase, brief by role: goals, deliverables, constraints, ETA. Store phase briefs under `docs/` if needed.

## Related

- [development-process.md](./development-process.md)

**Last updated:** 2026-04-21
