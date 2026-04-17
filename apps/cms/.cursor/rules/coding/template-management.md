---
priority: high
category: implementation
---

# 템플릿 관리 — 구현 규칙 (CMS)

**적용 범위**: `apps/cms/src/features/template/**`, `apps/cms/src/pages/templates/**`

**비적용**: 화면 기획·IA·카피·PM 스펙은 별도 문서로 관리하며, 이 룰에는 포함하지 않는다.

---

## 1. 신규 공통 UI 배치

템플릿 도메인용 공통 UI·재사용 컴포넌트를 **새로 추가할 때** 아래 중 하나에 둔다. 페이지 파일에만 두지 않는다.

| 위치 | 용도 |
|------|------|
| `@/features/template/ui` (예: `template-fullpage-modal`, `template-modal-*`, `template-list-card`) | 양식 관리(작성/발급) 풀페이지 모달, 좌·우 네비, 섹션 카드 등 **템플릿 작성/발급 화면의 프레젠테이션 셸** |
| `@/features/template` (그 외 model·hooks·ui) | 문자(SMS)·메일 템플릿 CRUD, 목록 테이블, 필터, 일괄 발송, 미리보기/편집 모달 등 **채널·도메인에 가까운 기능** |

**선택 기준**

- 작성/발급과 동일한 풀페이지 레이아웃을 다른 경로에서도 쓸 예정 → `@/features/template/ui`의 풀페이지·네비·카드 컴포넌트
- 카카오 알림톡·메일 등 데이터 모델·모달 플로우·목록 액션이 채널 고유 → `features/template`

---

## 2. Import 경로 (풀페이지 템플릿 셸)

템플릿 작성/발급 풀페이지 UI는 아래에서 가져온다.

- `@/features/template/ui/template-list-card`
- `@/features/template/ui/template-fullpage-modal`
- `@/features/template/ui/template-modal-left-content`
- `@/features/template/ui/template-modal-right-navigation`

---

## 3. `@/features/template` 구성 (참고)

- **model**: `template.schema.ts` — 작성 양식 목록·variant·모달 섹션 정의
- **lib**: `build-template-config.ts` — 풀페이지 모달 좌·우 구성 빌더
- **hooks**: `use-template-modal`, `use-template-crud`, `use-clipboard`, `use-template-editor`, `use-template-preview`
- **ui**: `template-fullpage-modal`, `template-list-card`, `template-modal-left-content`, `template-modal-right-navigation`, `template-table`, `basic-info-curriculum-section`, `template-filters`, `sms-template-table`, `email-template-table`, SMS/메일 폼·미리보기·일괄 발송 모달 등
- **루트**: `template-route-redirects.tsx` — 구 템플릿 URL 리다이렉트
- **constants**: `constants.ts`

페이지(`pages/templates`)는 이 모듈을 **조합**하고, 동일 패턴이 두 화면 이상이면 `features/template`로 승격한다.

---

## 4. 범위 구분

### A) 양식 관리 (작성 / 발급)

- 라우트: `/templates` — index는 `form-management`로 이동.
- 셸·탭: `template-list-page.tsx` — 쿼리 `tab`(예: `template-form`, `issuance-form`)과 Ant `Tabs`.
- 작성: `template-form-tab.tsx` — `@/features/template`의 `model/template.schema`, `hooks/use-template-modal`, `lib/build-template-config`, `ui/template-table`, 필요 시 `ui/basic-info-curriculum-section`.
- 발급: `issuance-form-tab.tsx` — 동일 풀페이지 모달 패턴; 우측 하단 보조 UI는 `TemplateModalRightNavigation`의 **`children`**으로 확장한다.
- 구 URL: `@/features/template/template-route-redirects`

### B) SMS / 메일

- `template-sms-page.tsx`, `template-email-page.tsx`는 **`@/features/template`** 위주. A)의 풀페이지 카드·네비 세트와 **같은 레이어로 강제하지 않는다**.

### C) 기타 페이지 파일

- `template-program-forms-page.tsx`, `template-files-page.tsx` 등은 라우트 연결 여부와 무관하게 **자체 스택**을 유지한다. A) 패턴과 혼동하지 않는다.

---

## 5. 공통 컴포넌트 역할

**체크박스**: `basic-info-curriculum-section` 등 템플릿 작성 양식 필드에서는 `antd` `Checkbox` 대신 `@/shared/ui/cms-checkbox`의 **`CmsCheckbox` / `CmsCheckbox.Group`** 을 쓰고, 사이즈는 **`checkboxSize="large"`** 를 기준으로 한다.

| 컴포넌트 | 역할 |
|----------|------|
| `TemplateListCard` | 섹션 제목·설명 + 내부 목록 |
| `TemplateFullpageModal` | `TealHeaderModal` 기반 풀페이지 셸. `templateTabType`: `writing` \| `issuance` 로 상단 액션 분기 |
| `TemplateModalLeftContent` | 좌측 카드 + DnD + 선택 (`TemplateModalLeftCardConfig`, 아래 §5.1 `pinned`) |
| `TemplateModalRightNavigation` | 우측 정렬 가능 네비 + `children`(목록 아래 영역; 구분선은 컴포넌트 내부) |

템플릿 풀페이지 UI는 위 조합을 깨지 않는다. 확장이 필요하면 `@/features/template/ui`의 해당 컴포넌트를 확장한다.

### 5.1 좌측 카드 `pinned` — 상단 고정·비정렬

`TemplateModalLeftCardConfig`의 **`pinned?: boolean`** 으로, 풀페이지 모달 **좌측 카드 중 일부만** 순서 변경 대상에서 빼고 맨 위에 고정한다.

| 동작 | 설명 |
|------|------|
| **`pinned: true`** | 렌더 시 **항상 비-pinned 카드보다 위**에 둔다. **드래그 핸들(정렬 아이콘) 없음**, `@dnd-kit` Sortable 대상이 아니다. |
| **`pinned` 생략 / `false`** | 기존과 같이 정렬 가능하고 상단 중앙에 핸들이 보인다. |
| **여러 개** | config 배열에서 `pinned`인 항목들의 **상대 순서**는 그대로 유지한 채, 전부 목록 **앞쪽**에 모은다. |

**데이터 정규화·재정렬**

- 모달에 넘기기 전·초기화 시 순서를 맞출 때: `@/features/template/ui/template-modal-left-content`의 **`normalizeLeftCardOrder(cards)`** — `pinned`를 앞으로 모은 배열을 반환.
- 우측 네비 DnD 등 **id 배열만** 넘어올 때: 같은 모듈의 **`mergeLeftCardOrderByDragIds(prev, orderedIds)`** — `orderedIds` 순을 반영하되 **`pinned` 카드 id는 항상 결과 배열의 앞쪽**에 둔다 (작성 탭 `use-template-modal`, 발급 탭 등에서 사용).

**설정 위치 예**

- 작성 탭: `features/template/lib/build-template-config.ts`에서 생성하는 `TemplateModalLeftCardConfig`에 `pinned: true`를 붙인다.
- 발급 탭 등: `useMemo`로 만드는 카드 배열에 동일하게 지정한다.

**주의**

- 우측 네비 `items`는 여전히 좌측 카드와 **동일 id·동일 순서 규칙**(pinned 선두)을 따른다. 순서만 바꾸는 콜백에서는 `mergeLeftCardOrderByDragIds`를 쓰지 않으면 `pinned`가 어긋날 수 있다.

---

## 6. 데이터·모달 (작성 탭)

- 행·variant·모달 섹션: `features/template/model/template.schema.ts` (`TemplateVariant`, `writingSections`, `TEMPLATE_MODAL_SECTIONS_BY_VARIANT`).
- 모달 상태: `features/template/hooks/use-template-modal.ts`.
- 좌측 카드·우측 네비 구성: `features/template/lib/build-template-config.ts` — 우측 `items`는 좌측 카드 배열에서 파생(`buildRightNavigationConfig`).
- 목록 테이블 마크업·컬럼: `features/template/ui/template-table.tsx`에 모은다.

좌·우 DnD 정렬은 **동일한 ordered id**로 좌측 카드 목록을 맞춘다. **`pinned` 카드가 있으면** §5.1대로 `normalizeLeftCardOrder` / `mergeLeftCardOrderByDragIds`로 순서를 맞춘다. 모달 닫을 때 선택 템플릿·열림 상태를 초기화한다.

---

## 7. 목록 View — 테이블

- 클래스: **`cms-data-table`** (외곽 보더는 `cms-data-table.css` 기본값. 작성 탭은 `TemplateTable`에 반영).
- 발급 등 동일 목록 패턴 추가 시에도 동일 조합·컬럼 폭·정렬을 맞춘다.

---

## 8. 모달 내부 격자 (항목명 / 항목내용)

- 반복되는 라벨+값 격자는 **`DetailInfoForm`** 우선.
- **`DetailInfoForm.Row` + `DetailInfoForm.Field`**로 구성한다. 라벨·본문 폭·세로 구분선은 **`DetailInfoForm` / `detail-info-form` 기본 스타일**에 맡긴다.
- 차시·블록처럼 **한 덩어리 UI**를 묶어야 하면 `Row type="custom"`으로 래핑한 뒤, **그 안에서** 다시 `Row`/`Field`를 중첩해 동일 격자 규칙을 유지한다 (마크업만 `div`로 끝내지 않는다).
- 참고: `basic-info-curriculum-section.tsx`, `kpi-goals-curriculum-section.tsx`, `wage-info-curriculum-section.tsx`, `education-curriculum-section.tsx` (`curriculum` variant 카드 `children`).

### 8.1 `DetailInfoForm` 사용 시 클래스·스타일

- **`Field`의 `edit` 슬롯 등에 임의 `className`을 추가하지 않는다.** 기본 격자·필드 스타일로 충분하다.
- **컨트롤 너비**: `edit` 안에서 `CmsInput`·`CmsSelect`·`CmsDatePicker` 등에 가로 폭을 줄 때 **`style={{ width: … }}`를 쓰지 않는다.** 각 컴포넌트의 **`width` prop**(`number | string`)으로 넘긴다. 예: `width="20%"`, `width={'50%'}`, `width={300}`(숫자는 px). **한 `Field`의 `edit`에 컨트롤이 하나뿐이면** 값 영역 가로를 채우도록 **`width={'100%'}`** (또는 `width="100%"`)를 넣는다. **한 Field 안에 다중 컨트롤과 `DetailInfoForm.InputsSeparator`가 같이 있을 때** 래퍼는 `detail-info-form-inputs-wrapper-no-gap`을 쓰고, 각 컨트롤 `width`는 직접 `calc`를 쓰지 않고 `@/shared/lib/form-inputs-width`의 **`getFormInputsWidth`** 또는 `@/shared/hooks`의 **`useFormInputsWidth`** 로 계산한다. 구분선 가로 점유는 **`DETAIL_INFO_FORM_SEPARATOR_WIDTH`** 와 `apps/cms/src/index.css`의 `.detail-info-form-inputs-separator`를 함께 맞춘다.
- **그 외 추가 스타일**이 꼭 필요할 때만 `style` 등 **인라인으로 임시** 적용한다. 전용 유틸 클래스를 새로 두는 것은 지양한다.
- **인풋·셀렉트·데이트피커 등을 한 줄로 맞출 때** (`apps/cms/src/index.css`):
  - `detail-info-form-inputs-wrapper` — 기본 간격
  - `detail-info-form-inputs-wrapper-no-gap` — 간격 없음
- **같은 줄 안에서 컨트롤 사이에 세로 구분(가로선 느낌) UI가 필요할 때**: `<DetailInfoForm.InputsSeparator />` 를 사용한다.

### 8.2 템플릿 작성(신규 섹션·필드) 시 — `DetailInfoForm` 안 인풋 너비

- `@/features/template`에서 **템플릿 양식용 UI를 새로 만들거나** `DetailInfoForm` 기반 필드를 추가할 때, **`mode="edit"`이고 한 `Field`의 `edit`에 `CmsInput`·`CmsSelect`·`CmsDatePicker` 등이 하나만** 오면 해당 컨트롤에 **`width={'100%'}`** 를 넣는다 (값 셀 가로 활용).
- **`mode="edit"`이고 한 `Field`의 `edit` 슬롯 안에 컨트롤이 둘 이상 한 줄로** 배치되면, **`width`는 우선 `@/features/template/constants`의 사전 정의 튜플을 쓴다**: **`FORM_INPUTS_2_WIDTHS`** … **`FORM_INPUTS_5_WIDTHS`** (각 튜플 원소는 동일 문자열 — `InputsSeparator`가 컨트롤 사이마다 1개일 때, 구분선 폭 **`TEMPLATE_FORM_SEPARATOR_WIDTH_PX`(26px)** 로 `getFormInputsWidth`와 동일 계산). 2~5개가 아니거나 구분선 개수가 다르면 **`useFormInputsWidth`** / **`getFormInputsWidth`** 로 계산한다.
- **`inputCount`** / **`separatorCount`** 의미는 §8.1·`form-inputs-width`와 동일.
- 래퍼는 **`detail-info-form-inputs-wrapper` 또는 `detail-info-form-inputs-wrapper-no-gap`** 중 해당하는 쪽을 쓰고, **`calc((100% - …px) / n)` 형태의 `width` 문자열을 직접 하드코딩하지 않는다** (상수 튜플·훅·`getFormInputsWidth` 사용).

---

## 9. 편집 컨트롤 — `cms-*` 우선

- `CmsInput`, `CmsSelect`, `CmsDatePicker`, `CmsRadio` 등 **존재 여부를 확인 후** 우선 사용.
- **`@/features/template`에서 `DetailInfoForm`의 `mode="edit"` 안에 넣는 `CmsInput` / `CmsSelect` / `CmsDatePicker`에는 `inputSize="medium"`을 기본으로 둔다** (컴포넌트 기본값은 `large`이므로 명시). **한 Field에 컨트롤이 하나면 `width={'100%'}`**, 둘 이상 나란히면 §8.2대로 **`FORM_INPUTS_*_WIDTHS`**(2~5) 또는 **`useFormInputsWidth`** / **`getFormInputsWidth`** 로 `width`를 채운다.
- Ant 전용 위젯만 있을 때는 사용 가능; 공통화되면 교체한다.

---

## 10. 금지·주의

- `template.schema`의 variant·섹션을 바꿀 때 `TEMPLATE_MODAL_SECTIONS_BY_VARIANT`와 행 정의의 `variant`를 함께 검증한다.
- `features/template/ui/template-fullpage-modal*`·`template-modal-*`·`template-list-card*` 또는 `shared/ui/cms-data-table.css` 수정 시 작성·발급 탭·모달 회귀를 PR에 명시한다.

---

## 11. PR 체크리스트

- [ ] 신규 템플릿 도메인 UI는 `features/template`(`ui` 포함)에만 추가
- [ ] 풀페이지 셸·import가 `@/features/template/ui/template-...` 형태인가
- [ ] 목록 테이블에 `cms-data-table` (또는 `TemplateTable` 사용)
- [ ] 모달은 `TemplateFullpageModal` + 좌·우 공통 컴포넌트 조합 유지
- [ ] 격자형 필드는 `DetailInfoForm` 우선, 입력은 `cms-*` 우선; 템플릿 `edit`의 `CmsInput`/`CmsSelect`/`CmsDatePicker`는 `inputSize="medium"` (`DetailInfoForm`에 불필요한 `className` 추가 없음; 일렬 정렬·구분은 `detail-info-form-inputs-wrapper*` / `InputsSeparator`; 너비는 `width` prop, `style.width` 지양; **한 Field 컨트롤 1개면 `width={'100%'}`**; **다중 인라인(2~5)은 `FORM_INPUTS_*_WIDTHS` 우선, 그 외 `useFormInputsWidth`/`getFormInputsWidth`; `calc` 하드코딩 금지**)
- [ ] 발급 탭 우측 하단은 `TemplateModalRightNavigation` `children`으로 확장
- [ ] (해당 시) 레거시 리다이렉트·`?tab=` 동작 확인
- [ ] (해당 시) 좌측 카드에 `pinned`를 쓰면 초기화·재정렬에 `normalizeLeftCardOrder` / `mergeLeftCardOrderByDragIds` 적용 여부 확인

---

**마지막 업데이트**: 2026-04-10
