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
- **배지/상태 열**: `render`에서 공용 Badge 컴포넌트 사용 (예: `TextbookStatusBadge`, `SettlementStatusBadge`). **상태를 클릭해 드롭다운으로 변경하는 열**은 [상태 드롭다운 셀](../coding/status-dropdown-cell.md) 패턴 사용 (`StatusDropdownCell`, `ProgramLifecycleStatusCell`, `STATUS_DROPDOWN_CELL_CLASSNAME`). **132×33 태그 + 활성(민트) 래퍼** 스펙이면 동 문서 §2.4 `tagLayout="tag132"` 및 `STATUS_DROPDOWN_CELL_TAG_132_*` 상수를 따른다.
- **버튼/링크 열**: `dataIndex` 없이 `key`만 두고 `render`에서 버튼 반환. 링크 스타일은 `border: none; background: none; color: var(--color-link); text-decoration: underline` 등으로 통일.

---

## 3. 체크박스(행 선택) 열

- `rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}` 사용.
- **첫 번째 열(체크박스) 고정 너비**: 전역 `filter-controls-common.css`의 `--table-selection-column-width`(기본 **60px**) 및 `.ant-table-selection-column` 규칙을 따른다. `rowSelection.columnWidth`는 `TABLE_COLUMN_WIDTHS.checkbox`(60)와 맞출 것.
- 예외적으로 셀 패딩·행 높이만 로컬 CSS로 덮는 경우(예: 신청자 상세 테이블)는 너비 토큰은 유지한다.

```css
/* 로컬 오버라이드 예시 — 너비는 토큰 사용 권장 */
.my-feature__table .ant-table-thead > tr > th.ant-table-selection-column,
.my-feature__table .ant-table-tbody > tr > td.ant-table-selection-column {
  width: var(--table-selection-column-width, 60px);
  min-width: var(--table-selection-column-width, 60px);
  max-width: var(--table-selection-column-width, 60px);
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

- 모달 구현은 **`ContentModal` 우선**을 원칙으로 한다. **`TealHeaderModal` 직접 사용은 deprecated**.
- `ContentModal` 사용 시, 푸터(닫기 버튼) 위에 **30px 여백**이 있도록 공통 스타일 적용됨 (`content-modal.css` → `.content-modal .teal-header-modal__footer` margin-top: 30px). 테이블이 스크롤되어도 닫기 버튼과 겹치지 않습니다.
- 모달 내 테이블은 **체크박스 열 48px** 사용 (school-detail-modal 참고).
- **모달 내 디바이더**: 디바이더가 쓰인 곳은 **양옆 gap 12px**로 통일한다. flex 컨테이너면 `gap: 12px`(또는 `var(--spacing-12)`), 또는 디바이더에 `margin: 0 12px` 적용.
- **기본정보를 위·아래 두 개의 native `<table>`로 나누는 경우** 열 정렬·가로 잘림·디바이더는 [§12 복수 블록 기본정보 테이블](#12-복수-블록-기본정보-테이블-모달-가로-오버플로-명세-프롬프트)을 따른다.

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
| 모달 공통(푸터 여백)                     | `shared/ui/content-modal.css`                                    |
| 필터·조회 룰                             | `design/ui-principles.md`                                        |

---

## 10. 모달 내 기본정보·상세 테이블(native table) 정량 스펙

강사진 추가 모달, 강의 신청 강사 상세 모달 등 **모달 내 기본정보/상세용 native `<table>`** 에서 공통으로 적용하는 정량화된 사이즈 룰입니다.

### 10.1 디바이더 갭 (모달 내 공통)

- **모달 내 디바이더가 쓰인 곳은 양옆 gap 12px**로 통일.
- **세로 디바이더**로 좌/우 블록을 구분할 때: **디바이더 양옆 갭 12px**.
- **적용 방법**:
  - **flex 컨테이너**: 자식에 디바이더가 포함된 경우 `gap: 12px`(또는 `var(--spacing-12)`) 사용.
  - **또는** 디바이더 요소에 `margin: 0 12px` 적용.
  - **native table**에서: 디바이더 **좌측** 셀(값 셀) `padding-right: 12px`, **우측** 셀(라벨 셀) `border-left: 1px solid var(--color-border-secondary, #e8e8e8)` + `padding-left: 12px`.

### 10.2 tr / td 사이즈

| 구분 | 크기 | 비고 |
|------|------|------|
| **tr 높이** | **48px** | 행 높이 통일 |
| **값 셀(데이터 영역)** | **353px × 48px** | 한줄소개 등 전체 너비 행 제외 |
| **라벨 셀(순위·행 라벨)** | **180px × 48px** | 희망 배정 학교 순위 열, 기본정보 테이블 주소/정산 계좌 등 row-label |
| **성명 셀(rowSpan 3)** | 높이 **144px** (48×3) | 한글/한자/영문 3행 대응 |

- 한줄소개처럼 **한 행 전체를 쓰는 셀**은 353×48 적용 대상에서 제외하고, 필요 시 `vertical-align: top`, `max-height` 등으로 처리.

### 10.3 참고 컴포넌트

- **기본정보 테이블 구조**: `features/program/ui/add-instructor-modal.tsx` (성명 rowSpan 3 + 한글/한자/영문 3행)
- **상세 조회·디바이더·353×48 적용**: `features/program/ui/applicant-instructor-detail-modal.tsx` / `.css`
- **희망 배정 학교 테이블**: 동일 모달 내 순위 180×48, 학교 셀 353×48, tr 48px

---

## 11. 체크리스트 (새 테이블 구현 시)

- [ ] 행 타입 정의 후 `ColumnsType<Row>` 사용
- [ ] 컬럼에 `width`, `align: 'center'`, 필요 시 `ellipsis`/`render` 적용
- [ ] 체크박스 사용 시 첫 번째 열 40px 또는 48px(모달) 고정
- [ ] thead/tbody 높이 57px, 헤더 배경 #EDF0F2, 구분선 `var(--color-border-light)` 적용
- [ ] 테이블 상단에 제목·총 N건·액션 있으면 해당 섹션 스타일 통일
- [ ] 필터가 있으면 조회 버튼 시에만 적용되도록 입력/적용 상태 분리
- [ ] 모달 내 테이블은 푸터 여백 확인(이미 30px 적용됨)
- [ ] **모달 내 기본정보/상세 native table** 사용 시: 디바이더 갭 12px(양옆), tr 높이 48px, 값 셀 353×48, 라벨/순위 셀 180×48 적용 ([§10 모달 내 기본정보·상세 테이블 정량 스펙](#10-모달-내-기본정보상세-테이블native-table-정량-스펙) 참고)
- [ ] **산출 내역서 모달 기본정보**는 §12 단일 4열 `program-detail-info-tab` 패턴; **위·아래 두 블록 5열 applicant** 패턴을 쓸 때는 동일 `colgroup`·`table-layout: fixed` 등 §12.1 후반 참고 ([§12](#12-산출-내역서-기본정보-모달-가로-오버플로-명세프롬프트))

---

## 12. 산출 내역서 기본정보 · 모달 가로 오버플로 · 명세(프롬프트)

### 12.0 산출 내역서 ContentModal — 기본 정보(프로그램 맥락)

- **단일** native 테이블: 지급 현황 상세 **프로그램** 풀페이지와 동일하게 **`program-detail-info-tab__table-wrapper`** + **`program-detail-info-tab__table--basic`**, `colgroup` **`200px` / 가변 / `200px` / 가변**, `th`·`td` 4열 × **3행** (1행: 프로그램명·사업 운영 기간 / 2행: 프로그램 진행 회차·지급 조서 처리 현황 / 3행: 강의비 책정 기준·사업소득자 여부).
- 스타일 베이스: `apps/cms/src/features/program/program-detail/ui/project-info/project-info-form-shared.css` 참고; 모달에서는 해당 파일 import 후 **`.payment-order-calc-statement-modal__basic--program-info` 스코프**로 `table-layout: fixed`, 값 셀 `min-width: 0` 등 보정 (`apps/cms/src/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.css`).
- 데이터: `context: 'program'`일 때 `PaymentOrderCalculationStatementProgramBasicInfo`(`businessPeriodDisplay`, `programSessionProgressDisplay` 등); mock은 `getMockPaymentOrderProgramDetail(programRow)`와 동일 시드로 기간·회차를 채운다. 강사 풀페이지에서는 `context: 'instructor'` + `getMockPaymentOrderInstructorCalculationStatement`.

### 12.1 복수 블록 5열 applicant 패턴(참고)

다른 화면에서 기본정보가 **2개 이상의 native `<table>` 블록**으로 나뉘고 `applicant-instructor-basic-info`와 동기해야 할 때:

- **`colgroup`를 블록마다 동일**하게 둔다 (예: `140px`, `80px`, 가변, `160px`, 가변).
- **`table-layout: fixed`** + **테이블 `width: 100%`**, **`max-width: 100%`**.  
  - **`width: max-content`만으로 두 테이블을 각각 맞추면** 가변 열 비율이 테이블마다 달라져 세로 열이 **어긋날 수 있음**.
- 행별 **`colspan`/`rowspan`**으로 **같은 5열 그리드**를 공유하도록 맞춘다.
- **래퍼**는 `overflow-x: auto`로 두어 좁은 뷰포트에서 잘림 대신 스크롤 가능하게 할 수 있다.

### 12.2 모달 가로 잘림(ContentModal large)

- `ContentModal`도 내부적으로 모달 바디에 레이아웃 제약이 있으므로, 테이블·인라인 버튼 등으로 가로가 넘치면 **우측이 잘릴 수 있음**.
- 해당 UX가 필요한 모달에서는 **스코프 한정**으로 `.ant-modal-body`에 `overflow-x: auto`, `.teal-header-modal__body`에 `overflow-x: auto` 및 `min-width: 0` 등을 검토한다.
- 값 셀에 **`overflow-wrap: break-word`**, **`word-break: break-word`**, **`min-width: 0`**을 주어 `table-layout: fixed`에서 긴 문자열이 셀 밖으로 밀리지 않게 한다.

### 12.3 값 셀 안 구분선(파이프 문자 금지)

- **은행·계좌 | 예금주**, **강의비 항목 | 금액** 등은 **`|` 문자열로 붙이지 않는다.**
- 공통으로 **`withProgramDetailTdDivider`** + **`ProgramDetailTdDivider`**(또는 동일 시각 스펙의 세로 1×13 디바이더)를 쓰고, 필요 시 **`payment-order-calc-statement-modal__td-divider-wrap`** 같은 flex 래퍼로 정렬한다 ([§10.1](#101-디바이더-갭-모달-내-공통) 갭 12px와 함께).

### 12.4 지급 반려(또는 반려 계열) 값 셀

- **상태 문구 → 세로 바 → `사유 : …` → 세로 바 → 알림 버튼** 한 줄 패턴: 산출 내역서에서는 **`payment-order-calc-statement-modal__processing-status-row`** / **`__processing-vbar`**; 다른 화면에서는 `applicant-instructor-basic-info__approval-status-row` 등과 동일 시각.
- 알림 버튼은 **`SendNotiButton`** (`detail-modal/components/send-noti-button.tsx`) 사용.

### 12.5 기획·디자인·AI 프롬프트로 이 레이아웃을 전달할 때(권장 순서)

스크린샷만으로는 열 병합이 빠지기 쉬우므로, 아래 순서로 적으면 구현·리뷰가 수월하다.

1. **블록 구조**: 산출 내역서는 **단일 4열 `program-detail-info-tab` 3행**; 그 외는 표 덩어리 수·라벨/값 셀 역할(`th`/`td`) 명시.
2. **열 수·고정 폭**: 산출 내역서 예: **200 / 가변 / 200 / 가변**; 5열 applicant 패턴 예: 140 / 80 / … / 160 / … + **`table-layout: fixed`**.
3. **행별 병합 표**: 병합이 있으면 행 단위로 적는다 (산출 내역서 현재 버전은 병합 없음).
4. **값 셀 UI**: 디바이더는 `withProgramDetailTdDivider`, 반려 시 상태|사유|버튼(`SendNotiButton`).
5. **상태 색**: `payment-order-admin__status-text--*` 등.
6. **레이아웃 제약**: 모달 가로 스크롤(`minWidth` 산출 테이블과 맞춤), 하단 Ant `Table`과 기본정보 블록 가로 정렬.

**피할 것**: 산출 내역서를 5열 applicant 말로만 설명하기; `program-detail-info-tab__table--basic td`의 전역 `min-width: 400px`를 모달에서 오버라이드하지 않아 레이아웃이 깨지게 두기.

### 12.6 참고 구현

| 용도 | 파일 |
| --- | --- |
| 강사 지급 상세 기본정보(단일 테이블) | `pages/settlement-management/payment-order-instructor-basic-info.tsx` |
| 산출 내역서 기본정보(4열 program-detail-info-tab·3행·디바이더·반려) | `features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.tsx` / `.css` |
