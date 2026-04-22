# 신규 동의 양식(직접 등록) 기본 폼 — 계획 (수정본)

## 범위 변경 요약

- **제외**: 기존 목록의 `agreement-personal`(개인정보 수집 동의서) **행 편집** 전용 분기로 기본 양식을 넣는 방식.
- **포함**: **템플릿 신규 등록 → 직접 등록 → 동의 양식** 선택 시 열리는 화면(`mode=new&type=agreement`)의 **신규 동의 양식 기본 폼**을 스크린샷과 같이 구성.

## 진입 경로 (코드 기준)

1. [`apps/cms/src/pages/templates/template-list-page.tsx`](apps/cms/src/pages/templates/template-list-page.tsx): `TemplateCreateModal`에서 `kind === 'direct'` + 셀렉트 `동의 양식` → `onDirectRegister('agreement')` → `setParams({ tab: 'template-form', mode: 'new', type: 'agreement', id: undefined })`.
2. [`apps/cms/src/pages/templates/template-form-tab.tsx`](apps/cms/src/pages/templates/template-form-tab.tsx): `params.mode === 'new' && params.type === 'agreement'`일 때 [`NewAgreementForm`](apps/cms/src/features/template/ui/new-agreement-form.tsx) 렌더.
3. 현재 `NewAgreementForm`은 `null`만 반환하므로, 여기를 **`NewSurveyForm`과 동일 패턴의 풀페이지 에디터**로 구현하고 초기 `draft`만 **동의서 기본 구조**로 두면 됨.

## 목표 UX

- 직접 등록으로 들어온 **빈 신규 동의 양식**이 스크린샷과 같은 단락·placeholder·작성 기간·우측 커스텀 필드/타이틀 번호(기본 `1, 2, 3` 등)를 갖춤.
- 모달 상단 제목/설명은 신규 등록에 맞게 조정(예: 제목 `"동의 양식"` 또는 `"신규 동의 양식"`, 하단 안내는 설문과 구분되는 동의서용 문구 — 기존 `NewSurveyForm`의 설문 전용 카피와 중복되지 않게).

## 구현 방향 (변경 없음 — 적용 위치만 이동)

### 1) `SurveyDraft` 확장 + `createDefaultAgreementPersonalDraft()` (이름은 `createDefaultDirectAgreementDraft` 등으로 해도 됨)

- 파일: [`apps/cms/src/features/template/model/survey-draft.schema.ts`](apps/cms/src/features/template/model/survey-draft.schema.ts)
- 스크린샷에 필요한 **일반 본문 블록 / 개인정보 항목(라벨+입력) / 표+동의 라디오 / 마무리+일자·서명 바**를 표현하는 단락 variant 추가, **5단락**(상단 고정 + 중간 3 + 하단 고정) 유지 — [`SurveyEditorLeftPane`](apps/cms/src/features/template/ui/survey/survey-editor-left-pane.tsx) 구조 제약과 동일.

### 2) 렌더·우측 패널

- [`render-survey-paragraph-body.tsx`](apps/cms/src/features/template/ui/paragraph/render-survey-paragraph-body.tsx) 및 `paragraph/*` 신규 body.
- [`survey-editor-right-panel.tsx`](apps/cms/src/features/template/ui/survey/survey-editor-right-panel.tsx): 동의서 문맥 라벨 분기 시 **`editorContext: 'agreement'`** 같은 prop으로 처리(신규 화면만 넘기면 목록 편집과 섞이지 않음).

### 3) `NewAgreementForm` 구현 (핵심 납품)

- [`apps/cms/src/features/template/ui/new-agreement-form.tsx`](apps/cms/src/features/template/ui/new-agreement-form.tsx): `NewSurveyForm`과 동일하게 `TemplateFullpageModal` + `SurveyEditorLeftPane` + `SurveyEditorFieldNav` + `SurveyEditorRightPanel` 조합.
- `useState` 초기값: `createDefaultDirectAgreementDraft()` (위 스키마 함수).
- `onClose`: `setParams({ mode: undefined, type: undefined, id: undefined })` 등 `NewSurveyForm`과 동일한 쿼리 정리.

### 4) 명시적으로 하지 않을 것

- `template-form-tab`에서 `agreement-personal` **edit** 분기 추가(이전 계획) — **이번 범위에서 제외**.

## 검증

- 폼 양식 관리 탭 → `+ 신규 템플릿` → 직접 등록 → 동의 양식 → 등록: 빈 화면이 아니라 스크린샷 구조의 기본 폼.
- `mode=new&type=survey`인 `NewSurveyForm` 동작·기본 초안은 변경 없음(`createDefaultSurveyDraft` 유지).

## 구현 할 일 (체크리스트)

- [ ] `survey-draft.schema.ts`: 단락 타입 + `createDefaultDirectAgreementDraft` + 단락 ID 상수
- [ ] paragraph UI + `render-survey-paragraph-body` + `closing` 하단 일자/서명 바
- [ ] `survey-editor-right-panel` (+ 필요 시 `ExplanationTitle`) agreement 컨텍스트 prop
- [ ] `new-agreement-form.tsx`: 풀페이지 에디터 완성
- [ ] `survey-editor.css` 등 최소 스타일

## 리스크

- `SurveyParagraph` union 확장 시 **설문 신규** 화면 타입 체크/switch 전부 업데이트 필요.
- 공유 경로 `features/template/**` 변경이므로 설문 편집 회귀를 한 번 확인하는 것이 좋음.
