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

**최종 실행 (2026-09-02):** 59 passed, 1 skipped (~4.4m)

실행: `cd apps/cms && pnpm test:e2e:templates:qa`

## BE 시딩 2차 QA 체크리스트 (입력용)

- [ ] `VITE_REAL_API_MODULES`에 `formsSurveys` 포함 + 실 JWT로 42종 API save/load
- [ ] `agreement-crime` settingsJson 시드 + 문서 이미지 CDN
- [ ] 인증서 **5종** 원격 이미지 재진입 (`certificate-form-seeds-backend-handoff.md`)
- [ ] `application-ujat-school` 희망 교육일 실 API
- [ ] 회원 동의 fill vs authoring preview 정책 분리 재확인
- [ ] Platform fill renderer와 CMS schema parity ([form-template-schema-parity](../../../.cursor/rules/form-template-schema-parity.mdc))

## 미커버 (수동 2차 권장)

- 등록 4종 overlay·참여 대상·커리큘럼 필드별 입력
- 모집/신청 20종 overlay 필드 저장·미리보기 overlay 동기화
- 동의 5종 A4 표·서명·필수 마크 픽셀 검수
- 발급 보고 4종 A4 레이아웃·페이지 나눔
- 양식 테스트 테이블 — 셀 편집·bottomConsent·미리보기
