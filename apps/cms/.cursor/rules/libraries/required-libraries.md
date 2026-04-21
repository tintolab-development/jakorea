# Required libraries (CMS)

> **Source of truth:** `apps/cms/package.json`. This file summarizes intent; versions may drift—verify lockfile.

## Core UI / app

| Package | Role |
|---------|------|
| `react`, `react-dom` | UI runtime |
| `antd`, `@ant-design/cssinjs` | Components + styling |
| `@jakorea/ui`, `@jakorea/utils` | Monorepo shared UI/utils |

## Routing & data

| Package | Role |
|---------|------|
| `react-router-dom` | Routing |
| `axios` | HTTP client (mock/real APIs) |
| `zustand` | Client global state |

## Forms & validation

| Package | Role |
|---------|------|
| `react-hook-form`, `@hookform/resolvers` | Forms |
| `zod` | Schema validation |

## Tables & utilities

| Package | Role |
|---------|------|
| `@tanstack/react-table` | Table model / filters (when used) |
| `date-fns` | Date formatting |
| `dayjs` | Often paired with Ant DatePicker |

## Domain-specific (add when needed)

| Package | Role |
|---------|------|
| `exceljs` | Settlement / Excel export |
| `recharts` | Dashboard charts (optional) |
| `file-saver` (+ types) | Browser download of generated files |
| `lodash-es` | Heavy array/object helpers (prefer native + small utils first) |

## Install pattern

```bash
pnpm --filter cms add <package>
```

## Related

- [package-management.md](../environment/package-management.md)  
- [tech-stack.md](../environment/tech-stack.md)  

**Last updated:** 2026-04-21
