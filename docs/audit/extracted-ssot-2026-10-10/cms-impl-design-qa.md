# CMS design·implementation·QA 이관 SSOT

이관일: 2026-10-10
원본 수: 4

원본 경로 목록:

- `apps/cms/docs/design/dashboard-program-progress-improvement.md`
- `apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md`
- `apps/cms/docs/implementation/template-form-draft-local-save.md`
- `apps/cms/docs/qa/form-template-fe-gap-report.md`

---

### Source: `apps/cms/docs/design/dashboard-program-progress-improvement.md`

# 관리자 메인 홈 - 프로그램 진행현황 표현방식 개선안

**작성 일자**: 2026-01-23  
**작성자**: 기획자 / UX/UI 디자이너 / PM 협의  
**대상**: 관리자(ADMIN) 권한 메인 홈 대시보드

---

## 📋 현재 상태 분석

### 현재 구현

- **위젯**: `ProgramProgressWidget` (program-progress-widget.tsx)
- **표현 방식**:
  - 전체 프로그램 수 (Statistic)
  - 8개 상태별 Progress 바 (수평)
  - 각 상태별 색상 및 개수 표시

### 문제점

1. **가독성**: 8개 상태를 수직으로 나열하여 스크롤 필요
2. **비교 어려움**: 각 상태별 비율을 한눈에 파악하기 어려움
3. **시각적 임팩트 부족**: 단순 Progress 바만으로는 전체 흐름 파악 어려움
4. **상태 간 관계**: 프로그램 라이프사이클의 단계별 흐름이 명확하지 않음

---

## 🎯 개선 목표

1. **한눈에 파악**: 전체 프로그램 진행 현황을 즉시 이해
2. **시각적 명확성**: 상태별 분포와 비율을 직관적으로 표시
3. **단계별 흐름**: 프로그램 라이프사이클 단계를 시각적으로 표현
4. **인터랙티브**: 클릭/호버로 상세 정보 확인 가능

---

## 💡 개선안 제안

### 옵션 1: 파이 차트 + 단계별 타임라인 (추천) ⭐

**구성 요소**:

1. **상단**: 전체 프로그램 수 + 주요 상태 요약 (큰 숫자)
2. **중앙**: 파이 차트 (Pie Chart) - 상태별 분포 시각화
3. **하단**: 단계별 타임라인 (Timeline) - 프로그램 라이프사이클 흐름

**장점**:

- 상태별 비율을 한눈에 파악 가능
- 라이프사이클 단계를 명확히 표현
- 시각적으로 임팩트 있음

**단점**:

- 파이 차트는 상태가 많을 경우(8개) 레이블이 복잡할 수 있음

**라이브러리**: `recharts` (이미 설치됨)

---



---

### Source: `apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md`

# Rich Text 에디터·뷰어 마이그레이션 (Toast UI → Tiptap)

**작성일**: 2026-06-02  
**상태**: **마이그레이션 완료** (단계 2~6) + **기본 툴바** (`RichTextToolbar`). fixture·화면별 QA는 후속.  
**범위**: `apps/cms` only (`@toast-ui/editor` ^3.2.2 + `@tiptap/*` ^3.24.0)  
**목적**: Toast UI Editor/Viewer를 Tiptap 기반 공통 모듈로 교체하고, 화면별 중복·CSS·포커스 이슈를 줄인다.

---

## 목차

1. [배경 및 목표](#1-배경-및-목표)
2. [현재 구조](#2-현재-구조)
3. [영향 화면·라우트](#3-영향-화면라우트)
4. [저장 포맷 계약](#4-저장-포맷-계약)
5. [목표 아키텍처](#5-목표-아키텍처)
6. [마이그레이션 단계](#6-마이그레이션-단계)
7. [Tiptap 스택 권장안](#7-tiptap-스택-권장안)
8. [CSS·스타일 이전](#8-css스타일-이전)
9. [콘텐츠 호환·검증](#9-콘텐츠-호환검증)
10. [PR 분할·체크리스트](#10-pr-분할체크리스트)
11. [하지 말 것](#11-하지-말-것)
12. [부록: 파일 인벤토리](#12-부록-파일-인벤토리)

---

## 1. 배경 및 목표

### 배경

- CMS는 `@toast-ui/editor`를 **imperative API**(`new Editor({ el })`, `new Viewer({ el })`)로 마운트한다.
- 에디터 훅이 2종(`use-notice-wysiwyg-editor`, `use-template-editor`)이고, 뷰어는 별도 컴포넌트(`ToastUiMarkdownViewer`)다.
- 프로그램 상세 「추가 내용」은 `use-template-editor`에 **포커스·스크롤 방지** 로직이 ~180줄 수준으로 쌓여 있다.
- 읽기 모드는 Markdown(뷰어) vs HTML(`dangerouslySetInnerHTML` + `.toastui-editor-contents`)로 **렌더 경로가 분리**되어 있다.

### 목표

| 항목 | 내용 |
|------|------|
| 라이브러리 | Toast UI 제거 → Tiptap (`@tiptap/react` 등) |
| 구조 | `shared/rich-text` 단일 모듈, Strangler(어댑터) 교체 |
| API | 기존 훅 시그니처는 1차 PR에서 유지 가능 (`editorHostRef` → 점진적 컴포넌트 API) |
| 포맷 | **경계별 Markdown/HTML 유지**(백엔드 계약 변경 없음) |
| 스타일 | `.toastui-editor-contents` → `.rich-text-content` 등 단일 prose 클래스 |
| 범위 외 | `packages/*` (Toast UI 미사용) |

### 비목표 (이번 마이그레이션에서 하지 않음)

- DB/API 필드명 일괄 변경 (`content` → `contentHtml` 등)
- 전사 Markdown/HTML 단일 포맷 통일(별 프로젝트로 분리)
- 이미지 업로드·파일 정책 전면 재설계(기존 동작 유지 전제)

---

## 2. 현재 구조

### 2.1 레이어 요약

```
┌─────────────────────────────────────────────────────────────┐

#### Marker lines (excerpt)
```
| 경로 | `src/features/posts/hooks/use-notice-wysiwyg-editor.ts` |
| 경로 | `src/features/template/hooks/use-template-editor.ts` |
| 경로 | `src/shared/components/toast-ui-markdown-viewer.tsx` |
| 경로 | `project-info-detail-info-section.tsx` → `AdditionalContentRow` |
UJAT 학교 모집 **프로그램 컨텍스트**에서는 `UjatRecruitDetailInfoParagraph`가 `DetailInfoSection`을 쓰므로 HTML 에디터 경로(§3.3)와 겹친다.
FSD: **features/posts, program, template는 `shared/rich-text`만 import** — Tiptap 패키지 직접 import 금지(규칙화 권장).
### 5.4 읽기 경로 통일
- 사용자 클릭 전 autofocus 금지.
| 구분 | 경로 |
| 경로 |
| 경로 |
| 경로 | 비고 |
```

---

### Source: `apps/cms/docs/implementation/template-form-draft-local-save.md`

# 템플릿 양식 임시저장 구현 가이드

**작성일**: 2026-05-26  
**상태**: 구현 설계

---

## 1. 목적

템플릿 양식 폼의 `임시저장`은 백엔드 API 연동 없이 브라우저 `localStorage`에 작성 중인 폼 상태를 저장한다. 사용자는 모달을 닫거나 화면을 다시 열어도 마지막으로 임시저장한 내용을 이어서 작성할 수 있어야 한다.

이 문서는 일반 프로그램 등록 폼을 포함한 템플릿 작성 양식에 적용할 표준 임시저장 방식과 구현 순서를 정의한다.

---

## 2. 저장소

저장소는 브라우저의 `localStorage`이다. 서버, DB, mock API에 저장하지 않는다.

| 용도 | localStorage key | 현재 상태 |
|------|------------------|-----------|
| 일반 작성 양식 템플릿 | `cms.jakorea.writingFormTemplateSaves.v1` | 공통 저장 유틸 존재 |
| UJAT 모집 템플릿 | `cms.jakorea.ujatRecruitTemplateSaves.v1` | 별도 저장 유틸 존재 |
| UJAT 프로그램 등록 | `cms.jakorea.ujatRegistrationLocalSaves.v1` | 목록 노출용 임시 프로그램 저장 |

일반 프로그램 등록 폼의 임시저장은 새 저장소를 만들기보다 `cms.jakorea.writingFormTemplateSaves.v1`를 우선 사용한다. 단, 임시저장 결과를 프로그램 목록에 곧바로 노출해야 하는 별도 요구가 생기면 UJAT 프로그램 등록처럼 도메인 전용 저장소를 둘 수 있다.

---

## 3. 저장 단위

기본 저장 단위는 `templateId`이다. 하나의 `templateId`에는 가장 최근 임시저장 1건만 유지한다.

```json
{
  "version": 1,
  "byTemplateId": {
    "registration-general": {
      "version": 1,
      "templateId": "registration-general",
      "savedAt": "2026-05-26T10:00:00.000Z",
      "draft": {},
      "overlay": {},
      "editorState": {}
    }
  }
}
```

여러 단계 또는 탭이 있는 플로우는 다음 중 하나를 선택한다.

| 방식 | 사용 조건 | 예시 |
|------|-----------|------|
| 단계별 `templateId` 저장 | 각 단계가 독립 템플릿으로 동작할 때 | `registration-general`, `recruitment-ujat-school` |
| 플로우 단위 저장 | 한 화면에서 여러 탭 상태를 한 번에 복원해야 할 때 | `program-registration-general-flow` |

현재 코드 구조는 UJAT 플로우처럼 단계별 editor VM을 전환하는 방식이므로, 우선은 단계별 `templateId` 저장을 따른다. 탭 이동 상태까지 복원해야 하면 `editorState.activeStep`을 함께 저장한다.

---



---

### Source: `apps/cms/docs/qa/form-template-fe-gap-report.md`

# 폼 양식 관리 — FE QA 갭 리포트 (BE DB 시딩 전)

> 작성: 2026-09-02  
> 범위: CMS `/templates/form-management` authoring (회원 동의 fill 제외)  
> 저장: mock auth 환경에서 **localStorage** (`cms.jakorea.writingFormTemplateSaves.v1`)

## 요약

| 구분 | FE 검증 완료 | BE 대기 | Fail (버그) | 수동 2차 필요 |
|------|-------------|---------|-------------|--------------|
| 작성 양식 33종 | open·save·재진입 E2E 32/33 | 2건 | **1건** | 단락 교차 전수 |
| 발급 양식 9종 | open·save (E2E 9/9) | 4건 (인증서 이미지) | — | A4 미리보기 전수 |
| 양식 테스트 탭 | 단일항목·설명글·테이블 smoke | — | — | 표 셀 입력 매트릭스 |
| P0 회귀 | `agreement-expense` blur·미리보기 | — | — | — |

## FE 버그 (Fail — BE 시딩과 무관)

| # | templateCode | 증상 | 재현 | 의심 코드 | E2E |
|---|--------------|------|------|-----------|-----|
| 1 | `recruitment-ujat-volunteer` | 양식 상세 진입 시 **Maximum update depth exceeded** | `/templates/form-management` → UJAT_봉사자 모집 폼 → 양식 상세보기 | `UjatRecruitVolunteerInterviewScheduleTemplateEditor` → `useProgramDetailEditForm` + 면접 일정 `ParagraphTimePicker` / `initialTimeRange` ↔ `value` effect | **skip** (`E2E_OPEN_SAVE_SKIP_TEMPLATE_NAMES`) |

수정 전까지 수동·E2E open+save는 해당 양식만 제외한다.

## BE 시딩 후에만 검증 가능

| 항목 | templateCode | FE에서 한 일 | BE 시딩 후 할 일 |
|------|--------------|-------------|-----------------|
| formsSurveys API round-trip | 전체 | localStorage save/load | API draft ↔ UI 동기화, 409/버전 충돌 |
| UJAT 희망 교육일 | `application-ujat-school` | MOCK UI·분기 | 실 API 일정 목록·선택 저장 |
| 성범죄 동의 문서 | `agreement-crime` | 전용 모달·다운로드/변경 버튼 | settingsJson·원격 이미지 URL |
| 인증서 로고/배경 | `document-2`, `document-3`, `document-participation-certificate`, `document-4`, `document-5` (**5종**) | local 업로드·localStorage | 스토리지 URL·CDN 재진입·종별 독립 |
| 강사 성범죄 조회 연동 | `application-instructor` | MOCK 제출 UI | 실 조회 API·상태 반영 |

## FE only로 Pass 처리한 항목 (의도적 한계)

| 항목 | 설명 |
|------|------|
| Fill 동의서 초기화 | 회원 상세 `normalizeMemberConsentWriteDraft` — authoring preview와 다름 |
| 설문 MC blur 초기화 | structureLocked 아닌 설문 authoring — 카드 blur 시 preview 선택 클리어 **정상** |
| `issuance-5` | 목록 비노출 — E2E로 확인 |

## P0 회귀 수정 이력

| 이슈 | 원인 | 수정 |
|------|------|------|
| `agreement-expense` 라디오 선택이 단락 이동·미리보기에 미반영 | `MultipleChoice` authoring blur 시 `selectedPreviewSingleId` 초기화 | `preservePreviewSelectionOnCardBlur` + `structureLockedConsentChoiceInteractive` |

관련 파일:

- [`multiple-choice.tsx`](../../src/features/template/ui/paragraph/single-item/multiple-choice.tsx)
- [`render-form-paragraph-body.tsx`](../../src/features/template/ui/paragraph/renderers/render-form-paragraph-body.tsx)

## E2E 커버리지 (2026-09-02 확장)

| 스위트 | 내용 |
|--------|------|
| smoke | 목록·모집 잠금·대표 저장·신규 설문 edit |
| P0 회귀 | `agreement-expense` MC blur·미리보기, `agreement-notice`, `application-ujat-volunteer`, 등록 1종 |
| 양식 테스트 | 단일항목 MC blur·주관식 미리보기, 설명글, 테이블 |
| 전수 open+save | 작성 32 + 발급 9 (성범죄 동의는 전용 모달만); `recruitment-ujat-volunteer` 1 skip |


---
