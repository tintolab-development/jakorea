# Color palette

**Brand (reference):** Primary `#01A1AF`, secondary `#296075`, `#22404B`.

## Principles

1. Prefer **brand teal** for core education surfaces.  
2. Keep domains visually distinct but harmonious.  
3. Meet **WCAG 2.1 AA** contrast for text.

## Domain mapping (summary)

| Domain | Primary | Notes |
|--------|---------|-------|
| Program | `#01A1AF` | Brand-forward |
| School | `#13C2C2` | Teal variant |
| Instructor | `#722ED1` | Purple |
| Sponsor | `#FA8C16` | Warm orange |
| Application | `#EB2F96` | Pink |
| Schedule | `#FADB14` | Yellow (attention) |
| Matching | `#52C41A` | Green |
| Settlement | `#FF4D4F` | Red (money/critical) |

Exact light/dark companions and CSS vars live in `theme-provider.css`.

## Usage

- Prefer **`var(--color-*)`** tokens — see [styling-tokens.md](./styling-tokens.md).  
- Avoid raw hex in new CSS unless adding a new approved token.

**Last updated:** 2026-04-21
