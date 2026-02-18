---
priority: high
always_include: false
category: tables
---

# 테이블 구현 컨텍스트 (Ant Design Table)

다음 테이블 구현 시 참고할 수 있도록, CMS에서 사용하는 **테이블 구성·스타일·패턴**을 정리한 문서입니다.

**관련 규칙**: [필터·조회 원칙](../design/ui-principles.md#-필터조회-원칙), [테이블 관리](./table-management.md), [Ant Design 사용법](../libraries/ant-design-usage.md)

---

## 1. 라이브러리 및 기본 사용

- **Ant Design `Table`** 사용. `@tanstack/react-table`은 필터/페이지 상태와 URL 동기화가 필요한 경우에만 사용( [테이블 관리](./table-management.md) 참고).
- 행 데이터 타입을 정의한 뒤 `ColumnsType<Row>`로 컬럼을 타입 지정합니다.

```tsx
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface MyRow {
  id: string
  no: number
  name: string
  // ...
}

const columns: ColumnsType<MyRow> = useMemo(
  () => [
    { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
    { title: '이름', dataIndex: 'name', key: 'name', width: 120, align: 'center' },
    // ...
  ],
  []
)

<Table
  dataSource={filteredList}
  columns={columns}
  rowKey="id"
  pagination={false}
  size="middle"
  className="my-feature__table"
  rowSelection={needSelection ? { selectedRowKeys, onChange: setSelectedRowKeys } : undefined}
/>
```

---

## 2. 컬럼 정의 패턴

| 속성        | 용도                                    | 권장 예시                                              |
| ----------- | --------------------------------------- | ------------------------------------------------------ |
| `title`     | 헤더 텍스트                             | `'No.'`, `'참여 학교명'`, `'정산 현황'`                |
| `dataIndex` | 데이터 필드 (key와 동일 권장)           | `'no'`, `'schoolName'`, `'settlementStatus'`           |
| `key`       | React key, 정렬/필터 시 사용            | `dataIndex`와 동일 값                                  |
| `width`     | 열 너비(px). 고정 시 스크롤 시에도 일정 | `56`, `72`, `90`, `100`, `120`, `140`, `180`, `220` 등 |
| `align`     | 셀 정렬                                 | `'center'` (목록 테이블은 대부분 가운데)               |
| `ellipsis`  | 긴 텍스트 말줄임                        | `true` (이메일, 프로그램명 등)                         |
| `render`    | 커스텀 셀 (배지, 버튼, `-` 처리)        | `(v) => v ?? '-'`, 배지/버튼 컴포넌트                  |

- **No. 열**: 보통 `width: 72` 또는 `56`, `align: 'center'`.
- **배지/상태 열**: `render`에서 공용 Badge 컴포넌트 사용 (예: `TextbookStatusBadge`, `SettlementStatusBadge`).
- **버튼/링크 열**: `dataIndex` 없이 `key`만 두고 `render`에서 버튼 반환. 링크 스타일은 `border: none; background: none; color: var(--color-link); text-decoration: underline` 등으로 통일.

---

## 3. 체크박스(행 선택) 열

- `rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}` 사용.
- **첫 번째 열(체크박스) 고정 너비**:
  - **페이지/카드 내 테이블**: `40px` (예: program-progress-tab)
  - **모달 내 테이블**: `48px` (예: school-detail-modal 강사/학생 테이블)
- CSS로 첫 번째 `th`/`td`에 `width`, `min-width`, `max-width` 동일하게 지정하고, 필요 시 `padding-left/right: 8px` 조정.

```css
.my-feature__table .ant-table-thead > tr > th:first-child,
.my-feature__table .ant-table-tbody > tr > td:first-child {
  width: 40px;
  min-width: 40px;
  max-width: 40px;
  padding-left: 8px;
  padding-right: 8px;
}
```

---

## 4. 테이블 공통 CSS 스펙

아래는 프로그램 진행현황·학교 상세 모달 등에서 사용하는 **공통 테이블 스타일**입니다. 새 테이블 구현 시 동일한 톤으로 적용합니다.

### 4.1 헤더 (thead)

- **높이**: `57px` (min-height 포함)
- **패딩**: `12px 16px`
- **배경**: `#EDF0F2`
- **글자**: `font-size: 14px`, `font-weight: 700`, `color: var(--color-text-label)` (또는 `#262626`)
- **정렬**: `text-align: center`, `vertical-align: middle`

### 4.2 바디 셀 (tbody)

- **높이**: `57px` (min-height 포함)
- **패딩**: `12px 16px`
- **정렬**: `vertical-align: middle`. 가운데 정렬 테이블은 `text-align: center`

### 4.3 열 구분선

- **세로선**: `border-right: 1px solid var(--color-border-light)` (마지막 열은 제거)
- **가로선**: `border-bottom: 1px solid var(--color-border-light)` (마지막 행은 제거 가능)

### 4.4 선택된 행 하이라이트

- 배경: `#f6ffed`
- hover: `#d9f7be`

```css
.my-feature__table .ant-table-tbody > tr.ant-table-row-selected > td {
  background: #f6ffed !important;
}
.my-feature__table .ant-table-tbody > tr.ant-table-row-selected:hover > td {
  background: #d9f7be !important;
}
```

### 4.5 테이블 레이아웃

- 열 너비를 고정해 스크롤 시에도 헤더와 맞추려면 `table-layout: fixed` 사용 (필요 시).

---

## 5. 테이블 상단 헤더(섹션) 패턴

테이블 위에 **제목 + 건수 + 액션 버튼**을 두는 패턴입니다.

- **레이아웃**: flex, `justify-content: space-between`, `align-items: center`, `margin-bottom: 12px`
- **제목**: `font-size: 18px`, `font-weight: 700`, `color: var(--default-BK, #3d3d3d)`
- **건수**: `font-size: 14px`, `font-weight: 500`, `opacity: 0.6` (예: "총 N건")
- **액션**: 버튼 그룹 `gap: 8px`

```tsx
<div className="my-feature__table-header">
  <div className="my-feature__table-heading">
    <span className="my-feature__table-title">학생 정보</span>
    <span className="my-feature__table-description">총 {filteredList.length}건</span>
  </div>
  <div className="my-feature__table-actions">
    <AppButton ...>수정</AppButton>
    <AppButton ...>학생 등록</AppButton>
  </div>
</div>
<Table ... className="my-feature__table" />
```

---

## 6. 필터·조회와 테이블 연동

- **필터에 조회 버튼이 있으면**, [필터·조회 원칙](../design/ui-principles.md#-필터조회-원칙)에 따라 **조회 버튼 클릭 시에만** 필터가 적용됩니다.
- **구현 패턴**:
  - **입력용 상태**: `filters` (Select/Input 값)
  - **적용용 상태**: `appliedFilters` (조회 클릭 시 `filters`를 복사)
  - **테이블 데이터**: `filteredList = useMemo(() => list.filter( appliedFilters 기준 ), [list, appliedFilters])`
  - 조회 버튼: `onClick={() => setAppliedFilters(filters)}` 또는 `setAppliedFilters({ ...filters })`

---

## 7. 모달 내 테이블

- **TealHeaderModal** 사용 시, 푸터(닫기 버튼) 위에 **30px 여백**이 있도록 이미 공통 스타일 적용됨 (`teal-header-modal.css` → `.teal-header-modal__footer` padding-top: 30px). 테이블이 스크롤되어도 닫기 버튼과 겹치지 않습니다.
- 모달 내 테이블은 **체크박스 열 48px** 사용 (school-detail-modal 참고).

---

## 8. Ant Design Descriptions (라벨-값 테이블)

기본 정보처럼 **라벨 | 값** 형태의 고정 레이아웃이 필요할 때는 `Descriptions`를 사용할 수 있습니다.

- **열 너비**: 라벨 `180px`, 값 `490px` (디자인 시안에 따라 조정)
- **행 높이**: `57px` (label/content 동일)
- **라벨 스타일**: `font-size: 14px`, `font-weight: 700`, `text-align: center`, `background: #EDF0F2`, `color: var(--color-text-label)`
- **테이블 레이아웃**: `table-layout: fixed`, `width: 100%`
- 두 개의 Descriptions를 세로로 쓸 때: 위쪽은 `margin-bottom: 0`, 두 번째는 `margin-top: 16px`

---

## 9. 참고 파일 목록

| 용도                                     | 파일                                                             |
| ---------------------------------------- | ---------------------------------------------------------------- |
| 탭+필터+테이블, 조회 버튼 필터, 행 선택  | `features/program/ui/program-progress-tab.tsx` / `.css`          |
| 모달 내 탭+필터+테이블, 강사/학생 테이블 | `features/program/ui/school-detail-modal.tsx` / `.css`           |
| 탭별 테이블(단순, 체크박스 없음)         | `features/dashboard/ui/program-progress-tabs-table.tsx` / `.css` |
| 모달 공통(푸터 여백)                     | `shared/ui/teal-header-modal.css`                                |
| 필터·조회 룰                             | `design/ui-principles.md`                                        |

---

## 10. 체크리스트 (새 테이블 구현 시)

- [ ] 행 타입 정의 후 `ColumnsType<Row>` 사용
- [ ] 컬럼에 `width`, `align: 'center'`, 필요 시 `ellipsis`/`render` 적용
- [ ] 체크박스 사용 시 첫 번째 열 40px 또는 48px(모달) 고정
- [ ] thead/tbody 높이 57px, 헤더 배경 #EDF0F2, 구분선 `var(--color-border-light)` 적용
- [ ] 테이블 상단에 제목·총 N건·액션 있으면 해당 섹션 스타일 통일
- [ ] 필터가 있으면 조회 버튼 시에만 적용되도록 입력/적용 상태 분리
- [ ] 모달 내 테이블은 푸터 여백 확인(이미 30px 적용됨)
