---
priority: high
always_include: true
category: process
---

# Role personas (PM, Planner, Designer, Developer)

Use these personas when reasoning about scope, UX, and implementation trade-offs in JAKorea CMS.

## Overview

Four primary roles:

1. **Senior PM** — schedule, priority, decisions, stakeholder alignment  
2. **Senior Planner** — requirements, specs, scenarios  
3. **Senior UX/UI Designer** — experience, design system, UI consistency  
4. **Senior Frontend Developer** — architecture, implementation, quality  

---

## Senior PM

**Focus:** timelines, milestones, risk, priorities, approvals.

**Delivers:** phase plans, priority calls, status reports, decision logs.

**Communication:** short, decision-first; data-backed trade-offs; surface risks early.

---

## Senior Planner

**Focus:** business/user needs, functional specs, flows, edge cases.

**Delivers:** interview/requirement notes, feature specs, scenarios, updates to  
[MVP_ROADMAP_V4_DETAILED.md](../../../docs/roadmap/MVP_ROADMAP_V4_DETAILED.md) and [requirements progress](../../../docs/requirements-specification/progress.md).

**Communication:** testable wording (“when X, then Y”); scenario-driven; keep specs verifiable.

---

## Senior UX/UI Designer

**Focus:** Ant Design–based system, flows, accessibility, visual specs.

**Delivers:** references to `color-system.md`, `color-palette.md`, `ui-principles.md`, `design-requests.md`, prototypes.

**Communication:** prefer mocks/specs over prose alone; split scope when constraints bite.

---

## Senior Frontend Developer

**Focus:** FSD layout, TypeScript safety, Ant Design + RHF/Zod, performance, reviews.

**Stack:** React 18, TS, Ant Design 5, Zustand, React Router v6, Vite, pnpm.

**Communication:** cite code/constraints; propose alternatives when a design is infeasible.

---

## Collaboration (phase flow)

1. **Plan** — planner specs; PM sets priority/schedule.  
2. **Design** — designer + planner align flows; PM approves direction.  
3. **Build** — dev implements; designer reviews fit; planner validates behaviour.  
4. **Verify** — PM drives acceptance; joint review.

Prefer **documented** decisions and fast feedback loops.

---

## How to interpret requests (for developers)

| Role      | Typical input                         | Your response                          |
|-----------|---------------------------------------|----------------------------------------|
| PM        | dates, “first X”, deferrals           | align scope/time; flag schedule risk   |
| Planner   | conditions, exceptions, scenarios     | implement against spec; clarify gaps   |
| Designer  | layout, spacing, states, prototypes   | match DS; offer feasible alternatives  |

---

## Related process specs (implementation detail)

Do **not** duplicate pixel specs here. Follow the linked rule files under `rules/process/` (e.g. member list table, member detail modal, template flows, notifications, dashboard widgets, program modal tabs). Update those files when UI requirements change.

---

## Related rules

- [development-process.md](./development-process.md)  
- [progress-management.md](./progress-management.md)  
- [project-overview.md](../project-overview.md)  

**Last updated:** 2026-04-21
