# QA Status Report

> 최종 업데이트: 2026-01-19
> Phase: 0.4.3 (지급조서/이체리스트), 0.4.4 (실적 통계)

---

## 검증 결과 요약

| 검사 | 결과 | 에러 | 경고 |
|-----|------|------|------|
| TypeScript | ❌ FAIL | 10 | 0 |
| ESLint | ❌ FAIL | 14 | 82 |
| Build | ❌ FAIL | - | - |

---

## 🔴 Critical Issues (빌드 차단)

### 1. Rules of Hooks 위반
**파일:** `src/features/settlement/ui/settlement-detail-drawer.tsx:39-50`

```typescript
// ❌ 문제: Hook이 조건문 이후에 호출됨
if (!settlement) return null  // line 39

const { ... } = useSettlementDetail(settlement, onStatusChange)  // line 41-50
```

**해결 방법:**
```typescript
// ✅ 수정: Hook을 먼저 호출하고, null 체크는 이후에
export function SettlementDetailDrawer({ settlement, ... }: Props) {
  const details = useSettlementDetail(settlement, onStatusChange)

  if (!settlement) return null

  const { programTitle, ... } = details
  // ...
}
```

또는 Hook 내부에서 null 처리:
```typescript
// useSettlementDetail.ts 수정
export function useSettlementDetail(
  settlement: Settlement | null,  // null 허용
  onStatusChange: ...
) {
  // settlement가 null이면 기본값 반환
  if (!settlement) {
    return { canDownload: false, itemColumns: [], ... }
  }
  // ...
}
```

---

### 2. 타입 불일치 (Promise vs void)
**파일:** `src/features/settlement/ui/settlement-detail-drawer.tsx:50`

```typescript
// settlement-detail-drawer.tsx Props
onStatusChange: (status: Settlement['status']) => void  // ❌ void

// use-settlement-detail.ts 시그니처
onStatusChange: (status: Settlement['status']) => Promise<void>  // expects Promise
```

**해결 방법:**
```typescript
// Props 타입 수정
interface SettlementDetailDrawerProps {
  onStatusChange: (status: Settlement['status']) => Promise<void>  // ✅ Promise로 변경
}
```

---

### 3. 누락된 타입 import
**파일:** `src/pages/settlements/settlement-list-page.tsx:211`

```typescript
// ❌ 문제: Settlement 타입이 import 되지 않음
onStatusChange={(status: Settlement['status']) => { ... }}
```

**해결 방법:**
```typescript
// 상단에 import 추가
import type { Settlement } from '@/types/domain'
```

---

## 🟡 Minor Issues (미사용 변수/import)

| 파일 | 라인 | 변수 | 수정 방법 |
|-----|------|------|----------|
| `use-settlement-form.ts` | 10 | `mockPrograms`, `mockInstructors` | import 제거 |
| `use-settlement-management.ts` | 48 | `navigate` | `_navigate` 또는 제거 |
| `interview-list-page.tsx` | 12 | `InterviewStatus` | import 제거 |
| `matching-list-page.tsx` | 25 | `matchingToDelete` | 사용하거나 제거 |
| `performance-dashboard-page.tsx` | 6 | `useMemo` | import 제거 |
| `settlement-list-page.tsx` | 14 | `SettlementFormData` | import 제거 |
| `settlement-list-page.tsx` | 41 | `settlementToDelete` | 사용하거나 제거 |

---

## 수정 가이드

### Quick Fix Script (Cursor AI용)

```
다음 파일들의 미사용 import/변수를 수정해주세요:

1. src/features/settlement/hooks/use-settlement-form.ts
   - Line 10: mockPrograms, mockInstructors import 제거

2. src/features/settlement/hooks/use-settlement-management.ts
   - Line 48: navigate를 _navigate로 변경하거나 사용하지 않으면 제거

3. src/pages/interviews/interview-list-page.tsx
   - Line 12: InterviewStatus import 제거

4. src/pages/matchings/matching-list-page.tsx
   - Line 25: matchingToDelete 사용 또는 제거

5. src/pages/performance/performance-dashboard-page.tsx
   - Line 6: useMemo import 제거

6. src/pages/settlements/settlement-list-page.tsx
   - Line 14: SettlementFormData import 제거
   - Line 41: settlementToDelete 사용 또는 제거
   - 상단에 Settlement 타입 import 추가

7. src/features/settlement/ui/settlement-detail-drawer.tsx
   - Rules of Hooks 위반 수정 (Hook을 조건문 전에 호출)
   - onStatusChange 타입을 Promise<void>로 변경
```

---

## Phase별 영향 파일

### Phase 0.4.3 (지급조서/이체리스트)
- `settlement-detail-drawer.tsx` ❌ Critical
- `settlement-list-page.tsx` ❌ Critical
- `use-settlement-form.ts` ⚠️ Minor
- `use-settlement-management.ts` ⚠️ Minor

### Phase 0.4.4 (실적 통계)
- `performance-dashboard-page.tsx` ⚠️ Minor

### 기타 (이전 Phase)
- `interview-list-page.tsx` ⚠️ Minor
- `matching-list-page.tsx` ⚠️ Minor

---

## 다음 단계

1. Cursor AI가 Critical Issues 3개 수정
2. Minor Issues 7개 수정
3. Claude Code에 재검증 요청: `pnpm validate`
