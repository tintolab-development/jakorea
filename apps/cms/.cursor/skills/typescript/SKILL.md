---
name: typescript
description: Write production-grade TypeScript and React code following project-specific conventions. Use this skill when writing TypeScript code, React components, hooks, utilities, or any TypeScript-related implementation. Ensures code follows the project's coding standards, uses function declarations, Ant Design components, proper naming conventions, and maintains type safety.
always_include: true
---

This skill guides creation of production-grade TypeScript and React code that follows the project's specific conventions and best practices. Implement working code with exceptional attention to code quality, type safety, and maintainability.

The user provides TypeScript/React requirements: components, hooks, utilities, pages, or features to build. They may include context about functionality, data structures, or technical constraints.

## Core Principles

- Follow user requirements carefully and to the letter.
- Think step-by-step - describe your plan in pseudocode, written out in great detail, then implement.
- Write correct, best practice, DRY principle (Don't Repeat Yourself), bug-free, fully functional and working code.
- Focus on easy readability code over being performant.
- Fully implement all requested functionality.
- Leave NO todos, placeholders or missing pieces.
- Ensure code is complete! Verify thoroughly finalized.
- Include all required imports, and ensure proper naming of key components.
- Be concise. Minimize any other prose.

## Development Environment

This project uses the following technology stack:

- **React 19**: UI library
- **TypeScript**: Type safety
- **Ant Design 5**: UI component library
- **React Router**: Routing
- **Zustand**: State management
- **React Hook Form**: Form management
- **Zod**: Schema validation

## Code Implementation Guidelines

### 1. Use Early Returns

Use early returns whenever possible to make the code more readable.

**✅ Good Example**:
```typescript
export function MyComponent({ data }: Props) {
  if (!data) return null
  if (data.length === 0) return <EmptyState />
  
  return <DataList data={data} />
}
```

**❌ Bad Example**:
```typescript
export function MyComponent({ data }: Props) {
  if (data) {
    if (data.length > 0) {
      return <DataList data={data} />
    } else {
      return <EmptyState />
    }
  } else {
    return null
  }
}
```

### 2. Styling: Use Ant Design

**Prioritize Ant Design components**, and use inline styles or CSS files when necessary.

**✅ Good Example**:
```typescript
import { Button, Card, Space } from 'antd'

export function MyComponent() {
  return (
    <Card>
      <Space>
        <Button type="primary">Confirm</Button>
        <Button>Cancel</Button>
      </Space>
    </Card>
  )
}
```

**Inline Styles**:
```typescript
<div style={{ padding: 16, marginBottom: 24 }}>
  <Typography.Text type="secondary">Guide text</Typography.Text>
</div>
```

**CSS Files** (when needed):
```typescript
import './my-component.css'

export function MyComponent() {
  return <div className="my-component-wrapper">...</div>
}
```

### 3. Function Declaration: Use `function` Keyword

Components and functions should be declared using the `function` keyword.

**✅ Good Example**:
```typescript
export function ApplicationListPage() {
  // ...
}

export function getApplicationStatus(status: string): string {
  // ...
}
```

**❌ Bad Example**:
```typescript
export const ApplicationListPage = () => {
  // ...
}

export const getApplicationStatus = (status: string): string => {
  // ...
}
```

**Exception**: Callback functions inside Hooks can use arrow functions:
```typescript
export function MyComponent() {
  const handleClick = useCallback(() => {
    // ...
  }, [])
  
  return <Button onClick={handleClick}>Click</Button>
}
```

### 4. Descriptive Variable and Function Names

Use descriptive names for variables and functions/constants. Event handler functions should use the `handle` prefix.

**✅ Good Example**:
```typescript
export function ApplicationForm({ application }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>({})
  
  const handleSubmit = async () => {
    // ...
  }
  
  const handleCancel = () => {
    // ...
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // ...
  }
  
  return (
    <Form onFinish={handleSubmit}>
      {/* ... */}
    </Form>
  )
}
```

**❌ Bad Example**:
```typescript
export function ApplicationForm({ application }: Props) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({})
  
  const submit = async () => {
    // ...
  }
  
  return <Form onFinish={submit}>...</Form>
}
```

### 5. Implement Accessibility Features

Implement accessibility features on elements. For example, add appropriate attributes for accessibility.

**✅ Good Example**:
```typescript
<Button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
  aria-label="Submit application"
  tabIndex={0}
>
  Submit
</Button>
```

### 6. Type Definitions

Define types whenever possible.

**✅ Good Example**:
```typescript
interface ApplicationFormProps {
  application?: Application
  onSubmit: (data: ApplicationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ApplicationForm({
  application,
  onSubmit,
  onCancel,
  loading = false,
}: ApplicationFormProps) {
  // ...
}
```

### 7. File Naming: Kebab-case

File names should use kebab-case.

**✅ Correct Examples**:
- `application-list-page.tsx`
- `instructor-form.tsx`
- `my-component.tsx`

**❌ Incorrect Examples**:
- `ApplicationListPage.tsx`
- `InstructorForm.tsx`
- `MyComponent.tsx`

**Exception**: `index.ts`, `index.tsx` are allowed as exceptions (directory entry points)

## Related Rules

- [Code Style](../../rules/coding/code-style.md) - ESLint, Prettier, TypeScript configuration
- [Component Patterns](../../rules/coding/component-patterns.md) - Component separation of concerns and patterns
- [Custom Hooks](../../rules/coding/custom-hooks.md) - Custom Hooks writing guide
- [Refactoring Principles](../../rules/coding/refactoring-principles.md) - Code quality principles
- [Ant Design Usage](../../rules/libraries/ant-design-usage.md) - Ant Design basic usage
