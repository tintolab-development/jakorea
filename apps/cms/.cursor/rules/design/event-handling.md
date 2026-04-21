# Event handling

## Stop propagation

Interactive controls inside **tables**, **rows**, or **nested click targets** should call `stopPropagation()` so parent row clicks / overlays do not fire unintentionally.

### Tables

Wrap dropdowns, buttons, `Popconfirm`, etc.:

```tsx
<div onClick={(e) => e.stopPropagation()}>
  <Dropdown>
    <Button onClick={(e) => e.stopPropagation()}>…</Button>
  </Dropdown>
</div>
```

### Forms inside rows

Use `onClick={(e) => e.stopPropagation()}` on wrappers; for `Radio.Group` / `Checkbox.Group`, stop on group and controls when needed.

### Calendar widgets

Wrap `Calendar` and mode toggles so date cell clicks do not bubble to parent cards.

## Related

- [schedule-calendar-ux.md](./schedule-calendar-ux.md)  
- [form-validation.md](../forms/form-validation.md)  

**Last updated:** 2026-04-21
