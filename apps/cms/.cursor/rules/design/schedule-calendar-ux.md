# Schedule calendar — click behaviour

## Context

Admins add many schedule items; **viewing** is frequent, **creating** is periodic.

## Options

1. **Date with events → open summary/drawer (recommended)**  
   - Clicking the day (even empty padding) opens the day’s events.  
   - Creating a new item uses an explicit **“Add schedule”** action or clicking an **empty** day.

2. **Current mixed behaviour**  
   - Item click → detail.  
   - Empty area on busy day → create modal (fast add, ambiguous intent).

3. **Hybrid**  
   - Day opens list drawer with “Add” inside—extra step, clearer intent.

## Recommendation

Prefer **option 1** for consistency with common calendar apps and fewer mistaken creates.

## Engineering

- Stop propagation on nested controls per [event-handling.md](./event-handling.md).

**Last updated:** 2026-04-21
