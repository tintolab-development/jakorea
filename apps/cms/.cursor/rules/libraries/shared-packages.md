# 공유 패키지 사용

## @jakorea/ui

공유 UI 컴포넌트를 사용합니다.

### 사용 예시

```typescript
import { Button } from '@jakorea/ui'

<Button variant="primary">클릭</Button>
```

## @jakorea/utils

공유 유틸리티 함수를 사용합니다.

### 사용 예시

```typescript
import { formatDate, timeSince } from '@jakorea/utils'

const formatted = formatDate(new Date())
const relative = timeSince(new Date())
```

## 관련 규칙

- [필수 라이브러리](./required-libraries.md)
- [패키지 관리](../environment/package-management.md)




