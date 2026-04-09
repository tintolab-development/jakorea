---
priority: high
category: implementation
---

# 템플릿 관리 — 구현 규칙 (CMS)

**적용 범위**: `apps/cms/src/shared/components/template/**`, `apps/cms/src/features/template/**`, `apps/cms/src/pages/templates/**`

**비적용**: 화면 기획·IA·카피·PM 스펙은 별도 문서로 관리하며, 이 룰에는 포함하지 않는다.

---

## 1. 신규 공통 UI 배치

템플릿 도메인용 공통 UI·재사용 컴포넌트를 **새로 추가할 때** 아래 중 하나에 둔다. 페이지 파일에만 두지 않는다.

| 위치 | 용도 |
|------|------|
| `@/shared/components/template` | 양식 관리(작성/발급) 풀페이지 모달, 좌·우 네비, 섹션 카드 등 **여러 템플릿 화면에서 공유하는 프레젠테이션 셸** |
| `@/features/template` | 문자(SMS)·메일 템플릿 CRUD, 목록 테이블, 필터, 일괄 발송, 미리보기/편집 모달 등 **채널·도메인에 가까운 기능** |

**선택 기준**

- 작성/발급과 동일한 풀페이지 레이아웃을 다른 경로에서도 쓸 예정 → `shared/components/template`
- 카카오 알림톡·메일 등 데이터 모델·모달 플로우·목록 액션이 채널 고유 → `features/template`

---

## 2. Import 경로 (`shared/components/template`)

템플릿 전용 공통 UI는 아래 네임스페이스에서 가져온다.

- `@/shared/components/template/template-list-card`
- `@/shared/components/template/template-fullpage-modal`
- `@/shared/components/template/template-modal-left-content`
- `@/shared/components/template/template-modal-right-navigation`

---

## 3. `@/features/template` 구성 (참고)

- **model**: `template.schema.ts` — 작성 양식 목록·variant·모달 섹션 정의
- **lib**: `build-template-config.ts` — 풀페이지 모달 좌·우 구성 빌더
- **hooks**: `use-template-modal`, `use-template-crud`, `use-clipboard`, `use-template-editor`, `use-template-preview`
- **ui**: `template-table`, `basic-info-curriculum-section`, `template-filters`, `sms-template-table`, `email-template-table`, SMS/메일 폼·미리보기·일괄 발송 모달 등
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

| 컴포넌트 | 역할 |
|----------|------|
| `TemplateListCard` | 섹션 제목·설명 + 내부 목록 |
| `TemplateFullpageModal` | `TealHeaderModal` 기반 풀페이지 셸. `templateTabType`: `writing` \| `issuance` 로 상단 액션 분기 |
| `TemplateModalLeftContent` | 좌측 카드 + DnD + 선택 |
| `TemplateModalRightNavigation` | 우측 정렬 가능 네비 + `children`(목록 아래 영역; 구분선은 컴포넌트 내부) |

템플릿 풀페이지 UI는 위 조합을 깨지 않는다. 확장이 필요하면 `shared/components/template`를 확장한다.

---

## 6. 데이터·모달 (작성 탭)

- 행·variant·모달 섹션: `features/template/model/template.schema.ts` (`TemplateVariant`, `writingSections`, `TEMPLATE_MODAL_SECTIONS_BY_VARIANT`).
- 모달 상태: `features/template/hooks/use-template-modal.ts`.
- 좌측 카드·우측 네비 구성: `features/template/lib/build-template-config.ts` — 우측 `items`는 좌측 카드 배열에서 파생(`buildRightNavigationConfig`).
- 목록 테이블 마크업·컬럼: `features/template/ui/template-table.tsx`에 모은다.

좌·우 DnD 정렬은 **동일한 ordered id**로 좌측 카드 목록을 맞춘다. 모달 닫을 때 선택 템플릿·열림 상태를 초기화한다.

---

## 7. 목록 View — 테이블

- 클래스: **`cms-data-table cms-data-table--border`** (작성 탭은 `TemplateTable`에 반영).
- 발급 등 동일 목록 패턴 추가 시에도 동일 조합·컬럼 폭·정렬을 맞춘다.

---

## 8. 모달 내부 격자 (항목명 / 항목내용)

- 반복되는 라벨+값 격자는 **`DetailInfoForm`** 우선.
- 참고: `features/template/ui/basic-info-curriculum-section.tsx` (`curriculum` variant + 「기본 정보」 카드 `children` 주입).

---

## 9. 편집 컨트롤 — `cms-*` 우선

- `CmsInput`, `CmsSelect`, `CmsDatePicker`, `CmsRadio` 등 **존재 여부를 확인 후** 우선 사용.
- Ant 전용 위젯만 있을 때는 사용 가능; 공통화되면 교체한다.

---

## 10. 금지·주의

- `template.schema`의 variant·섹션을 바꿀 때 `TEMPLATE_MODAL_SECTIONS_BY_VARIANT`와 행 정의의 `variant`를 함께 검증한다.
- `shared/components/template/**` 또는 `shared/ui/cms-data-table.css` 수정 시 작성·발급 탭·모달 회귀를 PR에 명시한다.

---

## 11. PR 체크리스트

- [ ] 신규 공통 UI는 `shared/components/template` 또는 `features/template`에만 추가
- [ ] import가 `@/shared/components/template/...` 형태인가
- [ ] 목록 테이블에 `cms-data-table--border` (또는 `TemplateTable` 사용)
- [ ] 모달은 `TemplateFullpageModal` + 좌·우 공통 컴포넌트 조합 유지
- [ ] 격자형 필드는 `DetailInfoForm` 우선, 입력은 `cms-*` 우선
- [ ] 발급 탭 우측 하단은 `TemplateModalRightNavigation` `children`으로 확장
- [ ] (해당 시) 레거시 리다이렉트·`?tab=` 동작 확인

---

**마지막 업데이트**: 2026-04-11
