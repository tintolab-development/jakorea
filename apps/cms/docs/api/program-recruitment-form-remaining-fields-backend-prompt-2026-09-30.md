# Cursor prompt — 모집 양식 잔여 필드 왕복 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | JABACK |
| 작성일 | 2026-09-30 |
| 우선순위 | P1 |
| 상태 | **BE 완료 · FE 반영 (2026-09-30).** Gemini `draftStatus` 전송, 참여자 컬럼 GET 우선. 강사·봉사자 nested는 `serviceDetailJson` 유지 |
| 비대상 | 교육받은 교사 모집 왕복, Gemini 교육형태·연수요청기간·지원방법 top-level (해당 문서는 BE 완료). 운영 시작 후 모집 잠금·모집 현황 파생 표시는 유지 |

BE 반영 이후 프론트 어댑터를 연결했다. 이 문서로 프론트를 다시 고치지 마라.

---

## 한줄

1. Gemini 모집 공고의 **게시 여부(`draftStatus`)** 를 create/PATCH에서 받아 GET과 같게 돌려라.
2. 일반·1사1교의 **강사·봉사자** `applicationMethod` / `remarks` 는 참여자 top-level 컬럼 하나로 덮지 말고, audience별 nested 모집 정보에 저장·재조회하라.
3. UJAT `recruitments[]` 거절은 이 문서에서 다시 설계하지 않는다. 기존 문서만 따른다.

---

## 1. Gemini 공고 게시 ↔ `draftStatus`

### 화면

CMS → 제미나이 → 찾아가는 연수 → 모집 공고 등록 / 정보 수정.  
UI 값 `announcementPublished`: `published` | `unpublished`.

### 현재

- 목록·상세 GET `GeminiRecruitmentItem` / `GeminiRecruitmentDetailResponse`에 `draftStatus`가 있다.
- FE는 `draftStatus`가 draft면 `unpublished`, 아니면 `published`로 표시한다.
- `ProgramCreateRequest` / `ProgramUpdateRequest`(및 Gemini recruitment create/PATCH body)에 `draftStatus`가 **없다**.
- 그래서 FE 어댑터 `mapGeminiRecruitmentDetailToUpdateRequest`는 게시 여부를 보내지 못한다. 스냅샷 JSON에만 남는다.

### 요구

대상 API (기존 Gemini 모집 공고와 동일):

- `POST /api/admin/gemini/trainings/recruitments`
- `PATCH /api/admin/gemini/trainings/recruitments/{programId}`
- `GET` 목록·상세

| UI | 요청 `draftStatus` | GET |
|---|---|---|
| `unpublished` | `DRAFT` | `DRAFT` (또는 FE가 draft로 보는 동일 값) |
| `published` | `PUBLISHED` | `PUBLISHED` |

- 키 생략 = 기존 게시 상태 유지.
- 2xx 이후 같은 프로그램 GET의 `draftStatus`가 요청과 같다.
- GENERAL / UJAT / 1사1교 / TRAINED_TEACHER 의 `draftStatus` 의미는 바꾸지 마라.

FE는 OpenAPI에 필드가 생긴 뒤 Orval·어댑터에서만 연결한다. 그 전까지 FE가 임의 키를 보내지 않는다.

---

## 2. 강사·봉사자 지원 방법·비고 (일반 · 1사1교)

### 현재 FE

참여자 모집 탭 PATCH는 top-level 컬럼을 보낸다.

| UI | PATCH 컬럼 | 비고 |
|---|---|---|
| 지원 방법 | `applicationMethod` | 키를 건드린 경우만. 빈 값 삭제는 `clearFields: ["applicationMethod"]` |
| 모집 비고 | `remarks` | `otherNotes` / `otherMatters`(기타사항)와 별개. 빈 값 삭제는 `clearFields: ["remarks"]` |

강사·봉사자 탭의 지원 방법·비고는 top-level 컬럼이 하나뿐이라, FE는 nested에만 둔다.

- `generalCommonInfo.instructorRecruitmentInfo.applicationMethod`
- `generalCommonInfo.instructorRecruitmentInfo.remarks`
- `generalCommonInfo.volunteerRecruitmentInfo.applicationMethod`
- `generalCommonInfo.volunteerRecruitmentInfo.remarks`
- overlay: `recruitInstructor.detailInfo.applicationMethod` / `otherNotes`, `recruitVolunteer.detailInfo.*`
- 직렬화: `serviceDetailJson` (일반) / 1사1교 서비스 상세 JSON

1사1교에는 봉사자 모집이 없다. volunteer 키를 새로 만들지 마라.

### 장애

BE가 nested를 무시하고 program 컬럼 `applicationMethod` / `remarks`만 쓰면:

- 강사·봉사자에서 고친 문구가 저장되지 않거나
- 참여자 컬럼을 강사 값으로 덮어 참여자 모집 문구가 바뀐다.

### 요구

`programType` 이 `GENERAL_INDIVIDUAL` / `GENERAL_ORGANIZATION` / `COMPANY_SCHOOL` 일 때:

- 참여자: 요청의 top-level `applicationMethod` · `remarks` 를 저장하고 GET 컬럼으로 돌려라. `clearFields`에 이름이 있으면 해당 컬럼을 비워라. 키 생략은 유지.
- 강사·봉사자: `serviceDetailJson`(또는 동일 SSOT)의 `instructorRecruitmentInfo` / `volunteerRecruitmentInfo` 안 `applicationMethod` · `remarks` 를 **그 audience만** 갱신하고 GET 시 같은 경로로 돌려라.
- 참여자 컬럼 수정이 강사·봉사자 nested를 지우거나, 그 반대가 되면 안 된다.
- `otherMatters`(기타사항)와 `remarks`(모집 비고)를 한 컬럼으로 합치지 마라.

교육받은 교사는 이미 top-level `remarks` 왕복이 있으므로 이 절의 대상으로 바꾸지 마라.

---

## 3. UJAT — 기존 문서

UJAT 생성·수정이 `STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 로 `recruitments[]` 를 거절하는 문제는 여기서 반복하지 않는다.

구현·검수는 다음 문서만 본다.

- `apps/cms/docs/api/ujat-structured-recruitments-backend-prompt-2026-09-30.md`

---

## 검수

- [ ] Gemini 등록 시 `draftStatus: "DRAFT"` → 상세 GET `draftStatus` 가 draft. `PUBLISHED` 로 PATCH → GET 도 published. 키 생략 PATCH는 게시 상태가 유지된다.
- [ ] 일반 참여자 모집 PATCH `applicationMethod` / `remarks` 가 GET 컬럼과 같다. `clearFields` 후 GET 은 빈 값이다. `otherMatters` 는 그대로다.
- [ ] 일반 강사 모집만 nested `applicationMethod` 를 바꿔도 참여자 컬럼 `applicationMethod` 는 유지되고, GET nested 강사 값만 바뀐다. 봉사자도 같다.
- [ ] 1사1교는 참여자·강사만 위와 같고, volunteer 모집 블록을 만들지 않는다.
- [ ] UJAT `recruitments[]` 는 기존 UJAT 문서의 검수를 통과한다. 이 문서로 UJAT 계약을 새로 해석하지 않는다.
