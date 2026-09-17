# BE 구현 요청 — 교육받은 교사 상세 풀페이지 미확인 API

**작성일:** 2026-09-16  
**갱신:** 2026-09-16 — BE 핸드오프 반영 후 FE acceptance  
**대상:** CMS `/programs/trained-teachers` 프로그램 상세 풀페이지  
**programType:** `TRAINED_TEACHER`  
**FE gate:** `VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true` (+ `programs` 모듈) 또는 `trainedTeacherPrograms`  
**BE 회신:** `JABACK/docs/frontend/trained-teacher-detail-unconfirmed-api-frontend-handoff-2026-09-16.md`  
**관련 SSOT:** [programs-trained-teachers-api-conversion-status.md](./programs-trained-teachers-api-conversion-status.md) · [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md)

---

## FE acceptance (BE 핸드오프 기준)

| 항목 | 상태 |
|------|------|
| §1 `preferredScheduleBlocks` 매핑 · memo 비파싱 | **완료** — adapter + 신청/진행 기관 상세 UI |
| §2 managers 공용 path · OWNER→PM · 조회용 VIEWER | **확인** — 기존 `toProgramManagerApiRole(ASSISTANT)=VIEWER` 유지 (BE `ASSISTANT` 문자열 별칭 PARTNER와 구분) |
| §3 surveys + `/responses` | **확인** — 공용 survey 훅이 `/responses` 사용 · Excel export는 공용 gap |
| §4 journal POST create UI | **보류(선택)** — API만 유지, CMS 업로드 UI 미추가 |
| §5 completions POST/cancel UI | **보류(선택)** — strip은 GET만 |
| §6 일지 보기 download blob | **완료** — preview URL invent 없음 |

OpenAPI: `backend.openapi.json` 동기화·dashboard filter까지 반영. 전체 orval dashboard 재생성은 무관 path-param 검증 실패로, `preferredScheduleBlocks` 스키마는 dashboard generated에 **additive hand-patch**.

---

## 백엔드 전달용 프롬프트 (원문 · 보관)

아래는 최초 BE 요청 원문입니다. 구현 상태는 위 acceptance 표를 따릅니다.

교육받은 교사 프로그램 상세 풀페이지에서 FE는 CRUD · `trained-teacher/detail` · organization-applications · education-journals list/download/bulk · performance-summary 를 이미 호출합니다.

아래 항목은 **OpenAPI/응답 필드가 없거나 제품 계약이 확인되지 않아** FE가 연결하지 못한 갭입니다. DB에 값이 있어도 FE가 추측·mock으로 보정하지 않도록 API 계약을 확정해 주세요.

비범위: 강사/봉사자 진행 LNB(제품상 없음), 일반·UJAT·1사1교·Gemini 기본 계약 변경.

---

## 0. 이미 FE가 쓰는 경로 (참고 · 재구현 불필요)

| Method | Path | 화면 |
|--------|------|------|
| GET/POST/PATCH/DELETE | `/api/admin/programs` (`programType=TRAINED_TEACHER`) | 목록·CRUD |
| GET/PATCH | `/api/admin/programs/{programId}/trained-teacher/detail` | 공통 정보 |
| GET | `…/trained-teacher/organization-applications` (+ `/{id}`) | 기관 신청 목록·상세 |
| POST | `…/trained-teacher/organization-applications/{id}/approve` · `…/reject` | 승인/반려 (**TT 전용**, 공통 applications mutation 아님) |
| GET | `…/trained-teacher/education-journals` | 교육일지 목록 |
| GET | `…/education-journals/{journalId}/download` | 단건 다운로드 · **보기 모달 미리보기(blob)** |
| POST | `…/education-journals/bulk-download` | 일괄 다운로드 |
| GET | `…/trained-teacher/performance-summary` | 진행 실적 strip |
| GET | `…/trained-teacher/education-completions` | 완료 건수(strip 보조) |

---

## 1. 희망 교육 일정 structured blocks

### 화면

- 기관 신청 상세 · 신청 정보 → 「희망 교육 일정」 섹션  
  (`TrainedTeachersPreferredScheduleDetailSection`)
- 신청 양식 단락: `application-trained-teachers` preferred-schedule  
  (날짜 · 차시 수 · 교시 · 시작/종료 시각, 지망 순위별 block)

### 현재 FE

- remote ON: `preferredScheduleBlocks` → 일정 섹션 SoT (memo 파싱 없음)
- memo는 `otherRequests` / `desiredEducationPeriod` fallback만
- blocks `[]`이면 「등록된 교육 일정이 없습니다.」

### 요청

`GET …/trained-teacher/organization-applications` 및 `GET …/{applicationId}` 응답에 구조화 배열을 추가해 주세요.

FE 표시 모델(권장 스키마):

```ts
type PreferredScheduleSessionTime = {
  sessionIndex: number      // 1-based
  classPeriod: string       // 교시 라벨
  timeRange: string         // "HH:mm ~ HH:mm" 또는 start/end 분리
}

type PreferredScheduleBlock = {
  preferenceRank: number    // 1지망=1 …
  date: string              // YYYY-MM-DD 또는 YYYY.MM.DD
  dayOfWeek: string         // 월~일
  sessionCount: number
  sessionTimes: PreferredScheduleSessionTime[]
}
```

필드명은 OpenAPI에서 확정하되, 위 의미와 1:1 매핑 가능해야 합니다.  
`desiredEducationScheduleMemo`는 유지해도 됩니다(자유 메모). blocks와 중복 시 우선순위 규칙을 문서화해 주세요.

### 수락 조건

- [ ] 목록·상세 GET에 blocks(또는 동등) 포함
- [ ] 신청 양식에서 제출한 지망 순위·날짜·차시·교시·시간이 CMS 상세에 동일하게 표시
- [ ] OpenAPI schema + 예시 payload
- [ ] memo만 있는 레거시 건: blocks `[]` + memo 유지 가능

### 비범위

- memo 문자열을 FE에서 파싱해 UI blocks로 복원하는 것

---

## 2. 담당자(managers) CRUD — 전 유형 공통 갭 (M-18)

### 화면

- 상세 LNB 「담당자 정보」 → `ProgramManagersTab`

### 현재 FE

- 이미 `GET/POST/PATCH/DELETE /api/admin/programs/{programId}/managers` (+ assignment PATCH role) 호출
- OpenAPI에 path가 없거나 BE 미구현이면 실패/empty가 정상
- TT 전용 managers path를 invent 하지 않음

### 요청

1. OpenAPI에 managers CRUD 스펙 추가(또는 기존 구현 path 확정)
2. `programType=TRAINED_TEACHER` 프로그램에서도 동일 path로 동작
3. role 매핑: FE `OWNER`/`PARTNER`/`ASSISTANT` ↔ BE `PM`/`PARTNER`/`VIEWER` (일반 프로그램과 동일)

### 수락 조건

- [ ] TT 프로그램 id로 managers list/create/update/delete round-trip
- [ ] 타 `programType`과 동일 계약 · type 혼입 없음
- [ ] OpenAPI sync 가능

### 비범위

- TT 전용 managers URL 신설(불필요 시)

---

## 3. 설문 answers / 응답 목록·내보내기

### 화면

- 상세 LNB 「설문 관리」(조건부) — 일반 survey UI 재사용, audience는 teacher-only

### 현재 FE

- surveys HTTP gate에 TT 포함(목록/템플릿 쪽)
- **응답(answers) 목록·상세·export** 계약/연동이 잔여로 문서화됨

### 요청

1. TT 프로그램에서 설문 응답 조회·내보내기 path 확정  
   - 일반 `…/surveys/.../answers` 재사용 가능 여부  
   - 불가 시 TT 전용 path
2. 응답 행 필드(제출자·제출일시·문항별 답)와 export(Excel/CSV) 계약
3. 설문 미설정 프로그램의 empty/404 규칙

### 수락 조건

- [ ] TT 상세 survey LNB에서 응답 목록이 비어 있지 않은 시드/실데이터로 표시 가능
- [ ] export 동작 · 권한·감사로그 정책 명시
- [ ] OpenAPI

### 비범위

- 설문 작성기(template) 자체 — forms-surveys 영역

---

## 4. education-journals POST create (CMS 업로드 UI)

### 화면

- 기관 상세 「교육 일지」 — 현재 **목록·다운로드·보기(다운로드 API blob)** 만 연결
- CMS에서 관리자가 일지를 대신 업로드하는 UI는 없음

### 현재 FE

- `POST …/trained-teacher/education-journals` client/service 준비됨
- UI mutation 미배선 (Platform 제출만 가정)

### 요청 (제품 확인 포함)

1. CMS에서 관리자 업로드가 **필요한지** 확정
2. 필요 시 `EducationJournalCreateRequest` 필수 필드 · multipart/JSON · 권한
3. 불필요 시 OpenAPI에 “Platform-only”로 표기하고 CMS 비범위 확정

### 수락 조건

- [ ] 제품 결정(필요/불필요) 문서화
- [ ] 필요 시 create round-trip + 목록 즉시 반영

---

## 5. education-completions POST / cancel

### 화면

- 진행 현황 실적 strip — **GET completions 건수**만 사용
- CMS에서 「학생교육 완료」등록/취소 버튼 UI 없음

### 현재 FE

- `GET/POST …/education-completions`, `POST …/{id}/cancel` client 존재
- UI는 GET 집계만

### 요청 (제품 확인 포함)

1. CMS에서 완료 등록·취소 UI가 필요한지
2. 필요 시 request body · 상태 전이 · 실적 summary 재계산 규칙
3. 불필요 시 Platform/배치 전용으로 비범위 확정

### 수락 조건

- [ ] 제품 결정 문서화
- [ ] 필요 시 mutation + summary invalidate 계약

---

## 6. (선택) 교육일지 전용 preview/presigned URL

### 화면

- 「교육일지 보기」모달 — 현재 `GET …/download` → blob → PDF/이미지 object URL 미리보기

### 요청

- download blob만으로 충분한지 확인
- 대용량·office 문서 등 미리보기가 필요하면 별도 preview/presigned GET 제안

### 수락 조건

- [ ] “download blob로 충분” 또는 preview path 스펙 중 하나 확정

---

## 7. 우선순위 제안

| 우선 | 항목 | 이유 |
|------|------|------|
| P0 | §1 희망일정 blocks | 기관 상세 핵심 섹션이 항상 빈 UI |
| P0 | §2 managers | LNB 노출되나 BE 갭으로 실패 가능 |
| P1 | §3 survey answers | Phase 5 잔여 |
| P2 | §4·§5 create/cancel | 제품 확인 후 |
| P3 | §6 preview URL | 현재 download로 동작 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-16 | 초안 — 상세 풀페이지 미확인 갭 정리 · 일지 보기 FE는 download API 연결 완료 |
