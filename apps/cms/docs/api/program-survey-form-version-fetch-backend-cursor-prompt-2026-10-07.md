# Cursor prompt — 프로그램 설문 결과 화면의 양식 version 단건 조회 부하 완화 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-survey-form-version-fetch-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 낮음 (성능·부하 개선).** 반복 호출의 주원인은 FE였고 FE에서 이미 고쳤다.
> 이 문서는 남은 비용을 줄이기 위한 **선택적** 백엔드 개선이다.
> 결과 그래프가 0으로 보이는 문제(마스킹)는 별도 문서
> `program-survey-results-aggregation-backend-cursor-prompt-2026-10-07.md`에서 다뤘고,
> 백엔드 handoff `docs/frontend/program-survey-results-aggregation-frontend-handoff-2026-10-07.md`로 반영 완료됐다
> (V21 선택형 `NON_PII` 백필, summary `options`/`unmatchedCount`, 응답 목록 `X-Total-Count`, `submittedCount` 기준 통일).

## 집계 handoff 반영 후 상태 (2026-10-07)

- FE는 척도·복수선택·별점 그래프를 summary `options`(`label`·`count`·`displayOrder`)로 그리도록 전환한다.
  → 선택지 라벨·순서를 얻으려고 version `schemaJson`을 읽을 필요는 없어진다.
- summary 행(`SurveySummaryResponse`)에는 `questionKey`, `questionLabel`, `questionType`은 있지만
  **문항 표시 순서와 단락 구조(제목 단락·안내문)가 없다.** 그래서 FE는 결과 화면의 문항 순서·섹션 구성,
  주관식 표의 열 구성을 위해 여전히 version `schemaJson`을 1회 조회한다.
- 아래 ③이 반영되면 결과 화면에서 version 단건 조회를 없앨 수 있다. ①·②는 ③이 어려울 때의 대안이다.

---

## 증상 (로컬, 2026-10-07 11:1x KST)

- CMS 일반 프로그램 상세 → 설문 관리(설문조사 · 만족도조사 · 강의평가) 탭
- `GET /api/admin/form-template-versions/338` 이 한 화면에서 6회 이상 반복 호출
- 응답: `templateId=1842`, `versionStatus=PUBLISHED`, `schemaJson` 전체, `responseCount=1`, `activeBindingCount=1`

## FE에서 고친 원인 (참고용, 백엔드 작업 아님)

1. 설문 응답·바인딩 목록을 백그라운드로 다시 조회할 때 스피너가 결과 뷰를 언마운트했고, 다시 마운트될 때마다 version을 재조회
2. version 단건 조회에 캐시가 없었음 → 이제 `versionId` 단위로 5분 캐시(TanStack Query)
3. 강의평가 draft 로드 effect가 바인딩 재조회마다 같은 version을 다시 조회

FE 수정 후에는 결과 탭에 처음 들어갈 때 version당 1회만 조회한다.

## 남은 백엔드 비용

- `GET /api/admin/form-template-versions/{versionId}`는 `schemaJson` 전체와 함께
  `form_response` / `program_form_binding`에 대한 `count(*)` LATERAL 서브쿼리
  (`response_count`, `active_binding_count`)를 **매 호출마다** 실행한다
  (`FormTemplateVersionQueryService` 참고).
- 설문 결과 화면은 문항 구성(schema)만 필요하고 카운트·`availableActions`는 쓰지 않는다.
- `PUBLISHED` version의 `schemaJson`은 바뀌지 않는데, 조건부 요청(ETag/304)을 지원하지 않는다.

---

## 요청

### ① PUBLISHED version 단건 조회에 ETag 지원 (권장)

- `GET /api/admin/form-template-versions/{versionId}` 응답에 `ETag` 헤더 추가
  - 값 예: `W/"v{versionId}-{updatedAt epoch ms}"` (또는 schemaJson 해시)
- 요청에 `If-None-Match`가 일치하면 `304 Not Modified` (본문 없음)
- `DRAFT` version은 기존대로 매번 200 반환해도 된다
- `Cache-Control: private, no-cache` 유지 (권한 데이터라 공유 캐시 금지, 재검증만 허용)

### ② 결과 화면용 경량 schema 조회 (선택)

둘 중 하나를 선택해서 구현:

- (a) 기존 단건 조회에 `?include=schema` 같은 옵션을 추가해, 지정하면 카운트 서브쿼리와 `availableActions` 계산을 건너뜀
- (b) `GET /api/admin/programs/{programId}/surveys/{templateVersionId}/schema` 신설
  - 응답: `{ templateVersionId, templateId, versionStatus, schemaJson, updatedAt }`
  - 권한: 기존 `GET .../surveys/{templateVersionId}/responses`와 동일
  - 해당 프로그램에 바인딩된 version이 아니면 404

FE는 (b)가 생기면 결과 화면에서 이 엔드포인트로 바꿔 쓴다.

### ③ summary 행에 문항 순서 추가 (권장 — version 조회 제거 가능)

`GET /api/admin/programs/{programId}/surveys/{templateVersionId}/summary` 배열 각 행에 필드 **추가**:

| 필드 | 타입 | 의미 |
|---|---|---|
| `questionDisplayOrder` | number | 게시 version `schemaJson` 단락 순서 기준 0부터 |
| `requiredYn` | boolean | 필수 문항 여부 (결과 화면 `*` 표시용) |

- 응답 배열도 `questionDisplayOrder` 오름차순으로 정렬해서 반환
- 답할 수 없는 단락(제목·안내문)은 지금처럼 행을 만들지 않아도 된다. FE는 문항만 순서대로 그린다
- 기존 필드·`summaryJson` 형식은 변경 금지 (추가만)

---

## 하지 말 것

- `GET /api/admin/form-template-versions/{id}`의 기존 응답 필드 제거·이름 변경 금지 (템플릿 편집기에서 사용 중)
- `Cache-Control: public` 또는 `max-age`로 공유 캐시 허용 금지
- `DRAFT` version에 304를 오래 유지하도록 만드는 것 금지 (편집 직후 반영돼야 함)

## 보고 형식

1. 변경 파일 목록
2. ① ETag 값 생성 규칙과 304 재현 결과 (`curl -i -H 'If-None-Match: …'`)
3. ② 선택안(a/b)과 요청·응답 예시
4. ③ 프로그램 `186046` / version `338` summary 응답 예시 (`questionDisplayOrder` 포함)
5. 기존 템플릿 편집기 API 회귀 여부

## FE 후속 작업 (백엔드 반영 후)

- 집계 handoff(반영 완료) 기준 FE 작업은 별도로 진행한다: summary `options`로 그래프 그리기,
  `X-Total-Count`로 응답 페이지 수집 종료, 만족도 응답 수 `max(...)` 보정 제거
- ① 반영 시: FE 변경 불필요 (브라우저가 `If-None-Match`를 자동으로 보냄)
- ②(b) 반영 시: `resolveSurveyWritingDraft(templateId, { templateVersionId })`의 version 조회를 새 엔드포인트로 교체
- ③ 반영 시: 결과 화면(`survey-poll-results-view.tsx`)과 엑셀 내보내기를 summary 행만으로 구성하고,
  version 조회는 양식 미리보기(`openTemplatePreview`)에서만 사용
