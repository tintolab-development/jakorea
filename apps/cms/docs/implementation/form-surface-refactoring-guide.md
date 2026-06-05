# 폼 Surface 리팩터링 가이드 (Template Authoring ↔ Response Entry)

**작성일**: 2026-05-27  
**상태**: 가이드(점진 적용)

---

## 1. 목적

CMS 전반에서 “양식(템플릿) 편집”과 “응답(인스턴스) 작성/수정” UI가 섞여 생기는 문제를 줄인다.

- **재사용 가능**한 렌더링 레이어(섹션/단락)로 합친다.
- 향후 API 연동을 위해 **JSON 기반 화면 모델**로 확장 가능하게 만든다.
- 단기적으로는 특정 페이지(예: UJAT 봉사자 추가 등록)만 **로컬 스코프**로 개선하고, 파급을 최소화한다.

---

## 2. 용어(필수) — 2축으로 구분

### 2.1 “무엇을 편집하는가” (Definition vs Response)

- **Template Authoring**: 양식 정의(구조/카피) 편집
  - 단락 추가/삭제, 제목/설명 문구, 필드 구조/옵션, 필수 여부
- **Response Entry**: 배포된 양식의 응답(값) 입력/수정
  - input/select/radio 등 **값 데이터**만 변경

### 2.2 “화면 표시 모드” (Instance view/edit)

- **view**: 조회
- **edit**: 응답 값 수정(입력 UI 노출)

> `edit` 단어는 혼선이 가장 크므로, PR/기획/코드에서 단독으로 쓰지 말고
> **template authoring edit** / **response edit**처럼 대상(Definition/Response)을 반드시 함께 적는다.

---

## 3. Surface 모델(권장)

라우트/제품 상태에 따른 상위 모드를 `surface`로 명시한다.

| surface | 의미 | 구조 편집 | 값 입력 |
|--------|------|----------|--------|
| `templateAuthoring` | `/templates` 편집 | O | (메타) |
| `templateAuthoringPreview` | `/templates` 미리보기(`userPreview`) | X | X(프리뷰) |
| `responseEntryWrite` | `/programs`, `/users` 등 신규 작성 | X | O |
| `responseEntryEdit` | `/programs`, `/users` 등 수정 | X | O |
| `responseEntryPreview` | 응답 미리보기/조회 | X | X |

코드에서 이미 사용 중인 축:

- 단락 본문 상호작용: `ParagraphBodyInteractionMode = 'authoring' | 'user'`
- 상세 격자 표시: `DetailInfoFormMode = 'view' | 'edit'`

> `userPreview` 쿼리는 “사용자 모드” 제품 용어와 동의어가 아니다. URL 히스토리 동기화 플래그로만 취급한다.

---

## 4. JSON 기반 화면 모델(장기 목표)

API 연동을 위해 “정의(Definition)”와 “응답(Response)”를 분리한다.

### 4.1 Definition (양식 정의)

```ts
type FormDefinition = {
  id: string
  version: number
  settings: { titleNumbering: string }
  sections: FormSectionDefinition[]
}

type FormSectionDefinition = {
  id: string
  title: string
  required: boolean
  /** title 우측/옆 — 항상 노출 가능 */
  descriptionRight: string | null
  /** title 하단 — responseEntryEdit에서만 노출(기획) */
  descriptionBottom: string | null
  /** variant 또는 plugin */
  renderKey: string
  layout?: 'default' | 'split-grids' | 'embed-header'
  visibility?: { when?: { fieldId: string; eq: string } }
  body: unknown
}
```

### 4.2 Response (응답 값)

```ts
type FormResponse = {
  id: string
  definitionId: string
  definitionVersion: number
  status: 'draft' | 'submitted'
  values: Record<string, unknown>
  meta?: Record<string, unknown>
}
```

### 4.3 RenderContext (경로/권한/상태)

```ts
type FormRenderContext = {
  surface:
    | 'templateAuthoring'
    | 'templateAuthoringPreview'
    | 'responseEntryWrite'
    | 'responseEntryEdit'
    | 'responseEntryPreview'
}
```

> 단기(로컬 리팩터)에서는 `WritingFormDraft`(draft)에서 `sections[]`를 어댑트하는 방식으로 시작하고,
> API가 붙으면 동일 인터페이스로 교체한다.

---

## 5. 공통 스타일 — “하단 description”의 기준

하단 description은 UJAT 전용이 아니라 다음 화면에서 공통으로 쓰인다.

- templateAuthoringPreview(문서 미리보기/카드 description)
- responseEntry(작성/수정 화면의 섹션 하단 설명)

공통 컴포넌트/클래스:

- `FormParagraphSectionDescription` (`apps/cms/src/features/template/ui/shared/form-paragraph-section-description.tsx`) — 하단 설명 **문구만**
- `FormParagraphSectionHeader` (`apps/cms/src/features/template/ui/shared/form-paragraph-section-header.tsx`) — 타이틀 + (선택) 우측 액션 + 하단 설명(내부에서 위 컴포넌트 사용)
- 하단 설명 타이포(`form-paragraph-section-description.css`): `main-BK` **16px / 500 / 150%**, **opacity 0.6**
- 타이틀 ↔ 하단 설명 간격: `FormParagraphSectionHeader__lead` flex column **gap 2px** (우측 `titleTrailing` 버튼 높이와 무관)
- `titleAligned`: `padding-left: 8px` (제목과 좌측 정렬)
- `surface` prop: API 호환용(현재 하단 타이포는 동일). 템플릿 카드 **편집 인풋**(`.paragraph-card__description`)만 14px 유지
- re-export: `@/features/template/lib/writing-form-paragraph-description`
- 교육 진행 예정일 목록: `EducationSchedulePreviewLines` (`education-schedule-preview-lines.tsx`) — 텍스트 + X만, **배경·테두리 없음** (등록 폼·상세·templateAuthoring 동일)
- 복수 회차 커리큘럼 과제: `ProgramRegistrationMultiRoundAssignmentFields`(등록 폼 입력), `CurriculumAssignmentSettingView`(조회·responseEntry) — 단일 회차에는 미노출. 상세 복수 회차 판별: `isGeneralProgramMultiRoundCurriculum`

> 우측 description(`detail-info-form__description`)과는 다른 토큰이다. 타이틀 하단 설명은 `DetailInfoForm`의 `description` prop을 쓰지 않는다.

---

## 6. 리팩터링 패턴(권장) — “로컬 renderer + config”

목표: 페이지가 섹션을 수동 조립하지 않고, “섹션 정의(config) + renderer”로 렌더한다.

### 6.1 파일 구조(예시)

페이지 폴더(도메인 스코프) 아래에 로컬로 두고, 파급을 최소화한다.

```
.../volunteers/
  *-section-config.ts
  *-section-renderer.tsx
  (page).tsx
  (page).css
```

### 6.2 config 예시(요지)

- 섹션 순서
- 단락 id 연결
- `isVisible(vm)` 같은 가벼운 가시성 조건
- plugin body 매핑(기존 paragraph TSX 재사용)

### 6.3 renderer 예시(요지)

- draft 단락: `renderFormParagraphBody(..., paragraphInteractionMode: 'user')`
- plugin 단락: 제목/설명은 공통 헤더로, 본문은 기존 TSX로
- custom 섹션: 기존 컴포넌트 그대로 포함(약관/활동시기 등)

---

## 7. 스코프 가드(파급 최소화 체크리스트)

다른 브랜치/화면에 영향이 커지는 변경을 1차에 피한다.

- [ ] `*fullpage-modal.tsx`(탭 셸) 무터치
- [ ] `features/template/**` 공통 렌더러(`renderFormParagraphBody`) 무터치
- [ ] `shared/components/detail-info-form/**` 무터치
- [ ] 변경은 페이지 폴더(로컬) + 해당 화면 전용 CSS로 제한

피할수 없을 때(공통화가 필요한 경우)엔:

- [ ] 공통 컴포넌트/토큰은 `features/template/ui/shared/` 또는 `shared/`에 두고
- [ ] 최소한의 “opt-in” 방식(클래스 추가/새 props)으로만 확장
- [ ] 영향 화면 목록을 PR 설명에 명시

---

## 8. 적용 순서(권장)

1) **로컬 config + renderer**로 페이지 조립부만 정리  
2) 하단 description 등 스타일 토큰을 공통화  
3) (필요 시) draft → definition 어댑터 도입  
4) API 연동 시 definition/response 분리로 교체  

---

## 9. UJAT 봉사자 추가 등록(참고 구현)

예시 위치:

- `apps/cms/src/features/program/ujat/ui/detail-modal/progress/volunteers/ujat-volunteer-add-registration-form-section-config.ts`
- `apps/cms/src/features/program/ujat/ui/detail-modal/progress/volunteers/ujat-volunteer-add-registration-form-section-renderer.tsx`

이 구현은 “fullpage-modal 무터치” 원칙을 유지한 채, 추가 등록 폼 내부 조립만 통합했다.

