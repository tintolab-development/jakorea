# Cursor prompt — Gemini 찾아가는 연수 모집 공고 상세 필드 왕복 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | JABACK |
| 주 API | `POST /api/admin/gemini/trainings/recruitments` (또는 동일 create) · `GET /api/admin/gemini/trainings/recruitments/{programId}` · `PATCH …/recruitments/{programId}` |
| 대상 화면 | CMS → 제미나이 프로그램 → 찾아가는 연수 → 모집 공고 상세 → 「프로그램 모집 정보」 |
| 프로그램 유형 | `GEMINI_TRAINING` 만. GENERAL / UJAT / 1사1교 / TRAINED_TEACHER 계약은 바꾸지 마라 |
| 우선순위 | P0 |
| 작성일 | 2026-09-30 |
| 재확인 | **2026-09-30 13:45** CMS 상세 UI. 신규 등록 건에서도 동일 증상 |
| 상태 | **BE 완료 · FE create/PATCH·목록 매퍼 반영 (2026-09-30).** `educationForm` · `trainingRequest*` · `applicationMethod` top-level + 목록 기간 분리 |
| FE | top-level이 정본. `serviceDetailJson`은 병행 전송만. `applicationMethod` ≠ `applicationPathId` |
| 실측 QA | create echo · 목록 seed `185002` 기간 분리 · PATCH clearFields |

**BE handoff:** `JABACK/docs/frontend/gemini-recruitment-detail-field-roundtrip-frontend-handoff-2026-09-30.md`

~~프론트 레포를 이 작업으로 고치지 마라. **백엔드만** 고친다.~~ → BE 배포 후 FE Orval·매퍼 반영 완료.

---

## 한줄

모집 공고 **등록·수정 시 받은 필드를 저장**하고, **상세 GET에서 같은 이름·같은 값으로 돌려줘라.**  
지금 GET은 `nameKo` / `description` / 기간 / `minimumParticipantCount` 정도만 주고, CMS가 쓰는 문의처·교육 대상·모집 안내 등을 버린다.

---

## 증상

CMS에서 모집 공고를 등록하면 상세 「모집 정보」「상세 정보」에 빈 칸(`-`)이 많다.  
등록 실패가 아니다. **GET 계약이 너무 얇다.**

### 실측 UI A — programId 186025

| 영역 | 표시 | 기대 |
|---|---|---|
| 공고명 | 성인 금융이해력 방문 연수 | OK |
| 기관 모집 기간 · 연수 요청 가능기간 | 2026.10.07 ~ 2026.10.21 | OK(지금은 동일 값) |
| 최소 수강 인원 | 15명 | OK |
| 프로그램 설명 | 샘플 문장 | OK |
| 교육 대상 · 교육 대상 상세 | `-` | 등록값 |
| 교육 형태 | 오프라인(FE 기본값) | 등록한 online/offline |
| 문의처 | `-` | 등록값 |
| 비고 | `-` | 등록값 |
| 썸네일 · 모집 안내 · 지원 방법 · 학습 지원 · 추가 내용 · 첨부 | `-` / 빈칸 | 등록값 |

### 실측 UI B — 재확인 2026-09-30 13:45 (신규 등록)

| 영역 | 표시 | 기대 |
|---|---|---|
| 공고명 | 제미나이 찾아가는 연수 모집 예정 | OK |
| 최초·마지막 수정 | 2026.09.30(수) 13:45 | OK |
| 공고 게시 / 진행 현황 | 게시 예정 / 프로그램 진행 예정 | OK(draft/period 파생) |
| 기관 모집 · 연수 요청 기간 | 2026.10.25 ~ 2027.01.18 (둘 다 동일) | 두 기간 **분리** 저장·응답 |
| 최소 수강 인원 | 15명 | OK |
| 프로그램 설명 | Gemini Primary Case SoT… GEM-02 재현 | OK |
| 교육 대상 · 교육 대상 상세 | `-` | 등록값 |
| 교육 형태 | 오프라인 | 등록한 online/offline |
| 문의처 · 비고 | `-` | 등록값 |
| 썸네일 · 모집 안내 · 지원 방법 · 학습 지원 · 추가 내용 · 첨부 | 빈칸 / `-` | 등록값 |

동일 증상 = **재현 지속.** FE 매퍼 변경만으로는 해결 불가.

---

## 실측 응답 (186025)

`GET /api/admin/gemini/trainings/recruitments/186025` (또는 동일 상세):

```json
{
  "programId": 186025,
  "programCode": "GEMINI_TRAINING-2026-09-30-000026",
  "programType": "GEMINI_TRAINING",
  "draftStatus": "PUBLISHED",
  "periodStatus": "SCHEDULED",
  "nameKo": "성인 금융이해력 방문 연수",
  "summary": null,
  "description": "오프라인으로 진행하는 찾아가는 연수 개발용 샘플입니다.",
  "businessYear": 2026,
  "businessStartDate": "2026-10-07",
  "businessEndDate": "2026-10-21",
  "minimumParticipantCount": 15,
  "certificateDisabled": true,
  "organizationApplicationCount": 0,
  "approvedOrganizationApplicationCount": 0
}
```

OpenAPI `GeminiRecruitmentDetailResponse` 프로퍼티와 **정확히 이 집합**이다.  
문의처·교육 대상·모집 안내 키가 **스키마에도 없다.**

---

## 원인

1. FE create는 `ProgramCreateRequest`에 아래를 실어 보낸다(일부는 OpenAPI에 이미 있음).

   - `title`, `description`
   - `businessStartDate` / `businessEndDate` ← 현재 FE는 **기관 모집 기간**을 넣음
   - `applicationStartDate` / `applicationEndDate` ← 동일하게 기관 모집 기간
   - `educationStructure` (`SCHEDULE`)
   - `totalParticipants` ← 최소 수강 인원
   - `managerName` / `contactName` ← 문의처 이름
   - `contactPhone` / `contactEmail`
   - `recruitmentGuide`, `learningSupportContent`, `additionalContentHtml`
   - `attachmentFileNames`
   - `otherMatters` ← 비고(해당없음이 아닐 때)
   - `recruitmentTargetDetail` ← 교육 대상 상세
   - `serviceDetailJson` = `{ "geminiRecruitment": <전체 폼 스냅샷> }`

2. BE가 create에서 위 필드를 **컬럼/JSON에 저장하지 않거나**, 저장해도 **Gemini 상세 DTO projection에서 버린다.**

3. FE 상세 매퍼(`mapGeminiRecruitmentDetailToDetail`)는 slim DTO에 없는 필드를 `''` / `[]`로 채운다. `serviceDetailJson`을 FE에서 파싱하지 않는다(프로그램 유형 정책).

---

## 수정

### 1. `GeminiRecruitmentDetailResponse` 확장

기존 필드는 유지하고 **아래를 추가**한다. null이면 생략 가능. 빈 문자열과 null을 섞지 말고, 미입력은 `null` 또는 빈 배열로 통일한다.

| 응답 필드 | 타입 | 의미 | FE 매핑 |
|---|---|---|---|
| `targetLevels` | `string[]` | `elementary` \| `middle` \| `high` \| `university` \| `adult` | `educationTargetLevels` |
| `recruitmentTargetDetail` | `string \| null` | 교육 대상 상세 | `educationTargetDetail` |
| `educationForm` | `string \| null` | `online` \| `offline` | `educationForm` |
| `contactName` | `string \| null` | 문의처 이름 | `inquiryContactName` |
| `contactPhone` | `string \| null` | Tel | `inquiryTel` |
| `contactEmail` | `string \| null` | E-mail | `inquiryEmail` |
| `otherMatters` | `string \| null` | 비고. 해당없음이면 `null` | `notes` / `notesNotApplicable` |
| `thumbnailFileName` 또는 기존 썸네일 파일 키 | `string \| null` | 섬네일 | `thumbnailFileName` |
| `recruitmentGuide` | `string \| null` | 모집 안내 | `recruitmentGuide` |
| `applicationMethod` | `string \| null` | 지원 방법 | `applicationMethod` |
| `learningSupportContent` | `string \| null` | 학습 지원 내용 | `learningSupportContent` |
| `additionalContentHtml` | `string \| null` | 추가 내용 HTML/MD 저장분 | `additionalContentMarkdown` |
| `attachmentFileNames` | `string[]` | 첨부 파일명 | `attachmentFileNames` |
| `applicationStartDate` / `applicationEndDate` | `date \| null` | **기관 모집 기간** | `applicationPeriodStart/End` |
| `trainingRequestStartDate` / `trainingRequestEndDate` | `date \| null` | **연수 요청 가능기간** | `trainingRequestPeriodStart/End` |
| `createdAt` / `createdByName` | instant / string | 최초 등록 | 감사 필드 |
| `updatedAt` / `updatedByName` | instant / string | 마지막 수정 | 감사 필드 |

`businessStartDate` / `businessEndDate`는 기존처럼 둬도 된다.  
다만 **기관 모집 기간**과 **연수 요청 가능기간**을 한 쌍으로 합치지 마라. FE 화면은 두 기간이 다르다.

권장:

- `applicationStartDate` / `applicationEndDate` = 기관 모집 기간
- `trainingRequestStartDate` / `trainingRequestEndDate` = 연수 요청 가능기간  
  (또는 OpenAPI에 이미 있는 동일 의미 필드명을 쓰고 문서에 고정)

지금 FE create는 버그로 두 기간에 모두 기관 모집 기간을 넣고, 연수 요청 기간은 `serviceDetailJson.geminiRecruitment`에만 있다.  
BE는:

1. create/update body의 top-level 기간 필드를 저장하고
2. `serviceDetailJson.geminiRecruitment.trainingRequestPeriodStart/End` 가 있으면 **연수 요청 기간**으로 채우고
3. GET에서 두 기간을 **따로** 돌려라.

### 2. CREATE / PATCH 저장

`ProgramCreateRequest` / `ProgramUpdateRequest`(또는 Gemini 전용 body)로 들어온 값을 **버리지 마라.**

최소 저장 대상:

- `title` → `nameKo`
- `description`
- `totalParticipants` → `minimumParticipantCount`
- `contactName` / `managerName`(문의처 표시명) · `contactPhone` · `contactEmail`
- `recruitmentTargetDetail`
- `targetLevels` (요청에 있으면). FE가 아직 create에 top-level `targetLevels`를 안 실을 수 있다 → **`serviceDetailJson.geminiRecruitment.educationTargetLevels`를 fallback**으로 읽어 저장
- `recruitmentGuide` · `learningSupportContent` · `additionalContentHtml` · `attachmentFileNames`
- `otherMatters`
- `type` 또는 Gemini 합의 필드에 `educationForm` (`online`/`offline`). 없으면 `serviceDetailJson.geminiRecruitment.educationForm` fallback
- `applicationMethod` — top-level이 없으면 `serviceDetailJson.geminiRecruitment.applicationMethod` fallback
- 썸네일 파일 메타

`serviceDetailJson` 통째를 GET에 노출하지 마라. **상세 DTO 필드로 projection**한다.  
FE가 JSON blob을 다시 파싱하게 만들지 마라.

### 3. GET projection

상세 핸들러가 programs 테이블·supplement·geminiRecruitment JSON에서 위 필드를 읽어 `GeminiRecruitmentDetailResponse`에 채운다.

- 등록 직후 GET === 방금 저장한 값
- PATCH 직후 GET === PATCH echo와 동일
- 미입력은 `null` / `[]`. FE가 `-`로 그린다

### 4. 공고 게시 · 진행 현황

이미 있는 `draftStatus` / `periodStatus`는 유지.

- `draftStatus`: `DRAFT` \| `PUBLISHED` (또는 현행 enum)
- `periodStatus`: 기관 모집 기간 기준 `SCHEDULED` \| `IN_PROGRESS` \| `ENDED` 등

FE는 `draftStatus`로 임시저장 여부, `periodStatus`로 목록 상태/게시 예정 문구를 파생한다. 한글 라벨을 BE가 넣지 마라.

---

## 기대 GET 예시 (개념)

186025에 문의처·교육 대상·모집 안내를 넣었다면:

```json
{
  "programId": 186025,
  "programCode": "GEMINI_TRAINING-2026-09-30-000026",
  "programType": "GEMINI_TRAINING",
  "draftStatus": "PUBLISHED",
  "periodStatus": "SCHEDULED",
  "nameKo": "성인 금융이해력 방문 연수",
  "description": "오프라인으로 진행하는 찾아가는 연수 개발용 샘플입니다.",
  "businessYear": 2026,
  "businessStartDate": "2026-10-07",
  "businessEndDate": "2026-10-21",
  "applicationStartDate": "2026-10-07",
  "applicationEndDate": "2026-10-21",
  "trainingRequestStartDate": "2026-10-07",
  "trainingRequestEndDate": "2026-10-21",
  "minimumParticipantCount": 15,
  "certificateDisabled": true,
  "organizationApplicationCount": 0,
  "approvedOrganizationApplicationCount": 0,
  "targetLevels": ["adult"],
  "recruitmentTargetDetail": "성인 학습자",
  "educationForm": "offline",
  "contactName": "JA Korea 연수팀",
  "contactPhone": "02-1234-5678",
  "contactEmail": "gemini@jakorea.org",
  "otherMatters": null,
  "recruitmentGuide": "홈페이지에서 기관 신청서를 작성해 제출해 주세요.",
  "applicationMethod": "온라인 신청",
  "learningSupportContent": "...",
  "additionalContentHtml": "...",
  "attachmentFileNames": [],
  "thumbnailFileName": null,
  "createdAt": "2026-09-30T04:02:00Z",
  "createdByName": "…",
  "updatedAt": "2026-09-30T04:02:00Z",
  "updatedByName": "…"
}
```

(값은 예시. 필드 이름·왕복만 맞추면 된다.)

---

## 검수

1. CMS에서 모집 공고 등록: 교육 대상·문의처·모집 안내·지원 방법·학습 지원·추가 내용·비고를 채운다.
2. `GET …/recruitments/{id}` → 위 필드가 요청/스냅샷과 일치.
3. 상세 화면에서 `-`가 아니라 등록값이 보인다(FE 매퍼 반영 후). BE만 먼저 고치면 Network 탭 응답만으로도 검증 가능.
4. PATCH로 문의처만 바꾼 뒤 GET → 문의처만 바뀌고 다른 필드가 비지 않는다.
5. `targetLevels`를 비운 PATCH → GET `targetLevels` = `[]` 또는 null. 이전 값이 되살아나지 않는다.
6. GENERAL / 교육받은 교사 / 1사1교 / UJAT 프로그램 상세 GET 스키마는 변하지 않는다.

---

## 하지 말 것

- FE가 `serviceDetailJson`을 파싱하도록 미루지 마라. 상세 DTO를 넓혀라.
- GET body에 `serviceDetailJson` 원문만 주고 끝내기 금지.
- `educationForm`을 항상 `offline`으로 강제하지 마라.
- 기관 모집 기간과 연수 요청 가능기간을 한 필드로 합치지 마라.
- 다른 `programType` 응답 DTO를 Gemini용으로 겸용 확장하지 마라. **Gemini 상세 전용**으로 확장한다.
- 프론트 레포·Orval 재생성은 BE OpenAPI 머지 후 FE 작업으로 둔다.

---

## FE 후속 (참고 — BE 범위 밖)

BE 배포·OpenAPI 반영 후 FE에서:

1. Orval 재생성
2. `mapGeminiRecruitmentDetailToDetail`이 새 필드를 매핑(하드코딩 `''` 제거)
3. create에 top-level `targetLevels` · `educationForm` · 연수 요청 기간 분리 전송 정리

이 문서는 **BE 저장·GET projection**만 지시한다.
