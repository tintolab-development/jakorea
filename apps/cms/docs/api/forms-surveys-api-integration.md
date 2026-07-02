# Forms-Surveys (템플릿 양식) API 연동 명세

`/templates/form-management` 작성·발급 양식과 Swagger `forms-surveys` 도메인 매핑입니다.

**마이그레이션 실행 가이드 (PHASE 0–6)**: [forms-surveys-api-migration-guide.md](./forms-surveys-api-migration-guide.md)  
**백엔드 갭·미구현 목록**: [forms-surveys-api-backend-gaps.md](./forms-surveys-api-backend-gaps.md)

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,formsSurveys` | `isRealApiModuleEnabled('formsSurveys')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

**기본값:** 모듈 미포함 시 작성 양식 목록·draft는 mock/localStorage 유지.

---

## schemaJson 계약 (프론트 제안 — 백엔드 확인 필요)

`FormTemplateVersionResponse.schemaJson`에는 CMS `WritingFormDraft` JSON을 그대로 저장합니다.

```json
{
  "schemaVersion": 1,
  "formSettings": { "titleNumbering": "numeric" },
  "paragraphs": [ "... WritingFormParagraph[] ..." ]
}
```

| 필드 | 설명 |
|------|------|
| `schemaVersion` | 프론트 draft 스키마 버전. 현재 `1` 고정 |
| `formSettings` | 타이틀 번호 매김 등 에디터 설정 |
| `paragraphs` | 단락 배열 (`kind`, `variant` 등) |

역직렬화 시 `normalizeWritingFormDraft()`로 레거시 필드 마이그레이션.

**overlay / editorState** (UJAT 등 훅 로컬 state)는 1차 연동에서 `schemaJson` 외부 — API 확장 또는 별도 JSON 필드 합의 필요.

---

## formType · category (프론트 제안)

| UI 섹션 key | section title | formType (제안) | category (제안) |
|-------------|---------------|-----------------|-----------------|
| `registration` | 등록 양식 | `WRITING` | `REGISTRATION` |
| `application` | 모집 양식 | `WRITING` | `RECRUITMENT` |
| `application_form` | 신청 양식 | `WRITING` | `APPLICATION` |
| `survey` | 설문 양식 | `WRITING` | `SURVEY` |
| `agreement` | 동의 양식 | `WRITING` | `AGREEMENT` |
| (발급 탭) | 발급 양식 | `ISSUANCE` | `ISSUANCE` |

`GET /api/admin/form-templates?formType=&category=` 필터와 1:1 대응 목표.

---

## templateCode 시드 매핑 (프론트 하드코딩 id ↔ API)

프론트 라우트·localStorage 키는 **string `templateCode`** 를 SSOT로 유지합니다. API `templateId`(number)는 목록 조회 후 캐시합니다.

| templateCode (프론트 id) | templateName | category |
|--------------------------|--------------|----------|
| `registration-general` | 일반 프로그램 등록 폼 | REGISTRATION |
| `registration-economy` | 1사 1교 프로그램 등록 폼 | REGISTRATION |
| `registration-ujat` | UJAT 프로그램 등록 폼 | REGISTRATION |
| `recruitment-participant-school` | 프로그램 참여자 모집 폼 (학교) | RECRUITMENT |
| `recruitment-participant-individual` | 프로그램 참여자 모집 폼 (개인) | RECRUITMENT |
| `recruitment-instructor` | 프로그램 강사 모집 폼 | RECRUITMENT |
| `recruitment-volunteer` | 프로그램 봉사자 모집 폼 | RECRUITMENT |
| `recruitment-ujat-school` | UJAT 프로그램 학교 모집 폼 | RECRUITMENT |
| `recruitment-ujat-volunteer` | UJAT 프로그램 봉사자 모집 폼 | RECRUITMENT |
| `application-participant-school` | 프로그램 참여자 신청 폼 (학교) | APPLICATION |
| `application-participant-individual` | 프로그램 참여자 신청 폼 (개인) | APPLICATION |
| `application-instructor` | 프로그램 강사 신청 폼 | APPLICATION |
| `application-volunteer` | 프로그램 봉사자 신청 폼 | APPLICATION |
| `application-economy` | 1사1교 프로그램 참여자 신청 폼 | APPLICATION |
| `application-gemini-visiting-training-instructor` | Gemini 찾아가는 연수 강사 신청 폼 | APPLICATION |
| `application-gemini-visiting-training-school` | Gemini 찾아가는 연수 학교 신청 폼 | APPLICATION |
| `application-ujat-school` | UJAT 프로그램 학교 신청 폼 | APPLICATION |
| `application-ujat-volunteer` | UJAT 프로그램 봉사자 신청 폼 | APPLICATION |
| `survey-default` | 설문조사 | SURVEY |
| `survey-student` | 만족도조사 (학생용) | SURVEY |
| `survey-teacher` | 만족도조사 (교사용) | SURVEY |
| `survey-admin` | 강의 평가 (관리자용) | SURVEY |
| `agreement-third-party` | 지급조서 사전 동의서 | AGREEMENT |
| `agreement-crime` | 성범죄 경력조회 동의서 | AGREEMENT |
| `agreement-notice` | 행정정보 공동이용 사전 동의서 | AGREEMENT |
| `agreement-expense` | 교육진행자 동의 서약서 | AGREEMENT |
| `agreement-portrait` | 초상권 수집·이용 동의서 | AGREEMENT |

코드 상수: [`form-template-catalog.ts`](../../src/features/template/api/form-template-catalog.ts)

---

## Endpoint ↔ UI (1차 파일럿)

| Swagger endpoint | 프론트 query key | 서비스 | UI |
|------------------|------------------|--------|-----|
| `GET /api/admin/form-templates` | `get_admin_form-templates` | `getWritingFormSections()` | 작성 양식 탭 목록 |
| `GET /api/admin/form-template-versions/{versionId}` | `get_admin_form-template-versions_versionId` | `loadFormTemplateVersionDraft()` | 에디터 draft 로드 |
| `PUT /api/admin/form-template-versions/{versionId}` | `put_admin_form-template-versions_versionId` | `saveFormTemplateVersionDraft()` | 임시저장 |
| `POST .../versions/{versionId}/publish` | `post_..._publish` | `publishFormTemplateVersion()` | 게시 |
| `POST .../{templateId}/versions/copy` | `post_..._copy` | `duplicateWritingTemplate()` | 복제 |

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| OpenAPI subset | `scripts/filter-openapi-forms-surveys.mjs` |
| Orval 생성 | `src/shared/api/generated/forms-surveys/` |
| HTTP 래퍼 | `features/template/api/form-templates-api-client.ts` |
| mock/실 분기 | `features/template/api/admin-form-templates-service.ts` |
| DTO adapter | `features/template/api/adapters/` |
| draft ↔ schemaJson | `features/template/api/adapters/form-template-draft-adapters.ts` |
| Query keys | `features/template/api/form-template-query-keys.ts` |
| 목록 훅 | `features/template/hooks/use-writing-form-sections.ts` |

OpenAPI subset 필터: `/api/admin/form-templates*`, `/api/admin/form-template-versions*`, `/api/admin/form-responses*`, `/form-bindings`

---

## localStorage 마이그레이션

| 단계 | 동작 |
|------|------|
| mock | `writing-form-template-local-save.ts` only |
| remote + cache | localStorage 유지 + API PUT (fire-and-forget) |
| remote load | `loadFormTemplateVersionDraft` 우선, 없으면 localStorage |

키: `cms.jakorea.writingFormTemplateSaves.v1` — API 전환 후에도 오프라인·롤백용 캐시로 유지.

---

## 백엔드 확인 요청 (미확정)

- [ ] `formType` / `category` enum 최종 값
- [ ] 위 `templateCode` 시드 DB 반영 여부
- [ ] `schemaJson` 외 overlay/editorState 저장 방식
- [ ] 수료증 로고·배경 파일 — 템플릿 PATCH vs 파일 API
- [ ] draft vs published 버전 — `versionStatus` 값 목록
