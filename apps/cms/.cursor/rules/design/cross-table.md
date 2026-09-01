---
priority: high
category: design
---

# 행·열 교차 격자 (`CrossTable`)

**Component:** `@/shared/ui/cross-table` (`CrossTable`, `CrossTableRow`, `CrossTableProps`)  
**Styles:** `cross-table.css` (colocated) — 타이포·선·헤더 색은 `detail-info-form` 격자와 동일 계열.

---

## 언제 쓸지 (필수)

다음 UI는 **인라인 `<table>`·셀별 `style`·Ant `Table`을 새로 만들지 말고** `CrossTable`을 사용한다.

- **1행 1열**에 행·열 교차 라벨(예: `학년 / 교시`)
- **1행**에 열 헤더, **1열**에 행 헤더, 나머지에 데이터 셀
- 행·열 개수와 셀 내용이 **데이터에 따라 가변**

대표 예: 학년 × 교시 수업 시간표, 학년 × 요일 매트릭스 등.

---

## 언제 쓰지 말지

- **목록·페이지네이션·정렬·행 선택** → `cms-data-table` + [table-implementation.md](../tables/table-implementation.md)
- **라벨 1열 + 값 1열** 필드 격자 → `DetailInfoForm` `Field` / `Row`
- **캘린더·일별 리스트** → [calendar-sub-right-list.md](./calendar-sub-right-list.md)

---

## 사용 패턴

`DetailInfoForm` 본문 안이면 `Row type="custom"`으로 감싼다. 래퍼는 `width: 100%`를 채우도록 두고, **셀 스타일은 컴포넌트에만** 둔다.

```tsx
import { CrossTable } from '@/shared/ui/cross-table'

<DetailInfoForm title="학년 별 수업 시간" mode="view">
  <DetailInfoForm.Row type="custom">
    <CrossTable
      aria-label="학년 별 수업 시간"
      corner="학년 / 교시"
      columnHeaders={['1교시', '2교시', '3교시', '4교시']}
      rows={rows.map(row => ({
        id: row.gradeRangeLabel,
        rowHeader: row.gradeRangeLabel,
        cells: row.periods,
      }))}
    />
  </DetailInfoForm.Row>
</DetailInfoForm>
```

### Props 요약

| prop | 용도 |
|------|------|
| `corner` | 1행 1열 교차 라벨 |
| `columnHeaders` | 열 헤더 배열 |
| `rows` | `{ id?, rowHeader, cells[] }` |
| `wide` | 첫 열 **240px** (`DetailInfoForm.Field` `labelWidth={240}` 과 동일) |
| `style` | 루트 스타일 — `--cross-table-label-w` 로 첫 열만 더 넓게 (예외) |
| `className` / `aria-label` | 확장·접근성 |

**첫 열 너비:** 기본 **200px 고정** (`DetailInfoForm` 라벨 열과 동일). `wide` 또는 `style={{ '--cross-table-label-w': '…' }}` 가 있을 때만 더 넓게.

---

## 스타일 규칙 (override 금지)

- 외곽 **`border-radius: 8px`** (네 모서리만, `overflow: hidden`)
- **1행 1열** 배경: `var(--disabled-default-bg, …)` — `cross-table.css`의 `--corner`만 사용
- 헤더·데이터 색·폰트는 **파일 내 토큰**을 따름; 소비처에서 `background` / `fontWeight` 인라인 override **하지 않음**
- 첫 열 `width` / `%` 인라인·prop override **하지 않음** — `wide`·`--cross-table-label-w` 만 사용
- 교차표 전용 레이아웃이 필요하면 **래퍼 `className` + BEM 보조 클래스**로만 확장

---

## 참고 구현

- UJAT 기관 신청 상세 수업 시간: `ujat-institution-application-detail-view.tsx` (`ClassTimeTable`)

**Related:** [component-patterns.md](../coding/component-patterns.md), `detail-info-form` (`@/shared/components/detail-info-form`)
