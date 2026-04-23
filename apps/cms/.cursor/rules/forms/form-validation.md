---
priority: medium
always_include: false
category: forms
---

# Forms: React Hook Form + Zod

## Rule

All **new** forms use **react-hook-form** for state/submit/validation. Ant Design `Form` may wrap layout, but RHF remains the source of truth.

## Pairing

- **Zod** schemas for validation (`zodResolver`).  
- Colocate schemas in `features/*/model/schema.ts` or `entities/*/model/schema.ts`.

## Example

```typescript
const instructorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

type InstructorFormData = z.infer<typeof instructorSchema>

const form = useForm<InstructorFormData>({
  resolver: zodResolver(instructorSchema),
})
```

## Related

- [component-patterns.md](../coding/component-patterns.md)  
- [event-handling.md](../design/event-handling.md)  

**Last updated:** 2026-04-21
